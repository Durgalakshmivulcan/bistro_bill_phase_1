import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Actions from "../form/ActionButtons";
import Pagination from "../Common/Pagination";
import MasterDataNavTabs from "../NavTabs/MasterDataNavTabs";
import Modal from "../ui/Modal";
import {
  getMeasuringUnits,
  deleteMeasuringUnit,
  MeasuringUnit,
} from "../../services/masterDataService";

// Images
import deleteConfirmImg from "../../assets/deleteConformImg.png";
import deleteSuccessImg from "../../assets/deleteSuccessImg.png";

const MeasuringPage = () => {
  const navigate = useNavigate();

  const [units, setUnits] = useState<MeasuringUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Delete
  const [deleteItem, setDeleteItem] = useState<MeasuringUnit | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadUnits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMeasuringUnits();
      if (res.success && res.data) {
        setUnits(res.data.measuringUnits);
      } else {
        setError("Failed to load measuring units");
      }
    } catch {
      setError("An error occurred while loading measuring units");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  // Filter by search (name, unit, symbol)
  const filtered = units.filter(
    (u) =>
      u.quantity.toLowerCase().includes(search.toLowerCase()) ||
      u.unit.toLowerCase().includes(search.toLowerCase()) ||
      u.symbol.toLowerCase().includes(search.toLowerCase())
  );

  // Paginate
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleClear = () => {
    setSearch("");
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await deleteMeasuringUnit(deleteItem.id);
      if (res.success) {
        setShowConfirm(false);
        setShowSuccess(true);
        loadUnits();
      } else {
        setDeleteError(res.message || "Failed to delete measuring unit");
      }
    } catch {
      setDeleteError("Failed to delete measuring unit");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 bg-bb-bg min-h-screen p-4 sm:p-6">
      {/* TABS */}
      <MasterDataNavTabs />

      {/* SEARCH + ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* SEARCH */}
        <div className="relative w-full md:w-80">
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="Search here..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border rounded-md px-3 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto md:justify-end">
          <button
            onClick={handleClear}
            className="bg-yellow-400 px-5 py-2 rounded-md border border-black text-sm font-medium w-full sm:w-auto"
          >
            Clear
          </button>

          <button
            className="bg-black text-white px-5 py-2 rounded-md text-sm font-medium w-full sm:w-auto"
            onClick={() => navigate("/master-data/measuring-units/create")}
          >
            Add New
          </button>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="text-center py-8 text-bb-textSoft">Loading measuring units...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {search ? (
            <p>No results found for "{search}"</p>
          ) : (
            <>
              <p className="mb-4">No measuring units found</p>
              <button
                onClick={() => navigate("/master-data/measuring-units/create")}
                className="bg-black text-white px-4 py-2 rounded text-sm inline-block"
              >
                Add Your First Measuring Unit
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          {/* TABLE */}
          <div className="overflow-x-auto bg-white rounded-lg border">
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead className="bg-yellow-400">
                <tr>
                  <th className="px-4 py-3 text-left">Measuring Quantity</th>
                  <th className="px-4 py-3 text-left">Unit</th>
                  <th className="px-4 py-3 text-left">Symbol</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginated.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b odd:bg-white even:bg-[#FFF8E7]"
                  >
                    <td className="px-4 py-3 font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 font-medium">{item.unit}</td>
                    <td className="px-4 py-3 font-medium">{item.symbol}</td>
                    <td className="px-4 py-3 text-right">
                      <Actions
                        actions={["edit", "delete"]}
                        onEdit={() => navigate(`edit/${item.id}`)}
                        onDelete={() => {
                          setDeleteItem(item);
                          setShowConfirm(true);
                          setDeleteError(null);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        </>
      )}

      {/* DELETE CONFIRM MODAL */}
      {showConfirm && deleteItem && (
        <Modal
          open={showConfirm}
          onClose={() => {
            setShowConfirm(false);
            setDeleteItem(null);
          }}
          className="w-[90%] max-w-md p-6 text-center z-[9999]"
        >
          <h2 className="text-2xl font-bold mb-4">Delete Measuring Unit</h2>

          <div className="flex justify-center mb-4">
            <img src={deleteConfirmImg} alt="delete" className="w-16 h-16" />
          </div>

          <p className="text-sm text-gray-600 mb-6">
            This action cannot be undone. <br />
            Are you sure you want to delete{" "}
            <span className="font-medium">{deleteItem.quantity}</span>?
          </p>

          {deleteError && (
            <p className="text-sm text-red-500 mb-4">{deleteError}</p>
          )}

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setShowConfirm(false);
                setDeleteItem(null);
              }}
              className="border px-6 py-2 rounded"
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes"}
            </button>
          </div>
        </Modal>
      )}

      {/* DELETE SUCCESS MODAL */}
      {showSuccess && (
        <Modal
          open={showSuccess}
          onClose={() => {
            setShowSuccess(false);
            setDeleteItem(null);
          }}
          className="w-[90%] max-w-md p-6 text-center z-[9999]"
        >
          <h2 className="text-2xl font-bold mb-4">Deleted!</h2>

          <div className="flex justify-center mb-4">
            <img src={deleteSuccessImg} alt="success" className="w-16 h-16" />
          </div>

          <p className="text-sm text-gray-600">
            Measuring unit has been successfully removed.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default MeasuringPage;

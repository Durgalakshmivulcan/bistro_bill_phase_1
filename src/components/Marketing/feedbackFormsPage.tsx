import { Search, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Select from "../form/Select";
import QRCode from "react-qr-code";
import Actions from "../form/ActionButtons";
import LoadingSpinner from "../Common/LoadingSpinner";
import { useState, useEffect, useCallback, useMemo } from "react";
import deleteIcon from "../../assets/deleteConformImg.png";
import deleteSuccessImg from "../../assets/deleteSuccessImg.png";
import Modal from "../ui/Modal";
import { getFeedbackForms, deleteFeedbackForm, FeedbackForm } from "../../services/marketingService";

export default function FeedbackFormsPage() {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [feedbackForms, setFeedbackForms] = useState<FeedbackForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Filter by Status");
  const [dateFilter, setDateFilter] = useState("Filter by Expiry Date");

  const filteredForms = useMemo(() => {
    let result = feedbackForms;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q))
      );
    }

    if (statusFilter === "Active") {
      result = result.filter((f) => f.status === "active");
    } else if (statusFilter === "Inactive") {
      result = result.filter((f) => f.status === "inactive");
    }

    if (dateFilter === "Today") {
      const today = new Date().toISOString().split("T")[0];
      result = result.filter((f) => f.createdAt.startsWith(today));
    } else if (dateFilter === "Last 7 days") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      result = result.filter((f) => new Date(f.createdAt) >= d);
    }

    return result;
  }, [feedbackForms, searchQuery, statusFilter, dateFilter]);

  const handleClear = () => {
    setSearchQuery("");
    setStatusFilter("Filter by Status");
    setDateFilter("Filter by Expiry Date");
  };

  useEffect(() => {
    loadFeedbackForms();
  }, []);

  const loadFeedbackForms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getFeedbackForms();
      if (response.success && response.data) {
        setFeedbackForms(response.data);
      } else {
        setError(response.error?.message || 'Failed to load feedback forms');
      }
    } catch (err) {
      console.error('Error loading feedback forms:', err);
      setError('Failed to load feedback forms');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = useCallback((formTitle: string, qrCode: string) => {
    const svg = document.getElementById(`qr-${qrCode}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = 256;
      canvas.height = 256;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 256, 256);
      ctx.drawImage(img, 0, 0, 256, 256);

      const link = document.createElement('a');
      link.download = `${formTitle.replace(/[^a-zA-Z0-9]/g, '_')}_QR.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await deleteFeedbackForm(deleteId);
      if (response.success) {
        setShowConfirm(false);
        setShowSuccess(true);
        // Refresh the list after successful deletion
        await loadFeedbackForms();
      } else {
        setError(response.error?.message || 'Failed to delete feedback form');
        setShowConfirm(false);
      }
    } catch (err) {
      console.error('Error deleting feedback form:', err);
      setError('Failed to delete feedback form');
      setShowConfirm(false);
    }
  };

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Feedback Forms</h1>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search
              className="absolute right-3 top-1/2 -translate-y-1/2"
              size={16}
            />
            <input
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border rounded-md px-3 pr-10 py-2 text-sm"
            />
          </div>

          <button
            onClick={() => navigate("/marketing/feedbackCampaign/add")}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Add New
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex justify-end gap-2">
        <div className="w-[15%]">
          <Select
            value={dateFilter}
            onChange={setDateFilter}
            options={[
              {
                label: "Filter by Expiry Date",
                value: "Filter by Expiry Date",
              },
              { label: "Today", value: "Today" },
              { label: "Last 7 days", value: "Last 7 days" },
            ]}
          />
        </div>

        <div className="w-[15%]">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "Filter by Status", value: "Filter by Status" },
              { label: "Active", value: "Active" },
              { label: "Inactive", value: "Inactive" },
            ]}
          />
        </div>

        <button onClick={handleClear} className="bg-yellow-400 px-4 py-2 rounded border">
          Clear
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-yellow-400 text-black">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">QR Code</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <div className="flex justify-center">
                    <LoadingSpinner size="md" message="Loading feedback forms..." />
                  </div>
                </td>
              </tr>
            ) : filteredForms.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No feedback forms found
                </td>
              </tr>
            ) : (
              filteredForms.map((form) => (
                <tr key={form.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{form.title}</td>

                  <td className="px-4 py-3 text-gray-600 max-w-md">
                    {form.description || '-'}
                  </td>

                  {/* QR CODE */}
                  <td className="px-4 py-3">
                    {form.qrCode ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8">
                          <QRCode
                            value={form.qrCode}
                            size={32}
                            viewBox="0 0 256 256"
                          />
                        </div>
                        {/* Hidden full-size QR for download */}
                        <div className="hidden">
                          <QRCode
                            id={`qr-${form.qrCode}`}
                            value={form.qrCode}
                            size={256}
                          />
                        </div>
                        <button
                          onClick={() => downloadQRCode(form.title, form.qrCode!)}
                          className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                          title="Download QR Code"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No QR code</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        form.status === "active"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {form.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <Actions
                      actions={["edit", "delete"]}
                      onEdit={() =>
                        navigate(`/marketing/feedbackCampaign/edit/${form.id}`)
                      }
                      onDelete={() => handleDeleteClick(form.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl w-[420px] p-6 relative text-center">
            {/* Close */}
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute right-4 top-4 text-gray-500 text-xl"
            >
              ✕
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
                <div className="flex justify-center mb-4">
                  <img src={deleteIcon} alt="delete" className="w-16 h-16" />
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-2">Delete</h2>

            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone. Do you want to proceed with
              deletion?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="border px-6 py-2 rounded border-black"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setShowDeletedModal(true);
                }}
                className="bg-yellow-400 px-6 py-2 rounded"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Delete</h2>

        <div className="flex justify-center mb-4">
          <img src={deleteIcon} alt="delete" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600 mb-6">
          This action cannot be undone. <br />
          Do you want to proceed with deletion?
        </p>

        <div className="flex justify-center gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            className="border px-6 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={confirmDelete}
            className="bg-yellow-400 px-6 py-2 rounded font-medium"
          >
            Yes
          </button>
        </div>
      </Modal>

      {/* DELETE SUCCESS MODAL */}
      <Modal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Deleted!</h2>

        <div className="flex justify-center mb-4">
          <img src={deleteSuccessImg} alt="success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Feedback From has been successfully removed.
        </p>
      </Modal>
    </div>
  );
}

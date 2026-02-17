import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ShoppingCart, RefreshCw, Settings, Package } from "lucide-react";
import LoadingSpinner from "../Common/LoadingSpinner";
import {
  getLowStockAlerts,
  LowStockAlertResponse,
  LowStockItem,
  LowStockByBranch,
  createAutoReorderPO,
  updateAutoReorderSettings,
} from "../../services/inventoryService";
import { getSuppliers, Supplier } from "../../services/supplierService";
import { CRUDToasts } from "../../utils/toast";

export default function LowStockAlerts() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertData, setAlertData] = useState<LowStockAlertResponse | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [creatingPO, setCreatingPO] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingAutoReorder, setEditingAutoReorder] = useState<string | null>(null);
  const [autoReorderForm, setAutoReorderForm] = useState<{
    enableAutoReorder: boolean;
    reorderLevel: number;
    reorderQuantity: number;
    autoReorderSupplierId: string;
  }>({
    enableAutoReorder: false,
    reorderLevel: 0,
    reorderQuantity: 0,
    autoReorderSupplierId: "",
  });
  const [savingAutoReorder, setSavingAutoReorder] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
    fetchSuppliers();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getLowStockAlerts();
      if (response.success && response.data) {
        setAlertData(response.data);
      } else {
        setError(response.message || "Failed to load low stock alerts");
      }
    } catch (err) {
      setError("Failed to load low stock alerts");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await getSuppliers({ status: "active" });
      if (response.success && response.data) {
        setSuppliers(response.data.suppliers);
      }
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAllItems = () => {
    if (!alertData) return;
    const allItemIds = alertData.branches.flatMap((b) => b.items.map((item) => item.id));
    if (selectedItems.size === allItemIds.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allItemIds));
    }
  };

  const handleAutoReorderSelected = async () => {
    if (selectedItems.size === 0) return;

    setCreatingPO(true);
    try {
      const response = await createAutoReorderPO(Array.from(selectedItems));
      if (response.success && response.data) {
        const { invoiceNumber, supplierName, itemCount, grandTotal } = response.data;
        setSuccessMessage(
          `Auto-reorder PO ${invoiceNumber || ""} created for ${itemCount} items from ${supplierName} (Total: ₹${grandTotal.toFixed(2)})`
        );
        CRUDToasts.created("Auto-Reorder Purchase Order");
        setSelectedItems(new Set());
        setTimeout(() => setSuccessMessage(null), 5000);
        fetchAlerts();
      } else {
        setError(response.message || "Failed to create auto-reorder PO");
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError("Failed to create auto-reorder purchase order");
      setTimeout(() => setError(null), 5000);
    } finally {
      setCreatingPO(false);
    }
  };

  const openAutoReorderSettings = (item: LowStockItem) => {
    setEditingAutoReorder(item.id);
    setAutoReorderForm({
      enableAutoReorder: true,
      reorderLevel: item.restockAlert || 0,
      reorderQuantity: item.restockAlert ? item.restockAlert * 2 : 10,
      autoReorderSupplierId: item.supplier?.id || "",
    });
  };

  const handleSaveAutoReorder = async () => {
    if (!editingAutoReorder) return;

    setSavingAutoReorder(true);
    try {
      const response = await updateAutoReorderSettings(editingAutoReorder, {
        enableAutoReorder: autoReorderForm.enableAutoReorder,
        reorderLevel: autoReorderForm.reorderLevel,
        reorderQuantity: autoReorderForm.reorderQuantity,
        autoReorderSupplierId: autoReorderForm.autoReorderSupplierId || null,
      });
      if (response.success) {
        CRUDToasts.updated("Auto-Reorder Settings");
        setEditingAutoReorder(null);
        fetchAlerts();
      } else {
        setError(response.message || "Failed to update auto-reorder settings");
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      setError("Failed to update auto-reorder settings");
      setTimeout(() => setError(null), 5000);
    } finally {
      setSavingAutoReorder(false);
    }
  };

  const getShortageColor = (shortage: number, restockAlert: number) => {
    const ratio = shortage / restockAlert;
    if (ratio >= 1) return "text-red-600 bg-red-50";
    if (ratio >= 0.5) return "text-orange-600 bg-orange-50";
    return "text-yellow-600 bg-yellow-50";
  };

  const allItems = alertData?.branches.flatMap((b) => b.items) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/inventory")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-bb-text">Low Stock Alerts</h1>
            <p className="text-sm text-bb-textSoft mt-1">
              Items below restock threshold that need attention
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          {selectedItems.size > 0 && (
            <button
              onClick={handleAutoReorderSelected}
              disabled={creatingPO}
              className="flex items-center gap-2 px-4 py-2 bg-bb-primary text-black rounded-lg hover:bg-yellow-500 text-sm font-medium disabled:opacity-50"
            >
              <ShoppingCart size={16} />
              {creatingPO
                ? "Creating PO..."
                : `Auto-Reorder (${selectedItems.size} items)`}
            </button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Package size={16} />
          {successMessage}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" message="Loading low stock alerts..." />
        </div>
      )}

      {/* Empty State */}
      {!loading && alertData && alertData.totalItems === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-coloredborder">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-bb-text mb-2">All Stock Levels OK</h3>
          <p className="text-bb-textSoft">
            No items are below their restock alert threshold.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && alertData && alertData.totalItems > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-coloredborder p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-bb-textSoft">Total Low Stock Items</p>
                  <p className="text-2xl font-bold text-bb-text">{alertData.totalItems}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-coloredborder p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-bb-textSoft">Branches Affected</p>
                  <p className="text-2xl font-bold text-bb-text">
                    {alertData.branches.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-coloredborder p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-bb-textSoft">Selected for Reorder</p>
                  <p className="text-2xl font-bold text-bb-text">{selectedItems.size}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Select All */}
          <div className="flex items-center gap-3 px-4">
            <input
              type="checkbox"
              checked={selectedItems.size === allItems.length && allItems.length > 0}
              onChange={selectAllItems}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-sm text-bb-textSoft">
              Select All ({allItems.length} items)
            </span>
          </div>

          {/* Branch Sections */}
          {alertData.branches.map((branchData: LowStockByBranch) => (
            <div
              key={branchData.branch.id}
              className="bg-white rounded-xl border border-coloredborder overflow-hidden"
            >
              <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-bb-text">
                    {branchData.branch.name}
                  </h3>
                  <p className="text-xs text-bb-textSoft">
                    {branchData.itemCount} low stock items
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bb-primary">
                    <tr>
                      <th className="px-4 py-3 w-10"></th>
                      <th className="px-4 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-left">Supplier</th>
                      <th className="px-4 py-3 text-right">In Stock</th>
                      <th className="px-4 py-3 text-right">Restock Alert</th>
                      <th className="px-4 py-3 text-right">Shortage</th>
                      <th className="px-4 py-3 text-right">Cost Price</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchData.items.map((item: LowStockItem, idx: number) => (
                      <tr
                        key={item.id}
                        className={`border-t ${idx % 2 === 0 ? "bg-white" : "bg-[#FFF9ED]"} ${
                          selectedItems.has(item.id) ? "bg-yellow-50" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image || "/placeholder.jpg"}
                              alt={item.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.unit && (
                                <p className="text-xs text-bb-textSoft">{item.unit}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-bb-textSoft">
                          {item.supplier?.name || "No supplier"}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {item.inStock}
                        </td>
                        <td className="px-4 py-3 text-right">{item.restockAlert}</td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getShortageColor(
                              item.shortage,
                              item.restockAlert
                            )}`}
                          >
                            -{item.shortage}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          ₹{item.costPrice?.toFixed(2) || "0.00"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => openAutoReorderSettings(item)}
                              className="p-1.5 text-gray-500 hover:text-bb-text hover:bg-gray-100 rounded"
                              title="Auto-Reorder Settings"
                            >
                              <Settings size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItems(new Set([item.id]));
                                handleAutoReorderSelected();
                              }}
                              className="p-1.5 text-gray-500 hover:text-bb-text hover:bg-gray-100 rounded"
                              title="Create Reorder PO"
                            >
                              <ShoppingCart size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Auto-Reorder Settings Modal */}
      {editingAutoReorder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Auto-Reorder Settings</h3>
              <p className="text-sm text-bb-textSoft mt-1">
                Configure automatic reorder for this product
              </p>
            </div>
            <div className="p-6 space-y-4">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-bb-text">
                  Enable Auto-Reorder
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setAutoReorderForm((prev) => ({
                      ...prev,
                      enableAutoReorder: !prev.enableAutoReorder,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoReorderForm.enableAutoReorder ? "bg-bb-primary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoReorderForm.enableAutoReorder ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {autoReorderForm.enableAutoReorder && (
                <>
                  {/* Reorder Level */}
                  <div>
                    <label className="block text-sm font-medium text-bb-text mb-1">
                      Reorder Level (trigger threshold)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={autoReorderForm.reorderLevel}
                      onChange={(e) =>
                        setAutoReorderForm((prev) => ({
                          ...prev,
                          reorderLevel: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-primary"
                    />
                    <p className="text-xs text-bb-textSoft mt-1">
                      PO will be created when stock falls below this level
                    </p>
                  </div>

                  {/* Reorder Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-bb-text mb-1">
                      Reorder Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={autoReorderForm.reorderQuantity}
                      onChange={(e) =>
                        setAutoReorderForm((prev) => ({
                          ...prev,
                          reorderQuantity: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-primary"
                    />
                    <p className="text-xs text-bb-textSoft mt-1">
                      How many units to order when reorder is triggered
                    </p>
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="block text-sm font-medium text-bb-text mb-1">
                      Default Supplier for Auto-Reorder
                    </label>
                    <select
                      value={autoReorderForm.autoReorderSupplierId}
                      onChange={(e) =>
                        setAutoReorderForm((prev) => ({
                          ...prev,
                          autoReorderSupplierId: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bb-primary"
                    >
                      <option value="">
                        Use most recent supplier
                      </option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-bb-textSoft mt-1">
                      Leave empty to use the most recent supplier for this product
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() => setEditingAutoReorder(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={savingAutoReorder}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAutoReorder}
                className="px-4 py-2 text-sm bg-bb-primary text-black rounded-md hover:bg-yellow-500 disabled:opacity-50"
                disabled={savingAutoReorder}
              >
                {savingAutoReorder ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

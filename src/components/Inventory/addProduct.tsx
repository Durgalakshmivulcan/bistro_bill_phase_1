import { Eye, Pencil, Trash2, RotateCcw } from "lucide-react";
import Input from "../form/Input";
import Select from "../form/Select";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import DataSaveModal from "./datasavemodule";
import { useLocation, useParams } from "react-router-dom";
import { getBrands, Brand } from "../../services/catalogService";
import { adjustStock } from "../../services/inventoryService";
import {
  createInventoryProduct,
  updateInventoryProduct,
  getInventoryProduct,
  CreateInventoryProductData,
  getStockAdjustmentHistory,
  undoStockAdjustment,
  StockAdjustmentHistoryItem,
} from "../../services/inventoryService";
import { getBranches, Branch } from "../../services/branchService";
import { getSuppliers, Supplier } from "../../services/supplierService";
import { getStockAssignmentHistory, StockAssignmentHistory } from "../../services/purchaseOrderService";
import { CRUDToasts, showSuccessToast } from "../../utils/toast";


export default function AddInventoryProduct() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);
  const location = useLocation();
  const { id } = useParams();

  const isView = location.pathname.includes("viewproduct");
  const isEdit = location.pathname.includes("editproduct");
  const isAdd = location.pathname.includes("addproduct");
const [brands, setBrands] = useState<Brand[]>([]);
const [brandsLoading, setBrandsLoading] = useState(false);
  // Form state
  const [formData, setFormData] =
  useState<
    Partial<CreateInventoryProductData> & {
      brandId?: string;
      skuCode?: string;
    }
  >({
    name: '',
    unit: '',
    branchId: '',
    supplierId: '',
    inStock: 0,
    restockAlert: 0,
    costPrice: 0,
    sellingPrice: 0,
    expiryDate: '',
    status: 'active' as const,
    enableAutoReorder: false,
    reorderLevel: 0,
    reorderQuantity: 0,
    autoReorderSupplierId: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [stockHistory, setStockHistory] = useState<StockAssignmentHistory[]>([]);
  const [stockHistoryLoading, setStockHistoryLoading] = useState(false);
  const [stockHistoryError, setStockHistoryError] = useState<string>('');
  const [adjustmentHistory, setAdjustmentHistory] = useState<StockAdjustmentHistoryItem[]>([]);
  const [adjustmentHistoryLoading, setAdjustmentHistoryLoading] = useState(false);
  const [adjustmentHistoryError, setAdjustmentHistoryError] = useState<string>('');
  const [undoingId, setUndoingId] = useState<string | null>(null);
const [showAssignStock, setShowAssignStock] = useState(false);
const [assignBranchId, setAssignBranchId] = useState("");
const [assignPoNumber, setAssignPoNumber] = useState("");
const [assignQuantity, setAssignQuantity] = useState("");
  // Load branches on mount
  useEffect(() => {
  const fetchBrands = async () => {
    try {
      setBrandsLoading(true);

      const response = await getBrands({ status: "active" });

      if (response.success && response.data) {
        setBrands(response.data.brands);
      }
    } catch (err) {
      console.error("Failed to load brands:", err);
    } finally {
      setBrandsLoading(false);
    }
  };

  fetchBrands();
}, []);
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await getBranches({ status: "active" });
        if (response.success && response.data) {
          setBranches(response.data.branches);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };

    fetchBranches();
  }, []);

  // Load suppliers on mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      setSuppliersLoading(true);
      try {
        const response = await getSuppliers({ status: 'active' });
        if (response.success && response.data) {
          setSuppliers(response.data.suppliers);
        }
      } catch (err) {
        console.error("Failed to load suppliers:", err);
      } finally {
        setSuppliersLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Load product data in edit/view mode
  useEffect(() => {
    if ((isEdit || isView) && id) {
      loadProductData();
      loadStockHistory();
      loadAdjustmentHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit, isView]);

  const loadProductData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getInventoryProduct(id!);
      if (response.success && response.data) {
        const product = response.data;
        setFormData({
          name: product.name,
          unit: product.unit || '',
          branchId: product.branch.id,
          supplierId: product.supplier?.id || '',
          inStock: product.inStock ?? 0,
          restockAlert: product.restockAlert ?? 0,
          costPrice: product.costPrice ?? 0,
          sellingPrice: product.sellingPrice ?? 0,
          expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
          status: product.status as 'active' | 'inactive',
          enableAutoReorder: product.enableAutoReorder ?? false,
          reorderLevel: product.reorderLevel ?? 0,
          reorderQuantity: product.reorderQuantity ?? 0,
          autoReorderSupplierId: product.autoReorderSupplierId || '',
        });
        if (product.image) {
          setImagePreview(product.image);
        }
      } else {
        setError(response.message || 'Failed to load product data');
      }
    } catch (err) {
      setError('Failed to load product data');
      console.error('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStockHistory = async () => {
    if (!id) return;

    setStockHistoryLoading(true);
    setStockHistoryError('');
    try {
      const response = await getStockAssignmentHistory(id);
      if (response.success && response.data) {
        setStockHistory(response.data.assignments);
      } else {
        setStockHistoryError(response.message || 'Failed to load stock history');
      }
    } catch (err) {
      setStockHistoryError('Failed to load stock history');
      console.error('Error loading stock history:', err);
    } finally {
      setStockHistoryLoading(false);
    }
  };

  const loadAdjustmentHistory = async () => {
    if (!id) return;

    setAdjustmentHistoryLoading(true);
    setAdjustmentHistoryError('');
    try {
      const response = await getStockAdjustmentHistory(id);
      if (response.success && response.data) {
        setAdjustmentHistory(response.data.adjustments);
      } else {
        setAdjustmentHistoryError('Failed to load adjustment history');
      }
    } catch (err) {
      setAdjustmentHistoryError('Failed to load adjustment history');
      console.error('Error loading adjustment history:', err);
    } finally {
      setAdjustmentHistoryLoading(false);
    }
  };

  const handleUndoAdjustment = async (adjustmentId: string) => {
    setUndoingId(adjustmentId);
    try {
      const response = await undoStockAdjustment(adjustmentId);
      if (response.success) {
        showSuccessToast('Stock adjustment undone successfully');
        // Reload both adjustment history and product data to reflect changes
        loadAdjustmentHistory();
        loadProductData();
      } else {
        setAdjustmentHistoryError(response.error?.message || 'Failed to undo adjustment');
      }
    } catch (err) {
      setAdjustmentHistoryError(err instanceof Error ? err.message : 'Failed to undo adjustment');
    } finally {
      setUndoingId(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name || !formData.unit || !formData.brandId) {
      setError('Please fill in all required fields (Name, Unit, Brand)');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (isAdd) {
        // Create new product
        const response = await createInventoryProduct(formData as CreateInventoryProductData, imageFile || undefined);
        if (response.success) {
          CRUDToasts.created("Inventory Product");
          setShowSuccess(true);
          setTimeout(() => {
            navigate('/inventory');
          }, 2000);
        } else {
          setError(response.message || 'Failed to create product');
        }
      } else if (isEdit) {
        // Update existing product
        const response = await updateInventoryProduct(id!, formData, imageFile || undefined);
        if (response.success) {
          CRUDToasts.updated("Inventory Product");
          setShowSuccess(true);
          setTimeout(() => {
            navigate('/inventory');
          }, 2000);
        } else {
          setError(response.message || 'Failed to update product');
        }
      }
    } catch (err) {
      setError('An error occurred while saving');
      console.error('Error saving product:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-bb-bg min-h-screen p-6">
        <p className="text-center text-gray-600">Loading product data...</p>
      </div>
    );
  }

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-6">
      <h1 className="text-2xl font-bold">  {isAdd && "Add Product"}
  {isEdit && "Edit Product"}
  {isView && "View Product"}</h1>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* ================= PRODUCT DETAILS ================= */}
      <div className="bg-bb-bg p-6 rounded-xl space-y-6 border border-coloredborder">
        <h2 className="font-semibold text-yellow-600">Product Details</h2>

        {/* <div className="flex flex-col lg:flex-row gap-6"> */}

  {/* LEFT — IMAGE CARD */}
  <div className="w-full lg:w-[260px]">
    <label className="font-semibold block mb-2">Product Image</label>

    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center min-h-[220px] flex flex-col justify-center items-center bg-black/5">

      {imagePreview && (
        <img
          src={imagePreview}
          alt="Preview"
          className="w-32 h-32 object-cover mb-3 rounded"
        />
      )}

      <input
        type="file"
        id="image-upload"
        accept="image/jpeg,image/png,image/jpg"
        onChange={handleImageChange}
        className="hidden"
        disabled={isView}
      />

      <label
        htmlFor="image-upload"
        className={`bg-yellow-400 px-5 py-2 rounded font-medium cursor-pointer ${
          isView ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        Upload Image
      </label>

      <p className="text-xs text-gray-500 mt-3 max-w-[200px]">
        (The recommended image size should be between 400x260 and
        600x300 pixels, and the format must be JPG or PNG.)
      </p>
    </div>
  </div>

  {/* RIGHT — FORM GRID */}
  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">

    <Input
      label="Product Name"
      required
      name="name"
      value={formData.name || ""}
      onChange={(value) =>
        setFormData((prev) => ({ ...prev, name: value }))
      }
      disabled={isView}
    />

    <Input
      label="SKU Code"
      name="skuCode"
      value={(formData as any).skuCode || ""}
      onChange={(value) =>
        setFormData((prev) => ({ ...prev, skuCode: value }))
      }
      disabled={isView}
    />

    <Select
  label="Brand"
  required
  value={(formData as any).brandId || ""}
  onChange={(value) =>
    setFormData((prev) => ({ ...prev, brandId: value }))
  }
  options={[
    {
      label: brandsLoading
        ? "Loading brands..."
        : brands.length === 0
        ? "No brands available"
        : "Select Brand",
      value: "",
    },
    ...brands.map((brand) => ({
      label: brand.name,
      value: brand.id,
    })),
  ]}
  disabled={isView || brandsLoading}
/>

    <Input
      label="Measuring Unit"
      required
      name="unit"
      value={formData.unit || ""}
      onChange={(value) =>
        setFormData((prev) => ({ ...prev, unit: value }))
      }
      disabled={isView}
    />

    <Select
      label="Supplier Name"
      required
      value={formData.supplierId || ""}
      onChange={(value) =>
        setFormData((prev) => ({ ...prev, supplierId: value }))
      }
      options={[
        { label: "Select the Supplier", value: "" },
        ...suppliers.map((s) => ({ label: s.name, value: s.id })),
      ]}
      disabled={isView}
    />

    <Input
      label="Total Stock"
      required
      type="number"
      name="inStock"
      value={String(formData.inStock || 0)}
      onChange={(value) =>
        setFormData((prev) => ({
          ...prev,
          inStock: parseFloat(value) || 0,
        }))
      }
      disabled={isView}
    />

    <Input
      label="Restock Alert"
      required
      type="number"
      name="restockAlert"
      value={String(formData.restockAlert || 0)}
      onChange={(value) =>
        setFormData((prev) => ({
          ...prev,
          restockAlert: parseFloat(value) || 0,
        }))
      }
      disabled={isView}
    />

    <Input
      label="Cost Price"
      required
      type="number"
      name="costPrice"
      value={String(formData.costPrice || 0)}
      onChange={(value) =>
        setFormData((prev) => ({
          ...prev,
          costPrice: parseFloat(value) || 0,
        }))
      }
      disabled={isView}
    />

    <Input
      label="Selling Price"
      required
      type="number"
      name="sellingPrice"
      value={String(formData.sellingPrice || 0)}
      onChange={(value) =>
        setFormData((prev) => ({
          ...prev,
          sellingPrice: parseFloat(value) || 0,
        }))
      }
      disabled={isView}
    />

    <Input
      label="Expiry Date"
      required
      type="date"
      name="expiryDate"
      value={formData.expiryDate || ""}
      onChange={(value) =>
        setFormData((prev) => ({ ...prev, expiryDate: value }))
      }
      disabled={isView}
    />
  </div>
</div>


      {/* ================= AUTO-REORDER SETTINGS ================= */}
      <div className="bg-bb-bg p-6 rounded-xl space-y-4 border border-coloredborder">
        <h2 className="font-semibold text-yellow-600">Auto-Reorder Settings</h2>

        {/* Enable Toggle */}
        <div className="flex items-center gap-4">
          <label className="font-medium text-sm">Enable Auto-Reorder</label>
          <button
            type="button"
            onClick={() => {
              if (!isView) {
                setFormData(prev => ({
                  ...prev,
                  enableAutoReorder: !prev.enableAutoReorder,
                }));
              }
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.enableAutoReorder ? "bg-bb-primary" : "bg-gray-300"
            } ${isView ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            disabled={isView}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.enableAutoReorder ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {formData.enableAutoReorder && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Reorder Level (Trigger Threshold)"
              type="number"
              name="reorderLevel"
              value={String(formData.reorderLevel || 0)}
              onChange={(value) => setFormData(prev => ({ ...prev, reorderLevel: parseFloat(value) || 0 }))}
              disabled={isView}
            />
            <Input
              label="Reorder Quantity"
              type="number"
              name="reorderQuantity"
              value={String(formData.reorderQuantity || 0)}
              onChange={(value) => setFormData(prev => ({ ...prev, reorderQuantity: parseFloat(value) || 0 }))}
              disabled={isView}
            />
            <Select
              label="Auto-Reorder Supplier"
              value={formData.autoReorderSupplierId || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, autoReorderSupplierId: value }))}
              options={[
                {
                  label: "Use Most Recent Supplier",
                  value: ""
                },
                ...suppliers.map(supplier => ({
                  label: supplier.name,
                  value: supplier.id
                }))
              ]}
              disabled={isView}
            />
          </div>
        )}

        {formData.enableAutoReorder && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              When stock falls below <strong>{formData.reorderLevel || 0}</strong> units,
              a purchase order for <strong>{formData.reorderQuantity || 0}</strong> units
              will be automatically created with {formData.autoReorderSupplierId
                ? "the selected supplier"
                : "the most recent supplier"}.
              A notification will be sent to the purchase manager.
            </p>
          </div>
        )}
      </div>

      {/* ================= STOCK DETAILS ================= */}
      {(
        <div className="bg-bb-bg p-6 rounded-xl space-y-4 border border-coloredborder">
          <h2 className="font-semibold text-yellow-600">Stock Details</h2>
          <div className="border border-coloredborder p-3">
            <button
  disabled={!id}
  onClick={() => {
    if (!id) {
      showSuccessToast("Please save product first");
      return;
    }
    setShowAssignStock((prev) => !prev);
  }}
  className={`w-full border px-4 py-2 rounded text-sm border border-black ${
    !id ? "opacity-50 cursor-not-allowed" : ""
  }`}
>
  + Assign Stock
</button>{showAssignStock && (
  <div className="border border-coloredborder rounded-lg p-4 mt-3">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* Branch */}
     <Select
  label="Branch"
  required
  value={formData.branchId || ""}
  onChange={(value) =>
    setFormData((prev) => ({ ...prev, branchId: value }))
  }
  options={[
    { label: "Select Branch", value: "" },
    ...branches.map((branch) => ({
      label: branch.name,
      value: branch.id,
    })),
  ]}
  disabled={isView}
/>

      {/* PO Invoice */}
      <Input
        label="PO Invoice Number"
        value={assignPoNumber}
        onChange={setAssignPoNumber}
        placeholder="Select PO Invoice Number"
      />

      {/* Quantity */}
      <Input
        label="Assign Quantity"
        type="number"
        value={assignQuantity}
        onChange={setAssignQuantity}
        placeholder="Enter Quantity"
      />
    </div>

    {/* Action buttons */}
    <div className="flex justify-end gap-2 mt-4">
      <button
        onClick={() => setShowAssignStock(false)}
        className="border px-4 py-2 rounded"
      >
        Cancel
      </button>

      <button
        onClick={async () => {
  if (!id) {
    showSuccessToast("Please save product first");
    return;
  }

  if (!assignBranchId || !assignQuantity) {
    showSuccessToast("Please fill required fields");
    return;
  }

  try {
    await adjustStock(id, {
  adjustment: Number(assignQuantity),
  reason: `Stock assigned via PO ${assignPoNumber || "-"}`,
});

    showSuccessToast("Stock assigned successfully");

    setShowAssignStock(false);
    setAssignBranchId("");
    setAssignPoNumber("");
    setAssignQuantity("");

    await loadStockHistory();
    await loadProductData();
  } catch (err) {
    console.error("Assign stock failed:", err);
  }
}}
        className="bg-yellow-400 px-4 py-2 rounded font-medium"
      >
        Save
      </button>
    </div>
  </div>
)}
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bb-primary">
                <tr>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">PO Invoice Number<br />(Recent)</th>
                  <th className="px-4 py-3">Quantity Assigned<br />(Recent)</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockHistoryLoading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      Loading stock history...
                    </td>
                  </tr>
                ) : stockHistoryError ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center">
                      <div className="text-red-600">{stockHistoryError}</div>
                      <button
                        onClick={loadStockHistory}
                        className="mt-2 text-blue-600 hover:underline"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : stockHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      No stock assignments found
                    </td>
                  </tr>
                ) : (
                  stockHistory.map((assignment, index) => (
                    <tr key={assignment.id} className={index % 2 === 0 ? "bg-white border-t" : "bg-[#FFF9ED] border-t"}>
                      <td className="px-4 py-3">{assignment.purchaseOrder.branch.name}</td>
                      <td className="px-4 py-3">{assignment.purchaseOrder.invoiceNumber || 'N/A'}</td>
                      <td className="px-4 py-3">{assignment.quantity}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-3">
                          <button className="text-gray-600 hover:text-black">
                            <Eye size={16} />
                          </button>
                          <button className="text-gray-600 hover:text-black">
                            <Pencil size={16} />
                          </button>
                          <button className="text-red-500 hover:text-red-700">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= STOCK ADJUSTMENT HISTORY ================= */}
      {(isEdit || isView) && (
        <div className="bg-bb-bg p-6 rounded-xl space-y-4 border border-coloredborder">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-yellow-600">Stock Adjustment History</h2>
            <span className="text-xs text-gray-500">Last 10 adjustments</span>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-bb-primary">
                <tr>
                  <th className="px-4 py-3 text-left">Date & Time</th>
                  <th className="px-4 py-3 text-right">Adjustment</th>
                  <th className="px-4 py-3 text-right">Old Stock</th>
                  <th className="px-4 py-3 text-right">New Stock</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adjustmentHistoryLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Loading adjustment history...
                    </td>
                  </tr>
                ) : adjustmentHistoryError ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center">
                      <div className="text-red-600">{adjustmentHistoryError}</div>
                      <button
                        onClick={loadAdjustmentHistory}
                        className="mt-2 text-blue-600 hover:underline"
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : adjustmentHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No stock adjustments found
                    </td>
                  </tr>
                ) : (
                  adjustmentHistory.map((adj, index) => (
                    <tr key={adj.id} className={index % 2 === 0 ? "bg-white border-t" : "bg-[#FFF9ED] border-t"}>
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(adj.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(adj.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${adj.adjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {adj.adjustment >= 0 ? '+' : ''}{adj.adjustment}
                      </td>
                      <td className="px-4 py-3 text-right">{adj.oldStock}</td>
                      <td className="px-4 py-3 text-right">{adj.newStock}</td>
                      <td className="px-4 py-3 text-gray-600">{adj.reason || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        {adj.undone ? (
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                            Undone
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                            Applied
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!adj.undone && (
                          <button
                            onClick={() => handleUndoAdjustment(adj.id)}
                            disabled={undoingId === adj.id}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Undo this adjustment"
                          >
                            <RotateCcw size={12} className={undoingId === adj.id ? 'animate-spin' : ''} />
                            {undoingId === adj.id ? 'Undoing...' : 'Undo'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= ACTION BUTTONS ================= */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => navigate(-1)}
          className="border border-black px-4 py-2 rounded"
          disabled={saving}
        >
          Cancel
        </button>
        {!isView && (
          <button
            className="bg-yellow-400 px-4 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : isAdd ? "Save" : "Update"}
          </button>
        )}
      </div>
      {/* SUCCESS MODAL */}
      <DataSaveModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}

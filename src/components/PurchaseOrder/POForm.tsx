import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Input from "../form/Input";
import Select from "../form/Select";
import Modal from "../../components/ui/Modal";
import LoadingSpinner from "../Common/LoadingSpinner";
import tickImg from "../../assets/tick.png";
import { Trash2, RefreshCw, Calendar } from "lucide-react";
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  getPurchaseOrder,
  addPOItem,
  updatePOItem,
  removePOItem,
  updatePOStatus,
  updatePORecurrence,
  PurchaseOrderDetail,
  PurchaseOrderItem,
  CreatePurchaseOrderData,
  UpdatePurchaseOrderData,
  RecurrenceFrequency,
  RecurrenceStatus
} from "../../services/purchaseOrderService";
import { getSuppliers, Supplier } from "../../services/supplierService";
import { getInventoryProducts, InventoryProduct } from "../../services/inventoryService";
import { getBranches, Branch } from "../../services/branchService";
import { useBranch } from "../../contexts/BranchContext";
import ReceivePOModal from "./ReceivePOModal";
import { CRUDToasts } from "../../utils/toast";

type Mode = "add" | "edit" | "view";

interface POFormProps {
  mode: Mode;
  defaultValues?: any;
}

export default function POForm({
  mode,
  defaultValues,
}: POFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentBranchId } = useBranch();
  const isView = mode === "view";
  const isEdit = mode === "edit";

  // State for form data - default to current branch from context
  const [branchId, setBranchId] = useState(currentBranchId);
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");

  // State for recurring PO
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>("Monthly");
  const [recurrenceStartDate, setRecurrenceStartDate] = useState("");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  // State for PO details
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderDetail | null>(null);
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);

  // State for adding new item
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  // State for lists
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // State for UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);

  // Load branches, suppliers and inventory products
  useEffect(() => {
    const fetchData = async () => {
      setLoadingBranches(true);
      try {
        const [branchesRes, suppliersRes, productsRes] = await Promise.all([
          getBranches({ status: 'Active' }),
          getSuppliers(),
          getInventoryProducts()
        ]);

        if (branchesRes.success && branchesRes.data?.branches) {
          setBranches(branchesRes.data.branches);
        }

        if (suppliersRes.success && suppliersRes.data?.suppliers) {
          setSuppliers(suppliersRes.data.suppliers);
        }

        if (productsRes.success && productsRes.data?.inventoryProducts) {
          setInventoryProducts(productsRes.data.inventoryProducts);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load form data. Please refresh the page.");
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchData();
  }, []);

  // Load PO data in edit/view mode
  useEffect(() => {
    if ((isEdit || isView) && id) {
      const loadPO = async () => {
        setLoading(true);
        setError("");

        try {
          const response = await getPurchaseOrder(id);

          if (response.success && response.data) {
            setPurchaseOrder(response.data);
            setBranchId(response.data.branch.id);
            setSupplierId(response.data.supplier.id);
            setNotes(response.data.notes || "");
            setItems(response.data.items || []);
            // Populate recurrence fields
            if (response.data.isRecurring) {
              setIsRecurring(true);
              setRecurrenceFrequency(response.data.recurrenceFrequency || "Monthly");
              setRecurrenceStartDate(response.data.recurrenceStartDate ? response.data.recurrenceStartDate.split("T")[0] : "");
              setRecurrenceEndDate(response.data.recurrenceEndDate ? response.data.recurrenceEndDate.split("T")[0] : "");
            }
          } else {
            setError(response.message || "Failed to load purchase order");
          }
        } catch (err: any) {
          setError(err.message || "Failed to load purchase order");
        } finally {
          setLoading(false);
        }
      };

      loadPO();
    }
  }, [isEdit, isView, id]);

  const handleSubmit = async () => {
    if (isView) return;

    // Validation
    if (!branchId) {
      setError("Please select a branch");
      return;
    }
    if (!supplierId) {
      setError("Please select a supplier");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (mode === "add") {
        const data: CreatePurchaseOrderData = {
          branchId,
          supplierId,
          notes: notes || undefined,
          isRecurring: isRecurring || undefined,
          recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
          recurrenceStartDate: isRecurring && recurrenceStartDate ? recurrenceStartDate : undefined,
          recurrenceEndDate: isRecurring && recurrenceEndDate ? recurrenceEndDate : undefined,
        };

        const response = await createPurchaseOrder(data);

        if (response.success) {
          CRUDToasts.created("Purchase Order");
          setSuccessOpen(true);
          setTimeout(() => {
            setSuccessOpen(false);
            navigate("/purchaseorder");
          }, 2000);
        } else {
          setError(response.message || "Failed to create purchase order");
        }
      } else if (mode === "edit" && id) {
        const data: UpdatePurchaseOrderData = {
          notes: notes || undefined,
          isRecurring: isRecurring || undefined,
          recurrenceFrequency: isRecurring ? recurrenceFrequency : undefined,
          recurrenceStartDate: isRecurring && recurrenceStartDate ? recurrenceStartDate : undefined,
          recurrenceEndDate: isRecurring && recurrenceEndDate ? recurrenceEndDate : undefined,
        };

        const response = await updatePurchaseOrder(id, data);

        if (response.success) {
          CRUDToasts.updated("Purchase Order");
          setSuccessOpen(true);
          setTimeout(() => {
            setSuccessOpen(false);
            navigate("/purchaseorder");
          }, 2000);
        } else {
          setError(response.message || "Failed to update purchase order");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to save purchase order");
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!purchaseOrder?.id) {
      setError("Please save the PO first before adding items");
      return;
    }

    if (!selectedProductId || !quantity || !unitPrice) {
      setError("Please fill in all item fields");
      return;
    }

    try {
      const response = await addPOItem(purchaseOrder.id, {
        inventoryProductId: selectedProductId,
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice)
      });

      if (response.success && response.data?.item) {
        setItems([...items, response.data.item]);
        // Clear form
        setSelectedProductId("");
        setQuantity("");
        setUnitPrice("");
        setError("");

        // Update grandTotal from response
        if (purchaseOrder && response.data.purchaseOrder) {
          setPurchaseOrder({
            ...purchaseOrder,
            grandTotal: response.data.purchaseOrder.grandTotal
          });
        }
      } else {
        setError(response.message || "Failed to add item");
      }
    } catch (err: any) {
      setError(err.message || "Failed to add item");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!purchaseOrder?.id) return;

    try {
      const response = await removePOItem(purchaseOrder.id, itemId);

      if (response.success) {
        setItems(items.filter(item => item.id !== itemId));
        setError("");

        // Update grandTotal from response
        if (purchaseOrder && response.data?.purchaseOrder) {
          setPurchaseOrder({
            ...purchaseOrder,
            grandTotal: response.data.purchaseOrder.grandTotal
          });
        }
      } else {
        setError(response.message || "Failed to remove item");
      }
    } catch (err: any) {
      setError(err.message || "Failed to remove item");
    }
  };

  const selectedSupplier = suppliers.find(s => s.id === supplierId);
  const calculateSubtotal = () => items.reduce((sum, item) => sum + item.totalPrice, 0);

  const getNextScheduledDate = (): string | null => {
    if (!isRecurring || !recurrenceStartDate) return null;
    if (purchaseOrder?.nextScheduledDate) {
      return new Date(purchaseOrder.nextScheduledDate).toLocaleDateString();
    }
    const start = new Date(recurrenceStartDate);
    const now = new Date();
    let next = new Date(start);
    while (next <= now) {
      if (recurrenceFrequency === "Weekly") next.setDate(next.getDate() + 7);
      else if (recurrenceFrequency === "Biweekly") next.setDate(next.getDate() + 14);
      else next.setMonth(next.getMonth() + 1);
    }
    if (recurrenceEndDate && next > new Date(recurrenceEndDate)) return null;
    return next.toLocaleDateString();
  };

  const handleReceivePO = async (
    receivedItems: { itemId: string; orderedQty: number; receivedQty: number }[],
    notes: string
  ) => {
    if (!purchaseOrder?.id) return;

    try {
      // Call API to mark PO as received
      // Note: The backend will automatically update inventory stock levels
      const response = await updatePOStatus(purchaseOrder.id, {
        status: 'Received'
      });

      if (response.success) {
        // Refresh PO data to show updated status
        const refreshResponse = await getPurchaseOrder(purchaseOrder.id);
        if (refreshResponse.success && refreshResponse.data) {
          setPurchaseOrder(refreshResponse.data);
        }

        // Show success message
        setSuccessOpen(true);
        setTimeout(() => {
          setSuccessOpen(false);
          navigate("/purchaseorder");
        }, 2000);
      } else {
        throw new Error(response.message || "Failed to receive purchase order");
      }
    } catch (err: any) {
      throw err; // Re-throw to be handled by modal
    }
  };

  if (loading) {
    return (
      <div className="bg-bb-bg min-h-screen p-6 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading purchase order..." />
      </div>
    );
  }

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        {mode === "add" && "Create New PO"}
        {mode === "edit" && "Edit PO"}
        {mode === "view" && "View PO"}
      </h1>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* ================= BASIC DETAILS ================= */}
      <div className="bg-bb-bg p-6 rounded-xl space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-yellow-600 font-semibold">
            Basic Details
          </h2>

          {/* Status Badge */}
          {purchaseOrder && (
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                purchaseOrder.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                purchaseOrder.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                purchaseOrder.status === 'Received' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {purchaseOrder.status}
              </span>

              {/* Receive PO button for Approved orders */}
              {purchaseOrder.status === 'Approved' && isView && (
                <button
                  onClick={() => setReceiveModalOpen(true)}
                  className="bg-green-500 text-white px-4 py-1 rounded font-medium hover:bg-green-600"
                >
                  Receive PO
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Branch"
            disabled={isView || isEdit || loadingBranches}
            value={branchId}
            onChange={(value) => setBranchId(value)}
            options={[
              {
                label: loadingBranches
                  ? "Loading branches..."
                  : branches.length === 0
                  ? "No branches available"
                  : "Select Branch",
                value: ""
              },
              ...branches.map((b) => ({
                label: b.name,
                value: b.id,
              }))
            ]}
          />

          <Input
            label="PO Invoice Number"
            value={purchaseOrder?.invoiceNumber || "Auto generated"}
            disabled
          />

          <Select
            label="Supplier Name"
            disabled={isView || isEdit}
            value={supplierId}
            onChange={(value) => setSupplierId(value)}
            options={[
              { label: "Select Supplier", value: "" },
              ...suppliers.map((s) => ({
                label: s.name,
                value: s.id,
              }))
            ]}
          />

          <Input
            label="Supplier Code"
            value={selectedSupplier?.code || "Auto fetched"}
            disabled
          />

          <Input
            label="Supplier Email"
            value={selectedSupplier?.email || "Auto fetched"}
            disabled
          />

          <Input
            label="Supplier Phone"
            value={selectedSupplier?.phone || "Auto fetched"}
            disabled
          />

          {/* Notes */}
          <div className="col-span-2">
            <label className="text-sm font-medium">
              Notes
            </label>
            <textarea
              disabled={isView}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded-md px-3 py-2 mt-1"
              rows={3}
              placeholder="Type here..."
            />
          </div>
        </div>
      </div>

      {/* ================= RECURRING PO SETTINGS ================= */}
      <div className="bg-bb-bg p-6 rounded-xl space-y-4">
        <div className="flex items-center gap-2">
          <RefreshCw size={18} className="text-yellow-600" />
          <h2 className="text-yellow-600 font-semibold">
            Recurring PO Settings
          </h2>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              disabled={isView}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-400"></div>
          </label>
          <span className="text-sm font-medium">
            {isRecurring ? "Recurring PO Enabled" : "Enable Recurring PO"}
          </span>
        </div>

        {isRecurring && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium block mb-1">Frequency</label>
              <select
                value={recurrenceFrequency}
                onChange={(e) => setRecurrenceFrequency(e.target.value as RecurrenceFrequency)}
                disabled={isView}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              >
                <option value="Weekly">Weekly</option>
                <option value="Biweekly">Biweekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Start Date</label>
              <input
                type="date"
                value={recurrenceStartDate}
                onChange={(e) => setRecurrenceStartDate(e.target.value)}
                disabled={isView}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                disabled={isView}
                min={recurrenceStartDate || undefined}
                className="w-full border rounded-md px-3 py-2 text-sm bg-white"
              />
            </div>
          </div>
        )}

        {/* Recurrence Status and Next Scheduled Date (view/edit mode) */}
        {isRecurring && purchaseOrder && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Status: {purchaseOrder.recurrenceStatus || "Active"}
                </span>
              </div>

              {getNextScheduledDate() && (
                <div className="text-sm text-blue-700">
                  Next scheduled PO: <span className="font-semibold">{getNextScheduledDate()}</span>
                </div>
              )}

              {purchaseOrder.recurrenceFrequency && (
                <div className="text-sm text-blue-700">
                  Frequency: <span className="font-semibold">{purchaseOrder.recurrenceFrequency}</span>
                </div>
              )}
            </div>

            {/* Email notification info */}
            <p className="text-xs text-blue-600 mt-2">
              An email notification will be sent when a recurring PO is automatically generated.
            </p>
          </div>
        )}
      </div>

      {/* ================= PRODUCT DETAILS ================= */}
      <div className="bg-bb-bg p-6 rounded-xl space-y-4">
        <h2 className="text-yellow-600 font-semibold">
          Product Details
        </h2>

        {purchaseOrder && purchaseOrder.status === 'Pending' && !isView && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Product"
                disabled={isView}
                value={selectedProductId}
                onChange={(value) => setSelectedProductId(value)}
                options={[
                  { label: "Select Product", value: "" },
                  ...inventoryProducts.map((p) => ({
                    label: `${p.name} (${p.unit})`,
                    value: p.id,
                  }))
                ]}
              />

              <Input
                label="Unit Price"
                placeholder="0.00"
                disabled={isView}
                value={unitPrice}
                onChange={(value) => setUnitPrice(value)}
              />

              <Input
                label="Quantity"
                placeholder="1"
                disabled={isView}
                value={quantity}
                onChange={(value) => setQuantity(value)}
              />

              <div className="flex items-end">
                <button
                  onClick={handleAddItem}
                  className="border px-4 py-2 rounded w-full text-sm bg-yellow-400 font-medium"
                >
                  + Add Item
                </button>
              </div>
            </div>
          </>
        )}

        {/* PRODUCTS TABLE */}
        {items.length > 0 && (
          <table className="w-full text-sm border rounded">
            <thead className="bg-bb-primary">
              <tr>
                <th className="px-3 py-2 text-left">
                  Product
                </th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2">Unit Price</th>
                <th className="px-3 py-2">
                  Quantity
                </th>
                <th className="px-3 py-2">
                  Total Price
                </th>
                <th className="px-3 py-2">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">
                    {item.inventoryProduct.name}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {item.inventoryProduct.unit || "N/A"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    ₹ {item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2 text-center">
                    ₹ {item.totalPrice.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {!isView && purchaseOrder?.status === 'Pending' && (
                      <Trash2
                        size={14}
                        className="cursor-pointer inline-block text-red-500"
                        onClick={() => handleRemoveItem(item.id)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {items.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No items added yet. {purchaseOrder ? "Add items using the form above." : "Please save the PO first before adding items."}
          </p>
        )}


        {/* SUMMARY */}
        {items.length > 0 && (
          <div className="bg-bb-bg flex justify-end">
            <div className="w-full md:w-1/2 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹ {calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base">
                <span>Grand Total</span>
                <span>₹ {(purchaseOrder?.grandTotal || calculateSubtotal()).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= ACTION BUTTONS ================= */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => navigate(-1)}
          className="border px-6 py-2 rounded"
        >
          {isView ? "Back" : "Cancel"}
        </button>

        {mode !== "view" && (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : (mode === "add" ? "Create PO" : "Update")}
          </button>
        )}
      </div>

      {/* ================= SUCCESS MODAL ================= */}
      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">
          {mode === "add"
            ? "PO Created"
            : purchaseOrder?.status === 'Received'
            ? "PO Received"
            : "PO Updated"}
        </h2>

        <div className="flex justify-center mb-6">
          <img
            src={tickImg}
            alt="Success"
            className="w-16 h-16"
          />
        </div>

        <p className="text-sm text-gray-600">
          {mode === "add"
            ? "Purchase Order created successfully."
            : purchaseOrder?.status === 'Received'
            ? "Purchase order has been marked as received and inventory has been updated."
            : "Purchase Order updated successfully."}
        </p>
      </Modal>

      {/* ================= RECEIVE PO MODAL ================= */}
      {purchaseOrder && (
        <ReceivePOModal
          open={receiveModalOpen}
          onClose={() => setReceiveModalOpen(false)}
          items={items}
          onConfirm={handleReceivePO}
        />
      )}
    </div>
  );
}

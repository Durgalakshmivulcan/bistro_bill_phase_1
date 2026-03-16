import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "../../components/ui/Modal";
import LoadingSpinner from "../Common/LoadingSpinner";
import { Trash2, RefreshCw, Calendar, ChevronDown, Upload, Pencil, Truck, BadgePercent, Paperclip } from "lucide-react";
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
import PurchaseOrderTabs from "../NavTabs/PurchaseOrderTabs";
import { showUpdatedSweetAlert } from "../../utils/swalAlerts";
import { useAuth } from "../../contexts/AuthContext";

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
  const { currentBranchId, currentBranch, accessLevel } = useBranch();
  const { user } = useAuth();
  const branchLocked = accessLevel === "branch_manager";
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const pageShell = "max-w-6xl mx-auto space-y-6 text-[#1F1F1F]";
  const sectionCard = "bg-[#FFFAF0] border border-[#EADFC2] rounded-xl p-6 shadow-[0_1px_6px_rgba(0,0,0,0.03)]";
  const sectionTitle = "text-[15px] font-semibold text-[#D49B0C]";

  // State for form data - default to current branch from context
  const [branchId, setBranchId] = useState(currentBranchId);
  const [originalBranchId, setOriginalBranchId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [originalSupplierId, setOriginalSupplierId] = useState("");
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
  const [taxValue, setTaxValue] = useState("");

  const [deliveryDate, setDeliveryDate] = useState("");
  const [attachmentsLabel, setAttachmentsLabel] = useState("");
  const attachmentsInputRef = useRef<HTMLInputElement | null>(null);

  // Delivery charges default to 0; user can add via the Charges modal.
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [discount, setDiscount] = useState(0);

  // Charges/Discount modals (UI-only)
  const [chargesModalOpen, setChargesModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [chargesDraft, setChargesDraft] = useState({ name: "", amount: "" });
  const [discountDraft, setDiscountDraft] = useState({ name: "", amount: "" });

  // State for lists
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // State for UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState(false);
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declineRemarks, setDeclineRemarks] = useState("");

  // Load branches, suppliers and inventory products
  useEffect(() => {
    // Sync branch selection with context on add mode
    if (mode === "add" && currentBranchId && currentBranchId !== branchId) {
      setBranchId(currentBranchId);
    }
  }, [currentBranchId, branchId, mode]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingBranches(true);
      // Don't show a global error banner for a single failing lookup call.
      // We can still render the form UI and let the user retry/select later.
      setError("");
      try {
        const branchesReq = (async () => {
          try {
            return await getBranches({ status: "Active" });
          } catch {
            // Some environments use lowercase status filters.
            return await getBranches({ status: "active" });
          }
        })();

        const [branchesSettle, suppliersSettle, productsSettle] = await Promise.allSettled([
          branchesReq,
          getSuppliers(),
          getInventoryProducts(),
        ]);

        const branchesRes = branchesSettle.status === "fulfilled" ? branchesSettle.value : null;
        const suppliersRes = suppliersSettle.status === "fulfilled" ? suppliersSettle.value : null;
        const productsRes = productsSettle.status === "fulfilled" ? productsSettle.value : null;

        if (branchesRes?.success && branchesRes.data?.branches) {
          setBranches(branchesRes.data.branches);
        }

        if (suppliersRes?.success && suppliersRes.data?.suppliers) {
          setSuppliers(suppliersRes.data.suppliers);
        }

        if (productsRes?.success && productsRes.data?.inventoryProducts) {
          setInventoryProducts(productsRes.data.inventoryProducts);
        }
      } catch (err) {
        // If something truly unexpected happens (e.g. code bug), keep it in console
        // but don't block the UI with an always-on banner.
        console.error("Failed to load PO form lookups:", err);
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
            setOriginalBranchId(response.data.branch.id);
            setSupplierId(response.data.supplier.id);
            setOriginalSupplierId(response.data.supplier.id);
            setNotes(response.data.notes || "");
            // Backend doesn't currently store delivery date; match UI by defaulting
            // to the PO's created date in edit/view screens.
            setDeliveryDate(response.data.createdAt?.split("T")?.[0] || "");
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
    if (
      mode === "edit" &&
      (branchId !== originalBranchId || supplierId !== originalSupplierId)
    ) {
      setError("Branch and Supplier cannot be changed for an existing PO.");
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
          const createdId = (response.data as any)?.id as string | undefined;

          // Persist any locally-added items after PO creation
          if (createdId && pendingItems.length > 0) {
            for (const it of pendingItems) {
              await addPOItem(createdId, {
                inventoryProductId: it.inventoryProductId,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
              });
            }
          }

          if (createdId) {
            const detail = await getPurchaseOrder(createdId);
            if (detail.success && detail.data) {
              setPurchaseOrder(detail.data);
              setItems(detail.data.items || []);
              setPendingItems([]);
            }
          }

          await showUpdatedSweetAlert({
            title: "PO Submitted",
            message: "Purchase Order submitted successfully.",
          });
          navigate("/purchaseorder/polist");
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
          await showUpdatedSweetAlert({
            title: "PO Updated",
            message: "PO Details Updated Successfully!",
          });
          navigate("/purchaseorder/polist");
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

  type PendingItem = {
    id: string;
    inventoryProductId: string;
    productLabel: string;
    unitPrice: number;
    quantity: number;
    taxLabel: string;
    taxRate: number;
  };

  const taxOptions = useMemo(
    () => [
      { label: "Select Tax", value: "" },
      { label: "CGST (5%)", value: "CGST (5%)", rate: 5 },
      { label: "GST (5%)", value: "GST (5%)", rate: 5 },
      { label: "CGST (8%)", value: "CGST (8%)", rate: 8 },
    ],
    []
  );

  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [editingPendingId, setEditingPendingId] = useState<string | null>(null);
  const [editingApiItemId, setEditingApiItemId] = useState<string | null>(null);
  const [showAddProductRow, setShowAddProductRow] = useState(false);

  const handleAddItem = async () => {
    if (!selectedProductId || !quantity || !unitPrice) {
      setError("Please fill in all product fields");
      return;
    }

    const product = inventoryProducts.find((p) => p.id === selectedProductId);
    if (!product) {
      setError("Selected product not found");
      return;
    }

    const qty = Number(quantity);
    const price = Number(unitPrice);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price <= 0) {
      setError("Please enter valid price and quantity");
      return;
    }

    const selectedTax = taxOptions.find((t) => t.value === taxValue);
    const taxRate = selectedTax && "rate" in selectedTax ? (selectedTax as any).rate : 0;

    // If PO already exists (edit/view), persist via API. For add flow, keep locally until Submit.
    if (purchaseOrder?.id) {
      try {
        if (editingApiItemId) {
          const response = await updatePOItem(purchaseOrder.id, editingApiItemId, {
            quantity: qty,
            unitPrice: price,
          });

          if (response.success && response.data?.item) {
            setItems((prev) =>
              prev.map((it) => (it.id === editingApiItemId ? response.data!.item : it))
            );
            if (purchaseOrder && response.data.purchaseOrder) {
              setPurchaseOrder({
                ...purchaseOrder,
                grandTotal: response.data.purchaseOrder.grandTotal,
              });
            }
          } else {
            setError(response.message || "Failed to update item");
            return;
          }
        } else {
          const response = await addPOItem(purchaseOrder.id, {
            inventoryProductId: selectedProductId,
            quantity: qty,
            unitPrice: price,
          });

          if (response.success && response.data?.item) {
            setItems([...items, response.data.item]);
            if (purchaseOrder && response.data.purchaseOrder) {
              setPurchaseOrder({
                ...purchaseOrder,
                grandTotal: response.data.purchaseOrder.grandTotal,
              });
            }
          } else {
            setError(response.message || "Failed to add item");
            return;
          }
        }
      } catch (err: any) {
        setError(err.message || (editingApiItemId ? "Failed to update item" : "Failed to add item"));
        return;
      }
    } else {
      const next: PendingItem = {
        id: editingPendingId || `tmp-${Date.now()}`,
        inventoryProductId: selectedProductId,
        productLabel: `${product.name}${product.unit ? ` (${product.unit})` : ""}`,
        unitPrice: price,
        quantity: qty,
        taxLabel: taxValue || "-",
        taxRate,
      };

      setPendingItems((prev) => {
        if (!editingPendingId) return [...prev, next];
        return prev.map((p) => (p.id === editingPendingId ? next : p));
      });
      setEditingPendingId(null);
    }

    // Clear form row
    setSelectedProductId("");
    setQuantity("");
    setUnitPrice("");
    setTaxValue("");
    setEditingApiItemId(null);
    setShowAddProductRow(false);
    setError("");
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
  const allLineSubtotals = useMemo(() => {
    const apiSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const pendingSubtotal = pendingItems.reduce(
      (sum, it) => sum + it.unitPrice * it.quantity,
      0
    );
    return apiSubtotal + pendingSubtotal;
  }, [items, pendingItems]);

  const totalTaxes = useMemo(() => {
    const pendingTax = pendingItems.reduce(
      (sum, it) => sum + (it.unitPrice * it.quantity * (it.taxRate || 0)) / 100,
      0
    );
    return pendingTax;
  }, [pendingItems]);

  const totalAmount = useMemo(() => {
    return allLineSubtotals + totalTaxes + deliveryCharges - discount;
  }, [allLineSubtotals, totalTaxes, deliveryCharges, discount]);

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

        await showUpdatedSweetAlert({
          title: "PO Received",
          message: "Purchase order has been marked as received and inventory has been updated.",
        });
        navigate("/purchaseorder");
      } else {
        throw new Error(response.message || "Failed to receive purchase order");
      }
    } catch (err: any) {
      throw err; // Re-throw to be handled by modal
    }
  };

  const handleMarkAsDelivered = async () => {
    if (!purchaseOrder?.id) return;
    if (purchaseOrder.status === "Received") return;

    setMarkingDelivered(true);
    setError("");
    try {
      const res = await updatePOStatus(purchaseOrder.id, { status: "Received" });
      if (!res.success) {
        setError(res.message || "Failed to update PO status");
        return;
      }

      await showUpdatedSweetAlert({
        title: "PO Updated",
        message: "PO Status Successfully Updated as Delivered.",
      });
      navigate("/purchaseorder/polist");
    } catch (e: any) {
      setError(e?.message || "Failed to update PO status");
    } finally {
      setMarkingDelivered(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" message="Loading purchase order..." />
      </div>
    );
  }

  return (
    <div className={pageShell}>
      <PurchaseOrderTabs />

      <h1 className="text-[32px] font-extrabold tracking-tight text-[#1F1F1F]">
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
      <div className={`${sectionCard} space-y-5`}>
        <h2 className={sectionTitle}>Basic Detail's</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <POSelectField
            label="Branch"
            value={branchId || ""}
            disabled={isView || loadingBranches || branchLocked}
            onChange={(v) => setBranchId(v)}
            options={[
              {
                label: loadingBranches
                  ? "Loading branches..."
                  : branches.length === 0
                  ? "No branches available"
                  : "Select Branch",
                value: "",
              },
              ...branches.map((b) => ({ label: b.name, value: b.id })),
            ]}
          />

          <POField
            label="PO Invoice Number"
            value={purchaseOrder?.invoiceNumber || "Auto generated"}
            disabled
            disabledStyle="filled"
          />

          <POSelectField
            label="Supplier Name"
            value={supplierId}
            disabled={isView}
            onChange={(v) => setSupplierId(v)}
            options={[
              { label: "Select Supplier", value: "" },
              ...suppliers.map((s) => ({ label: s.name, value: s.id })),
            ]}
          />

          <POField
            label="Supplier Code"
            value={selectedSupplier?.code || "Auto Fetched"}
            disabled
            disabledStyle="filled"
          />

          <POField
            label="Supplier Email"
            value={selectedSupplier?.email || "Auto Fetched"}
            disabled
            disabledStyle="filled"
          />

          <POField
            label="GST Number"
            value={selectedSupplier?.gstNumber || "Auto Fetched"}
            disabled
            disabledStyle="filled"
          />

          <PODateField
            label="Delivery Date"
            value={deliveryDate}
            disabled={isView}
            placeholder="Choose Delivery Date"
            onChange={setDeliveryDate}
          />

          <POAttachmentField
            label="Attachments"
            value={attachmentsLabel}
            disabled={isView}
            placeholder="Upload Documents"
            onPick={() => attachmentsInputRef.current?.click()}
          />

          <input
            ref={attachmentsInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length === 0) return;
              setAttachmentsLabel(files.map((f) => f.name).join(", "));
              e.currentTarget.value = "";
            }}
          />

          <div className="md:col-span-2">
            <POTextArea
              label="Description"
              value={notes}
              disabled={isView}
              placeholder="Type Here..."
              onChange={setNotes}
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* ================= RECURRING PO SETTINGS ================= */}
      {mode !== "add" && !isView && (
      <div className={`${sectionCard} space-y-4`}>
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
      )}

      {/* ================= PRODUCT DETAILS ================= */}
      <div className={`${sectionCard} space-y-4`}>
        <h2 className={sectionTitle}>Product Detail's</h2>

        {!isView && (
        <div className="border border-[#EADFC2] rounded-md bg-[#FFFDF5] p-4">
          {!isView && !showAddProductRow && (
            <button
              type="button"
              onClick={() => setShowAddProductRow(true)}
              className="w-full border border-black rounded-md py-2.5 text-sm font-medium flex items-center justify-center bg-white hover:bg-[#FFF7DE] transition-colors"
            >
              + Add Product
            </button>
          )}

          {(isView || showAddProductRow) && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <POSelectField
                  label="Product"
                  value={selectedProductId}
                  disabled={isView}
                  onChange={(v) => setSelectedProductId(v)}
                  options={[
                    { label: "Select Product", value: "" },
                    ...inventoryProducts.map((p) => ({
                      label: `${p.name}${p.unit ? ` (${p.unit})` : ""}`,
                      value: p.id,
                    })),
                  ]}
                />

                <POField
                  label="Price"
                  value={unitPrice}
                  placeholder="40.00"
                  disabled={isView}
                  onChange={setUnitPrice}
                />

                <POSelectField
                  label="Tax"
                  value={taxValue}
                  disabled={isView}
                  onChange={(v) => setTaxValue(v)}
                  options={taxOptions.map((t) => ({ label: t.label, value: t.value }))}
                />

                <POField
                  label="Quantity"
                  value={quantity}
                  placeholder="1"
                  disabled={isView}
                  onChange={setQuantity}
                />
              </div>

              {!isView && (
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="mt-4 w-full border border-black rounded-md py-2.5 text-sm font-medium flex items-center justify-center bg-white hover:bg-[#FFF7DE] transition-colors"
                >
                  + Add Product
                </button>
              )}
            </>
          )}
        </div>
        )}

        <div className="border border-[#EADFC2] rounded-md overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#F8C533] text-[#1F1F1F]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Products</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-left font-medium">Tax</th>
                <th className="px-4 py-3 text-right font-medium">Quantity</th>
                <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                {!isView && (
                  <th className="px-4 py-3 text-center font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && pendingItems.length === 0 ? (
                <tr>
                  <td colSpan={isView ? 5 : 6} className="px-4 py-8 text-center text-gray-500">
                    No products added
                  </td>
                </tr>
              ) : (
                <>
                  {pendingItems.map((it, idx) => (
                    <tr key={it.id} className={idx % 2 ? "bg-[#FFF9E8]" : "bg-white"}>
                      <td className="px-4 py-3">{it.productLabel}</td>
                      <td className="px-4 py-3">₹ {it.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3">{it.taxLabel}</td>
                      <td className="px-4 py-3">{it.quantity}</td>
                      <td className="px-4 py-3">
                        ₹ {(it.unitPrice * it.quantity).toFixed(2)}
                      </td>
                      {!isView && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-4">
                            <Pencil
                              size={16}
                              className="cursor-pointer"
                              onClick={() => {
                                setShowAddProductRow(true);
                                setEditingPendingId(it.id);
                                setSelectedProductId(it.inventoryProductId);
                                setUnitPrice(String(it.unitPrice));
                                setQuantity(String(it.quantity));
                                setTaxValue(it.taxLabel === "-" ? "" : it.taxLabel);
                              }}
                            />
                            <Trash2
                              size={16}
                              className="cursor-pointer text-red-600"
                              onClick={() => {
                                setPendingItems((prev) => prev.filter((p) => p.id !== it.id));
                              }}
                            />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}

                  {items.map((it, idx) => (
                    <tr
                      key={it.id}
                      className={(pendingItems.length + idx) % 2 ? "bg-[#FFF9E8]" : "bg-white"}
                    >
                      <td className="px-4 py-3">
                        {it.inventoryProduct.name}
                        {it.inventoryProduct.unit ? ` (${it.inventoryProduct.unit})` : ""}
                      </td>
                      <td className="px-4 py-3">₹ {it.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">{it.quantity}</td>
                      <td className="px-4 py-3">₹ {it.totalPrice.toFixed(2)}</td>
                      {!isView && (
                        <td className="px-4 py-3 text-center">
                          {purchaseOrder?.status === "Pending" && (
                            <div className="flex items-center justify-center gap-4">
                              <Pencil
                                size={16}
                                className="cursor-pointer"
                                onClick={() => {
                                  setShowAddProductRow(true);
                                  setEditingPendingId(null);
                                  setEditingApiItemId(it.id);
                                  setSelectedProductId(it.inventoryProduct.id);
                                  setUnitPrice(String(it.unitPrice));
                                  setQuantity(String(it.quantity));
                                  setTaxValue("");
                                }}
                              />
                              <Trash2
                                size={16}
                                className="cursor-pointer text-red-600"
                                onClick={() => handleRemoveItem(it.id)}
                              />
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {!isView && (
        <div className="space-y-3 pt-2">
          <button
            type="button"
            disabled={isView}
            onClick={() => {
              setChargesDraft({ name: "", amount: "" });
              setChargesModalOpen(true);
            }}
            className={`w-full border border-gray-200 rounded-md bg-[#FFFDF5] px-4 py-3 flex items-center gap-3 text-sm text-left ${
              isView ? "opacity-80 cursor-not-allowed" : "cursor-pointer hover:bg-[#FFF7DE]"
            }`}
          >
            <Truck size={18} className="text-gray-700" />
            <span className="text-gray-700">Add Charges</span>
          </button>

          <button
            type="button"
            disabled={isView}
            onClick={() => {
              setDiscountDraft({ name: "", amount: "" });
              setDiscountModalOpen(true);
            }}
            className={`w-full border border-gray-200 rounded-md bg-[#FFFDF5] px-4 py-3 flex items-center gap-3 text-sm text-left ${
              isView ? "opacity-80 cursor-not-allowed" : "cursor-pointer hover:bg-[#FFF7DE]"
            }`}
          >
            <BadgePercent size={18} className="text-pink-600" />
            <span className="text-gray-700">Discount</span>
          </button>
        </div>
        )}

        <div className="pt-4">
          <div className="flex justify-between text-sm py-2">
            <span className="text-gray-800">Subtotal</span>
            <span className="text-gray-800">₹ {allLineSubtotals.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm py-2">
            <span className="text-gray-800">Total Taxes</span>
            <span className="text-gray-800">₹ {totalTaxes.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm py-2">
            <span className="text-gray-800">Delivery charges</span>
            <span className="text-gray-800">₹ {deliveryCharges.toFixed(2)}</span>
          </div>

          <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between text-sm font-semibold">
            <span className="text-gray-900">Total Amount</span>
            <span className="text-gray-900">₹ {totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* ================= ACTION BUTTONS ================= */}
      <div className="flex justify-end gap-4">
        <button
          onClick={() => navigate(-1)}
          className="border border-black px-8 py-2 rounded-md bg-white"
        >
          {mode === "view" ? "Close" : "Cancel"}
        </button>

        {mode === "view" ? (
          <button
            type="button"
            onClick={handleMarkAsDelivered}
            disabled={markingDelivered || purchaseOrder?.status === "Received"}
            className="bg-yellow-400 px-10 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {markingDelivered ? "Updating..." : "Mark as Delivered"}
          </button>
        ) : isEdit && purchaseOrder?.status === "Pending" ? (
          <>
            <button
              type="button"
              onClick={() => setDeclineModalOpen(true)}
              className="border border-black px-8 py-2 rounded-md bg-white"
            >
              Decline
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                setError("");
                try {
                  const res = await updatePOStatus(purchaseOrder.id, { status: "Approved" });
                  if (!res.success) {
                    setError(res.message || "Failed to approve PO");
                    return;
                  }
                  await showUpdatedSweetAlert({
                    title: "PO Approved",
                    message: "Purchase Order approved successfully.",
                  });
                  navigate("/purchaseorder/polist");
                } catch (e: any) {
                  setError(e?.message || "Failed to approve PO");
                } finally {
                  setSaving(false);
                }
              }}
              className="bg-yellow-400 px-10 py-2 rounded-md font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Approve"}
            </button>
          </>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-yellow-400 px-10 py-2 rounded-md font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : (mode === "add" ? "Submit" : "Update")}
          </button>
        )}
      </div>

      {/* ================= RECEIVE PO MODAL ================= */}
      {purchaseOrder && (
        <ReceivePOModal
          open={receiveModalOpen}
          onClose={() => setReceiveModalOpen(false)}
          items={items}
          onConfirm={handleReceivePO}
        />
      )}

      {/* Decline Reason Modal */}
      <Modal
        open={declineModalOpen}
        onClose={() => setDeclineModalOpen(false)}
        className="w-[92%] max-w-xl p-8"
      >
        <h2 className="text-xl font-semibold mb-4 text-center">Select a Reason to Decline this PO</h2>

        <div className="space-y-3">
          {[
            "Sufficient Stock is Available.",
            "Quoted Price doesn’t Match.",
            "Placed by Mistake.",
            "Others",
          ].map((reason) => (
            <label
              key={reason}
              className="flex items-center gap-3 border border-[#F0E6C7] rounded-md px-3 py-2 bg-[#FFF8E8]"
            >
              <input
                type="radio"
                name="decline-reason"
                value={reason}
                checked={declineReason === reason}
                onChange={() => setDeclineReason(reason)}
                className="accent-yellow-500"
              />
              <span className="text-sm text-gray-800">{reason}</span>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium text-gray-800 mb-1 block">Remarks (Optional)</label>
          <textarea
            value={declineRemarks}
            onChange={(e) => setDeclineRemarks(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
            placeholder="Add remarks..."
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setDeclineModalOpen(false)}
            className="border border-black px-6 py-2 rounded-md bg-white"
          >
            No
          </button>
          <button
            type="button"
            className="bg-yellow-400 px-8 py-2 rounded-md font-medium"
            onClick={async () => {
              if (!purchaseOrder?.id) return;
              setSaving(true);
              setError("");
              try {
                const res = await updatePOStatus(purchaseOrder.id, { status: "Declined" });
                if (!res.success) {
                  setError(res.message || "Failed to decline PO");
                  return;
                }
                await showUpdatedSweetAlert({
                  title: "PO Declined",
                  message: "Purchase Order has been declined.",
                });
                setDeclineModalOpen(false);
                navigate("/purchaseorder/polist");
              } catch (e: any) {
                setError(e?.message || "Failed to decline PO");
              } finally {
                setSaving(false);
              }
            }}
          >
            Yes
          </button>
        </div>
      </Modal>

      {/* ================= ADD CHARGES MODAL ================= */}
      <Modal
        open={chargesModalOpen}
        onClose={() => setChargesModalOpen(false)}
        className="w-[92%] max-w-3xl p-10"
      >
        <h2 className="text-[28px] font-extrabold text-black mb-6">
          Add Charges to PO
        </h2>

        <div className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-black">Name</label>
            <input
              value={chargesDraft.name}
              onChange={(e) => setChargesDraft((p) => ({ ...p, name: e.target.value }))}
              className="w-full h-[42px] border border-gray-200 rounded-md px-4 text-sm bg-white"
              placeholder="Delivery Charges"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-black">Charges</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm">
                ₹
              </span>
              <input
                value={chargesDraft.amount}
                onChange={(e) =>
                  setChargesDraft((p) => ({
                    ...p,
                    amount: e.target.value.replace(/[^\d.]/g, ""),
                  }))
                }
                inputMode="decimal"
                className="w-full h-[42px] border border-gray-200 rounded-md pl-10 pr-4 text-sm bg-white"
                placeholder="60"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-10">
          <button
            type="button"
            onClick={() => setChargesModalOpen(false)}
            className="border border-black px-8 py-2 rounded-md bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const amt = Number(chargesDraft.amount);
              if (!chargesDraft.amount || !Number.isFinite(amt) || amt < 0) {
                setError("Please enter a valid charges amount");
                return;
              }
              setDeliveryCharges(amt);
              setChargesModalOpen(false);
            }}
            className="bg-yellow-400 px-10 py-2 rounded-md font-medium"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* ================= DISCOUNT/DEALS MODAL ================= */}
      <Modal
        open={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        className="w-[92%] max-w-3xl p-10"
      >
        <h2 className="text-[28px] font-extrabold text-black mb-6">
          Discounts &amp; Deals
        </h2>

        <div className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-black">Name</label>
            <input
              value={discountDraft.name}
              onChange={(e) => setDiscountDraft((p) => ({ ...p, name: e.target.value }))}
              className="w-full h-[42px] border border-gray-200 rounded-md px-4 text-sm bg-white"
              placeholder="Free Delivery"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-black">Discount Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm">
                - ₹
              </span>
              <input
                value={discountDraft.amount}
                onChange={(e) =>
                  setDiscountDraft((p) => ({
                    ...p,
                    amount: e.target.value.replace(/[^\d.]/g, ""),
                  }))
                }
                inputMode="decimal"
                className="w-full h-[42px] border border-gray-200 rounded-md pl-14 pr-4 text-sm bg-white"
                placeholder="60"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-10">
          <button
            type="button"
            onClick={() => setDiscountModalOpen(false)}
            className="border border-black px-8 py-2 rounded-md bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const amt = Number(discountDraft.amount);
              if (!discountDraft.amount || !Number.isFinite(amt) || amt < 0) {
                setError("Please enter a valid discount amount");
                return;
              }
              setDiscount(amt);
              setDiscountModalOpen(false);
            }}
            className="bg-yellow-400 px-10 py-2 rounded-md font-medium"
          >
            Save
          </button>
        </div>
      </Modal>
    </div>
  );
}

function POField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  disabledStyle,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledStyle?: "filled" | "default";
}) {
  const bg =
    disabled && disabledStyle === "filled"
      ? "bg-[#E5E5E5]"
      : "bg-[#FFFDF5]";

  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-black">{label}</label>
      <input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full h-[42px] border border-gray-200 rounded-md px-4 ${bg} text-sm ${
          disabled ? "opacity-80 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}

function POSelectField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  disabled?: boolean;
}) {
  const bg = disabled ? "bg-[#E5E5E5]" : "bg-[#FFFDF5]";

  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-black">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full h-[42px] border border-gray-200 rounded-md px-4 pr-10 ${bg} text-sm appearance-none ${
            disabled ? "opacity-80 cursor-not-allowed" : ""
          }`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
        />
      </div>
    </div>
  );
}

function POTextArea({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}) {
  const bg = disabled ? "bg-[#E5E5E5]" : "bg-[#FFFDF5]";
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-black">{label}</label>
      <textarea
        rows={rows}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-gray-200 rounded-md px-4 py-3 ${bg} text-sm resize-none ${
          disabled ? "opacity-80 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}

function PODateField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const bg = disabled ? "bg-[#E5E5E5]" : "bg-[#FFFDF5]";
  const displayValue = useMemo(() => {
    if (!value) return "";
    const dt = new Date(`${value}T00:00:00`);
    if (Number.isNaN(dt.getTime())) return value;
    // Match common UI expectation: dd/mm/yyyy
    return dt.toLocaleDateString("en-GB");
  }, [value]);

  const openPicker = () => {
    if (disabled) return;
    const el = pickerRef.current;
    if (!el) return;
    // Prefer native date picker when available.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyEl = el as any;
    if (typeof anyEl.showPicker === "function") {
      anyEl.showPicker();
      return;
    }
    el.click();
  };

  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-black">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          disabled={disabled}
          readOnly
          onClick={openPicker}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openPicker();
          }}
          className={`w-full h-[42px] border border-gray-200 rounded-md px-4 pr-10 ${bg} text-sm ${
            disabled ? "opacity-80 cursor-not-allowed" : ""
          }`}
          placeholder={placeholder}
        />
        <input
          ref={pickerRef}
          type="date"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        />
        <Calendar
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600"
        />
      </div>
    </div>
  );
}

function POAttachmentField({
  label,
  value,
  onPick,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onPick: () => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const bg = disabled ? "bg-[#E5E5E5]" : "bg-[#FFFDF5]";
  return (
    <div className="space-y-1">
      <label className="text-sm font-semibold text-black">{label}</label>
      <button
        type="button"
        onClick={onPick}
        disabled={disabled}
        className={`w-full h-[42px] border border-gray-200 rounded-md px-4 ${bg} text-sm flex items-center gap-2 ${
          disabled ? "opacity-80 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        {disabled ? (
          <Paperclip size={16} className="text-gray-700" />
        ) : (
          <Upload size={16} className="text-gray-700" />
        )}
        <span className="truncate text-gray-700">
          {value ? value : (disabled ? "Attached File" : (placeholder || "Upload"))}
        </span>
      </button>
    </div>
  );
}

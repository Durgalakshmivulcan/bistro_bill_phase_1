import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Input from "../form/Input";
import Select from "../form/Select";
import Textarea from "../form/Textarea";
import Checkbox from "../form/Checkbox";
import Modal from "../ui/Modal";
import successImg from "../../assets/tick.png";
import { getDiscountById, updateDiscount, UpdateDiscountData, DiscountType } from "../../services/marketingService";
import LoadingSpinner from "../Common/LoadingSpinner";
import ErrorDisplay from "../Common/ErrorDisplay";
import { CRUDToasts } from "../../utils/toast";
import { getCategories } from "../../services/catalogService";
import { getBranches } from "../../services/branchService";

export default function EditDiscount() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Form state
  const [discountTypeVal, setDiscountTypeVal] = useState<DiscountType>("OrderType");
  const [orderType, setOrderType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [branchId, setBranchId] = useState("");
  const [branchOptions, setBranchOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [discountValueType, setDiscountValueType] = useState<"fixed" | "percentage" | null>(null);
  const [fixedAmount, setFixedAmount] = useState("");
  const [percentageAmount, setPercentageAmount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [description, setDescription] = useState("");
  const [displayOnBistro, setDisplayOnBistro] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await getCategories({ status: "active" });
        if (response.success && response.data) {
          setCategoryOptions(
            response.data.categories.map((category) => ({
              label: category.name,
              value: category.id,
            }))
          );
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoadingBranches(true);
        const response = await getBranches({ status: "active" });
        if (response.success && response.data) {
          const options = response.data.branches.map((branch) => ({
            label: branch.name,
            value: branch.id,
          }));
          setBranchOptions(options);
          setBranchId((prev) => prev || options[0]?.value || "");
        } else {
          setBranchOptions([]);
        }
      } catch (err) {
        console.error("Error loading branches:", err);
      } finally {
        setLoadingBranches(false);
      }
    };

    loadBranches();
  }, []);

  useEffect(() => {
    // Keep branch selected if still valid after options refresh
    if (!branchOptions.length) {
      setBranchId("");
      return;
    }
    const isExisting = branchOptions.some((option) => option.value === branchId);
    if (!isExisting) {
      setBranchId(branchOptions[0].value);
    }
  }, [branchOptions, branchId]);

  useEffect(() => {
    setOrderType("");
    setCategoryId("");
  }, [discountTypeVal]);

  const dependentLabel = discountTypeVal === "OrderType" ? "Order Type" : "Product Category";
  const showDependentDropdown = discountTypeVal !== "Custom";
  const dependentOptions = useMemo(
    () =>
      discountTypeVal === "OrderType"
        ? [
            { label: "Dine In", value: "DineIn" },
            { label: "Takeaway", value: "Takeaway" },
            { label: "Delivery", value: "Delivery" },
            { label: "Online", value: "Online" },
          ]
        : categoryOptions,
    [discountTypeVal, categoryOptions]
  );

  useEffect(() => {
    if (id) {
      fetchDiscount();
    }
  }, [id]);

  const fetchDiscount = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await getDiscountById(id);

      if (response.success && response.data) {
        const discount = response.data;

        // Populate form fields
        setDiscountTypeVal(discount.type);
        setName(discount.name);
        setDescription(discount.description || "");
        setCode(discount.code);
        setStatus(discount.status);

        // Set dates (convert ISO to YYYY-MM-DD format for input[type="date"])
        if (discount.startDate) {
          setStartDate(discount.startDate.split('T')[0]);
        }
        if (discount.endDate) {
          setEndDate(discount.endDate.split('T')[0]);
        }

        // Set min order value
        if (discount.minOrderAmount) {
          setMinOrderValue(discount.minOrderAmount.toString());
        }

        // Set discount value type and amount
        if (discount.valueType === "Fixed") {
          setDiscountValueType("fixed");
          setFixedAmount(discount.value.toString());
        } else if (discount.valueType === "Percentage") {
          setDiscountValueType("percentage");
          setPercentageAmount(discount.value.toString());
        }

        // Set usage limit
        if (discount.usageLimit) {
          setUsageLimit(discount.usageLimit.toString());
        }
      } else {
        setError(response.message || "Failed to load discount");
      }
    } catch (err: any) {
      setError(err.message || "Error loading discount. Please try again.");
      console.error("Error fetching discount:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!id) return;

    // Validation
    if (!name.trim()) {
      setError("Discount name is required");
      return;
    }

    if (discountTypeVal === "OrderType" && !orderType) {
      setError("Please select order type");
      return;
    }

    if (discountTypeVal === "ProductCategory" && !categoryId) {
      setError("Please select product category");
      return;
    }

    if (!branchId) {
      setError("Please select branch");
      return;
    }

    if (!discountValueType) {
      setError("Please select a discount value type (Fixed or Percentage)");
      return;
    }

    const value = discountValueType === "fixed" ? fixedAmount : percentageAmount;
    if (!value || parseFloat(value) <= 0) {
      setError("Please enter a valid discount value");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const data: UpdateDiscountData = {
        name: name.trim(),
        description: description.trim() || undefined,
        code: code.trim(),
        type: discountTypeVal,
        valueType: discountValueType === "fixed" ? "Fixed" : "Percentage",
        value: parseFloat(value),
        status,
      };

      // Optional fields
      if (startDate) data.startDate = new Date(startDate).toISOString();
      if (endDate) data.endDate = new Date(endDate).toISOString();
      if (minOrderValue && parseFloat(minOrderValue) > 0) {
        data.minOrderAmount = parseFloat(minOrderValue);
      }
      if (usageLimit && parseInt(usageLimit) > 0) {
        data.usageLimit = parseInt(usageLimit);
      }
      if (discountTypeVal === "ProductCategory" && categoryId) {
        data.categoryIds = [categoryId];
      }

      const response = await updateDiscount(id, data);

      if (response.success) {
        CRUDToasts.updated("Discount");
        setShowSuccessModal(true);
      } else {
        setError(response.message || "Failed to update discount");
      }
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message;
      setError(serverMessage || err.message || "Error updating discount. Please try again.");
      console.error("Error updating discount:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-bb-bg min-h-screen p-6 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading discount..." />
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="bg-bb-bg min-h-screen p-6">
        <ErrorDisplay message={error} onRetry={fetchDiscount} />
      </div>
    );
  }

  return (
    <div className="bg-bb-bg min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Discount</h1>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-bb-bg p-6 rounded-xl space-y-6 border">
        {/* BASIC DETAILS */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Discount Type"
            required
            value={discountTypeVal}
            onChange={(value) => setDiscountTypeVal(value as DiscountType)}
            options={[
              { label: "Order Type", value: "OrderType" },
              { label: "Product Category", value: "ProductCategory" },
              { label: "Custom Discount", value: "Custom" },
            ]}
            disabled={saving}
          />

          {showDependentDropdown ? (
            <Select
              label={dependentLabel}
              required
              value={discountTypeVal === "OrderType" ? orderType : categoryId}
              onChange={(value) => {
                if (discountTypeVal === "OrderType") {
                  setOrderType(value);
                } else {
                  setCategoryId(value);
                }
              }}
              options={dependentOptions}
              disabled={saving || (discountTypeVal === "ProductCategory" && loadingCategories)}
            />
          ) : (
            <Input
              label="Discount Name"
              value={name}
              onChange={setName}
              required
              disabled={saving}
            />
          )}

          {showDependentDropdown && (
            <Input
              label="Discount Name"
              value={name}
              onChange={setName}
              required
              disabled={saving}
            />
          )}
          <Input
            label="Discount Code"
            value={code}
            onChange={setCode}
            required
            disabled={saving}
          />

          <Input
            label="Min. Order Value"
            type="number"
            value={minOrderValue}
            onChange={setMinOrderValue}
            disabled={saving}
            placeholder="Optional"
          />

          <Input
            label="Start Date"
            required
            type="date"
            value={startDate}
            onChange={setStartDate}
            disabled={saving}
          />
          <Input
            label="End Date"
            required
            type="date"
            value={endDate}
            onChange={setEndDate}
            disabled={saving}
          />

          <Select
            label="Status"
            required
            value={status}
            onChange={(value) => setStatus(value as "active" | "inactive")}
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
            disabled={saving}
          />
        </div>

        <Checkbox
          label="Display on Bistro Bill"
          checked={displayOnBistro}
          onChange={setDisplayOnBistro}
        />

        {/* DISCOUNT VALUE */}
        <div className="space-y-2">
          <label className="font-bold">Discount Value *</label>

          <div className="flex items-center gap-3">
            <input
              type="radio"
              checked={discountValueType === "fixed"}
              onChange={() => setDiscountValueType("fixed")}
              disabled={saving}
            />
            <span>Fixed Amount</span>
            <input
              type="number"
              value={discountValueType === "fixed" ? fixedAmount : ""}
              onChange={(e) => setFixedAmount(e.target.value)}
              disabled={discountValueType !== "fixed" || saving}
              className="ml-4 w-48 border rounded-md px-3 py-2 bg-bb-bg disabled:opacity-50"
              placeholder="Enter Amount"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="radio"
              checked={discountValueType === "percentage"}
              onChange={() => setDiscountValueType("percentage")}
              disabled={saving}
            />
            <span>Percentage Discount</span>
            <input
              type="number"
              value={discountValueType === "percentage" ? percentageAmount : ""}
              onChange={(e) => setPercentageAmount(e.target.value)}
              disabled={discountValueType !== "percentage" || saving}
              className="ml-4 w-48 border rounded-md px-3 py-2 bg-bb-bg disabled:opacity-50"
              placeholder="Enter Percentage"
            />
          </div>
        </div>

        {/* USAGE LIMIT */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Branch"
            required
            value={branchId}
            onChange={setBranchId}
            options={branchOptions}
            disabled={saving || loadingBranches}
          />
          <Input
            label="Usage Limit"
            required
            type="number"
            value={usageLimit}
            onChange={setUsageLimit}
            disabled={saving}
            placeholder="Optional - leave empty for unlimited"
          />
        </div>

        <Textarea
          label="Description"
          placeholder="Type here..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* ACTIONS */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => navigate(-1)}
            className="border px-4 py-2 rounded border-black"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            className="bg-yellow-400 px-4 py-2 rounded flex items-center gap-2"
            disabled={saving}
          >
            {saving && <LoadingSpinner size="sm" />}
            {saving ? "Updating..." : "Update"}
          </button>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      <Modal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate(-1);
        }}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Discount Updated</h2>

        <div className="flex justify-center mb-4">
          <img src={successImg} alt="success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Discount details updated successfully.
        </p>
      </Modal>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import Input from "../form/Input";
import Select from "../form/Select";
import { useNavigate } from "react-router-dom";
import Textarea from "../form/Textarea";
import Checkbox from "../form/Checkbox";
import Modal from "../../components/ui/Modal";
import successImg from "../../assets/tick.png";
import { createDiscount, CreateDiscountData, DiscountType } from "../../services/marketingService";
import LoadingSpinner from "../Common/LoadingSpinner";
import { CRUDToasts } from "../../utils/toast";
import { getCategories } from "../../services/catalogService";
import { getBranches } from "../../services/branchService";

export default function CreateDiscount() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
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
    // Reset dependent field when primary type changes
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

  const handleSubmit = async () => {
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
      setLoading(true);
      setError(null);

      const data: CreateDiscountData = {
        name: name.trim(),
        description: description.trim() || undefined,
        type: discountTypeVal,
        valueType: discountValueType === "fixed" ? "Fixed" : "Percentage",
        value: parseFloat(value),
        status,
      };

      // Optional fields
      if (code.trim()) data.code = code.trim();
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

      const response = await createDiscount(data);

      if (response.success) {
        CRUDToasts.created("Discount");
        setShowSuccess(true);
      } else {
        setError(response.message || "Failed to create discount");
      }
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message;
      setError(serverMessage || err.message || "Error creating discount. Please try again.");
      console.error("Error creating discount:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-bb-bg min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Create Discount</h1>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-bb-bg p-6 rounded-xl space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {/* DISCOUNT TYPE */}
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
              disabled={discountTypeVal === "ProductCategory" && loadingCategories}
            />
          ) : (
            <Input
              label="Discount Name"
              required
              value={name}
              onChange={setName}
              disabled={loading}
            />
          )}

          {showDependentDropdown && (
            <Input
              label="Discount Name"
              required
              value={name}
              onChange={setName}
              disabled={loading}
            />
          )}
          <Input
            label="Discount Code"
            required
            value={code}
            onChange={setCode}
            disabled={loading}
            placeholder="Leave empty for auto-generation"
          />
          <Input
            label="Start Date"
            required
            type="date"
            value={startDate}
            onChange={setStartDate}
            disabled={loading}
          />
          <Input
            label="End Date"
            required
            type="date"
            value={endDate}
            onChange={setEndDate}
            disabled={loading}
          />
          <Input
            label="Min. Order Value"
            type="number"
            value={minOrderValue}
            onChange={setMinOrderValue}
            disabled={loading}
            placeholder="Optional"
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
          />
        </div>
        <div className="space-y-3">
          <Checkbox
            label="Display on Bistro Bill"
            checked={displayOnBistro}
            onChange={setDisplayOnBistro}
          />
        </div>

        {/* DISCOUNT VALUE */}
        <div className="space-y-2">
          <label className="font-bold">Discount Value *</label>

          {/* FIXED AMOUNT */}
          <div className="flex items-center gap-3">
            <input
              type="radio"
              checked={discountValueType === "fixed"}
              onChange={() => setDiscountValueType("fixed")}
              disabled={loading}
            />
            <span className="text-sm">Fixed Amount</span>

            <input
              type="number"
              placeholder="Enter Amount"
              value={discountValueType === "fixed" ? fixedAmount : ""}
              onChange={(e) => setFixedAmount(e.target.value)}
              disabled={discountValueType !== "fixed" || loading}
              className="ml-4 w-48 border rounded-md px-3 py-2 bg-bb-bg disabled:opacity-50"
            />
          </div>

          {/* PERCENTAGE */}
          <div className="flex items-center gap-3">
            <input
              type="radio"
              checked={discountValueType === "percentage"}
              onChange={() => setDiscountValueType("percentage")}
              disabled={loading}
            />
            <span className="text-sm">Percentage Discount</span>

            <input
              type="number"
              placeholder="Enter Percentage"
              value={discountValueType === "percentage" ? percentageAmount : ""}
              onChange={(e) => setPercentageAmount(e.target.value)}
              disabled={discountValueType !== "percentage" || loading}
              className="ml-4 w-48 border rounded-md px-3 py-2 bg-bb-bg disabled:opacity-50"
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
            disabled={loadingBranches}
          />
          <Input
            label="Usage Limit"
            required
            type="number"
            value={usageLimit}
            onChange={setUsageLimit}
            disabled={loading}
            placeholder="Optional - leave empty for unlimited"
          />
        </div>
        <Textarea
          label="Description"
          placeholder="Type Here..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* ACTIONS */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => navigate(-1)}
            className="border px-4 py-2 rounded border border-black"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-yellow-400 px-4 py-2 rounded flex items-center gap-2"
            disabled={loading}
          >
            {loading && <LoadingSpinner size="sm" />}
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <Modal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          navigate(-1);
        }}
        className="w-[90%] max-w-md p-6 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Discount Added</h2>

        <div className="flex justify-center mb-4">
          <img src={successImg} alt="success" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          New discount offer has been added successfully.
        </p>
      </Modal>
    </div>
  );
}

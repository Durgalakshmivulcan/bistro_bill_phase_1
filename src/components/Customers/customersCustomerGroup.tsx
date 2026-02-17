import { Search, MoreVertical, Eye, Pencil, Trash2, Plus, X, RefreshCw, Users } from "lucide-react";
import Select from "../form/Select";
import Pagination from "../Common/Pagination";
import { useState, useRef, useEffect } from "react";
import Modal from "../../components/ui/Modal";
import deleteImg from "../../assets/deleteConformImg.png";
import tickImg from "../../assets/deleteSuccessImg.png";
import {
  getCustomerGroups,
  createCustomerGroup,
  updateCustomerGroup,
  deleteCustomerGroup,
  getCustomers,
  previewGroupRules,
  recalculateCustomerGroups,
} from "../../services/customerService";
import { TableSkeleton } from "../Common";
import { usePermissions } from "../../hooks/usePermissions";

// Import types from service
import type {
  CustomerGroup,
  GroupRules,
  RuleCondition,
  PreviewCustomer,
} from "../../services/customerService";

type Mode = "add" | "edit" | "view";

// Color palette for customer groups (10+ colors with good contrast)
const COLOR_PALETTE = [
  { value: "#3B82F6", name: "Blue", bg: "bg-blue-500", text: "text-white" },
  { value: "#8B5CF6", name: "Purple", bg: "bg-purple-500", text: "text-white" },
  { value: "#10B981", name: "Green", bg: "bg-green-500", text: "text-white" },
  { value: "#F59E0B", name: "Amber", bg: "bg-amber-500", text: "text-white" },
  { value: "#EF4444", name: "Red", bg: "bg-red-500", text: "text-white" },
  { value: "#EC4899", name: "Pink", bg: "bg-pink-500", text: "text-white" },
  { value: "#06B6D4", name: "Cyan", bg: "bg-cyan-500", text: "text-white" },
  { value: "#84CC16", name: "Lime", bg: "bg-lime-500", text: "text-white" },
  { value: "#F97316", name: "Orange", bg: "bg-orange-500", text: "text-white" },
  { value: "#6366F1", name: "Indigo", bg: "bg-indigo-500", text: "text-white" },
  { value: "#14B8A6", name: "Teal", bg: "bg-teal-500", text: "text-white" },
  { value: "#A855F7", name: "Violet", bg: "bg-violet-500", text: "text-white" },
];

// Field options for rule builder
const FIELD_OPTIONS = [
  { label: "Total Spent", value: "totalSpent" },
  { label: "Order Count", value: "orderCount" },
  { label: "Customer Type", value: "type" },
  { label: "Gender", value: "gender" },
];

// Operator options for numeric fields
const NUMERIC_OPERATORS = [
  { label: ">", value: "gt" },
  { label: ">=", value: "gte" },
  { label: "<", value: "lt" },
  { label: "<=", value: "lte" },
  { label: "=", value: "eq" },
  { label: "!=", value: "neq" },
];

// Operator options for string fields
const STRING_OPERATORS = [
  { label: "=", value: "eq" },
  { label: "!=", value: "neq" },
];

const TYPE_VALUES = [
  { label: "Regular", value: "Regular" },
  { label: "VIP", value: "VIP" },
  { label: "Wholesale", value: "Wholesale" },
];

const GENDER_VALUES = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

function isNumericField(field: string): boolean {
  return field === "totalSpent" || field === "orderCount";
}

// Helper function to determine if text should be light or dark based on background
function getTextColor(bgColor: string): string {
  // Remove # if present
  const hex = bgColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return dark text for light backgrounds, light text for dark backgrounds
  return luminance > 0.5 ? "#1A1C1E" : "#FFFFFF";
}

function getOperatorLabel(op: string): string {
  const map: Record<string, string> = {
    gt: ">", gte: ">=", lt: "<", lte: "<=", eq: "=", neq: "!="
  };
  return map[op] || op;
}

function getFieldLabel(field: string): string {
  const map: Record<string, string> = {
    totalSpent: "Total Spent", orderCount: "Order Count",
    type: "Type", gender: "Gender"
  };
  return map[field] || field;
}

// Empty condition factory
function createEmptyCondition(): RuleCondition {
  return { field: "totalSpent", operator: "gt", value: "" };
}

export default function CustomersGroup() {
  const { canCreate, canUpdate, canDelete } = usePermissions('customers');
  const [addOpen, setAddOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletedOpen, setDeletedOpen] = useState(false);

  const [mode, setMode] = useState<Mode>("add");
  const [lastAction, setLastAction] = useState<Mode>("add");

  const [selectedGroup, setSelectedGroup] = useState<CustomerGroup | null>(
    null,
  );

  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Filter by Status");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    status: "active" as "active" | "inactive",
    color: "#3B82F6" // Default blue color
  });

  // Rules state
  const [rulesEnabled, setRulesEnabled] = useState(false);
  const [rulesLogic, setRulesLogic] = useState<"AND" | "OR">("AND");
  const [conditions, setConditions] = useState<RuleCondition[]>([]);

  // Preview state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<{ matchCount: number; customers: PreviewCustomer[] } | null>(null);

  // Recalculate state
  const [recalculating, setRecalculating] = useState(false);

  // Load customer groups on mount
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load groups
      const groupsResponse = await getCustomerGroups();
      if (!groupsResponse.success || !groupsResponse.data) {
        setError(groupsResponse.message || "Failed to load customer groups");
        return;
      }

      // Load customers to count per group
      const customersResponse = await getCustomers();
      const customers = customersResponse.success && customersResponse.data
        ? customersResponse.data.customers
        : [];

      // Count customers per group (using customerGroupId)
      const groupsWithCount = groupsResponse.data.map(group => {
        const count = customers.filter(c => c.customerGroupId === group.id).length;
        return { ...group, customerCount: count };
      });

      setGroups(groupsWithCount);
    } catch (error: any) {
      setError(error.message || "Failed to load customer groups");
      console.error("Failed to load customer groups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openModal = (m: Mode, group?: CustomerGroup) => {
    setMode(m);
    setSelectedGroup(group || null);
    setError(null);
    setPreviewResult(null);

    // Load group data into form
    if (group) {
      setFormData({
        name: group.name,
        status: group.status,
        color: group.color || "#3B82F6"
      });
      // Load rules
      if (group.rules && group.rules.conditions && group.rules.conditions.length > 0) {
        setRulesEnabled(true);
        setRulesLogic(group.rules.logic);
        setConditions(group.rules.conditions);
      } else {
        setRulesEnabled(false);
        setRulesLogic("AND");
        setConditions([]);
      }
    } else {
      // Reset form for add mode
      setFormData({
        name: "",
        status: "active",
        color: "#3B82F6"
      });
      setRulesEnabled(false);
      setRulesLogic("AND");
      setConditions([]);
    }

    setAddOpen(true);
    setMenuOpen(null);
  };

  const buildRules = (): GroupRules | null => {
    if (!rulesEnabled || conditions.length === 0) return null;
    // Filter out conditions with empty values
    const validConditions = conditions.filter(c => c.value !== "" && c.value !== undefined);
    if (validConditions.length === 0) return null;
    return { logic: rulesLogic, conditions: validConditions };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validation
      if (!formData.name.trim()) {
        setError("Group name is required");
        setSaving(false);
        return;
      }

      const rules = buildRules();

      let response;
      if (mode === "add") {
        response = await createCustomerGroup({
          name: formData.name.trim(),
          status: formData.status,
          color: formData.color,
          rules
        });
      } else if (mode === "edit" && selectedGroup) {
        response = await updateCustomerGroup(selectedGroup.id, {
          name: formData.name.trim(),
          status: formData.status,
          color: formData.color,
          rules
        });
      }

      if (response?.success) {
        setLastAction(mode);
        setAddOpen(false);
        setSuccessOpen(true);

        // Auto-close success modal and refresh list after 2 seconds
        setTimeout(() => {
          setSuccessOpen(false);
          loadGroups();
        }, 2000);
      } else {
        setError(response?.message || "Failed to save customer group");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save customer group");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedGroup) return;

    try {
      setDeleting(true);
      setError(null);

      const response = await deleteCustomerGroup(selectedGroup.id);
      if (response.success) {
        setDeleteOpen(false);
        setDeletedOpen(true);

        // Auto-close success modal and refresh list after 2 seconds
        setTimeout(() => {
          setDeletedOpen(false);
          loadGroups();
        }, 2000);
      } else {
        setError(response.message || "Failed to delete customer group");
        setDeleteOpen(false);
        setTimeout(() => setError(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete customer group");
      setDeleteOpen(false);
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  // Preview rules
  const handlePreview = async () => {
    const rules = buildRules();
    if (!rules) {
      setPreviewResult({ matchCount: 0, customers: [] });
      return;
    }

    try {
      setPreviewLoading(true);
      const response = await previewGroupRules(rules);
      if (response.success && response.data) {
        setPreviewResult(response.data);
      }
    } catch (err: any) {
      console.error("Preview error:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Recalculate all groups
  const handleRecalculate = async () => {
    try {
      setRecalculating(true);
      setError(null);
      const response = await recalculateCustomerGroups();
      if (response.success && response.data) {
        const msg = `Recalculation complete: ${response.data.assigned} customer(s) reassigned across ${response.data.groups} group(s)`;
        // Reload groups to see updated counts
        await loadGroups();
        alert(msg);
      } else {
        setError(response.message || "Failed to recalculate groups");
      }
    } catch (err: any) {
      setError(err.message || "Failed to recalculate groups");
    } finally {
      setRecalculating(false);
    }
  };

  // Condition management
  const addCondition = () => {
    setConditions([...conditions, createEmptyCondition()]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    setConditions(conditions.map((c, i) => {
      if (i !== index) return c;
      const updated = { ...c, ...updates };
      // Reset operator and value when field changes
      if (updates.field && updates.field !== c.field) {
        updated.operator = isNumericField(updates.field) ? "gt" : "eq";
        updated.value = "";
      }
      return updated;
    }));
  };

  // Filter groups based on search query and status
  const filteredGroups = groups.filter((group) => {
    const matchesSearch = searchQuery.trim() === "" ||
      group.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "Filter by Status" ||
      statusFilter === "" ||
      group.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("Filter by Status");
  };

  // Check if any filters are active
  const hasActiveFilters = searchQuery.trim() !== "" ||
    (statusFilter !== "Filter by Status" && statusFilter !== "");

  // Check if any group has rules
  const hasGroupsWithRules = groups.some(g => g.rules && g.rules.conditions && g.rules.conditions.length > 0);

  return (
    <div className="bg-bb-bg min-h-screen p-4 md:p-6 space-y-4">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-[28px] font-bold">
          Customers Group
          {hasActiveFilters && (
            <span className="text-base font-normal text-gray-600 ml-2">
              ({filteredGroups.length} of {groups.length})
            </span>
          )}
        </h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black-400 pointer-events-none"
            />
            <input
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-black w-full border rounded-md px-3 pr-10 py-2 text-sm bg-white placeholder:text-black focus:outline-none"
            />
          </div>

          {hasGroupsWithRules && (
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm border border-blue-600 disabled:opacity-50"
              title="Re-run all auto-assignment rules for all customers"
            >
              <RefreshCw size={14} className={recalculating ? "animate-spin" : ""} />
              {recalculating ? "Recalculating..." : "Recalculate Groups"}
            </button>
          )}

          {canCreate && (
            <button
              onClick={() => openModal("add")}
              className="bg-black text-white px-4 py-2 rounded text-sm border border-black"
            >
              Add New
            </button>
          )}
        </div>
      </div>

      {/* ================= FILTER ROW ================= */}
      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2">
        <div className="w-full sm:w-[15%]">
          <Select
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              {
                label: "Filter by Status",
                value: "Filter by Status",
              },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ]}
          />
        </div>
        <button
          onClick={handleClearFilters}
          className="bg-yellow-400 px-4 py-2 rounded text-sm border border-black"
        >
          Clear
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-bb-primary">
            <tr>
              <th className="px-4 py-3 text-left">Sl. No.</th>
              <th className="px-4 py-3 text-left">Customer Group</th>
              <th className="px-4 py-3 text-left">Customer Count</th>
              <th className="px-4 py-3 text-left">Rules</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8">
                  <TableSkeleton rows={5} />
                </td>
              </tr>
            ) : filteredGroups.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {hasActiveFilters
                    ? "No customer groups match your filters"
                    : "No customer groups found"}
                </td>
              </tr>
            ) : (
              filteredGroups.map((group: CustomerGroup, index) => (
                <tr key={group.id} className="border-t">
                  <td className="px-4 py-3">{index + 1}</td>

                  <td className="px-4 py-3 font-medium">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: group.color || "#3B82F6",
                        color: getTextColor(group.color || "#3B82F6"),
                      }}
                    >
                      {group.name}
                    </span>
                  </td>

                  <td className="px-4 py-3 font-semibold">
                    {group.customerCount ?? 0} customers
                  </td>

                  <td className="px-4 py-3">
                    {group.rules && group.rules.conditions && group.rules.conditions.length > 0 ? (
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 font-medium">
                        {group.rules.conditions.length} rule{group.rules.conditions.length > 1 ? "s" : ""} ({group.rules.logic})
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">No rules</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        group.status === "active"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {group.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center relative">
                    <MoreVertical
                      size={16}
                      className="cursor-pointer inline-block"
                      onClick={() =>
                        setMenuOpen(menuOpen === group.id ? null : group.id)
                      }
                    />

                  {menuOpen === group.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-4 top-8 bg-white border rounded-md shadow-md w-36 z-50"
                    >
                      <button
                        onClick={() => openModal("view", group)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                      >
                        <Eye size={14} /> View
                      </button>

                      {canUpdate && (
                        <button
                          onClick={() => openModal("edit", group)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => {
                            setSelectedGroup(group);
                            setDeleteOpen(true);
                            setMenuOpen(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination />

      {/* ================= ADD / EDIT / VIEW MODAL ================= */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        className="w-[95%] max-w-lg p-6 text-center max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-xl font-bold mb-4">
          {mode === "add" && "Add New Customer Group"}
          {mode === "edit" && "Edit Customer Group"}
          {mode === "view" && "View Customer Group"}
        </h2>

        <div className="space-y-4 text-left">
          <div>
            <label className="text-sm font-medium">Customer Group Name *</label>
            <input
              disabled={mode === "view"}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter group name"
              className="w-full mt-1 border rounded-md px-3 py-2 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Badge Color</label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  disabled={mode === "view"}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-10 h-10 rounded-md ${color.bg} flex items-center justify-center transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.color === color.value ? "ring-2 ring-offset-2 ring-black" : ""
                  }`}
                  title={color.name}
                >
                  {formData.color === color.value && (
                    <span className={`text-xl ${color.text}`}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Status</label>
            <Select
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value as "active" | "inactive" })}
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />
          </div>

          {/* ================= AUTO-ASSIGNMENT RULES ================= */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Auto-Assignment Rules</label>
              {mode !== "view" && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rulesEnabled}
                    onChange={(e) => {
                      setRulesEnabled(e.target.checked);
                      if (e.target.checked && conditions.length === 0) {
                        addCondition();
                      }
                      setPreviewResult(null);
                    }}
                    className="w-4 h-4 accent-yellow-400"
                  />
                  <span className="text-xs text-gray-600">Enable</span>
                </label>
              )}
            </div>

            {(rulesEnabled || (mode === "view" && conditions.length > 0)) && (
              <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                {/* Logic selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Match</span>
                  {mode !== "view" ? (
                    <select
                      value={rulesLogic}
                      onChange={(e) => {
                        setRulesLogic(e.target.value as "AND" | "OR");
                        setPreviewResult(null);
                      }}
                      className="border rounded px-2 py-1 text-xs"
                    >
                      <option value="AND">ALL conditions (AND)</option>
                      <option value="OR">ANY condition (OR)</option>
                    </select>
                  ) : (
                    <span className="text-xs font-medium">
                      {rulesLogic === "AND" ? "ALL conditions (AND)" : "ANY condition (OR)"}
                    </span>
                  )}
                </div>

                {/* Conditions list */}
                {conditions.map((condition, index) => (
                  <div key={index} className="flex items-center gap-2 flex-wrap">
                    {/* Field */}
                    {mode !== "view" ? (
                      <select
                        value={condition.field}
                        onChange={(e) => updateCondition(index, { field: e.target.value as RuleCondition["field"] })}
                        className="border rounded px-2 py-1.5 text-xs flex-1 min-w-[100px]"
                      >
                        {FIELD_OPTIONS.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-medium bg-white px-2 py-1 rounded border">
                        {getFieldLabel(condition.field)}
                      </span>
                    )}

                    {/* Operator */}
                    {mode !== "view" ? (
                      <select
                        value={condition.operator}
                        onChange={(e) => {
                          updateCondition(index, { operator: e.target.value as RuleCondition["operator"] });
                          setPreviewResult(null);
                        }}
                        className="border rounded px-2 py-1.5 text-xs w-16"
                      >
                        {(isNumericField(condition.field) ? NUMERIC_OPERATORS : STRING_OPERATORS).map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-medium">
                        {getOperatorLabel(condition.operator)}
                      </span>
                    )}

                    {/* Value */}
                    {mode !== "view" ? (
                      isNumericField(condition.field) ? (
                        <input
                          type="number"
                          value={condition.value}
                          onChange={(e) => {
                            updateCondition(index, { value: e.target.value ? Number(e.target.value) : "" });
                            setPreviewResult(null);
                          }}
                          placeholder="Value"
                          className="border rounded px-2 py-1.5 text-xs flex-1 min-w-[80px]"
                        />
                      ) : (
                        <select
                          value={String(condition.value)}
                          onChange={(e) => {
                            updateCondition(index, { value: e.target.value });
                            setPreviewResult(null);
                          }}
                          className="border rounded px-2 py-1.5 text-xs flex-1 min-w-[80px]"
                        >
                          <option value="">Select...</option>
                          {(condition.field === "type" ? TYPE_VALUES : GENDER_VALUES).map(v => (
                            <option key={v.value} value={v.value}>{v.label}</option>
                          ))}
                        </select>
                      )
                    ) : (
                      <span className="text-xs font-medium bg-white px-2 py-1 rounded border">
                        {condition.value}
                      </span>
                    )}

                    {/* Remove button */}
                    {mode !== "view" && conditions.length > 1 && (
                      <button
                        onClick={() => {
                          removeCondition(index);
                          setPreviewResult(null);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove condition"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add condition button */}
                {mode !== "view" && (
                  <button
                    onClick={addCondition}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <Plus size={12} /> Add Condition
                  </button>
                )}

                {/* Preview button */}
                {mode !== "view" && conditions.length > 0 && (
                  <div className="border-t pt-3 mt-2">
                    <button
                      onClick={handlePreview}
                      disabled={previewLoading}
                      className="flex items-center gap-2 text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded disabled:opacity-50"
                    >
                      <Users size={12} />
                      {previewLoading ? "Loading..." : "Preview Matching Customers"}
                    </button>
                  </div>
                )}

                {/* Preview results */}
                {previewResult && (
                  <div className="border-t pt-3 mt-2">
                    <p className="text-xs font-medium mb-2">
                      {previewResult.matchCount} customer{previewResult.matchCount !== 1 ? "s" : ""} match{previewResult.matchCount === 1 ? "es" : ""}
                    </p>
                    {previewResult.customers.length > 0 && (
                      <div className="max-h-32 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1 px-1">Name</th>
                              <th className="text-left py-1 px-1">Type</th>
                              <th className="text-right py-1 px-1">Spent</th>
                              <th className="text-right py-1 px-1">Orders</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewResult.customers.map(c => (
                              <tr key={c.id} className="border-b border-gray-100">
                                <td className="py-1 px-1">{c.name}</td>
                                <td className="py-1 px-1">{c.type}</td>
                                <td className="py-1 px-1 text-right">{c.totalSpent.toFixed(2)}</td>
                                <td className="py-1 px-1 text-right">{c.orderCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {previewResult.matchCount > 20 && (
                          <p className="text-xs text-gray-400 mt-1">
                            Showing 20 of {previewResult.matchCount}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {mode === "view" && conditions.length === 0 && (
              <p className="text-xs text-gray-400">No auto-assignment rules configured</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setAddOpen(false)}
            className="border px-6 py-2 rounded"
          >
            {mode === "view" ? "Close" : "Cancel"}
          </button>

          {mode !== "view" && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : mode === "add" ? "Save" : "Update"}
            </button>
          )}
        </div>
      </Modal>

      {/* ================= DELETE MODAL ================= */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Delete</h2>

        <div className="flex justify-center mb-4">
          <img src={deleteImg} alt="Delete" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600 mb-6">
          This action cannot be undone. Do <br />
          you want to delete? ?
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => setDeleteOpen(false)}
            className="border border-black px-6 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleDeleteConfirm}
            disabled={deleting}
            className="bg-yellow-400 px-8 py-2 rounded font-medium disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Yes"}
          </button>
        </div>
      </Modal>

      {/* ================= SUCCESS MODAL ================= */}
      <Modal
        open={deletedOpen}
        onClose={() => setDeletedOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">Deleted!</h2>

        <div className="flex justify-center mb-6">
          <img src={tickImg} alt="Deleted" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Customer Group has been successfully removed.
        </p>
      </Modal>
      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">
          {mode === "add"
            ? "Customer Group Added"
            : mode === "edit"
              ? "Customer Group Updated"
              : "Deleted"}
        </h2>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-white text-3xl">✓</span>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          {mode === "add"
            ? "Customer Group added successfully."
            : mode === "edit"
              ? "Customer Group updated successfully."
              : "Customer Group deleted successfully."}
        </p>
      </Modal>
    </div>
  );
}

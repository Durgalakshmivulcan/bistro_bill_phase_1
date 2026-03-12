import { Search, MoreVertical, Eye, Pencil, Trash2, X, TrendingUp, Download, Users, ChevronDown, Tag } from "lucide-react";
import { getCustomers, deleteCustomer, createCustomer, updateCustomer, importCustomers, Customer, getCustomerGroups, CustomerGroup, getTags, bulkAssignTags } from "../../services/customerService";
import type { Tag as TagType } from "../../services/customerService";
import Select from "../form/Select";
import Pagination from "../Common/Pagination";
import { LoadingSpinner } from "../Common";
import { useState, useRef, useEffect, useMemo } from "react";
import Modal from "../../components/ui/Modal";
import deleteImg from "../../assets/deleteConformImg.png";
import tickImg from "../../assets/deleteSuccessImg.png";
import { useFilters } from "../../hooks/useFilters";
import { handleError, clearErrorAfterDelay } from "../../utils/errorHandler";
import { withOptimisticUpdate, generateTempId, optimisticListOperations } from "../../utils/optimisticUpdate";
import { CRUDToasts } from "../../utils/toast";
import { useDebounce } from "../../hooks/useDebounce";
import { usePagination } from "../../hooks/usePagination";
import { usePermissions } from "../../hooks/usePermissions";
import Swal from "sweetalert2";

type Mode = "add" | "edit" | "view";

const META_PREFIX = "__BB_CUSTOMER_META__:";

const parseDateParts = (dateValue?: string | Date | null) => {
  if (!dateValue) return { day: "", month: "", year: "" };
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return { day: "", month: "", year: "" };
  return {
    day: String(date.getDate()),
    month: String(date.getMonth() + 1),
    year: String(date.getFullYear()),
  };
};

const buildIsoDate = (day: string, month: string, year: string) => {
  if (!day || !month || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const parseCustomerMeta = (notes?: string | null) => {
  if (!notes) {
    return {
      plainNotes: "",
      meta: {
        anniversary: "",
        companyName: "",
        companyAddress: "",
        taxStateCode: "",
      },
    };
  }

  if (!notes.startsWith(META_PREFIX)) {
    return {
      plainNotes: notes,
      meta: {
        anniversary: "",
        companyName: "",
        companyAddress: "",
        taxStateCode: "",
      },
    };
  }

  try {
    const parsed = JSON.parse(notes.slice(META_PREFIX.length));
    return {
      plainNotes: parsed.notes || "",
      meta: {
        anniversary: parsed.anniversary || "",
        companyName: parsed.companyName || "",
        companyAddress: parsed.companyAddress || "",
        taxStateCode: parsed.taxStateCode || "",
      },
    };
  } catch {
    return {
      plainNotes: notes,
      meta: {
        anniversary: "",
        companyName: "",
        companyAddress: "",
        taxStateCode: "",
      },
    };
  }
};

const serializeCustomerNotes = (data: {
  notes: string;
  anniversary: string;
  companyName: string;
  companyAddress: string;
  taxStateCode: string;
}) => {
  const hasMeta = data.anniversary || data.companyName || data.companyAddress || data.taxStateCode;
  if (!hasMeta) return data.notes || undefined;

  return `${META_PREFIX}${JSON.stringify({
    notes: data.notes || "",
    anniversary: data.anniversary || "",
    companyName: data.companyName || "",
    companyAddress: data.companyAddress || "",
    taxStateCode: data.taxStateCode || "",
  })}`;
};

export default function CustomersListing() {
  const { canDelete, isAdmin } = usePermissions('customers');
  const allowDelete = canDelete || isAdmin;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const { page, pageSize, setPage, setPageSize, resetPagination } = usePagination({
    defaultPage: 1,
    defaultPageSize: 25,
    persistInUrl: true,
  });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("add");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const [successOpen, setSuccessOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Export/Import state
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkGroupOpen, setBulkGroupOpen] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkResultOpen, setBulkResultOpen] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ action: string; succeeded: number; failed: number } | null>(null);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Tag state
  const [availableTags, setAvailableTags] = useState<TagType[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState("");
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [bulkTagIds, setBulkTagIds] = useState<Set<string>>(new Set());
  const [loadingTags, setLoadingTags] = useState(false);
  const [formCustomerGroups, setFormCustomerGroups] = useState<CustomerGroup[]>([]);
  const [loadingFormGroups, setLoadingFormGroups] = useState(false);
  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    type: "Regular" as Customer["type"],
    gender: "",
    dobDay: "",
    dobMonth: "",
    dobYear: "",
    anniversaryDay: "",
    anniversaryMonth: "",
    anniversaryYear: "",
    companyName: "",
    companyAddress: "",
    gstin: "",
    taxStateCode: "",
    notes: "",
  });

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkActionRef = useRef<HTMLDivElement>(null);

  const isView = mode === "view";

  // Setup filters using useFilters hook
  const { filterValues, setFilterValue, filteredItems: filteredByFilters, clearAllFilters } = useFilters({
    items: customers,
    filters: [
      {
        key: 'group',
        predicate: (customer, value) => {
          if (!value || value === 'Filter by Group') return true;
          return customer.type === value;
        },
        defaultValue: 'Filter by Group'
      },
      {
        key: 'spendingTier',
        predicate: (customer, value) => {
          if (!value || value === 'All Tiers') return true;
          if (value === 'low') return customer.totalSpent < 1000;
          if (value === 'mid') return customer.totalSpent >= 1000 && customer.totalSpent <= 5000;
          if (value === 'high') return customer.totalSpent > 5000;
          return true;
        },
        defaultValue: 'All Tiers'
      }
    ]
  });

  // Top 5 customers by total spent
  const topCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .filter(c => c.totalSpent > 0);
  }, [customers]);

  // Debounce search query for API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch available tags on mount
  useEffect(() => {
    const loadCustomerGroups = async () => {
      try {
        setLoadingFormGroups(true);
        const response = await getCustomerGroups();

        if (response.success && response.data) {
          const groups = Array.isArray(response.data) ? response.data : [];
          setFormCustomerGroups(
            groups.filter((g: CustomerGroup) => g.status === "active")
          );
        }
      } catch {
        // optional: silent fail
      } finally {
        setLoadingFormGroups(false);
      }
    };

    loadCustomerGroups();
  }, []);
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await getTags('active');
        if (response.success && response.data) {
          setAvailableTags(response.data.tags);
        }
      } catch {
        // Tags are optional, don't block UI
      }
    };
    loadTags();
  }, []);

  useEffect(() => {
    if (!error) return;
    Swal.fire({
      icon: "error",
      title: "Error",
      text: error,
      background: "#ffffff",
    });
    setError(null);
  }, [error]);

  // Fetch customers with search query, pagination, and tag filter
  useEffect(() => {
    fetchCustomers();
  }, [debouncedSearch, page, pageSize, tagFilter]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCustomers({
        search: debouncedSearch.trim() || undefined,
        page,
        limit: pageSize,
        tagId: tagFilter || undefined,
      });
      if (response.success && response.data) {
        setCustomers(response.data.customers);

        // Update pagination metadata
        if (response.pagination) {
          setTotalItems(response.pagination.total || 0);
          setTotalPages(response.pagination.totalPages || 0);
        } else {
          // Fallback if backend doesn't send pagination metadata
          setTotalItems(response.data.customers.length);
          setTotalPages(1);
        }
      } else {
        handleError(response, setError, {
          message: response.message || "Failed to fetch customers",
          logError: true,
        });
      }
    } catch (err) {
      handleError(err, setError, {
        message: "Failed to fetch customers",
        logError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear search handler
  const handleClearSearch = () => {
    setSearchQuery("");
    resetPagination(); // Reset to page 1 when clearing search
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;

    const customerToDelete = selectedCustomer;

    try {
      await withOptimisticUpdate({
        operation: async () => {
          const response = await deleteCustomer(customerToDelete.id);
          if (!response.success) {
            throw new Error(response.message || "Failed to delete customer");
          }
          return response;
        },
        onOptimisticUpdate: () => {
          // Remove customer immediately
          setCustomers((prev) => optimisticListOperations.remove(prev, customerToDelete.id));
        },
        onRollback: () => {
          // Re-add customer on failure
          setCustomers((prev) => optimisticListOperations.add(prev, customerToDelete));
        },
        successMessage: "Customer deleted successfully",
        onError: (err: any) => {
          setError(err.message || "Failed to delete customer");
          clearErrorAfterDelay(setError, 3000);
        },
      });
    } catch (err) {
      // Error already handled by withOptimisticUpdate
      console.error("Customer delete error:", err);
    }
  };

  const confirmDeleteCustomer = async (cust: Customer) => {
    const result = await Swal.fire({
      title: "Delete Customer?",
      text: `Do you want to delete ${cust.name}? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#EAB308",
    });

    if (result.isConfirmed) {
      setSelectedCustomer(cust);
      await handleDeleteConfirm();
    }
  };

  const openAdd = () => {
    setMode("add");
    setSelectedCustomer(null);
    setSelectedTagIds(new Set());
    // Reset form data
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      type: "Regular",
      gender: "",
      dobDay: "",
      dobMonth: "",
      dobYear: "",
      anniversaryDay: "",
      anniversaryMonth: "",
      anniversaryYear: "",
      companyName: "",
      companyAddress: "",
      gstin: "",
      taxStateCode: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const openView = (cust: Customer) => {
    setMode("view");
    setSelectedCustomer(cust);
    setSelectedTagIds(new Set(cust.tags?.map(t => t.id) || []));
    const dobParts = parseDateParts(cust.dob);
    const parsed = parseCustomerMeta(cust.notes);
    const anniversaryParts = parseDateParts(parsed.meta.anniversary);
    // Load customer data into form
    const [firstName, ...lastNameParts] = cust.name.split(" ");
    setFormData({
      firstName: firstName || "",
      lastName: lastNameParts.join(" ") || "",
      email: cust.email || "",
      phone: cust.phone || "",
      type: cust.type,
      gender: cust.gender || "",
      dobDay: dobParts.day,
      dobMonth: dobParts.month,
      dobYear: dobParts.year,
      anniversaryDay: anniversaryParts.day,
      anniversaryMonth: anniversaryParts.month,
      anniversaryYear: anniversaryParts.year,
      companyName: parsed.meta.companyName,
      companyAddress: parsed.meta.companyAddress,
      gstin: cust.gstin || "",
      taxStateCode: parsed.meta.taxStateCode,
      notes: parsed.plainNotes,
    });
    setModalOpen(true);
  };

  const openEdit = (cust: Customer) => {
    setMode("edit");
    setSelectedCustomer(cust);
    setSelectedTagIds(new Set(cust.tags?.map(t => t.id) || []));
    const dobParts = parseDateParts(cust.dob);
    const parsed = parseCustomerMeta(cust.notes);
    const anniversaryParts = parseDateParts(parsed.meta.anniversary);
    // Load customer data into form
    const [firstName, ...lastNameParts] = cust.name.split(" ");
    setFormData({
      firstName: firstName || "",
      lastName: lastNameParts.join(" ") || "",
      email: cust.email || "",
      phone: cust.phone || "",
      type: cust.type,
      gender: cust.gender || "",
      dobDay: dobParts.day,
      dobMonth: dobParts.month,
      dobYear: dobParts.year,
      anniversaryDay: anniversaryParts.day,
      anniversaryMonth: anniversaryParts.month,
      anniversaryYear: anniversaryParts.year,
      companyName: parsed.meta.companyName,
      companyAddress: parsed.meta.companyAddress,
      gstin: cust.gstin || "",
      taxStateCode: parsed.meta.taxStateCode,
      notes: parsed.plainNotes,
    });
    setModalOpen(true);
  };

  const handleSaveCustomer = async () => {
    // Validation
    if (!formData.firstName || !formData.phone) {
      await Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "First name and phone number are required",
        background: "#ffffff",
      });
      return;
    }

    setSaving(true);
    setError(null);

    // Combine first and last name
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    const dob = buildIsoDate(formData.dobDay, formData.dobMonth, formData.dobYear);
    const anniversary = buildIsoDate(
      formData.anniversaryDay,
      formData.anniversaryMonth,
      formData.anniversaryYear
    );
    const serializedNotes = serializeCustomerNotes({
      notes: formData.notes,
      anniversary,
      companyName: formData.companyName,
      companyAddress: formData.companyAddress,
      taxStateCode: formData.taxStateCode,
    });

    const customerData = {
      name: fullName,
      phone: formData.phone,
      email: formData.email || undefined,
      gender: formData.gender || undefined,
      dob: dob || undefined,
      type: formData.type,
      gstin: formData.gstin || undefined,
      notes: serializedNotes,
      tagIds: Array.from(selectedTagIds),
    };

    try {
      if (mode === "add") {
        // CREATE with optimistic UI
        const tempId = generateTempId("customer");
        const tempCustomer: Customer = {
          id: tempId,
          name: fullName,
          phone: formData.phone,
          email: formData.email || null,
          gender: formData.gender || null,
          dob: dob ? new Date(dob) : null,
          type: formData.type,
          gstin: formData.gstin || null,
          notes: serializedNotes || null,
          amountDue: 0,
          totalSpent: 0,
          customerGroupId: null,
          customerGroupName: null,
          orderCount: 0,
          tags: Array.from(selectedTagIds).map(id => {
            const tag = availableTags.find(t => t.id === id);
            return { id, name: tag?.name || "", color: tag?.color || null };
          }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await withOptimisticUpdate({
          operation: async () => {
            const response = await createCustomer(customerData);
            if (!response.success) {
              throw new Error(response.message || "Failed to create customer");
            }
            return response.data;
          },
          onOptimisticUpdate: () => {
            // Add temp customer immediately
            setCustomers((prev) => optimisticListOperations.add(prev, tempCustomer));
            setModalOpen(false);
          },
          onRollback: () => {
            // Remove temp customer on failure
            setCustomers((prev) => optimisticListOperations.remove(prev, tempId));
            setModalOpen(true); // Reopen modal so user can try again
          },
          successMessage: "Customer created successfully",
          onSuccess: (createdCustomer) => {
            // Replace temp customer with real customer
            if (createdCustomer) {
              setCustomers((prev) =>
                optimisticListOperations.replace(prev, tempId, createdCustomer)
              );
            }
          },
          onError: (err: any) => {
            setError(err.message || "Failed to create customer");
          },
        });
      } else if (mode === "edit" && selectedCustomer) {
        // UPDATE with optimistic UI
        const updatedCustomer: Customer = {
          ...selectedCustomer,
          name: fullName,
          phone: formData.phone,
          email: formData.email || null,
          gender: formData.gender || null,
          dob: dob ? new Date(dob) : null,
          type: formData.type,
          gstin: formData.gstin || null,
          notes: serializedNotes || null,
          tags: Array.from(selectedTagIds).map(id => {
            const tag = availableTags.find(t => t.id === id);
            return { id, name: tag?.name || "", color: tag?.color || null };
          }),
          updatedAt: new Date().toISOString(),
        };

        await withOptimisticUpdate({
          operation: async () => {
            const response = await updateCustomer(selectedCustomer.id, customerData);
            if (!response.success) {
              throw new Error(response.message || "Failed to update customer");
            }
            return response.data;
          },
          onOptimisticUpdate: () => {
            // Update customer immediately
            setCustomers((prev) =>
              optimisticListOperations.update(prev, selectedCustomer.id, updatedCustomer)
            );
            setModalOpen(false);
          },
          onRollback: () => {
            // Revert to original customer on failure
            setCustomers((prev) =>
              optimisticListOperations.update(prev, selectedCustomer.id, selectedCustomer)
            );
            setModalOpen(true); // Reopen modal so user can try again
          },
          successMessage: "Customer updated successfully",
          onSuccess: (realCustomer) => {
            // Update with real data from server
            if (realCustomer) {
              setCustomers((prev) =>
                optimisticListOperations.update(prev, selectedCustomer.id, realCustomer)
              );
            }
          },
          onError: (err: any) => {
            setError(err.message || "Failed to update customer");
          },
        });
      }
    } catch (err: any) {
      // Error already handled by withOptimisticUpdate
      console.error("Customer save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportCustomers = async () => {
    try {
      setExporting(true);
      setError(null);

      if (customers.length === 0) {
        setError("No customers to export");
        setTimeout(() => setError(null), 3000);
        return;
      }

      // Generate CSV content
      const headers = ["ID", "Name", "Phone", "Email", "Gender", "Date of Birth", "Type", "Total Spent", "Notes", "Created At"];
      const csvRows = [headers.join(",")];

      filteredCustomers.forEach((cust) => {
        const row = [
          cust.id,
          `"${cust.name.replace(/"/g, '""')}"`,
          cust.phone || "N/A",
          cust.email ? `"${cust.email.replace(/"/g, '""')}"` : "N/A",
          cust.gender || "N/A",
          cust.dob ? new Date(cust.dob).toLocaleDateString() : "N/A",
          cust.type,
          cust.totalSpent.toFixed(2),
          cust.notes ? `"${cust.notes.replace(/"/g, '""')}"` : "N/A",
          new Date(cust.createdAt).toLocaleDateString(),
        ];
        csvRows.push(row.join(","));
      });

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = `customers-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Failed to export customers");
      setTimeout(() => setError(null), 3000);
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError("Please upload a CSV file");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setImporting(true);
      setError(null);
      setImportSuccess(null);

      // Call import API with 'skip' as default duplicate action
      const response = await importCustomers(file, 'skip');

      if (response.success && response.data) {
        const { imported, updated, skipped, failed, errors } = response.data;

        // Build success message
        const parts = [];
        if (imported > 0) parts.push(`${imported} imported`);
        if (updated > 0) parts.push(`${updated} updated`);
        if (skipped > 0) parts.push(`${skipped} skipped`);
        if (failed > 0) parts.push(`${failed} failed`);

        const message = `Import completed: ${parts.join(', ')}`;
        setImportSuccess(message);

        // Show errors if any
        if (errors && errors.length > 0) {
          const errorMessages = errors.slice(0, 2).map(e => `Row ${e.row}: ${e.error}`).join('; ');
          const moreErrors = errors.length > 2 ? ` and ${errors.length - 2} more` : '';
          setError(`${errorMessages}${moreErrors}`);
        }

        // Refresh customer list
        await fetchCustomers();

        // Clear success message after 5 seconds
        setTimeout(() => setImportSuccess(null), 5000);
      } else {
        throw new Error(response.error?.message || "Failed to import customers");
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.message || "Failed to import customers");
      setTimeout(() => setError(null), 3000);
    } finally {
      setImporting(false);
    }
  };

  // Use filteredByFilters directly (search is handled by API)
  const filteredCustomers = filteredByFilters;

  const handleClearFilters = () => {
    setSearchQuery("");
    setTagFilter("");
    clearAllFilters();
    resetPagination(); // Reset to page 1 when clearing filters
  };

  // ================= BULK OPERATIONS =================

  const isAllSelected = filteredCustomers.length > 0 && filteredCustomers.every(c => selectedIds.has(c.id));
  const isSomeSelected = selectedIds.size > 0;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkActionOpen(false);
  };

  const handleBulkExport = () => {
    const selected = filteredCustomers.filter(c => selectedIds.has(c.id));
    if (selected.length === 0) return;

    const headers = ["ID", "Name", "Phone", "Email", "Gender", "Date of Birth", "Type", "Total Spent", "Notes", "Created At"];
    const csvRows = [headers.join(",")];

    selected.forEach((cust) => {
      const row = [
        cust.id,
        `"${cust.name.replace(/"/g, '""')}"`,
        cust.phone || "N/A",
        cust.email ? `"${cust.email.replace(/"/g, '""')}"` : "N/A",
        cust.gender || "N/A",
        cust.dob ? new Date(cust.dob).toLocaleDateString() : "N/A",
        cust.type,
        cust.totalSpent.toFixed(2),
        cust.notes ? `"${cust.notes.replace(/"/g, '""')}"` : "N/A",
        new Date(cust.createdAt).toLocaleDateString(),
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `customers-bulk-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setBulkResult({ action: "Export", succeeded: selected.length, failed: 0 });
    setBulkResultOpen(true);
    clearSelection();
  };

  const handleBulkDeleteConfirm = async () => {
    const ids = Array.from(selectedIds);
    setBulkProcessing(true);
    setBulkProgress({ current: 0, total: ids.length });
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < ids.length; i++) {
      try {
        const response = await deleteCustomer(ids[i]);
        if (response.success) {
          succeeded++;
          setCustomers(prev => prev.filter(c => c.id !== ids[i]));
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
      setBulkProgress({ current: i + 1, total: ids.length });
    }

    setBulkProcessing(false);
    setBulkDeleteOpen(false);
    setBulkResult({ action: "Delete", succeeded, failed });
    setBulkResultOpen(true);
    clearSelection();

    if (succeeded > 0) {
      await fetchCustomers();
    }
  };

  const openBulkGroupAssign = async () => {
    setBulkGroupOpen(true);
    setBulkActionOpen(false);
    setSelectedGroupId("");
    setLoadingGroups(true);
    try {
      const response = await getCustomerGroups();
      if (response.success && response.data) {
        const groups = Array.isArray(response.data) ? response.data : [];
        setCustomerGroups(groups.filter((g: CustomerGroup) => g.status === 'active'));
      }
    } catch {
      setError("Failed to load customer groups");
      clearErrorAfterDelay(setError, 3000);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleBulkGroupAssign = async () => {
    if (!selectedGroupId) return;
    const ids = Array.from(selectedIds);
    setBulkProcessing(true);
    setBulkProgress({ current: 0, total: ids.length });
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < ids.length; i++) {
      try {
        const response = await updateCustomer(ids[i], { customerGroupId: selectedGroupId });
        if (response.success) {
          succeeded++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
      setBulkProgress({ current: i + 1, total: ids.length });
    }

    setBulkProcessing(false);
    setBulkGroupOpen(false);
    const groupName = customerGroups.find(g => g.id === selectedGroupId)?.name || "group";
    setBulkResult({ action: `Assign to ${groupName}`, succeeded, failed });
    setBulkResultOpen(true);
    clearSelection();

    if (succeeded > 0) {
      await fetchCustomers();
    }
  };

  const openBulkTagAssign = async () => {
    setBulkTagOpen(true);
    setBulkActionOpen(false);
    setBulkTagIds(new Set());
    setLoadingTags(true);
    try {
      const response = await getTags('active');
      if (response.success && response.data) {
        setAvailableTags(response.data.tags);
      }
    } catch {
      setError("Failed to load tags");
      clearErrorAfterDelay(setError, 3000);
    } finally {
      setLoadingTags(false);
    }
  };

  const handleBulkTagAssign = async () => {
    if (bulkTagIds.size === 0) return;
    const customerIdArray = Array.from(selectedIds);
    const tagIdArray = Array.from(bulkTagIds);
    setBulkProcessing(true);

    try {
      const response = await bulkAssignTags(customerIdArray, tagIdArray);
      if (response.success) {
        setBulkTagOpen(false);
        setBulkResult({ action: "Assign Tags", succeeded: customerIdArray.length, failed: 0 });
        setBulkResultOpen(true);
        clearSelection();
        await fetchCustomers();
      } else {
        setError(response.error?.message || "Failed to assign tags");
        clearErrorAfterDelay(setError, 3000);
      }
    } catch {
      setError("Failed to assign tags");
      clearErrorAfterDelay(setError, 3000);
    } finally {
      setBulkProcessing(false);
    }
  };

  const toggleBulkTag = (tagId: string) => {
    setBulkTagIds(prev => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const toggleFormTag = (tagId: string) => {
    setSelectedTagIds(prev => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  // Close bulk action dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bulkActionRef.current && !bulkActionRef.current.contains(e.target as Node)) {
        setBulkActionOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="bg-bb-bg min-h-screen p-4 md:p-6 space-y-4">
      {/* Import Success Message */}
      {importSuccess && (
        <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded">
          {importSuccess}
        </div>
      )}

      {/* ================= HEADER ================= */}
      <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center gap-4">
        <h1 className="text-[28px] md:text-[32px] font-bold">
          Customers
        </h1>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full lg:w-[360px]">
            <Search
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
            />
            <input
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-black w-full border rounded-md px-4 pr-11 h-11 text-base bg-[#F3F4F6] placeholder:text-gray-500"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              disabled={importing || loading}
              className="bg-yellow-400 px-4 h-11 rounded text-sm border border-black disabled:opacity-50"
            >
              {importing ? "Importing..." : "Import"}
            </button>
            <button
              onClick={openAdd}
              className="bg-black text-white px-4 h-11 rounded text-sm border border-black"
            >
              Add New
            </button>
          </div>
        </div>
      </div>

      {/* ================= TOP CUSTOMERS ================= */}
      {!loading && topCustomers.length > 0 && (
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-yellow-600" />
            <h2 className="text-base font-semibold">Top Customers</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {topCustomers.map((cust, i) => (
              <div
                key={cust.id}
                className="border rounded-lg p-3 bg-bb-bg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-full bg-bb-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="font-medium text-sm truncate">{cust.name}</span>
                </div>
                <div className="text-lg font-bold text-bb-text">
                  ₹{cust.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="flex justify-between text-xs text-bb-textSoft mt-1">
                  <span>{cust.orderCount} orders</span>
                  <span>Avg ₹{cust.orderCount > 0 ? (cust.totalSpent / cust.orderCount).toFixed(0) : '0'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= FILTER ================= */}
      <div className="flex flex-col lg:flex-row lg:justify-end lg:items-end gap-2">
        <div className="w-full lg:w-52">
          <Select
            value={filterValues.group as string}
            onChange={(value) => setFilterValue("group", value)}
            options={[
              { label: "Filter by Group", value: "Filter by Group" },
              ...formCustomerGroups.map((group) => ({
                label: group.name,
                value: group.name, // ⚠️ see note below
              })),
            ]}
          />
        </div>
        <div className="w-full lg:w-52">
          <Select
            value={filterValues.spendingTier as string}
            onChange={(value) => setFilterValue('spendingTier', value)}
            options={[
              { label: "All Tiers", value: "All Tiers" },
              { label: "< ₹1,000", value: "low" },
              { label: "₹1,000 - ₹5,000", value: "mid" },
              { label: "> ₹5,000", value: "high" },
            ]}
          />
        </div>
        <div className="w-full lg:w-52">
          <Select
            value={tagFilter}
            onChange={(value) => { setTagFilter(value); resetPagination(); }}
            options={[
              { label: "Filter by Tag", value: "" },
              ...availableTags.map(t => ({ label: t.name, value: t.id })),
            ]}
          />
        </div>
        <button
          onClick={handleClearFilters}
          className="bg-yellow-400 px-4 h-11 rounded text-sm border border-black"
        >
          Clear
        </button>
      </div>

      {/* ================= BULK ACTION BAR ================= */}
      {isSomeSelected && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-800">
              {selectedIds.size} customer{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={clearSelection}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear selection
            </button>
          </div>
          <div className="relative" ref={bulkActionRef}>
            <button
              onClick={() => setBulkActionOpen(!bulkActionOpen)}
              className="bg-black text-white px-4 py-2 rounded text-sm flex items-center gap-2"
            >
              Bulk Actions <ChevronDown size={14} />
            </button>
            {bulkActionOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-white border rounded-md shadow-lg w-52">
                <button
                  className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-gray-100 text-sm"
                  onClick={openBulkGroupAssign}
                >
                  <Users size={14} /> Assign to Group
                </button>
                <button
                  className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-gray-100 text-sm"
                  onClick={openBulkTagAssign}
                >
                  <Tag size={14} /> Assign Tags
                </button>
                <button
                  className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-gray-100 text-sm"
                  onClick={() => { handleBulkExport(); setBulkActionOpen(false); }}
                >
                  <Download size={14} /> Export Selected
                </button>
                {allowDelete && (
                  <button
                    className="w-full px-4 py-2.5 flex items-center gap-2 hover:bg-red-50 text-red-600 text-sm"
                    onClick={() => { setBulkDeleteOpen(true); setBulkActionOpen(false); }}
                  >
                    <Trash2 size={14} /> Delete Selected
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" message="Loading customers..." />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No customers found</p>
            <button
              onClick={openAdd}
              className="bg-black text-white px-6 py-2 rounded"
            >
              Add Your First Customer
            </button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No customers match your search</p>
            <button
              onClick={() => setSearchQuery("")}
              className="bg-yellow-400 px-6 py-2 rounded border border-black"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[980px]">
            <thead className="bg-bb-primary">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-bb-primary"
                  />
                </th>
                <th className="px-4 py-3">Sl No.</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Gender</th>
                <th className="px-4 py-3">DOB</th>
                <th className="px-4 py-3">Customer Group</th>
                <th className="px-4 py-3">Amount Due</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((cust, index) => {
                // Calculate actual row number based on pagination
                const rowNumber = (page - 1) * pageSize + index + 1;
                return (
                  <tr key={cust.id} className={`border-t ${selectedIds.has(cust.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(cust.id)}
                        onChange={() => handleSelectOne(cust.id)}
                        className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-bb-primary"
                      />
                    </td>
                    <td className="px-4 py-3">{rowNumber}</td>
                    <td className="px-4 py-3 font-medium">{cust.name}</td>
                    <td className="px-4 py-3">{cust.phone || "N/A"}</td>
                    <td className="px-4 py-3 text-gray-600">{cust.email || "N/A"}</td>
                    <td className="px-4 py-3">{cust.gender || "N/A"}</td>
                    <td className="px-4 py-3">
                      {cust.dob ? new Date(cust.dob).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 rounded-full text-xs bg-yellow-100 capitalize">
                        {cust.customerGroupName || cust.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      Rs. {(cust.amountDue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    {/* ================= ACTION MENU ================= */}
                    <td className="px-4 py-3 text-center relative">
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === cust.id ? null : cust.id)
                        }
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openMenuId === cust.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-8 top-10 z-50 bg-white border rounded-md shadow w-40"
                        >
                          <button
                            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100"
                            onClick={() => {
                              openView(cust);
                              setOpenMenuId(null);
                            }}
                          >
                            <Eye size={14} /> View
                          </button>
                          <button
                            className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100"
                            onClick={() => {
                              openEdit(cust);
                              setOpenMenuId(null);
                            }}
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            className="w-full px-3 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50"
                            onClick={async () => {
                              setOpenMenuId(null);
                              await confirmDeleteCustomer(cust);
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && filteredCustomers.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={pageSize}
          onPageChange={setPage}
          onItemsPerPageChange={setPageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          showPageSize={true}
        />
      )}

      {/* ================= CUSTOMER MODAL ================= */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        className="w-[95%] max-w-5xl p-4 md:p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold">
            {mode === "add" && "Add New Customer"}
            {mode === "edit" && "Edit Customer"}
            {mode === "view" && "View Customer"}
          </h2>

          {/* <button
            onClick={() => setModalOpen(false)}
            className="text-xl font-bold"
          >
            ✕
          </button> */}
        </div>

        {/* ================= BASIC DETAILS ================= */}
        <h3 className="text-yellow-600 font-semibold mb-4">Basic Detail's</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium">First Name *</label>
            <input
              disabled={isView}
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full mt-1 border rounded-md px-3 py-2 disabled:bg-gray-100"
              placeholder="First Name"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Last Name *</label>
            <input
              disabled={isView}
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full mt-1 border rounded-md px-3 py-2 disabled:bg-gray-100"
              placeholder="Last Name"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email Address</label>
            <input
              disabled={isView}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full mt-1 border rounded-md px-3 py-2 disabled:bg-gray-100"
              placeholder="Email"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Phone Number *</label>
            <input
              disabled={isView}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full mt-1 border rounded-md px-3 py-2 disabled:bg-gray-100"
              placeholder="Phone Number"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Customer Group *</label>
            <Select
              value={formData.type}
              onChange={(value) =>
                setFormData({ ...formData, type: value as Customer["type"] })
              }
              options={[
                { label: "Select Customer Group", value: "" },
                ...formCustomerGroups.map((group) => ({
                  label: group.name,
                  value: group.name, // ⚠️ adjust if backend expects ID
                })),
              ]}
              disabled={isView || loadingFormGroups}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Gender</label>
            <Select
              value={formData.gender}
              onChange={(value) => setFormData({ ...formData, gender: value })}
              options={[
                { label: "Select Gender", value: "" },
                { label: "Male", value: "Male" },
                { label: "Female", value: "Female" },
              ]}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Date of Birth</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <Select
                value={formData.dobDay}
                onChange={(value) => setFormData({ ...formData, dobDay: value })}
                options={[
                  { label: "Day", value: "" },
                  ...Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) })),
                ]}
                disabled={isView}
              />
              <Select
                value={formData.dobMonth}
                onChange={(value) => setFormData({ ...formData, dobMonth: value })}
                options={[
                  { label: "Month", value: "" },
                  ...Array.from({ length: 12 }, (_, i) => ({
                    label: new Date(2000, i, 1).toLocaleString("en-US", { month: "long" }),
                    value: String(i + 1),
                  })),
                ]}
                disabled={isView}
              />
              <Select
                value={formData.dobYear}
                onChange={(value) => setFormData({ ...formData, dobYear: value })}
                options={[
                  { label: "Year", value: "" },
                  ...Array.from({ length: 100 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return { label: String(year), value: String(year) };
                  }),
                ]}
                disabled={isView}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Anniversary</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <Select
                value={formData.anniversaryDay}
                onChange={(value) => setFormData({ ...formData, anniversaryDay: value })}
                options={[
                  { label: "Day", value: "" },
                  ...Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1) })),
                ]}
                disabled={isView}
              />
              <Select
                value={formData.anniversaryMonth}
                onChange={(value) => setFormData({ ...formData, anniversaryMonth: value })}
                options={[
                  { label: "Month", value: "" },
                  ...Array.from({ length: 12 }, (_, i) => ({
                    label: new Date(2000, i, 1).toLocaleString("en-US", { month: "long" }),
                    value: String(i + 1),
                  })),
                ]}
                disabled={isView}
              />
              <Select
                value={formData.anniversaryYear}
                onChange={(value) => setFormData({ ...formData, anniversaryYear: value })}
                options={[
                  { label: "Year", value: "" },
                  ...Array.from({ length: 100 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return { label: String(year), value: String(year) };
                  }),
                ]}
                disabled={isView}
              />
            </div>
          </div>
        </div>

        <h3 className="text-yellow-600 font-semibold mb-4">Additional Detail's</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium">Company Name</label>
            <input
              disabled={isView}
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full mt-1 border rounded-md px-3 py-2 disabled:bg-gray-100"
              placeholder="Company Name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Company Address</label>
            <input
              disabled={isView}
              value={formData.companyAddress}
              onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
              className="w-full mt-1 border rounded-md px-3 py-2 disabled:bg-gray-100"
              placeholder="Company Address"
            />
          </div>
          <div>
            <label className="text-sm font-medium">GSTIN</label>
            <input
              disabled={isView}
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              className="w-full mt-1 border rounded-md px-3 py-2 disabled:bg-gray-100"
              placeholder="Enter GSTIN Number"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tax State Code</label>
            <input
              disabled={isView}
              value={formData.taxStateCode}
              onChange={(e) => setFormData({ ...formData, taxStateCode: e.target.value })}
              className="w-full mt-1 border rounded-md px-3 py-2 disabled:bg-gray-100"
              placeholder="Enter Tax State Code"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              disabled={isView}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full mt-1 border rounded-md px-3 py-2 disabled:bg-gray-100"
              placeholder="Additional notes"
              rows={3}
            />
          </div>
        </div>

        {/* ================= TAGS ================= */}
        <h3 className="text-yellow-600 font-semibold mb-3 mt-6">Tags</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {availableTags.length === 0 ? (
            <p className="text-sm text-bb-textSoft">No tags available. Create tags from the Tags tab.</p>
          ) : (
            availableTags.map(tag => {
              const isSelected = selectedTagIds.has(tag.id);
              const hex = tag.color || "#3B82F6";
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              const textColor = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#1A1C1E" : "#FFFFFF";
              return (
                <button
                  key={tag.id}
                  type="button"
                  disabled={isView}
                  onClick={() => toggleFormTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isSelected ? "ring-2 ring-offset-1 ring-black" : "opacity-50 hover:opacity-80"
                    } disabled:cursor-default`}
                  style={{ backgroundColor: hex, color: textColor }}
                >
                  {isSelected && "✓ "}{tag.name}
                </button>
              );
            })
          )}
        </div>

        {/* ================= ACTION BUTTONS ================= */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
          <button
            onClick={() => setModalOpen(false)}
            className="border px-6 py-2 rounded"
          >
            {isView ? "Close" : "Cancel"}
          </button>

          {mode !== "view" && (
            <button
              onClick={handleSaveCustomer}
              disabled={saving}
              className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : mode === "add" ? "Save" : "Update"}
            </button>
          )}
        </div>
      </Modal>

      {/* ================= SUCCESS MODAL ================= */}
      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">
          {mode === "add" ? "Customer Added" : "Customer Updated"}
        </h2>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-white text-3xl">✓</span>
          </div>
        </div>

        <p className="text-sm text-gray-600">Action completed successfully.</p>
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
          you want to delete{" "}
          <span className="font-semibold">{selectedCustomer?.name}</span>?
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
            className="bg-yellow-400 px-8 py-2 rounded font-medium"
          >
            Yes
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
          Customer has been successfully removed.
        </p>
      </Modal>

      {/* ================= BULK DELETE MODAL ================= */}
      <Modal
        open={bulkDeleteOpen}
        onClose={() => !bulkProcessing && setBulkDeleteOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Bulk Delete</h2>

        <div className="flex justify-center mb-4">
          <img src={deleteImg} alt="Delete" className="w-16 h-16" />
        </div>

        {bulkProcessing ? (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">
              Deleting customers... {bulkProgress.current} of {bulkProgress.total}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone. Do you want to delete{" "}
              <span className="font-semibold">{selectedIds.size} customer{selectedIds.size !== 1 ? 's' : ''}</span>?
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setBulkDeleteOpen(false)}
                className="border border-black px-6 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                className="bg-red-500 text-white px-8 py-2 rounded font-medium"
              >
                Delete All
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ================= BULK GROUP ASSIGNMENT MODAL ================= */}
      <Modal
        open={bulkGroupOpen}
        onClose={() => !bulkProcessing && setBulkGroupOpen(false)}
        className="w-[90%] max-w-md p-8"
      >
        <h2 className="text-2xl font-bold mb-4">Assign to Group</h2>

        <p className="text-sm text-gray-600 mb-4">
          Assign {selectedIds.size} customer{selectedIds.size !== 1 ? 's' : ''} to a group.
        </p>

        {bulkProcessing ? (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">
              Assigning customers... {bulkProgress.current} of {bulkProgress.total}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${bulkProgress.total > 0 ? (bulkProgress.current / bulkProgress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="text-sm font-medium block mb-1">Select Group</label>
              {loadingGroups ? (
                <p className="text-sm text-bb-textSoft">Loading groups...</p>
              ) : (
                <Select
                  value={selectedGroupId}
                  onChange={(value) => setSelectedGroupId(value)}
                  options={[
                    { label: "Select a group...", value: "" },
                    ...customerGroups.map(g => ({ label: g.name, value: g.id })),
                  ]}
                />
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBulkGroupOpen(false)}
                className="border border-black px-6 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkGroupAssign}
                disabled={!selectedGroupId}
                className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ================= BULK TAG ASSIGNMENT MODAL ================= */}
      <Modal
        open={bulkTagOpen}
        onClose={() => !bulkProcessing && setBulkTagOpen(false)}
        className="w-[90%] max-w-md p-8"
      >
        <h2 className="text-2xl font-bold mb-4">Assign Tags</h2>

        <p className="text-sm text-gray-600 mb-4">
          Assign tags to {selectedIds.size} customer{selectedIds.size !== 1 ? 's' : ''}.
        </p>

        {bulkProcessing ? (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">Assigning tags...</p>
            <LoadingSpinner size="sm" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="text-sm font-medium block mb-2">Select Tags</label>
              {loadingTags ? (
                <p className="text-sm text-bb-textSoft">Loading tags...</p>
              ) : availableTags.length === 0 ? (
                <p className="text-sm text-bb-textSoft">No tags available. Create tags from the Tags tab.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => {
                    const isSelected = bulkTagIds.has(tag.id);
                    const hex = tag.color || "#3B82F6";
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    const textColor = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#1A1C1E" : "#FFFFFF";
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleBulkTag(tag.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isSelected ? "ring-2 ring-offset-1 ring-black" : "opacity-50 hover:opacity-80"
                          }`}
                        style={{ backgroundColor: hex, color: textColor }}
                      >
                        {isSelected && "✓ "}{tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBulkTagOpen(false)}
                className="border border-black px-6 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkTagAssign}
                disabled={bulkTagIds.size === 0}
                className="bg-yellow-400 px-6 py-2 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ================= BULK RESULT SUMMARY MODAL ================= */}
      <Modal
        open={bulkResultOpen}
        onClose={() => setBulkResultOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Bulk {bulkResult?.action} Complete</h2>

        <div className="flex justify-center mb-4">
          <img src={tickImg} alt="Success" className="w-16 h-16" />
        </div>

        <div className="text-sm text-gray-600 space-y-1 mb-6">
          <p><span className="font-semibold text-green-600">{bulkResult?.succeeded || 0}</span> succeeded</p>
          {(bulkResult?.failed || 0) > 0 && (
            <p><span className="font-semibold text-red-600">{bulkResult?.failed}</span> failed</p>
          )}
        </div>

        <button
          onClick={() => setBulkResultOpen(false)}
          className="bg-yellow-400 px-8 py-2 rounded font-medium"
        >
          OK
        </button>
      </Modal>
    </div>
  );
}


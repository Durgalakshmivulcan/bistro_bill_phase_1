import { Search, X } from "lucide-react";
import Select from "../form/Select";
import { useNavigate } from "react-router-dom";
import Actions from "../form/ActionButtons";
import LoadingSpinner from "../Common/LoadingSpinner";
import PurchaseOrderTabs from "../NavTabs/PurchaseOrderTabs";
import { useState, useEffect, useRef, useMemo } from "react";
import Modal from "../../components/ui/Modal";
import deleteImg from "../../assets/deleteConformImg.png";
import tickImg from "../../assets/deleteSuccessImg.png";
import { getPurchaseOrders, deletePurchaseOrder, importPurchaseOrders, resendPOEmail, downloadPOPdf, pausePORecurrence, resumePORecurrence, PurchaseOrder } from "../../services/purchaseOrderService";
import { getSuppliers, Supplier } from "../../services/supplierService";
import { getBranches, Branch } from "../../services/branchService";
import { useFilters } from "../../hooks/useFilters";
import { CRUDToasts } from "../../utils/toast";
import { useDebounce } from "../../hooks/useDebounce";
import { usePagination } from "../../hooks/usePagination";
import { showUpdatedSweetAlert } from "../../utils/swalAlerts";

export default function PurchaseOrderPOList() {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletedOpen, setDeletedOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resendSending, setResendSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // State for purchase orders
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Pagination state
  const { page, pageSize, setPage, resetPagination } = usePagination({
    defaultPage: 1,
    defaultPageSize: 25,
    persistInUrl: true,
  });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // State for export/import
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Date filter: "+ Custom Date" opens a range picker (UI per screenshot)
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const customDateRef = useRef<HTMLDivElement | null>(null);
  const [calendarBaseMonth, setCalendarBaseMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Setup filters using useFilters hook
  const { filterValues, setFilterValue, filteredItems: filteredByFilters, clearAllFilters } = useFilters({
    items: purchaseOrders,
    filters: [
      {
        key: 'branch',
        predicate: (po, value) => {
          if (!value) return true;
          return po.branch.name === value;
        },
        defaultValue: ''
      },
      {
        key: 'date',
        predicate: (po, value) => {
          if (!value || !po.createdAt) return true;

          const poDate = new Date(po.createdAt);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (value === 'Today') {
            const checkDate = new Date(poDate);
            checkDate.setHours(0, 0, 0, 0);
            return checkDate.getTime() === today.getTime();
          } else if (value === 'Yesterday') {
            const y = new Date(today);
            y.setDate(today.getDate() - 1);
            const checkDate = new Date(poDate);
            checkDate.setHours(0, 0, 0, 0);
            return checkDate.getTime() === y.getTime();
          } else if (value === 'Last 7 days') {
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(today.getDate() - 7);
            return poDate >= sevenDaysAgo && poDate <= today;
          } else if (value === 'Last 30 days') {
            const d = new Date(today);
            d.setDate(today.getDate() - 30);
            return poDate >= d && poDate <= today;
          } else if (value === 'Last 90 days') {
            const d = new Date(today);
            d.setDate(today.getDate() - 90);
            return poDate >= d && poDate <= today;
          } else if (value === 'Custom Date') {
            if (!customStart || !customEnd) return true;
            const s = new Date(customStart);
            s.setHours(0, 0, 0, 0);
            const e = new Date(customEnd);
            e.setHours(23, 59, 59, 999);
            return poDate >= s && poDate <= e;
          }

          return true;
        },
        defaultValue: ''
      },
      {
        key: 'supplier',
        predicate: (po, value) => {
          if (!value) return true;
          return po.supplier.name === value;
        },
        defaultValue: ''
      }
    ]
  });

  // Get supplier names for filter options from API data
  const supplierOptions = useMemo(() => {
    return [
      ...suppliers.map(supplier => ({ label: supplier.name, value: supplier.name }))
    ];
  }, [suppliers]);

  const branchOptions = useMemo(() => {
    return [
      ...branches.map((b) => ({ label: b.name, value: b.name })),
    ];
  }, [branches]);

  const dateOptions = useMemo(() => {
    return [
      { label: "Today", value: "Today" },
      { label: "Yesterday", value: "Yesterday" },
      { label: "Last 7 days", value: "Last 7 days" },
      { label: "Last 30 days", value: "Last 30 days" },
      { label: "Last 90 days", value: "Last 90 days" },
      { label: "Custom Date", value: "Custom Date" },
      { label: <span className="font-medium">+ Custom Date</span>, value: "__custom__" },
    ];
  }, []);

  // Debounce search query for API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Load suppliers and branches on mount
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const response = await getSuppliers({ status: "active" });
        if (response.success && response.data) {
          setSuppliers(response.data.suppliers);
        }
      } catch (err) {
        console.error("Failed to load suppliers:", err);
      }
    };

    const loadBranches = async () => {
      try {
        const response = await getBranches({ status: "Active" });
        if (response.success && response.data) {
          setBranches(response.data.branches || []);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };

    loadSuppliers();
    loadBranches();
  }, []);

  // Fetch purchase orders with search and pagination
  useEffect(() => {
    fetchPurchaseOrders();
  }, [debouncedSearch, page, pageSize]);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getPurchaseOrders({
        search: debouncedSearch.trim() || undefined,
        page,
        limit: pageSize,
      });

      if (response.success && response.data?.purchaseOrders) {
        setPurchaseOrders(response.data.purchaseOrders);

        // Update pagination metadata
        if (response.pagination) {
          setTotalItems(response.pagination.total || 0);
          setTotalPages(response.pagination.totalPages || 0);
        } else {
          // Fallback if backend doesn't send pagination metadata
          setTotalItems(response.data.purchaseOrders.length);
          setTotalPages(1);
        }
      } else {
        setError(response.message || "Failed to load purchase orders");
      }
    } catch (err) {
      setError("An error occurred while fetching purchase orders");
      console.error("Failed to fetch purchase orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Clear search handler
  const handleClearSearch = () => {
    setSearchQuery("");
    resetPagination(); // Reset to page 1 when clearing search
  };

  // Use filtered results directly (search handled by API)
  const filteredPurchaseOrders = filteredByFilters;

  const handleClearFilters = () => {
    setSearchQuery("");
    clearAllFilters();
    setCustomStart(null);
    setCustomEnd(null);
    resetPagination(); // Reset to page 1 when clearing filters
  };

  const handleDeleteConfirm = async () => {
    if (!selectedId) return;

    setDeleteOpen(false);

    try {
      const response = await deletePurchaseOrder(selectedId);

      if (response.success) {
        CRUDToasts.deleted("Purchase Order");
        setDeletedOpen(true);
      } else {
        setError(response.message || "Failed to delete purchase order");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setError("An error occurred while deleting purchase order");
      setTimeout(() => setError(""), 3000);
      console.error("Failed to delete purchase order:", err);
    }
  };

  const handleResend = async (poId: string) => {
    if (!poId || resendSending) return;

    setResendSending(true);
    setError("");
    try {
      const response = await resendPOEmail(poId);
      if (!response.success) {
        setError(response.error?.message || response.message || "Failed to send email");
        setTimeout(() => setError(""), 3000);
        return;
      }

      await showUpdatedSweetAlert({
        title: "Mail Sent",
        message: "Mail Successfully Sent to Supplier registered<br/>Email Address.",
      });
    } catch (err) {
      setError("An error occurred while sending email");
      setTimeout(() => setError(""), 3000);
      console.error("Failed to resend PO email:", err);
    } finally {
      setResendSending(false);
    }
  };

  const handleDownloadPdf = async (poId: string) => {
    try {
      const blob = await downloadPOPdf(poId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `purchase-order-${poId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download purchase order PDF");
      setTimeout(() => setError(""), 3000);
      console.error("Failed to download PO PDF:", err);
    }
  };

  const handleExportPurchaseOrders = async () => {
    if (purchaseOrders.length === 0) {
      setError("No purchase orders to export");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setExporting(true);

    try {
      // Generate CSV content
      const headers = [
        "ID",
        "Invoice Number",
        "Branch",
        "Supplier",
        "Amount Paid",
        "Grand Total",
        "Status",
        "Notes",
        "Created At",
      ];

      const csvRows = [headers.join(",")];

      purchaseOrders.forEach((po) => {
        const row = [
          po.id,
          po.invoiceNumber || "",
          po.branch.name,
          po.supplier.name,
          po.amountPaid.toString(),
          po.grandTotal.toString(),
          po.status,
          (po.notes || "").replace(/"/g, '""'),
          new Date(po.createdAt).toLocaleDateString(),
        ];
        csvRows.push(row.map((cell) => `"${cell}"`).join(","));
      });

      const csvContent = csvRows.join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `purchase-orders-export-${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to export purchase orders");
      setTimeout(() => setError(""), 3000);
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError("Please select a CSV file");
      setTimeout(() => setError(""), 5000);
      return;
    }

    setImporting(true);
    setError("");
    setImportSuccess("");

    try {
      const response = await importPurchaseOrders(file);

      if (response.success && response.data) {
        const { imported, failed, errors: importErrors } = response.data;
        const parts: string[] = [];
        if (imported > 0) parts.push(`${imported} PO(s) imported successfully`);
        if (failed > 0) parts.push(`${failed} row(s) failed`);

        if (imported > 0) {
          setImportSuccess(parts.join(", "));
          setTimeout(() => setImportSuccess(""), 8000);
          // Refresh the list
          fetchPurchaseOrders();
        }

        if (failed > 0 && importErrors && importErrors.length > 0) {
          const errorMsg = importErrors.length <= 2
            ? importErrors.join("; ")
            : `${importErrors.slice(0, 2).join("; ")} and ${importErrors.length - 2} more error(s)`;
          setError(errorMsg);
          setTimeout(() => setError(""), 8000);
        }
      } else {
        setError(response.error?.message || "Failed to import purchase orders");
        setTimeout(() => setError(""), 5000);
      }
    } catch (err) {
      setError("Failed to import purchase orders");
      setTimeout(() => setError(""), 3000);
      console.error("Import error:", err);
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleToggleRecurrence = async (po: PurchaseOrder) => {
    try {
      const response = po.recurrenceStatus === 'Paused'
        ? await resumePORecurrence(po.id)
        : await pausePORecurrence(po.id);

      if (response.success) {
        CRUDToasts.updated("Recurring PO");
        fetchPurchaseOrders();
      } else {
        setError(response.message || "Failed to update recurrence status");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) {
      setError("Failed to update recurrence status");
      setTimeout(() => setError(""), 3000);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700";
      case "Pending":
        return "bg-gray-200 text-gray-700";
      case "Declined":
        return "bg-red-100 text-red-700";
      case "Received":
        return "bg-blue-100 text-blue-700";
      default:
        return "";
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 9;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  const monthLabel = (d: Date) =>
    d.toLocaleString("en-US", { month: "long", year: "numeric" });

  const buildMonth = (year: number, month: number) => {
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7; // Monday=0
    const start = new Date(year, month, 1 - startDow);
    const weeks: { date: Date; inMonth: boolean }[][] = [];
    for (let w = 0; w < 6; w++) {
      const row: { date: Date; inMonth: boolean }[] = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + w * 7 + i);
        row.push({ date: day, inMonth: day.getMonth() === month });
      }
      weeks.push(row);
    }
    return weeks;
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const inRange = (d: Date) => {
    if (!customStart || !customEnd) return false;
    const t = new Date(d);
    t.setHours(0, 0, 0, 0);
    const s = new Date(customStart);
    s.setHours(0, 0, 0, 0);
    const e = new Date(customEnd);
    e.setHours(0, 0, 0, 0);
    return t >= s && t <= e;
  };

  const handleDayPick = (d: Date) => {
    if (!customStart || (customStart && customEnd)) {
      setCustomStart(d);
      setCustomEnd(null);
      return;
    }
    const s = customStart;
    if (d < s) {
      setCustomStart(d);
      setCustomEnd(s);
    } else {
      setCustomEnd(d);
    }
  };

  useEffect(() => {
    if (customStart && customEnd && customDateOpen) {
      setFilterValue("date", "Custom Date");
      setCustomDateOpen(false);
    }
  }, [customStart, customEnd, customDateOpen, setFilterValue]);

  // Close the custom date popover when clicking outside (since UI has no explicit Close button).
  useEffect(() => {
    if (!customDateOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = customDateRef.current;
      if (el && !el.contains(e.target as Node)) {
        setCustomDateOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [customDateOpen]);

  return (
    <div className="bg-bb-bg min-h-screen p-6 space-y-4">
      <PurchaseOrderTabs />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Success Message */}
      {importSuccess && (
        <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded">
          {importSuccess}
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-[32px] font-bold">PO Listing</h1>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="relative w-64">
            <Search
              size={16}
              className="
                absolute right-3 top-1/2
                -translate-y-1/2
                text-gray-400
                pointer-events-none
              "
            />
            <input
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
              text-black
                w-full
                border rounded-md
                pl-4 pr-10 py-2
                text-sm
                bg-white
                focus:outline-none
              "
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={handleImportClick}
            disabled={importing || loading}
            className="bg-yellow-400 px-4 py-2 rounded border border-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? "Importing..." : "Import"}
          </button>
          <button
            onClick={handleExportPurchaseOrders}
            disabled={exporting || loading}
            className="border px-4 py-2 rounded border border-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? "Exporting..." : "Export"}
          </button>
          <button
            onClick={() => navigate("/purchaseorder/polist/add")}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Add New
          </button>
        </div>
      </div>

      {/* FILTER ROW */}
      <div className="flex justify-end items-center gap-2">
        <div className="w-[180px]">
          <Select
            value={filterValues.branch as string}
            onChange={(value) => setFilterValue('branch', value)}
            options={branchOptions}
            placeholder="Filter by Branch"
            className="border-gray-200 bg-white"
          />
        </div>
        <div className="w-[180px] relative">
          <Select
            value={filterValues.date as string}
            onChange={(value) => {
              if (value === "__custom__") {
                setCustomDateOpen(true);
                setCustomStart(null);
                setCustomEnd(null);
                const now = new Date();
                setCalendarBaseMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                return;
              }
              setFilterValue("date", value);
            }}
            options={dateOptions}
            placeholder="Filter by Date"
            className="border-gray-200 bg-white"
          />

          {customDateOpen && (
            <div
              ref={customDateRef}
              className="absolute right-0 mt-2 z-50 bg-gray-100 border border-gray-200 rounded-md shadow-lg p-4 w-[520px]"
            >
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarBaseMonth(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                    )
                  }
                  className="w-8 h-8 border border-gray-200 rounded flex items-center justify-center"
                  aria-label="Previous month"
                >
                  ‹
                </button>
                <div className="flex items-center gap-10">
                  <div className="text-sm font-medium">{monthLabel(calendarBaseMonth)}</div>
                  <div className="text-sm font-medium">
                    {monthLabel(new Date(calendarBaseMonth.getFullYear(), calendarBaseMonth.getMonth() + 1, 1))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarBaseMonth(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                    )
                  }
                  className="w-8 h-8 border border-gray-200 rounded flex items-center justify-center"
                  aria-label="Next month"
                >
                  ›
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {[0, 1].map((offset) => {
                  const m = new Date(
                    calendarBaseMonth.getFullYear(),
                    calendarBaseMonth.getMonth() + offset,
                    1
                  );
                  const weeks = buildMonth(m.getFullYear(), m.getMonth());
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return (
                    <div
                      key={offset}
                      className="select-none bg-white rounded-md shadow p-3 border border-gray-200"
                    >
                      <div className="grid grid-cols-7 text-[11px] text-gray-500 mb-2">
                        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                          <div key={d} className="text-center">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {weeks.flat().map(({ date, inMonth }) => {
                          const isStart = customStart && isSameDay(date, customStart);
                          const isEnd = customEnd && isSameDay(date, customEnd);
                          const isIn = inRange(date);
                          const isToday = isSameDay(date, today);
                          const base =
                            "w-8 h-8 rounded flex items-center justify-center text-sm";
                          const muted = inMonth ? "text-gray-800" : "text-gray-300";
                          const rangeBg = isIn ? "bg-yellow-100" : "";
                          const edgeBg = isStart || isEnd ? "bg-yellow-400 text-black font-medium" : "";
                          const todayRing = isToday ? "ring-1 ring-gray-300" : "";
                          return (
                            <button
                              key={`${offset}-${date.toISOString()}`}
                              type="button"
                              onClick={() => handleDayPick(date)}
                              className={`${base} ${muted} ${rangeBg} ${edgeBg} ${todayRing}`}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="w-[180px]">
          <Select
            value={filterValues.supplier as string}
            onChange={(value) => setFilterValue('supplier', value)}
            options={supplierOptions}
            placeholder="Filter by Supplier"
            className="border-gray-200 bg-white"
          />
        </div>
        <button
          onClick={handleClearFilters}
          className="bg-yellow-400 px-4 py-2 rounded border border-black"
        >
          Clear
        </button>
      </div>
      {/* TABLE */}
      <div className="bg-white border border-[#EADFC2] rounded-md overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" message="Loading purchase orders..." />
          </div>
        ) : filteredPurchaseOrders.length === 0 ? (
          <div className="text-center py-8">
            {purchaseOrders.length === 0 ? (
              <>
                <p className="text-gray-500 mb-4">No purchase orders found</p>
                <button
                  onClick={() => navigate("/purchaseorder/polist/add")}
                  className="bg-black text-white px-4 py-2 rounded"
                >
                  Add Your First Purchase Order
                </button>
              </>
            ) : (
              <p className="text-gray-500">No matching purchase orders found</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-yellow-400 text-black">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Sl. No.</th>
                <th className="px-4 py-3 text-left font-medium">Created on</th>
                <th className="px-4 py-3 text-left font-medium">PO Invoice</th>
                <th className="px-4 py-3 text-left font-medium">Supplier Name</th>
                <th className="px-4 py-3 text-left font-medium">Branch Name</th>
                <th className="px-4 py-3 text-left font-medium">Amount Paid</th>
                <th className="px-4 py-3 text-left font-medium">Grand Total</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPurchaseOrders.map((po, index) => (
                <tr
                  key={po.id}
                  className={`border-t ${index % 2 ? "bg-[#FFF9E8]" : "bg-white"}`}
                >
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">
                    {formatDate(po.createdAt)}
                  </td>
                  <td className="px-4 py-3">{po.invoiceNumber || "N/A"}</td>
                  <td className="px-4 py-3">{po.supplier.name}</td>
                  <td className="px-4 py-3">{po.branch.name}</td>
                  <td className="px-4 py-3">
                    ₹ {po.amountPaid.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    ₹ {po.grandTotal.toLocaleString()}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusClass(
                        po.status,
                      )}`}
                    >
                      {po.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
  {(() => {
    const actions: ActionType[] =
      po.status === "Approved"
        ? ["view", "resend", "download", "logs"]
        : po.status === "Pending"
          ? ["view", "edit", "delete", "resend"]
          : po.status === "Declined"
            ? ["view", "resend", "download", "logs"]
            : ["view", "download", "logs"];

    return (
      <Actions
        actions={actions}
        onView={() => navigate(`/purchaseorder/polist/view/${po.id}`)}
        onEdit={
          actions.includes("edit")
            ? () => navigate(`/purchaseorder/polist/edit/${po.id}`)
            : undefined
        }
        onDelete={
          actions.includes("delete")
            ? () => {
                setSelectedId(po.id);
                setDeleteOpen(true);
              }
            : undefined
        }
        onResend={
          actions.includes("resend")
            ? () => handleResend(po.id)
            : undefined
        }
        onDownload={
          actions.includes("download")
            ? () => handleDownloadPdf(po.id)
            : undefined
        }
        onLogs={
          actions.includes("logs")
            ? () =>
                setError("Logs & Transactions is not available yet.")
            : undefined
        }
      />
    );
  })()}
</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && filteredPurchaseOrders.length > 0 && totalPages > 1 && (
        <div className="flex justify-end pt-2">
          <div className="flex items-center gap-1 text-sm">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center disabled:opacity-50"
              aria-label="First page"
            >
              «
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center disabled:opacity-50"
              aria-label="Previous page"
            >
              ‹
            </button>

            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-2 text-gray-500">
                  ...
                </span>
              ) : (
                <button
                  key={`p-${p}`}
                  type="button"
                  onClick={() => setPage(p as number)}
                  className={`w-7 h-7 border rounded flex items-center justify-center ${
                    page === p
                      ? "bg-yellow-400 border-yellow-400 font-medium"
                      : "border-gray-300 bg-white hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center disabled:opacity-50"
              aria-label="Next page"
            >
              ›
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="w-7 h-7 border border-gray-300 rounded flex items-center justify-center disabled:opacity-50"
              aria-label="Last page"
            >
              »
            </button>
          </div>
        </div>
      )}

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
          you want to proceed with deletion?
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
      <Modal
        open={deletedOpen}
        onClose={() => {
          setDeletedOpen(false);
          fetchPurchaseOrders();
        }}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">Deleted!</h2>

        <div className="flex justify-center mb-6">
          <img src={tickImg} alt="Deleted" className="w-16 h-16" />
        </div>

        <p className="text-sm text-gray-600">
          Purchase order has been successfully removed.
        </p>
      </Modal>
    </div>
  );
  type ActionType =
  | "view"
  | "edit"
  | "delete"
  | "resend"
  | "download"
  | "logs";
}

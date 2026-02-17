import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Download, X, Upload, Search } from "lucide-react";
import QRCode from "react-qr-code";
import Select from "../form/Select";
import { getReservations, Reservation } from "../../services/reservationService";
import { useBranch } from "../../contexts/BranchContext";

const ReservationsFilters: React.FC = () => {
  const navigate = useNavigate();
  const { currentBranchId } = useBranch();
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  /* Handlers */
  const handleDownloadQR = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = 256;
      canvas.height = 256;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 256, 256);
      ctx.drawImage(img, 0, 0, 256, 256);

      const link = document.createElement("a");
      link.download = `reservations-qr-${new Date().toISOString().split("T")[0]}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await getReservations({
        branchId: currentBranchId,
        limit: 10000,
      });

      const reservations: Reservation[] = response.data || [];
      if (reservations.length === 0) {
        alert("No reservations to export");
        return;
      }

      const headers = [
        "Customer Name",
        "Date",
        "Start Time",
        "End Time",
        "Phone",
        "Guests",
        "Status",
        "Table",
        "Notes",
      ];

      const rows = reservations.map((r) => [
        r.customerName,
        r.date,
        r.startTime,
        r.endTime,
        r.customerPhone,
        r.guestCount,
        r.status,
        r.table?.label || r.room?.name || "-",
        r.notes || "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reservations-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting reservations:", err);
      alert("Failed to export reservations. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleClear = () => {
    setDateFilter("");
    setSearch("");
  };

  return (
    <div className="space-y-4">
      {/* 🔹 TOP ROW : SEARCH + ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        {/* Title */}
        <h1 className="text-2xl font-bold">All Reservations List</h1>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search here..."
              className="w-full border rounded-md px-3 pr-10 py-2 text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="border px-4 py-2 rounded text-sm disabled:opacity-50"
            >
              {exporting ? "Exporting..." : "Export"}
            </button>

            <button
              onClick={() => navigate("/reservations/add")}
              className="bg-black text-white px-4 py-2 rounded text-sm"
            >
              Add New
            </button>
          </div>
        </div>
      </div>

      {/* 🔹 SECOND ROW : FILTERS */}
      <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3">
        {/* Download QR */}
        <button
          onClick={handleDownloadQR}
          className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm w-full sm:w-auto"
        >
          <Download size={16} />
          Download QR
        </button>

        {/* Filter by Date */}
        <div className="w-full sm:w-60">
          <Select
            value={dateFilter}
            onChange={(value) => setDateFilter(value)}
            options={[
              { label: "Filter by Date", value: "" },
              { label: "Today", value: "today" },
              { label: "Tomorrow", value: "tomorrow" },
              { label: "This Week", value: "week" },
              { label: "This Month", value: "month" },
            ]}
          />
        </div>

        {/* Clear */}
        <button
          onClick={handleClear}
          disabled={!dateFilter && !search}
          className="
            flex items-center justify-center gap-2
            rounded-lg bg-yellow-400
            px-4 py-2 text-sm font-medium
            w-full sm:w-auto
            disabled:opacity-50
          "
        >
          <X size={16} />
          Clear
        </button>
      </div>
      {/* Hidden QR code for download */}
      <div ref={qrRef} style={{ position: "absolute", left: "-9999px" }}>
        <QRCode
          value={`${window.location.origin}/reservations/add`}
          size={256}
        />
      </div>
    </div>
  );
};

export default ReservationsFilters;

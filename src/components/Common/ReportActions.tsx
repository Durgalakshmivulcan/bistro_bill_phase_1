import { useState } from "react";
import Modal from "../ui/Modal";
import Select from "../form/Select";
import { exportReport, ReportExportInput } from "../../services/reportsService";

interface ReportActionsProps {
  reportType?: 'sales' | 'products' | 'customers' | 'gst' | 'location-comparison';
  filters?: {
    startDate?: string;
    endDate?: string;
    branchId?: string;
    categoryId?: string;
    month?: string;
    year?: string;
    gstType?: 'b2b' | 'b2c';
  };
}

export default function ReportActions({
  reportType = 'sales',
  filters = {}
}: ReportActionsProps) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSuccessOpen, setEmailSuccessOpen] = useState(false);

  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadSuccessOpen, setDownloadSuccessOpen] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');

  const handleDownload = async () => {
    try {
      setDownloadOpen(true);
      setDownloadError(null);

      const exportInput: ReportExportInput = {
        reportType,
        format: selectedFormat,
        filters,
      };

      const response = await exportReport(exportInput);

      if (response.success && response.data) {
        // Trigger file download
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.download = response.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloadOpen(false);
        setDownloadSuccessOpen(true);

        setTimeout(() => {
          setDownloadSuccessOpen(false);
        }, 2000);
      } else {
        setDownloadOpen(false);
        setDownloadError(response.message || 'Failed to export report');
      }
    } catch (err) {
      setDownloadOpen(false);
      setDownloadError('An error occurred while exporting the report');
      console.error('Error exporting report:', err);
    }
  };

  return (
    <>
      {/* ================= BUTTONS ================= */}
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button
          onClick={() => setEmailOpen(true)}
          className="bb-btn-secondary bg-bb-bg border border-black rounded-md"
        >
          Email Report
        </button>

        <button
          onClick={handleDownload}
          className="bb-btn bg-bb-secondary text-white rounded-md hover:bg-black/90"
        >
          Download Full Report ({selectedFormat === 'excel' ? 'XLSX' : selectedFormat.toUpperCase()})
        </button>

        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value as 'csv' | 'pdf' | 'excel')}
          className="bb-input w-24 bg-bb-bg border border-black rounded-md text-sm"
        >
          <option value="csv">CSV</option>
          <option value="pdf">PDF</option>
          <option value="excel">Excel</option>
        </select>
      </div>

      {/* ================= SEND EMAIL MODAL ================= */}
      <Modal
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        className="w-[95%] max-w-lg p-4 md:p-6"
      >
        <h2 className="text-xl font-bold mb-4">
          Send Report to Email
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">From Date</label>
            <input
              type="date"
              className="w-full mt-1 border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">To Date</label>
            <input
              type="date"
              className="w-full mt-1 border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Mail Frequency
            </label>
            <Select
              value=""
              options={[
                { label: "Does not repeat", value: "" },
                { label: "Daily", value: "Daily" },
                { label: "Weekly", value: "Weekly" },
                { label: "Monthly", value: "Monthly" },
              ]}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Send On</label>
            <input
              type="time"
              className="w-full mt-1 border rounded-md px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setEmailOpen(false)}
            className="border px-6 py-2 rounded"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              setEmailOpen(false);
              setEmailSuccessOpen(true);

              setTimeout(() => {
                setEmailSuccessOpen(false);
              }, 2000);
            }}
            className="bg-yellow-400 px-6 py-2 rounded font-medium"
          >
            Save
          </button>
        </div>
      </Modal>

      {/* ================= EMAIL SUCCESS ================= */}
      <Modal
        open={emailSuccessOpen}
        onClose={() => setEmailSuccessOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">
          Email Sent
        </h2>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-white text-3xl">✓</span>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Report has been sent successfully.
        </p>
      </Modal>

      {/* ================= DOWNLOAD PROGRESS ================= */}
      <Modal
        open={downloadOpen}
        onClose={() => {}}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-xl font-bold mb-4">
          Download in Progress
        </h2>

        <div className="flex justify-center mb-6 text-5xl">
          ⏳
        </div>

        <p className="text-sm text-gray-600">
          This might take a few seconds. Please stay!
        </p>
      </Modal>

      {/* ================= DOWNLOAD SUCCESS ================= */}
      <Modal
        open={downloadSuccessOpen}
        onClose={() => setDownloadSuccessOpen(false)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">
          Reports Downloaded
        </h2>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-white text-3xl">✓</span>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Reports has been downloaded successfully.
        </p>
      </Modal>

      {/* ================= DOWNLOAD ERROR ================= */}
      <Modal
        open={!!downloadError}
        onClose={() => setDownloadError(null)}
        className="w-[90%] max-w-md p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6 text-red-600">
          Download Failed
        </h2>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-white text-3xl">✗</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {downloadError}
        </p>

        <button
          onClick={() => setDownloadError(null)}
          className="bg-bb-primary px-6 py-2 rounded font-medium"
        >
          Close
        </button>
      </Modal>
    </>
  );
}

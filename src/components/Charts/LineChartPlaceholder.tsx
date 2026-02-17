import { useState, useEffect, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  ScriptableContext,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { getSalesByTimePeriod } from "../../services/reportsService";
import { handleError } from "../../utils/errorHandler";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

interface LineChartPlaceholderProps {
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

const LineChartPlaceholder = ({ startDate, endDate, branchId }: LineChartPlaceholderProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);

  const fetchSalesData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Default to last 30 days if no date range provided
      const end = endDate || new Date().toISOString().split('T')[0];
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await getSalesByTimePeriod(start, end, 'month', branchId);

      if (response.success && response.data) {
        const { breakdown } = response.data;

        // Transform API data to chart format
        const labels = breakdown.map(item => item.period);
        const orderData = breakdown.map(item => item.orderCount);
        const revenueData = breakdown.map(item => item.revenue);

        setChartData({
          labels,
          datasets: [
            {
              label: "Total Orders",
              data: orderData,
              borderColor: "#000000",
              fill: true,
              tension: 0.45,
              pointRadius: 4,
              pointBackgroundColor: "#000",
              backgroundColor: (ctx: ScriptableContext<"line">) => {
                const chart = ctx.chart;
                const { ctx: canvasCtx, chartArea } = chart;
                if (!chartArea) return "rgba(0,0,0,0.1)";
                const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(0, "rgba(0, 0, 0, 0.25)");
                gradient.addColorStop(1, "rgba(0, 0, 0, 0.03)");
                return gradient;
              },
            },
            {
              label: "Total Revenue (₹)",
              data: revenueData,
              borderColor: "#F5B301",
              fill: true,
              tension: 0.45,
              pointRadius: 4,
              pointBackgroundColor: "#F5B301",
              backgroundColor: (ctx: ScriptableContext<"line">) => {
                const chart = ctx.chart;
                const { ctx: canvasCtx, chartArea } = chart;
                if (!chartArea) return "rgba(245,179,1,0.1)";
                const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(0, "rgba(245, 179, 1, 0.35)");
                gradient.addColorStop(1, "rgba(245, 179, 1, 0.05)");
                return gradient;
              },
            },
          ],
        });
      } else {
        setError(response.error?.message || "Failed to load sales data");
      }
    } catch (err) {
      handleError(err, setError);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, branchId]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#000",
        bodyColor: "#000",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx: any) => {
            const datasetLabel = ctx.dataset.label;
            const value = ctx.raw;
            if (datasetLabel.includes("Revenue")) {
              return `${datasetLabel}: ₹${value.toLocaleString()}`;
            }
            return `${datasetLabel}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        grid: { color: "#f1f5f9" },
        ticks: { stepSize: 5 },
      },
    },
  };

  if (loading) {
    return (
      <div className="h-[300px] bg-bb-bg rounded-xl p-4 shadow-bb-card flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bb-primary mx-auto mb-2"></div>
          <p className="text-bb-textSoft text-sm">Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[300px] bg-bb-bg rounded-xl p-4 shadow-bb-card flex items-center justify-center">
        <div className="text-center">
          <i className="bi bi-exclamation-circle text-4xl text-bb-danger mb-2"></i>
          <p className="text-bb-danger mb-2">{error}</p>
          <button
            onClick={fetchSalesData}
            className="px-4 py-2 bg-bb-primary text-white rounded-md hover:bg-bb-primary/90 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!chartData || chartData.labels.length === 0) {
    return (
      <div className="h-[300px] bg-bb-bg rounded-xl p-4 shadow-bb-card flex items-center justify-center">
        <div className="text-center">
          <i className="bi bi-inbox text-4xl text-bb-textSoft mb-2"></i>
          <p className="text-bb-textSoft">No data available for the selected period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[300px] bg-bb-bg rounded-xl p-4 shadow-bb-card">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default LineChartPlaceholder;

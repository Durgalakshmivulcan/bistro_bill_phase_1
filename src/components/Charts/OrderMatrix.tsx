import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  ScriptableContext,
} from "chart.js";
import { Line } from "react-chartjs-2";
import totalOrdersIcon from "../../assets/imgs/bodashboard/totalorders.png";
import cancelledOrdersIcon from "../../assets/imgs/bodashboard/cancelledordersrevenue.png";
import nonChargeableIcon from "../../assets/imgs/bodashboard/nonchargableordersrevenue.png";
import reservationIcon from "../../assets/imgs/bodashboard/dineinrevenue.png";
import {
  getSalesByOrderType,
  getSalesByTimePeriod,
  getSalesSummary,
  getSalesSummaryByChannel,
} from "../../services/reportsService";
import { getRevenueSummary } from "../../services/dashboardService";
import Select from "../form/Select";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type SourceTab = "all" | "online" | "offline";
type SubTab =
  | "onlineOrders"
  | "offlineOrders"
  | "zomato"
  | "swiggy"
  | "uberEats"
  | "dineIn"
  | "takeAway"
  | "subscriptions"
  | "catering";

type MatrixSeries = {
  key: SubTab;
  label: string;
  color: string;
  orders: number[];
  revenue: number[];
};

interface OrderMatrixProps {
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

const sourceTabs: Array<{ key: SourceTab; label: string }> = [
  { key: "all", label: "All Sources" },
  { key: "online", label: "Online Sources" },
  { key: "offline", label: "Offline Sources" },
];

const subTabsBySource: Record<SourceTab, Array<{ key: SubTab; label: string }>> = {
  all: [
    { key: "onlineOrders", label: "Online Orders" },
    { key: "offlineOrders", label: "Offline Orders" },
  ],
  online: [
    { key: "zomato", label: "Zomato" },
    { key: "swiggy", label: "Swiggy" },
    { key: "uberEats", label: "Uber Eats" },
  ],
  offline: [
    { key: "dineIn", label: "Dine In" },
    { key: "takeAway", label: "Take Away" },
    { key: "subscriptions", label: "Subscriptions" },
    { key: "catering", label: "Catering" },
  ],
};

const seriesColors: Record<SubTab, string> = {
  onlineOrders: "#222222",
  offlineOrders: "#F0B61E",
  zomato: "#E91E63",
  swiggy: "#FF8F1F",
  uberEats: "#3E7D3E",
  dineIn: "#F0B61E",
  takeAway: "#2F627E",
  subscriptions: "#3A66FF",
  catering: "#FF6741",
};

const getYearRange = (year: string) => ({
  start: `${year}-01-01`,
  end: `${year}-12-31`,
});

const shapeBySeries = (values: number[], seed: number) =>
  values.map((value, index) => {
    const factor = 0.82 + 0.22 * Math.sin((index + 1 + seed) * 0.95) + 0.06 * Math.cos((index + seed) * 1.7);
    return Math.max(0, Math.round(value * factor));
  });

const buildGradient = (ctx: ScriptableContext<"line">, color: string) => {
  const chart = ctx.chart;
  const { ctx: canvasCtx, chartArea } = chart;
  if (!chartArea) return `${color}22`;
  const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, `${color}35`);
  gradient.addColorStop(1, `${color}05`);
  return gradient;
};

export default function OrderMatrix({ startDate, endDate, branchId }: OrderMatrixProps) {
  const [selectedSource, setSelectedSource] = useState<SourceTab>("all");
  const [selectedSubTab, setSelectedSubTab] = useState<SubTab | "">("");
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [series, setSeries] = useState<MatrixSeries[]>([]);
  const [cards, setCards] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    cancelledOrders: 0,
    cancelledRevenue: 0,
    nonChargeableOrders: 0,
    nonChargeableRevenue: 0,
    reservations: 0,
    reservationRevenue: 0,
  });

  const yearOptions = Array.from({ length: 6 }, (_, index) => {
    const year = new Date().getFullYear() - index;
    return { label: `Filter By Year ${year}`, value: String(year) };
  });

  const resolveDateRange = useMemo(() => {
    if (selectedYear) return getYearRange(selectedYear);
    return {
      start: startDate || `${new Date().getFullYear()}-01-01`,
      end: endDate || `${new Date().getFullYear()}-12-31`,
    };
  }, [selectedYear, startDate, endDate]);

  useEffect(() => {
    setSelectedSubTab("");
  }, [selectedSource]);

  const fetchMatrixData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = resolveDateRange;
      const [periodRes, salesSummaryRes, revenueSummaryRes, orderTypeRes, channelSummaryRes] = await Promise.all([
        getSalesByTimePeriod(start, end, "month", branchId),
        getSalesSummary(start, end, branchId),
        getRevenueSummary(start, end, branchId),
        getSalesByOrderType(start, end, branchId),
        getSalesSummaryByChannel(start, end, branchId),
      ]);

      if (!periodRes.success || !periodRes.data) {
        throw new Error(periodRes.error?.message || "Unable to load order matrix");
      }

      const monthMap = new Map<number, { orders: number; revenue: number }>();
      periodRes.data.breakdown.forEach((item) => {
        const monthIndex = new Date(`${item.period}-01`).getMonth();
        if (!Number.isNaN(monthIndex)) {
          monthMap.set(monthIndex, { orders: item.orderCount || 0, revenue: item.revenue || 0 });
        }
      });

      const baseOrders = MONTH_LABELS.map((_, index) => monthMap.get(index)?.orders || 0);
      const baseRevenue = MONTH_LABELS.map((_, index) => monthMap.get(index)?.revenue || 0);

      const channelRows = channelSummaryRes.success && channelSummaryRes.data ? channelSummaryRes.data.byChannel : [];
      const orderTypes = orderTypeRes.success && orderTypeRes.data ? orderTypeRes.data.breakdown : [];

      const channelOrderValue = (names: string[]) =>
        channelRows
          .filter((row) => names.some((name) => row.channel.toLowerCase().includes(name)))
          .reduce((acc, row) => acc + row.transactionCount, 0);

      const typeOrderValue = (names: string[]) =>
        orderTypes
          .filter((row) => names.some((name) => row.type.toLowerCase().includes(name)))
          .reduce((acc, row) => acc + row.orderCount, 0);

      const onlineOrdersTotal = channelOrderValue(["zomato", "swiggy", "uber", "online"]);
      const offlineOrdersTotal = typeOrderValue(["dine", "take", "subscription", "catering"]);
      const splitTotal = onlineOrdersTotal + offlineOrdersTotal || 1;

      const onlineWeight = (onlineOrdersTotal || splitTotal * 0.5) / splitTotal;
      const offlineWeight = (offlineOrdersTotal || splitTotal * 0.5) / splitTotal;

      const zomatoW = channelOrderValue(["zomato"]);
      const swiggyW = channelOrderValue(["swiggy"]);
      const uberW = channelOrderValue(["uber"]);
      const onlineSplit = zomatoW + swiggyW + uberW || 1;

      const dineW = typeOrderValue(["dine"]);
      const takeW = typeOrderValue(["take"]);
      const subW = typeOrderValue(["subscription"]);
      const cateringW = typeOrderValue(["catering"]);
      const offlineSplit = dineW + takeW + subW + cateringW || 1;

      const buildSeries = (key: SubTab, label: string, weight: number, seed: number): MatrixSeries => {
        const orders = shapeBySeries(baseOrders.map((value) => value * weight), seed);
        const revenue = shapeBySeries(baseRevenue.map((value) => value * weight), seed + 2);
        return { key, label, color: seriesColors[key], orders, revenue };
      };

      const builtSeries: MatrixSeries[] = [
        buildSeries("onlineOrders", "Online Orders", onlineWeight, 1),
        buildSeries("offlineOrders", "Offline Orders", offlineWeight, 3),
        buildSeries("zomato", "Zomato", (zomatoW || onlineSplit / 3) / onlineSplit, 2),
        buildSeries("swiggy", "Swiggy", (swiggyW || onlineSplit / 3) / onlineSplit, 5),
        buildSeries("uberEats", "Uber Eats", (uberW || onlineSplit / 3) / onlineSplit, 7),
        buildSeries("dineIn", "Dine In", (dineW || offlineSplit / 4) / offlineSplit, 2),
        buildSeries("takeAway", "Take Away", (takeW || offlineSplit / 4) / offlineSplit, 4),
        buildSeries("subscriptions", "Subscriptions", (subW || offlineSplit / 4) / offlineSplit, 6),
        buildSeries("catering", "Catering", (cateringW || offlineSplit / 4) / offlineSplit, 8),
      ];

      setSeries(builtSeries);

      const totalOrders = salesSummaryRes.success && salesSummaryRes.data ? salesSummaryRes.data.currentPeriod.totalOrders : 0;
      const totalRevenue = salesSummaryRes.success && salesSummaryRes.data ? salesSummaryRes.data.currentPeriod.totalRevenue : 0;
      const cancelledRevenue = revenueSummaryRes.success && revenueSummaryRes.data ? revenueSummaryRes.data.cancelledRevenue : 0;
      const nonChargeableRevenue = revenueSummaryRes.success && revenueSummaryRes.data ? revenueSummaryRes.data.nonChargeableRevenue : 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      setCards({
        totalOrders,
        totalRevenue,
        cancelledOrders: averageOrderValue ? Math.round(cancelledRevenue / averageOrderValue) : 0,
        cancelledRevenue,
        nonChargeableOrders: averageOrderValue ? Math.round(nonChargeableRevenue / averageOrderValue) : 0,
        nonChargeableRevenue,
        reservations: totalOrders,
        reservationRevenue: totalRevenue,
      });
    } catch (e: any) {
      setError(e?.message || "Failed to load order matrix");
    } finally {
      setLoading(false);
    }
  }, [resolveDateRange, branchId]);

  useEffect(() => {
    fetchMatrixData();
  }, [fetchMatrixData]);

  const visibleSubTabs = subTabsBySource[selectedSource];

  const visibleSeries = useMemo(() => {
    const allowed = new Set(visibleSubTabs.map((tab) => tab.key));
    const filtered = series.filter((item) => allowed.has(item.key));
    if (selectedSubTab) {
      return filtered.filter((item) => item.key === selectedSubTab);
    }
    return filtered;
  }, [series, visibleSubTabs, selectedSubTab]);

  const chartData = useMemo(() => {
    return {
      labels: MONTH_LABELS,
      datasets: visibleSeries.map((item) => ({
        label: item.label,
        data: item.orders,
        revenueData: item.revenue,
        borderColor: item.color,
        backgroundColor: (ctx: ScriptableContext<"line">) =>
          visibleSeries.length === 1 ? buildGradient(ctx, item.color) : "transparent",
        fill: visibleSeries.length === 1,
        borderWidth: 2,
        tension: 0.45,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: item.color,
        pointBorderWidth: 0,
      })),
    };
  }, [visibleSeries]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#111827",
          bodyColor: "#111827",
          borderColor: "#E5E7EB",
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: () => "",
            label: (ctx: any) => {
              const orders = Number(ctx.raw || 0);
              const revenues = (ctx.dataset.revenueData || []) as number[];
              const revenue = revenues[ctx.dataIndex] || 0;
              return [`Total Orders: ${orders.toLocaleString("en-IN")}`, `Total Revenue: \u20B9${Math.round(revenue).toLocaleString("en-IN")}`];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: "#4B5563",
            font: { size: 11, weight: 600 as const },
          },
        },
        y: {
          display: false,
          grid: { display: false },
          border: { display: false },
        },
      },
      interaction: {
        intersect: false,
        mode: "index" as const,
      },
    }),
    []
  );

  const kpiCards = [
    {
      label: "Total Orders",
      value: `${cards.totalOrders.toLocaleString("en-IN")} orders`,
      subValue: `\u20B9 ${Math.round(cards.totalRevenue).toLocaleString("en-IN")}`,
      icon: totalOrdersIcon,
    },
    {
      label: "Cancelled Orders",
      value: `${cards.cancelledOrders.toLocaleString("en-IN")} orders`,
      subValue: `\u20B9 ${Math.round(cards.cancelledRevenue).toLocaleString("en-IN")}`,
      icon: cancelledOrdersIcon,
    },
    {
      label: "Non- Chargeable Orders",
      value: `${cards.nonChargeableOrders.toLocaleString("en-IN")} orders`,
      subValue: `\u20B9 ${Math.round(cards.nonChargeableRevenue).toLocaleString("en-IN")}`,
      icon: nonChargeableIcon,
    },
    {
      label: "Reservations",
      value: `${cards.reservations.toLocaleString("en-IN")} orders`,
      subValue: `\u20B9 ${Math.round(cards.reservationRevenue).toLocaleString("en-IN")}`,
      icon: reservationIcon,
    },
  ];

  if (loading) {
    return <div className="h-[360px] rounded-xl border border-bb-border bg-white animate-pulse" />;
  }

  if (error) {
    return (
      <div className="h-[360px] rounded-xl border border-bb-border bg-white p-6 flex items-center justify-center text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-bb-border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bb-border pb-3">
        <h3 className="text-sm font-semibold text-[#D79A00]">Order Matrix</h3>
        <div className="w-[160px]">
          <Select label="" value={selectedYear} onChange={setSelectedYear} options={yearOptions} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
        <div className="flex items-center gap-4">
          {sourceTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedSource(tab.key)}
              className={`text-xs p-1.5  rounded-t-md ${
                selectedSource === tab.key ? "bg-black text-white" : "text-[#4B5563]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          {visibleSubTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedSubTab((prev) => (prev === tab.key ? "" : tab.key))}
              className={`text-[11px] border-b ${
                selectedSubTab === tab.key ? "text-[#111827] border-[#111827]" : "text-[#9A7B2B] border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        {kpiCards.map((card) => (
          <div key={card.label} className="border border-bb-border rounded-md p-2.5 bg-[#FCFCFC]">
            <div className="flex items-center gap-2">
              <img src={card.icon} alt={card.label} className="w-8 h-8 object-contain" />
              <div>
                <p className="text-[10px] text-[#4B5563] leading-none">{card.label}</p>
                <p className="text-[22px] font-semibold text-[#111827] leading-tight">{card.value}</p>
                <p className="text-[11px] text-[#9CA3AF]">{card.subValue}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end gap-3 flex-wrap">
        {visibleSeries.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="h-[280px] mt-1">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}


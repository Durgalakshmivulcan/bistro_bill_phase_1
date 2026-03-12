import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import StatCard from "../components/Cards/StatCard";
import DateRangePicker from "../components/form/DateRangePicker";
import WelcomeAboardModal from "../components/Dashboardmodals/welcomeaboardmodal";
import WalkthroughModal from "../components/Dashboardmodals/walkthroughmodal";
import FinishedModal from "../components/Dashboardmodals/finishedmodal";
import Select from "../components/form/Select";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import { ErrorDisplay } from "../components/Common/ErrorDisplay";
import { KPICardsSkeleton, TableSkeleton, AverageValuesSkeleton } from "../components/Common/SkeletonLoader";
import { useWebSocket } from "../hooks/useWebSocket";
import { WebSocketEventType } from "../types/websocket.types";
import type { PaymentReceivedPayload, DashboardMetricsUpdatedPayload } from "../types/websocket.types";
import ConnectionStatus from "../components/Common/ConnectionStatus";
import { getRevenueSummary, getRevenueByType, getAverageValues, type RevenueSummaryResponse, type RevenueByTypeResponse } from "../services/dashboardService";
import { getBranches, type Branch } from "../services/branchService";
import { useBranch } from "../contexts/BranchContext";
import { getSalesByOrderType, getSalesSummary, getSalesSummaryByChannel } from "../services/reportsService";
import totalRevenueIcon from "../assets/imgs/bodashboard/totalrevenue.png";
import givenDiscountIcon from "../assets/imgs/bodashboard/givendiscountamount.png";
import chargesCollectedIcon from "../assets/imgs/bodashboard/chargescollected.png";
import nonChargeableIcon from "../assets/imgs/bodashboard/nonchargableordersrevenue.png";
import cancelledIcon from "../assets/imgs/bodashboard/cancelledordersrevenue.png";
import takeAwayIcon from "../assets/imgs/bodashboard/takeawayrevenue.png";
import dineInIcon from "../assets/imgs/bodashboard/dineinrevenue.png";
import subscriptionIcon from "../assets/imgs/bodashboard/subscriptionrevenue.png";
import cateringIcon from "../assets/imgs/bodashboard/cateringrevenue.png";
import swiggyIcon from "../assets/imgs/bodashboard/swiggyrevenue.png";
import zomatoIcon from "../assets/imgs/bodashboard/zomatorevenue.png";
import uberEatsIcon from "../assets/imgs/bodashboard/ubereatsrevenue.png";
import netRevenueIcon from "../assets/imgs/bodashboard/netrevenue.png";

// Lazy load heavy chart and table components
const OrderMatrix = lazy(() => import("../components/Charts/OrderMatrix"));
const ProductRankingTable = lazy(() => import("../components/Tables/ProductTable"));
const NetRevenueByPaymentMode = lazy(() => import("../components/Tables/NetRevenueByPaymentMode"));
const BrandRankingTable = lazy(() => import("../components/Tables/BrandRankingTable"));
const BranchRankingTable = lazy(() => import("../components/Tables/BranchRankingTable"));
const GoogleReviewsWidget = lazy(() => import("../components/Dashboard/GoogleReviewsWidget"));

type AverageMetric = {
  key: string;
  label: string;
  value: number;
  display: string;
};

const BODashboard = () => {
  const { accessLevel } = useBranch();
  const isFranchiseAdmin = accessLevel === 'franchise_admin';
  // Helper function to get default date range (last 30 days)
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const defaultRange = getDefaultDateRange();

  // Filter state
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [showFinished, setShowFinished] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));

  // WebSocket for real-time updates
  const { status: wsStatus, retryCount: wsRetryCount, lastConnectedAt: wsLastConnected, subscribe } = useWebSocket();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Modal state
  const [showWelcome, setShowWelcome] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  // Revenue data state
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummaryResponse | null>(null);
  const [revenueByType, setRevenueByType] = useState<RevenueByTypeResponse | null>(null);
  const [averageMetrics, setAverageMetrics] = useState<AverageMetric[]>([]);
  const [averageFilter, setAverageFilter] = useState<"day" | "week" | "month" | "year">("day");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [averageValuesLoading, setAverageValuesLoading] = useState(false);
  const [averageValuesError, setAverageValuesError] = useState<string | null>(null);

  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      const response = await getBranches({ status: 'Active' });

      if (response.success && response.data) {
        setBranches(response.data.branches);
      }
    } catch (err) {
      console.error("Error fetching branches:", err);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchRevenueData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both revenue summary and revenue by type in parallel
      const [summaryResponse, typeResponse] = await Promise.all([
        getRevenueSummary(startDate || undefined, endDate || undefined, branchId),
        getRevenueByType(startDate || undefined, endDate || undefined, branchId),
      ]);

      if (summaryResponse.success && summaryResponse.data) {
        setRevenueSummary(summaryResponse.data);
      } else {
        setError(summaryResponse.error?.message || "Failed to fetch revenue summary");
      }

      if (typeResponse.success && typeResponse.data) {
        setRevenueByType(typeResponse.data);
      } else {
        setError(typeResponse.error?.message || "Failed to fetch revenue by type");
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError("An unexpected error occurred while fetching revenue data");
      console.error("Error fetching revenue data:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, branchId]);

  const yearOptions = Array.from({ length: 6 }, (_, index) => {
    const year = new Date().getFullYear() - index;
    return { label: String(year), value: String(year) };
  });

  const formatCurrency = (value?: number) =>
    `\u20B9 ${(value || 0).toLocaleString("en-IN")}`;

  const fetchAverageValues = useCallback(async () => {
    try {
      setAverageValuesLoading(true);
      setAverageValuesError(null);

      const effectiveEnd = endDate || new Date().toISOString().split("T")[0];
      const end = new Date(effectiveEnd);
      const start = new Date(end);
      if (averageFilter === "week") start.setDate(end.getDate() - 6);
      if (averageFilter === "month") start.setDate(end.getDate() - 29);
      if (averageFilter === "year") start.setFullYear(end.getFullYear() - 1);

      const filterStart = averageFilter === "day" ? effectiveEnd : start.toISOString().split("T")[0];
      const filterEnd = effectiveEnd;

      const [avgRes, summaryRes, orderTypeRes, channelRes] = await Promise.all([
        getAverageValues(filterStart, filterEnd, branchId),
        getSalesSummary(filterStart, filterEnd, branchId),
        getSalesByOrderType(filterStart, filterEnd, branchId),
        getSalesSummaryByChannel(filterStart, filterEnd, branchId),
      ]);

      if (!avgRes.success || !avgRes.data) {
        setAverageValuesError(avgRes.error?.message || "Failed to fetch average values");
        return;
      }

      const periodCount = averageFilter === "day" ? 1 : averageFilter === "week" ? 7 : averageFilter === "month" ? 30 : 365;
      const totalOrders = summaryRes.success && summaryRes.data ? summaryRes.data.currentPeriod.totalOrders : 0;
      const avgOrderValue = summaryRes.success && summaryRes.data ? summaryRes.data.currentPeriod.avgOrderValue : 0;

      const orderTypes = orderTypeRes.success && orderTypeRes.data ? orderTypeRes.data.breakdown : [];
      const channels = channelRes.success && channelRes.data ? channelRes.data.byChannel : [];

      const getTypeOrders = (keys: string[]) =>
        orderTypes
          .filter((row) => keys.some((key) => row.type.toLowerCase().includes(key)))
          .reduce((sum, row) => sum + row.orderCount, 0);

      const getChannelOrders = (keys: string[]) =>
        channels
          .filter((row) => keys.some((key) => row.channel.toLowerCase().includes(key)))
          .reduce((sum, row) => sum + row.transactionCount, 0);

      const zomatoOrders = getChannelOrders(["zomato"]);
      const swiggyOrders = getChannelOrders(["swiggy"]);
      const uberOrders = getChannelOrders(["uber"]);
      const subscriptionOrders = getTypeOrders(["subscription"]);
      const reservationOrders = getTypeOrders(["reservation"]);
      const dineInOrders = getTypeOrders(["dine"]);
      const takeAwayOrders = getTypeOrders(["take"]);

      const metrics: AverageMetric[] = [
        {
          key: "zomato",
          label: "Average Zomato Orders Count",
          value: Math.round(zomatoOrders / periodCount),
          display: Math.round(zomatoOrders / periodCount).toLocaleString("en-IN"),
        },
        {
          key: "swiggy",
          label: "Average Swiggy Orders Count",
          value: Math.round(swiggyOrders / periodCount),
          display: Math.round(swiggyOrders / periodCount).toLocaleString("en-IN"),
        },
        {
          key: "uber",
          label: "Average Uber Eats Orders Count",
          value: Math.round(uberOrders / periodCount),
          display: Math.round(uberOrders / periodCount).toLocaleString("en-IN"),
        },
        {
          key: "revenue-per-customer",
          label: "Average Revenue Per Customer",
          value: Math.round(avgOrderValue),
          display: `\u20B9 ${Math.round(avgOrderValue).toLocaleString("en-IN")}`,
        },
        {
          key: "delivery-time",
          label: "Average Order Delivery Time",
          value: Math.round(avgRes.data.avgDelivery),
          display: `${Math.round(avgRes.data.avgDelivery).toLocaleString("en-IN")} Mins`,
        },
        {
          key: "orders",
          label: "Average Orders Count",
          value: Math.round(totalOrders / periodCount),
          display: Math.round(totalOrders / periodCount).toLocaleString("en-IN"),
        },
        {
          key: "subscription",
          label: "Average Subscription Orders Count",
          value: Math.round(subscriptionOrders / periodCount),
          display: Math.round(subscriptionOrders / periodCount).toLocaleString("en-IN"),
        },
        {
          key: "reservation",
          label: "Average Reservations Count",
          value: Math.round(reservationOrders / periodCount),
          display: Math.round(reservationOrders / periodCount).toLocaleString("en-IN"),
        },
        {
          key: "dine-in",
          label: "Average Dine In Orders Count",
          value: Math.round(dineInOrders / periodCount),
          display: Math.round(dineInOrders / periodCount).toLocaleString("en-IN"),
        },
        {
          key: "take-away",
          label: "Average Take Away Orders Count",
          value: Math.round(takeAwayOrders / periodCount),
          display: Math.round(takeAwayOrders / periodCount).toLocaleString("en-IN"),
        },
      ];

      setAverageMetrics(metrics);
    } catch (err) {
      setAverageValuesError("An unexpected error occurred while fetching average values");
      console.error("Error fetching average values:", err);
    } finally {
      setAverageValuesLoading(false);
    }
  }, [endDate, branchId, averageFilter]);

  useEffect(() => {
    setShowWelcome(true);
    fetchBranches();
  }, []);

  // Fetch revenue data when component mounts or filters change
  useEffect(() => {
    fetchRevenueData();
    fetchAverageValues();
  }, [fetchRevenueData, fetchAverageValues]);

  const handleYearFilterChange = (year: string) => {
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    setSelectedYear(year);
    setStartDate(start);
    setEndDate(end);
  };

  // Subscribe to WebSocket events for real-time dashboard updates
  useEffect(() => {
    const unsubPayment = subscribe<PaymentReceivedPayload>(
      WebSocketEventType.PAYMENT_RECEIVED,
      (data) => {
        // Update the total revenue card with live data
        setRevenueSummary((prev) => {
          if (!prev) return prev;
          return { ...prev, totalRevenue: data.todayRevenue };
        });
        setLastUpdated(new Date());
      }
    );

    const unsubMetrics = subscribe<DashboardMetricsUpdatedPayload>(
      WebSocketEventType.DASHBOARD_METRICS_UPDATED,
      () => {
        // Full refresh when metrics are updated (order created/completed)
        fetchRevenueData();
        fetchAverageValues();
      }
    );

    return () => {
      unsubPayment();
      unsubMetrics();
    };
  }, [subscribe, fetchRevenueData, fetchAverageValues]);

  // Map API response to KPI card format
  const getRevenueStatsCards = () => {
    if (!revenueSummary || !revenueByType) return [];

    const dynamicRevenueByType = revenueByType as RevenueByTypeResponse & {
      swiggyRevenue?: number;
      zomatoRevenue?: number;
      uberEatsRevenue?: number;
      netRevenue?: number;
    };

    const netRevenue =
      dynamicRevenueByType.netRevenue ??
      (revenueSummary.totalRevenue -
        revenueSummary.discountAmount -
        revenueSummary.cancelledRevenue -
        revenueSummary.nonChargeableRevenue);

    return [
      {
        id: 1,
        title: "Total Revenue",
        value: formatCurrency(revenueSummary.totalRevenue),
        icon: <img src={totalRevenueIcon} alt="Total Revenue" className="w-20 h-20 object-contain" />,
      },
      {
        id: 2,
        title: "Given Discount Amount",
        value: formatCurrency(revenueSummary.discountAmount),
        icon: <img src={givenDiscountIcon} alt="Given Discount Amount" className="w-20 h-20 object-contain" />,
      },
      {
        id: 3,
        title: "Charges Collected",
        value: formatCurrency(revenueSummary.chargesCollected),
        icon: <img src={chargesCollectedIcon} alt="Charges Collected" className="w-20 h-20 object-contain" />,
      },
      {
        id: 4,
        title: "Non-Chargeable Orders Revenue",
        value: formatCurrency(revenueSummary.nonChargeableRevenue),
        icon: <img src={nonChargeableIcon} alt="Non-Chargeable Orders Revenue" className="w-20 h-20 object-contain" />,
      },
      {
        id: 5,
        title: "Cancelled Orders Revenue",
        value: formatCurrency(revenueSummary.cancelledRevenue),
        icon: <img src={cancelledIcon} alt="Cancelled Orders Revenue" className="w-20 h-20 object-contain" />,
      },
      {
        id: 6,
        title: "Take Away Revenue",
        value: formatCurrency(revenueByType.takeAwayRevenue),
        icon: <img src={takeAwayIcon} alt="Take Away Revenue" className="w-20 h-20 object-contain" />,
      },
      {
        id: 7,
        title: "Dine In Revenue",
        value: formatCurrency(revenueByType.dineInRevenue),
        icon: <img src={dineInIcon} alt="Dine In Revenue" className="w-20 h-20 object-contain" />,
      },
      {
        id: 8,
        title: "Subscriptions Revenue",
        value: formatCurrency(revenueByType.subscriptionRevenue),
        icon: <img src={subscriptionIcon} alt="Subscriptions Revenue" className="w-20 h-20 object-contain" />,
      },
      {
        id: 9,
        title: "Catering Revenue",
        value: formatCurrency(revenueByType.cateringRevenue),
        icon: <img src={cateringIcon} alt="Catering Revenue" className="w-20 h-20 object-contain" />,
      },
      {
        id: 10,
        title: "Swiggy Revenue",
        value: formatCurrency(dynamicRevenueByType.swiggyRevenue),
        icon: <img src={swiggyIcon} alt="Swiggy Revenue" className="w-20 h-20 object-contain" />,
      },
      {
        id: 11,
        title: "Zomato Revenue",
        value: formatCurrency(dynamicRevenueByType.zomatoRevenue),
        icon: <img src={zomatoIcon} alt="Zomato Revenue" className="w-20 h-20 object-contain" />,
      },
      {
        id: 12,
        title: "Uber Eats Revenue",
        value: formatCurrency(dynamicRevenueByType.uberEatsRevenue),
        icon: <img src={uberEatsIcon} alt="Uber Eats Revenue" className="w-20 h-20 object-contain" />,
      },
      {
        id: 13,
        title: "Net Revenue",
        value: formatCurrency(netRevenue),
        icon: <img src={netRevenueIcon} alt="Net Revenue" className="w-20 h-20 object-contain" />,
      },
    ];
  };

  return (
    <DashboardLayout>
      <WelcomeAboardModal
  open={showWelcome}
  onClose={() => setShowWelcome(false)}
  onStartWalkthrough={() => {
    setShowWelcome(false);
    setShowWalkthrough(true);
  }}
/>


   <WalkthroughModal
  open={showWalkthrough}
  onClose={() => setShowWalkthrough(false)}
  onBackToWelcome={() => {
    setShowWalkthrough(false);
    setShowWelcome(true); // 👈 THIS shows welcome again
  }}
  onFinished={() => {
    setShowWalkthrough(false);
    setShowFinished(true);
  }}
/>


      <FinishedModal
        open={showFinished}
        onClose={() => setShowFinished(false)}
      />


      <div className="bg-bb-bg min-h-screen p-4 sm:p-6 space-y-6">
        {/* ================= SUMMARY BAR ================= */}
        <div className="bg-[#FFFDF5] rounded-xl p-4 flex flex-col gap-4">
          {/* ROW 1 */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* LEFT */}
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-lg sm:text-xl font-semibold text-bb-text">
                {isFranchiseAdmin && !branchId ? 'All Locations Summary' : 'Summary'}
              </h1>

              {/* LIVE STATUS INDICATOR */}
              <ConnectionStatus
                status={wsStatus}
                lastUpdateTime={wsLastConnected}
                retryCount={wsRetryCount}
              />

              {/* Last Updated Indicator */}
              {lastUpdated && (
                <span className="text-xs text-bb-textSoft">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          {/* ROW 2 */}
          <div className="flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-end gap-3">
            {/* FILTER BY BRANCH */}
            <div className="w-full sm:w-52">
              <Select
                label=""
                value={branchId || "all"}
                onChange={(value) => {
                  setBranchId(value === "all" ? undefined : value);
                }}
                options={[
                  { label: "All Branches", value: "all" },
                  ...branches.map((branch) => ({
                    label: branch.name,
                    value: branch.id,
                  })),
                ]}
                disabled={branchesLoading}
              />
            </div>

            {/* DATE RANGE */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onApply={(start, end) => {
                setStartDate(start);
                setEndDate(end);
                setSelectedYear(new Date(start).getFullYear().toString());
              }}
            />
            <button
              onClick={() => {
                const defaultRange = getDefaultDateRange();
                setStartDate(defaultRange.startDate);
                setEndDate(defaultRange.endDate);
                setBranchId(undefined);
                setSelectedYear(String(new Date().getFullYear()));
              }}
              className="flex items-center gap-2 border border-bb-border rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50 transition-colors"
            >
              <i className="bi bi-x-circle text-bb-textSoft" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* ================= REVENUE STATS ================= */}
        <section className="bg-bb-bg rounded-xl shadow-bb-card p-4 border border-bb-border">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-sm font-semibold text-bb-text">Revenue Statistics</h2>
            <div className="w-[150px]">
              <Select
                label=""
                value={selectedYear}
                onChange={handleYearFilterChange}
                options={yearOptions}
              />
            </div>
          </div>

          {/* Loading State - Skeleton */}
          {loading && <KPICardsSkeleton />}

          {/* Error State */}
          {!loading && error && (
            <ErrorDisplay
              message={error}
              onRetry={fetchRevenueData}
              variant="card"
              size="medium"
            />
          )}

          {/* Empty State */}
          {!loading && !error && (!revenueSummary || !revenueByType) && (
            <div className="text-center py-12">
              <p className="text-bb-textSoft text-lg">No revenue data available</p>
              <p className="text-bb-textSoft text-sm mt-2">Try adjusting your date range or filters</p>
            </div>
          )}

          {/* Data Display */}
          {!loading && !error && revenueSummary && revenueByType && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getRevenueStatsCards().map((item) => (
                <StatCard
                  key={item.id}
                  title={item.title}
                  value={item.value}
                  icon={item.icon}
                />
              ))}
            </div>
          )}
        </section>

        {/* ================= ORDER MATRIX ================= */}
        <section className="bg-bb-bg rounded-xl shadow-bb-card p-4 border border-bb-border">
          <div className="w-full overflow-x-auto">
            <Suspense fallback={<div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" />}>
              <OrderMatrix startDate={startDate} endDate={endDate} branchId={branchId} />
            </Suspense>
          </div>
        </section>
        {/* ================= AVERAGE VALUES ================= */}
        <section className="bg-bb-bg rounded-xl shadow-bb-card p-4 border border-bb-border">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-[30px] leading-none font-semibold text-[#D79A00]">Average Values</h2>
            <div className="w-[170px]">
              <Select
                label=""
                value={averageFilter}
                onChange={(value) => setAverageFilter(value as "day" | "week" | "month" | "year")}
                options={[
                  { label: "Filter By Day", value: "day" },
                  { label: "Filter By Week", value: "week" },
                  { label: "Filter By Month", value: "month" },
                  { label: "Filter By Year", value: "year" },
                ]}
              />
            </div>
          </div>

          {averageValuesLoading && <AverageValuesSkeleton />}

          {!averageValuesLoading && averageValuesError && (
            <ErrorDisplay
              message={averageValuesError}
              onRetry={fetchAverageValues}
              variant="card"
              size="small"
            />
          )}

          {!averageValuesLoading && !averageValuesError && averageMetrics.length === 0 && (
            <div className="text-center py-8">
              <p className="text-bb-textSoft text-sm">No average values data available</p>
            </div>
          )}

          {!averageValuesLoading && !averageValuesError && averageMetrics.length > 0 && (
            <div className="space-y-5">
              {averageMetrics.map((item) => {
                const maxValue = Math.max(...averageMetrics.map((metric) => metric.value), 1);
                const percentage = Math.max(2, Math.min(100, (item.value / maxValue) * 100));

                return (
                  <div key={item.key}>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-[#4B5563]">{item.label}</span>
                      <span className="font-medium text-[#1F2937]">{item.display}</span>
                    </div>

                    <div className="h-4 bg-[#E5E7EB] rounded-[4px] overflow-hidden">
                      <div
                        className="h-full rounded-[4px] transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: "#A88A2D",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        {/* ================= TABLES GRID ================= */}
        <section className="border border-[#E8DFCC] rounded-md overflow-hidden bg-[#FFFEFA]">
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#E8DFCC]">
            <div className="p-4">
              <Suspense fallback={<TableSkeleton rows={6} />}>
                <ProductRankingTable
                  startDate={startDate}
                  endDate={endDate}
                  branchId={branchId}
                />
              </Suspense>
            </div>

            <div className="p-4">
              <Suspense fallback={<TableSkeleton rows={6} />}>
                <NetRevenueByPaymentMode
                  startDate={startDate}
                  endDate={endDate}
                  branchId={branchId}
                />
              </Suspense>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#E8DFCC] border-t border-[#E8DFCC]">
            <div className="p-4">
              <Suspense fallback={<TableSkeleton rows={6} />}>
                <BrandRankingTable
                  startDate={startDate}
                  endDate={endDate}
                  branchId={branchId}
                />
              </Suspense>
            </div>

            <div className="p-4">
              <Suspense fallback={<TableSkeleton rows={6} />}>
                <BranchRankingTable
                  startDate={startDate}
                  endDate={endDate}
                />
              </Suspense>
            </div>
          </div>
        </section>

        {/* ================= GOOGLE REVIEWS ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Suspense fallback={<div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" />}>
            <GoogleReviewsWidget />
          </Suspense>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BODashboard;


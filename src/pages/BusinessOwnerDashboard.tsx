import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import StatCard from "../components/Cards/StatCard";
import SectionHeader from "../components/Common/SectionHeader";
import DateRangePicker from "../components/form/DateRangePicker";
import WelcomeAboardModal from "../components/Dashboardmodals/welcomeaboardmodal";
import WalkthroughModal from "../components/Dashboardmodals/walkthroughmodal";
import Select from "../components/form/Select";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import { ErrorDisplay } from "../components/Common/ErrorDisplay";
import { KPICardsSkeleton, TableSkeleton, AverageValuesSkeleton } from "../components/Common/SkeletonLoader";
import { useWebSocket } from "../hooks/useWebSocket";
import { WebSocketEventType } from "../types/websocket.types";
import type { PaymentReceivedPayload, DashboardMetricsUpdatedPayload } from "../types/websocket.types";
import ConnectionStatus from "../components/Common/ConnectionStatus";
import { getRevenueSummary, getRevenueByType, getAverageValues, type RevenueSummaryResponse, type RevenueByTypeResponse, type AverageValuesResponse } from "../services/dashboardService";
import { getBranches, type Branch } from "../services/branchService";
import { useBranch } from "../contexts/BranchContext";

// Lazy load heavy chart and table components
const LineChartPlaceholder = lazy(() => import("../components/Charts/LineChartPlaceholder"));
const ProductRankingTable = lazy(() => import("../components/Tables/ProductTable"));
const NetRevenueByPaymentMode = lazy(() => import("../components/Tables/NetRevenueByPaymentMode"));
const BrandRankingTable = lazy(() => import("../components/Tables/BrandRankingTable"));
const BranchRankingTable = lazy(() => import("../components/Tables/BranchRankingTable"));
const GoogleReviewsWidget = lazy(() => import("../components/Dashboard/GoogleReviewsWidget"));

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

  // WebSocket for real-time updates
  const { status: wsStatus, retryCount: wsRetryCount, lastConnectedAt: wsLastConnected, subscribe } = useWebSocket();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Modal state
  const [showWelcome, setShowWelcome] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  // Revenue data state
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummaryResponse | null>(null);
  const [revenueByType, setRevenueByType] = useState<RevenueByTypeResponse | null>(null);
  const [averageValues, setAverageValues] = useState<AverageValuesResponse | null>(null);
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

  const fetchAverageValues = useCallback(async () => {
    try {
      setAverageValuesLoading(true);
      setAverageValuesError(null);

      const response = await getAverageValues(
        startDate || undefined,
        endDate || undefined,
        branchId
      );

      if (response.success && response.data) {
        setAverageValues(response.data);
      } else {
        setAverageValuesError(response.error?.message || "Failed to fetch average values");
      }
    } catch (err) {
      setAverageValuesError("An unexpected error occurred while fetching average values");
      console.error("Error fetching average values:", err);
    } finally {
      setAverageValuesLoading(false);
    }
  }, [startDate, endDate, branchId]);

  useEffect(() => {
    setShowWelcome(true);
    fetchBranches();
  }, []);

  // Fetch revenue data when component mounts or filters change
  useEffect(() => {
    fetchRevenueData();
    fetchAverageValues();
  }, [fetchRevenueData, fetchAverageValues]);

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

    return [
      {
        id: 1,
        title: "Total Revenue",
        value: `₹ ${revenueSummary.totalRevenue.toLocaleString('en-IN')}`,
        icon: "💰",
        iconBg: "bg-purple-100",
      },
      {
        id: 2,
        title: "Given Discount Amount",
        value: `₹ ${revenueSummary.discountAmount.toLocaleString('en-IN')}`,
        icon: "✂️",
        iconBg: "bg-green-100",
      },
      {
        id: 3,
        title: "Charges Collected",
        value: `₹ ${revenueSummary.chargesCollected.toLocaleString('en-IN')}`,
        icon: "💳",
        iconBg: "bg-indigo-100",
      },
      {
        id: 4,
        title: "Non-Chargeable Orders Revenue",
        value: `₹ ${revenueSummary.nonChargeableRevenue.toLocaleString('en-IN')}`,
        icon: "🧾",
        iconBg: "bg-orange-100",
      },
      {
        id: 5,
        title: "Cancelled Orders Revenue",
        value: `₹ ${revenueSummary.cancelledRevenue.toLocaleString('en-IN')}`,
        icon: "❌",
        iconBg: "bg-gray-100",
      },
      {
        id: 6,
        title: "Take Away Revenue",
        value: `₹ ${revenueByType.takeAwayRevenue.toLocaleString('en-IN')}`,
        icon: "🍔",
        iconBg: "bg-yellow-100",
      },
      {
        id: 7,
        title: "Dine In Revenue",
        value: `₹ ${revenueByType.dineInRevenue.toLocaleString('en-IN')}`,
        icon: "🍽️",
        iconBg: "bg-blue-100",
      },
      {
        id: 8,
        title: "Subscriptions Revenue",
        value: `₹ ${revenueByType.subscriptionRevenue.toLocaleString('en-IN')}`,
        icon: "🎫",
        iconBg: "bg-pink-100",
      },
    ];
  };

  return (
    <DashboardLayout>
    <WelcomeAboardModal
        open={showWelcome}
        onClose={() => setShowWelcome(false)}
        onStartWalkthrough={() => {
          setShowWelcome(false);     // close welcome
          setShowWalkthrough(true); // open walkthrough
        }}
      />

         <WalkthroughModal
        open={showWalkthrough}
        onClose={() => setShowWalkthrough(false)}
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
              }}
            />
            <button
              onClick={() => {
                const defaultRange = getDefaultDateRange();
                setStartDate(defaultRange.startDate);
                setEndDate(defaultRange.endDate);
                setBranchId(undefined);
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
          <SectionHeader title="Revenue Statistics" />

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
                  iconBg={item.iconBg}
                />
              ))}
            </div>
          )}
        </section>

        {/* ================= ORDER METRICS ================= */}
        <section className="bg-bb-bg rounded-xl shadow-bb-card p-4 border border-bb-border">
          <SectionHeader title="Order Metrics" />
          <div className="w-full overflow-x-auto">
            <Suspense fallback={<div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" />}>
              <LineChartPlaceholder startDate={startDate} endDate={endDate} branchId={branchId} />
            </Suspense>
          </div>
        </section>

        {/* ================= AVERAGE VALUES ================= */}
        <section className="bg-bb-bg rounded-xl shadow-bb-card p-4 border border-bb-border">
          <SectionHeader title="Average Values" />

          {/* Loading State - Skeleton */}
          {averageValuesLoading && <AverageValuesSkeleton />}

          {/* Error State */}
          {!averageValuesLoading && averageValuesError && (
            <ErrorDisplay
              message={averageValuesError}
              onRetry={fetchAverageValues}
              variant="card"
              size="small"
            />
          )}

          {/* Empty State */}
          {!averageValuesLoading && !averageValuesError && !averageValues && (
            <div className="text-center py-8">
              <p className="text-bb-textSoft text-sm">No average values data available</p>
            </div>
          )}

          {/* Data Display */}
          {!averageValuesLoading && !averageValuesError && averageValues && (
            <div className="space-y-4">
              {[
                { label: "Average Online Order Cost", value: averageValues.avgOnline },
                { label: "Average Offline Order Cost", value: averageValues.avgOffline },
                { label: "Average Delivery Cost", value: averageValues.avgDelivery },
                { label: "Average Discount per Order", value: averageValues.avgDiscount },
                { label: "Average Tax per Order", value: averageValues.avgTax },
              ].map((item) => {
                // Calculate max value for percentage bar (use the highest average)
                const maxValue = Math.max(
                  averageValues.avgOnline,
                  averageValues.avgOffline,
                  averageValues.avgDelivery,
                  averageValues.avgDiscount,
                  averageValues.avgTax
                );
                const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs sm:text-sm mb-1 text-bb-textSoft">
                      <span>{item.label}</span>
                      <span>₹ {item.value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>

                    <div className="h-2 bg-bb-bgSoft rounded-full">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: "#987820",
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="overflow-x-auto bg-bb-bg rounded-xl shadow-bb-card border border-bb-border">
            <Suspense fallback={<TableSkeleton rows={5} />}>
              <ProductRankingTable
                startDate={startDate}
                endDate={endDate}
                branchId={branchId}
              />
            </Suspense>
          </div>

          <div className="overflow-x-auto bg-bb-bg rounded-xl shadow-bb-card border border-bb-border">
            <Suspense fallback={<TableSkeleton rows={5} />}>
              <NetRevenueByPaymentMode
                startDate={startDate}
                endDate={endDate}
                branchId={branchId}
              />
            </Suspense>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="overflow-x-auto bg-bb-bg rounded-xl shadow-bb-card border border-bb-border">
            <Suspense fallback={<TableSkeleton rows={5} />}>
              <BrandRankingTable
                startDate={startDate}
                endDate={endDate}
                branchId={branchId}
              />
            </Suspense>
          </div>

          <div className="overflow-x-auto bg-bb-bg rounded-xl shadow-bb-card border border-bb-border">
            <Suspense fallback={<TableSkeleton rows={5} />}>
              <BranchRankingTable
                startDate={startDate}
                endDate={endDate}
              />
            </Suspense>
          </div>
        </div>

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

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import EarningsChart from "../Charts/EarningsChart";
import SummaryCard from "../Cards/SummaryCard";
import DateRangePicker from "../Common/DateRangePicker/DateRangePicker";
import LoadingSpinner from "../Common/LoadingSpinner";
import ErrorDisplay from "../Common/ErrorDisplay";
import {
  getSuperAdminDashboardStats,
  getSuperAdminDashboardStatsByDate,
  SuperAdminDashboardStats,
  getMonthlyStats,
  MonthlyStatsResponse,
  getTopRestaurants,
  TopRestaurant,
} from "../../services/superAdminService";
import totalRestaurantIcon from "../../assets/sadashboard/totalrestaurent.png";
import totalEarningsIcon from "../../assets/sadashboard/totalearnings.png";
import totalNewRequestIcon from "../../assets/sadashboard/totalnewrequest.png";
import totalNewContactsIcon from "../../assets/sadashboard/totalnewcontacts.png";
import totalClosedWinsIcon from "../../assets/sadashboard/totalclosedwins.png";
import totalClosedLossesIcon from "../../assets/sadashboard/totalclosedlosses.png";
import takenSubIcon from "../../assets/sadashboard/takensub.png";
import activeSubIcon from "../../assets/sadashboard/activesub.png";
import inactiveSubIcon from "../../assets/sadashboard/inactivesub.png";
import openLeadsIcon from "../../assets/sadashboard/openleads.png";
import initialContactIcon from "../../assets/sadashboard/initialcontact.png";
import demoScheduleIcon from "../../assets/sadashboard/demoschedule.png";
import completedIcon from "../../assets/sadashboard/completed.png";

export default function DashboardSummaryPage() {
  const [stats, setStats] = useState<SuperAdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const today = new Date();
    return { start: today, end: today };
  });

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [monthlyData, setMonthlyData] = useState<MonthlyStatsResponse>({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    earnings: Array(12).fill(0),
    users: Array(12).fill(0),
  });
  const [topRestaurants, setTopRestaurants] = useState<TopRestaurant[]>([]);

  const formatDateForApi = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchMonthlyData = useCallback(async (year: number) => {
    try {
      const response = await getMonthlyStats(year);
      if (response.success && response.data) {
        setMonthlyData(response.data);
      }
    } catch {
      // Non-critical for page
    }
  }, []);

  useEffect(() => {
    const year = selectedYear ? Number(selectedYear) : currentYear;
    fetchMonthlyData(year);
  }, [selectedYear, currentYear, fetchMonthlyData]);

  const fetchDashboardStats = useCallback(
    async (range?: { start: Date; end: Date }) => {
      try {
        setLoading(true);
        setError(null);

        const response = range
          ? await getSuperAdminDashboardStatsByDate({
              startDate: formatDateForApi(range.start),
              endDate: formatDateForApi(range.end),
            })
          : await getSuperAdminDashboardStats();

        if (response.success && response.data) {
          setStats(response.data);
        } else {
          setError(response.error?.message || "Failed to load dashboard statistics");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchTopRestaurants = async () => {
    try {
      const response = await getTopRestaurants();
      if (response.success && response.data) {
        setTopRestaurants(response.data.restaurants);
      }
    } catch {
      // Non-critical for page
    }
  };

  useEffect(() => {
    fetchDashboardStats(dateRange);
    fetchTopRestaurants();
  }, [fetchDashboardStats]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year || String(currentYear));
  };

  const formatRangeLabel = (range: { start: Date; end: Date }) =>
    `${range.start.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })} - ${range.end.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })}`;

  const getSummaryCards = () => {
    if (!stats) return [];
    return [
      { title: "Total Restaurants", value: stats.totalBusinessOwners, icon: totalRestaurantIcon },
      { title: "Total Earnings", value: stats.totalRevenue, icon: totalEarningsIcon },
      { title: "Total New Requests", value: stats.leadsByStage.NewRequest, icon: totalNewRequestIcon },
      { title: "Total New Contacts", value: stats.leadsByStage.InitialContacted, icon: totalNewContactsIcon },
      { title: "Total Closed Wins", value: stats.leadsByStage.ClosedWin, icon: totalClosedWinsIcon },
      { title: "Total Closed Losses", value: stats.leadsByStage.ClosedLoss, icon: totalClosedLossesIcon },
    ];
  };

  const getSubscriptionCards = () => {
    if (!stats) return [];
    const inactive = stats.totalBusinessOwners - stats.activeBusinessOwners;
    return [
      { title: "Taken Subscriptions", value: stats.totalBusinessOwners, icon: takenSubIcon },
      { title: "Active Subscriptions", value: stats.activeBusinessOwners, icon: activeSubIcon },
      { title: "Inactive Subscriptions", value: inactive, icon: inactiveSubIcon },
    ];
  };

  const getLeadsCards = () => {
    if (!stats) return [];
    return [
      { title: "Open Leads", value: stats.leadsByStage.NewRequest, icon: openLeadsIcon },
      { title: "Initial Contacted", value: stats.leadsByStage.InitialContacted, icon: initialContactIcon },
      { title: "Demo Scheduled", value: stats.leadsByStage.ScheduledDemo, icon: demoScheduleIcon },
      { title: "Completed", value: stats.leadsByStage.Completed, icon: completedIcon },
    ];
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="bg-bb-bg min-h-screen p-6 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading dashboard statistics..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-bb-bg min-h-screen p-6">
          <ErrorDisplay
            variant="card"
            size="medium"
            message={error}
            onRetry={() => fetchDashboardStats(dateRange)}
          />
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="bg-bb-bg min-h-screen p-6 flex items-center justify-center">
          <p className="text-bb-textSoft">No dashboard data available</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-bb-bg min-h-screen p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-bold">Dashboard Summary</h1>
          <DateRangePicker
            value={formatRangeLabel(dateRange)}
            onApply={(range) => {
              setDateRange(range);
              fetchDashboardStats(range);
            }}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-yellow-600 mb-3">Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {getSummaryCards().map((item) => (
              <SummaryCard key={item.title} {...item} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-yellow-600 mb-3">Subscriptions Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {getSubscriptionCards().map((item) => (
              <SummaryCard key={item.title} {...item} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-yellow-600 mb-3">Leads Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {getLeadsCards().map((item) => (
              <SummaryCard key={item.title} {...item} />
            ))}
          </div>
        </div>

        <EarningsChart
          data={monthlyData}
          selectedYear={selectedYear}
          onYearChange={handleYearChange}
        />

        <div className="bg-white shadow-bb-card rounded-xl p-6">
          <h3 className="font-semibold mb-4">Top Restaurants</h3>
          {topRestaurants.length === 0 ? (
            <p className="text-bb-textSoft text-sm">No restaurant data available yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-bb-textSoft">
                    <th className="pb-3 pr-4">Rank</th>
                    <th className="pb-3 pr-4">Restaurant Name</th>
                    <th className="pb-3 pr-4">Owner</th>
                    <th className="pb-3 pr-4 text-right">Revenue</th>
                    <th className="pb-3 pr-4 text-right">Orders</th>
                    <th className="pb-3 pr-4">Plan</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topRestaurants.map((r, idx) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{idx + 1}</td>
                      <td className="py-3 pr-4">{r.restaurantName}</td>
                      <td className="py-3 pr-4">{r.ownerName}</td>
                      <td className="py-3 pr-4 text-right">{formatCurrency(r.totalRevenue)}</td>
                      <td className="py-3 pr-4 text-right">{r.orderCount}</td>
                      <td className="py-3 pr-4">
                        <span className="bg-bb-primary/20 text-bb-text px-2 py-0.5 rounded-full text-xs">
                          {r.plan || "N/A"}
                        </span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            r.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

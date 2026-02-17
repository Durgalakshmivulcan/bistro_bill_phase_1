// src/components/Dashboard/DashboardSummary.tsx

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import EarningsChart from "../Charts/EarningsChart";
import SummaryCard from "../Cards/SummaryCard";
import DateRangePicker from "../Common/DateRangePicker/DateRangePicker";
import LoadingSpinner from "../Common/LoadingSpinner";
import ErrorDisplay from "../Common/ErrorDisplay";
import {
    getSuperAdminDashboardStats,
    SuperAdminDashboardStats,
    getMonthlyStats,
    MonthlyStatsResponse,
    getTopRestaurants,
    TopRestaurant,
} from "../../services/superAdminService";

export default function DashboardSummaryPage() {
    const [stats, setStats] = useState<SuperAdminDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
    const [monthlyData, setMonthlyData] = useState<MonthlyStatsResponse>({
        labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
        earnings: Array(12).fill(0),
        users: Array(12).fill(0),
    });
    const [topRestaurants, setTopRestaurants] = useState<TopRestaurant[]>([]);

    useEffect(() => {
        fetchDashboardStats();
        fetchTopRestaurants();
    }, []);

    const fetchMonthlyData = useCallback(async (year: number) => {
        try {
            const response = await getMonthlyStats(year);
            if (response.success && response.data) {
                setMonthlyData(response.data);
            }
        } catch {
            // Keep existing chart data on error
        }
    }, []);

    useEffect(() => {
        const year = selectedYear ? Number(selectedYear) : currentYear;
        fetchMonthlyData(year);
    }, [selectedYear, currentYear, fetchMonthlyData]);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getSuperAdminDashboardStats();

            if (response.success && response.data) {
                setStats(response.data);
            } else {
                setError(response.error?.message || 'Failed to load dashboard statistics');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    };

    const fetchTopRestaurants = async () => {
        try {
            const response = await getTopRestaurants();
            if (response.success && response.data) {
                setTopRestaurants(response.data.restaurants);
            }
        } catch {
            // Non-critical — leave empty
        }
    };

    const handleYearChange = (year: string) => {
        setSelectedYear(year || String(currentYear));
    };

    // Transform API data to match the UI format
    const getSummaryCards = () => {
        if (!stats) return [];
        return [
            { title: "Total Restaurants", value: stats.totalBusinessOwners, icon: "🍽️" },
            { title: "Total Earnings", value: stats.totalRevenue, icon: "💰" },
            { title: "Total New Requests", value: stats.leadsByStage.NewRequest, icon: "📨" },
            { title: "Total New Contacts", value: stats.leadsByStage.InitialContacted, icon: "👥" },
            { title: "Total Closed Wins", value: stats.leadsByStage.ClosedWin, icon: "🏆" },
            { title: "Total Closed Losses", value: stats.leadsByStage.ClosedLoss, icon: "📉" },
        ];
    };

    const getSubscriptionCards = () => {
        if (!stats) return [];
        const inactive = stats.totalBusinessOwners - stats.activeBusinessOwners;
        return [
            { title: "Taken Subscriptions", value: stats.totalBusinessOwners, icon: "📦" },
            { title: "Active Subscriptions", value: stats.activeBusinessOwners, icon: "✅" },
            { title: "Inactive Subscriptions", value: inactive, icon: "❌" },
        ];
    };

    const getLeadsCards = () => {
        if (!stats) return [];
        return [
            { title: "Open Leads", value: stats.leadsByStage.NewRequest, icon: "📂" },
            { title: "Initial Contacted", value: stats.leadsByStage.InitialContacted, icon: "📞" },
            { title: "Demo Scheduled", value: stats.leadsByStage.ScheduledDemo, icon: "🗓️" },
            { title: "Completed", value: stats.leadsByStage.Completed, icon: "✔️" },
        ];
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

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
                        onRetry={fetchDashboardStats}
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
                        value="Nov 06, 2024 – Nov 06, 2024"
                        onApply={() => {
                          // TODO: Implement date range filter
                        }}
                    />
                </div>

                {/* SUMMARY */}
                <div>
                    <h3 className="text-sm font-semibold text-yellow-600 mb-3">
                        Summary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {getSummaryCards().map((item) => (
                            <SummaryCard key={item.title} {...item} />
                        ))}
                    </div>
                </div>

                {/* SUBSCRIPTIONS */}
                <div>
                    <h3 className="text-sm font-semibold text-yellow-600 mb-3">
                        Subscriptions Summary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {getSubscriptionCards().map((item) => (
                            <SummaryCard key={item.title} {...item} />
                        ))}
                    </div>
                </div>

                {/* LEADS */}
                <div>
                    <h3 className="text-sm font-semibold text-yellow-600 mb-3">
                        Leads Summary
                    </h3>
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

                {/* TOP RESTAURANTS */}
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
                                                    {r.plan || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                                    r.status === 'active'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
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

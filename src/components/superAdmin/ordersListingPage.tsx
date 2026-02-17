import { Search, Trash2, FileText } from "lucide-react";
import DashboardLayout from "../../layout/DashboardLayout";
import Select from "../form/Select";
import Pagination from "../Common/Pagination";
import { useState, useEffect, useMemo } from "react";
import DeleteModal from "./settings/deletemodule";
import { getSubscriptionOrders, SubscriptionOrder } from "../../services/superAdminService";
import LoadingSpinner from "../Common/LoadingSpinner";

const statusStyles: Record<string, string> = {
    Success: "bg-green-100 text-green-600",
    Failed: "bg-red-100 text-red-600",
    Pending: "bg-gray-200 text-gray-600",
};

const planStyles: Record<string, string> = {
    Free: "bg-green-100 text-green-600",
    Gold: "bg-yellow-100 text-yellow-700",
    Platinum: "bg-purple-100 text-purple-600",
};


export default function OrdersListingPage() {
    const [showDelete, setShowDelete] = useState(false);
    const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [businessTypeFilter, setBusinessTypeFilter] = useState("Filter by Business Type");
    const [planFilter, setPlanFilter] = useState("Filter by Plan");
    const [statusFilter, setStatusFilter] = useState("Filter by Status");
    const [dateFilter, setDateFilter] = useState("Filter by Date");
    const [countryFilter, setCountryFilter] = useState("Filter by Country");

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getSubscriptionOrders();
            if (response.success && response.data) {
                setOrders(response.data.orders);
            } else {
                setError(response.error?.message || 'Failed to load orders');
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Derive unique filter options from data
    const businessTypeOptions = useMemo(() => {
        const types = Array.from(new Set(orders.map((o) => o.businessType).filter(Boolean)));
        return [
            { label: "Filter by Business Type", value: "Filter by Business Type" },
            ...types.map((t) => ({ label: t, value: t })),
        ];
    }, [orders]);

    const planOptions = useMemo(() => {
        const plans = Array.from(new Set(orders.map((o) => o.plan).filter(Boolean)));
        return [
            { label: "Filter by Plan", value: "Filter by Plan" },
            ...plans.map((p) => ({ label: p, value: p })),
        ];
    }, [orders]);

    const statusOptions = useMemo(() => {
        const statuses = Array.from(new Set(orders.map((o) => o.status).filter(Boolean)));
        return [
            { label: "Filter by Status", value: "Filter by Status" },
            ...statuses.map((s) => ({ label: s, value: s })),
        ];
    }, [orders]);

    // Client-side filtering
    const filteredOrders = useMemo(() => {
        let result = orders;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (o) =>
                    o.orderId.toLowerCase().includes(q) ||
                    o.restaurant.toLowerCase().includes(q) ||
                    o.owner.toLowerCase().includes(q) ||
                    o.businessType.toLowerCase().includes(q) ||
                    o.plan.toLowerCase().includes(q)
            );
        }

        if (businessTypeFilter !== "Filter by Business Type") {
            result = result.filter((o) => o.businessType === businessTypeFilter);
        }

        if (planFilter !== "Filter by Plan") {
            result = result.filter((o) => o.plan === planFilter);
        }

        if (statusFilter !== "Filter by Status") {
            result = result.filter((o) => o.status === statusFilter);
        }

        if (dateFilter === "Today") {
            const today = new Date().toLocaleDateString();
            result = result.filter((o) => new Date(o.date).toLocaleDateString() === today);
        } else if (dateFilter === "Last 7 days") {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            result = result.filter((o) => new Date(o.date) >= d);
        }

        return result;
    }, [orders, searchQuery, businessTypeFilter, planFilter, statusFilter, dateFilter]);

    const handleClear = () => {
        setSearchQuery("");
        setBusinessTypeFilter("Filter by Business Type");
        setPlanFilter("Filter by Plan");
        setStatusFilter("Filter by Status");
        setDateFilter("Filter by Date");
        setCountryFilter("Filter by Country");
    };

    return (
        <DashboardLayout>
            <div className="bg-bb-bg min-h-screen p-6 space-y-4">

                {/* PAGE TITLE + SEARCH */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <h1 className="text-2xl font-bold">Orders Listing</h1>

                    <div className="relative w-full lg:w-64">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2" size={16} />
                        <input
                            placeholder="Search here..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full border rounded-md px-3 pr-10 py-2 text-sm"
                        />
                    </div>
                </div>

                {/* FILTERS */}
                <div className="flex flex-wrap gap-3 justify-end">
                    <div className="w-full sm:w-[48%] md:w-[30%] lg:w-[15%]">
                        <Select
                            value={businessTypeFilter}
                            onChange={setBusinessTypeFilter}
                            options={businessTypeOptions}
                        />
                    </div>

                    <div className="w-full sm:w-[48%] md:w-[30%] lg:w-[15%]">
                        <Select
                            value={planFilter}
                            onChange={setPlanFilter}
                            options={planOptions}
                        />
                    </div>

                    <div className="w-full sm:w-[48%] md:w-[30%] lg:w-[15%]">
                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={statusOptions}
                        />
                    </div>

                    <div className="w-full sm:w-[48%] md:w-[30%] lg:w-[15%]">
                        <Select value={dateFilter} onChange={setDateFilter} options={[
                            { label: "Filter by Date", value: "Filter by Date" },
                            { label: "Today", value: "Today" },
                            { label: "Last 7 days", value: "Last 7 days" },
                        ]} />
                    </div>

                    <div className="w-full sm:w-[48%] md:w-[30%] lg:w-[15%]">
                        <Select value={countryFilter} onChange={setCountryFilter} options={[{ label: "Filter by Country", value: "Filter by Country" },
                        { label: "India", value: "India" },]} />
                    </div>

                    <button onClick={handleClear} className="bg-yellow-400 px-4 py-2 rounded border border-black text-sm">
                        Clear
                    </button>
                </div>


                {/* TABLE */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" message="Loading orders..." />
                    </div>
                ) : error ? (
                    <div className="bg-white border rounded-xl p-8 text-center">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={fetchOrders}
                            className="bg-bb-primary px-4 py-2 rounded text-sm font-medium"
                        >
                            Retry
                        </button>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="bg-white border rounded-xl p-8 text-center text-bb-textSoft">
                        No orders found.
                    </div>
                ) : (
                    <div className="bg-white border rounded-xl overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-yellow-400 text-black">
                                <tr>
                                    <th className="px-4 py-3 text-left">Order ID</th>
                                    <th className="px-4 py-3 text-left">Restaurant Name</th>
                                    <th className="px-4 py-3 text-left">Business Owner Name</th>
                                    <th className="px-4 py-3 text-left">Business Type</th>
                                    <th className="px-4 py-3 text-left">Plan</th>
                                    <th className="px-4 py-3 text-left">Price</th>
                                    <th className="px-4 py-3 text-left">Date</th>
                                    <th className="px-4 py-3 text-left">Invoice</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredOrders.map((o, i) => (
                                    <tr key={o.id || i} className="border-t even:bg-[#FFF9EA]">
                                        <td className="px-4 py-3">{o.orderId}</td>
                                        <td className="px-4 py-3 font-medium">{o.restaurant}</td>
                                        <td className="px-4 py-3">{o.owner}</td>
                                        <td className="px-4 py-3">{o.businessType}</td>

                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${planStyles[o.plan] || ''}`}>
                                                {o.plan}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3">{o.price}</td>
                                        <td className="px-4 py-3">{o.date}</td>

                                        <td className="px-4 py-3">
                                            {o.invoice ? <FileText size={16} /> : "\u2013"}
                                        </td>

                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${statusStyles[o.status] || ''}`}>
                                                {o.status}
                                            </span>
                                        </td>

                                        <td className="px-4 py-3 text-center">
                                          <button
                                            className="text-gray-600 hover:text-red-500"
                                            onClick={() => setShowDelete(true)}
                                            >
                                            <Trash2 size={16} />
                                            </button>

                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}


                {/* PAGINATION */}
                <Pagination />

            </div>
             <DeleteModal
                    open={showDelete}
                    onClose={() => setShowDelete(false)}
                    />
        </DashboardLayout>
    );
}

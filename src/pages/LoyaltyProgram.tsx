import { useState, useCallback } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { Search, Gift, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { getCustomers, type Customer } from "../services/customerService";
import {
  getLoyaltyBalance,
  awardLoyaltyPoints,
  redeemLoyaltyPoints,
} from "../services/loyaltyService";
import Modal from "../components/ui/Modal";

interface LoyaltyTransaction {
  id: string;
  type: string;
  points: number;
  description: string | null;
  orderId: string | null;
  createdAt: string;
}

const LoyaltyProgram = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"award" | "redeem">("award");
  const [modalPoints, setModalPoints] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getCustomers({ search: searchQuery.trim(), limit: 10 });
      if (response.success && response.data?.customers) {
        setCustomers(response.data.customers);
        if (response.data.customers.length === 0) {
          setError("No customers found matching your search.");
        }
      } else {
        setError("Failed to search customers.");
      }
    } catch {
      setError("Failed to search customers.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const handleSelectCustomer = useCallback(async (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomers([]);
    setSearchQuery("");
    setBalanceLoading(true);
    setError(null);
    try {
      const response = await getLoyaltyBalance(customer.id);
      if (response.success && response.data) {
        setBalance((response.data as any).balance ?? 0);
        setTransactions((response.data as any).recentTransactions ?? []);
      } else {
        setError(response.error?.message || "Failed to fetch loyalty balance.");
      }
    } catch {
      setError("Failed to fetch loyalty balance.");
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const openModal = (mode: "award" | "redeem") => {
    setModalMode(mode);
    setModalPoints("");
    setModalDescription("");
    setModalOpen(true);
  };

  const handleModalSubmit = async () => {
    if (!selectedCustomer || !modalPoints) return;
    const pts = parseInt(modalPoints, 10);
    if (isNaN(pts) || pts <= 0) return;

    setModalSubmitting(true);
    try {
      let response;
      if (modalMode === "award") {
        response = await awardLoyaltyPoints(
          selectedCustomer.id,
          "",
          pts
        );
      } else {
        response = await redeemLoyaltyPoints(selectedCustomer.id, pts, "");
      }

      if (response.success) {
        setModalOpen(false);
        // Refresh balance
        await handleSelectCustomer(selectedCustomer);
      } else {
        setError(response.error?.message || `Failed to ${modalMode} points.`);
      }
    } catch {
      setError(`Failed to ${modalMode} points.`);
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 bg-bb-bg min-h-screen space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Gift className="w-7 h-7 text-bb-primary" />
          <h1 className="text-2xl font-bold text-bb-text">Loyalty Program</h1>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-bb-card p-6">
          <h2 className="text-lg font-semibold text-bb-text mb-4">
            Look Up Customer
          </h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bb-textSoft" />
              <input
                type="text"
                placeholder="Search by customer name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bb-primary focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="px-6 py-2.5 bg-bb-primary text-bb-text font-medium rounded-lg hover:bg-yellow-500 transition disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Search Results Dropdown */}
          {customers.length > 0 && (
            <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
              {customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCustomer(c)}
                  className="w-full text-left px-4 py-3 hover:bg-bb-bg transition flex justify-between items-center border-b border-gray-100 last:border-b-0"
                >
                  <div>
                    <span className="font-medium text-bb-text">{c.name}</span>
                    <span className="text-bb-textSoft text-sm ml-3">{c.phone}</span>
                  </div>
                  <span className="text-xs text-bb-textSoft">{c.type}</span>
                </button>
              ))}
            </div>
          )}

          {error && !selectedCustomer && (
            <p className="mt-3 text-sm text-bb-danger">{error}</p>
          )}
        </div>

        {/* Selected Customer Section */}
        {selectedCustomer && (
          <>
            {/* Balance Card */}
            <div className="bg-white rounded-xl shadow-bb-card p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-bb-text">
                    {selectedCustomer.name}
                  </h2>
                  <p className="text-sm text-bb-textSoft mt-1">
                    {selectedCustomer.phone}
                    {selectedCustomer.email && ` · ${selectedCustomer.email}`}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-bb-textSoft">Loyalty Balance</p>
                    {balanceLoading ? (
                      <p className="text-2xl font-bold text-bb-text">...</p>
                    ) : (
                      <p className="text-2xl font-bold text-bb-primary">
                        {balance.toLocaleString()} pts
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal("award")}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition"
                    >
                      <ArrowUpCircle className="w-4 h-4" />
                      Award
                    </button>
                    <button
                      onClick={() => openModal("redeem")}
                      disabled={balance <= 0}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      <ArrowDownCircle className="w-4 h-4" />
                      Redeem
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-bb-danger">{error}</p>
            )}

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-bb-card p-6">
              <h2 className="text-lg font-semibold text-bb-text mb-4">
                Recent Transactions
              </h2>
              {balanceLoading ? (
                <p className="text-bb-textSoft text-sm">Loading transactions...</p>
              ) : transactions.length === 0 ? (
                <p className="text-bb-textSoft text-sm">
                  No loyalty transactions yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-bb-textSoft">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-bb-textSoft">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-bb-textSoft">
                          Points
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-bb-textSoft">
                          Description
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-bb-textSoft">
                          Order ID
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((txn) => (
                        <tr
                          key={txn.id}
                          className="border-b border-gray-100 hover:bg-bb-bg transition"
                        >
                          <td className="py-3 px-4 text-bb-text">
                            {new Date(txn.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                txn.type === "award"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {txn.type === "award" ? (
                                <ArrowUpCircle className="w-3 h-3" />
                              ) : (
                                <ArrowDownCircle className="w-3 h-3" />
                              )}
                              {txn.type === "award" ? "Awarded" : "Redeemed"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-bb-text">
                            {txn.type === "award" ? "+" : "-"}
                            {txn.points}
                          </td>
                          <td className="py-3 px-4 text-bb-textSoft">
                            {txn.description || "—"}
                          </td>
                          <td className="py-3 px-4 text-bb-textSoft">
                            {txn.orderId || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty State */}
        {!selectedCustomer && !loading && customers.length === 0 && (
          <div className="bg-white rounded-xl shadow-bb-card p-12 text-center">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-bb-text mb-2">
              Manage Loyalty Points
            </h3>
            <p className="text-bb-textSoft text-sm max-w-md mx-auto">
              Search for a customer by name or phone number to view their loyalty
              balance, award points, or redeem points.
            </p>
          </div>
        )}
      </div>

      {/* Award / Redeem Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-bb-text">
            {modalMode === "award" ? "Award Points" : "Redeem Points"}
          </h2>
          <div>
            <label className="block text-sm font-medium text-bb-text mb-1">
              Points
            </label>
            <input
              type="number"
              min="1"
              value={modalPoints}
              onChange={(e) => setModalPoints(e.target.value)}
              placeholder="Enter points"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bb-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bb-text mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={modalDescription}
              onChange={(e) => setModalDescription(e.target.value)}
              placeholder={
                modalMode === "award"
                  ? "e.g., Bonus for birthday"
                  : "e.g., Discount on order"
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bb-primary focus:border-transparent"
            />
          </div>
          {modalMode === "redeem" && (
            <p className="text-sm text-bb-textSoft">
              Current balance: <span className="font-medium">{balance} pts</span>
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-bb-text hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleModalSubmit}
              disabled={
                modalSubmitting ||
                !modalPoints ||
                parseInt(modalPoints) <= 0
              }
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition disabled:opacity-50 ${
                modalMode === "award"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {modalSubmitting
                ? "Processing..."
                : modalMode === "award"
                ? "Award Points"
                : "Redeem Points"}
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default LoyaltyProgram;

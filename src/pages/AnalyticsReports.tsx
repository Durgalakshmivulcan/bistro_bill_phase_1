import { Suspense, useState, useEffect, useCallback } from "react";
import {
  useNavigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import { useBranch } from "../contexts/BranchContext";
import { useAuth } from "../contexts/AuthContext";
import { getBusinessOwners, BusinessOwnerListItem } from "../services/superAdminService";
import { getSelectedBoId, setSelectedBoId } from "../services/saReportContext";

type ReportItem = {
  title: string;
  desc: string;
};

const SECTIONS = [
  "Sale Summary",
  "Sale Transactions",
  "Sales Items",
  "Customer",
  "Resource",
  "Cash Management",
  "GST Reports",
  "Others",
  "Miscellaneous",
  "Customer Analytics",
  "Custom Reports"
];

const REPORTS_BY_SECTION: Record<string, ReportItem[]> = {
  "Sale Summary": [
    { title: "Sales Summary", desc: "Export Sales Summary." },
    { title: "Sales Summary by Branch", desc: "Export Sales Summary by Branch." },
    { title: "Sales Summary by Branch Label", desc: "Export Sales Summary by Branch Label." },
    { title: "Sales Summary by Channel", desc: "Export Sales Summary by Channel." },
    { title: "Sales Summary by Brand", desc: "Export Sales Summary by Brand." },
    { title: "Sales Summary by Day of Week", desc: "Export Sales Summary by Day of Week." },
    { title: "Sales Summary by Session", desc: "Export Sales Summary by Session." },
    { title: "Sales Summary by Hour", desc: "Export Sales Summary by Hour of Day." },
    { title: "Sales Summary by Branch & Time", desc: "Export Sales Summary by Branch & Time." },
    { title: "Sales by Metrics", desc: "Export Sales by Metrics." },
    { title: "Sales by Brand", desc: "Export Sales by Brand." },
    { title: "Sales Trend (MoM, YoY)", desc: "Sales Trend for e.g., MoM & YoY." },
    { title: "Revenue Waterfall", desc: "View revenue breakdown in waterfall format." },
    { title: "Location Comparison", desc: "Compare revenue and orders across all locations side-by-side." },
  ],

  "Sale Transactions": [
    { title: "Cancelled Transactions", desc: "Export Cancelled Transactions." },
    { title: "Non-Chargeable Sales", desc: "Export Non-Chargeable Sales." },
    { title: "Online Orders by Calendar Date", desc: "Export Online Orders by Calendar Date." },
    { title: "Open Orders", desc: "Export Open Orders." },
    { title: "Sales Transactions", desc: "Export Sales Transactions." },
    { title: "Sales Transactions Audit", desc: "Export Sales Transactions Audit." },
  ],

  "Sales Items": [
    { title: "Cancelled Sales Items by Transaction", desc: "Export Cancelled Sales Items by Transaction." },
    { title: "Cost of Sale Items", desc: "Export Cost of Sale Items." },
    { title: "Sale Items by Channel", desc: "Export Sale Items by Channel." },
    { title: "Sale Items by Channel & Resource", desc: "Export Sale Items by Channel & Resource." },
    { title: "Sale Items by Channel & Session", desc: "Export Sale Items by Channel & Session." },
    { title: "Sales Items Quantity by Branch", desc: "Export Sales Items Quantity by Branch." },
    { title: "Sales Items Quantity by Hour", desc: "Export Sales Items Quantity by Hour." },
    { title: "Sales Items Quantity by Session", desc: "Export Sales Items Quantity by Session." },
    { title: "Sales Items by Brand", desc: "Export Sales Items by Brand." },
    { title: "Sales Items by Transaction", desc: "Export Sales Items by Transaction." },
  ],

  Customer: [{ title: "Sales by Customers", desc: "Export Sales by Customers." }],
  Resource: [
    { title: "Sales by Resource", desc: "Export Sales by Resource." },
    { title: "Staff Performance", desc: "View staff performance metrics and rankings." },
  ],
  "Cash Management": [],
  "GST Reports": [
    { title: "Amount Due by Company Report", desc: "Export Amount Due by Company Report." },
    { title: "B2B Sale Transaction", desc: "Export B2B Sale Transaction." },
    { title: "B2C Large Sale Transaction", desc: "Export B2C Large Sale Transaction." },
    { title: "B2C Small Sale Summary", desc: "Export B2C Small Sale Summary." },
    { title: "HSN Tax Report", desc: "Export HSN Tax Report." },
  ],
  Others: [
    { title: "Aggregators Activity Log", desc: "Export Aggregators Activity Log." },
    { title: "Discount Analytics", desc: "View discount usage analytics and performance." },
    { title: "Feedback Analytics", desc: "View feedback response analytics and satisfaction metrics." },
    { title: "Discount by Product", desc: "Export Discount by Product." },
    { title: "Discounts by Transaction", desc: "Export Discounts by Transaction." },
    { title: "Product Unavailability Time", desc: "Export Product Unavailability Time." },
    { title: "Product Unavailability Time in Aggregators", desc: "Export Product Unavailability Time in Aggregators." },
    { title: "Payments", desc: "Export Payments." },
    { title: "Bistro Bill Card Summary Report", desc: "Export Bistro Bill Card Summary Report." },
    { title: "Bistro Bill Card Transactions Report", desc: "Export Bistro Bill Card Transactions Report." },
    { title: "Sale Commission", desc: "Export Sale Commission." },
    { title: "Settings Audit Log", desc: "Export Settings Audit Log." },
    { title: "User Activity Audit Log", desc: "View all user activity logs with before/after snapshots." },
    { title: "Swiggy Customer Complaint Report", desc: "Export Swiggy Customer Complaint Report." },
    { title: "Table Reservations", desc: "Export Table Reservations." },
    { title: "Zomato Customer Complaint Report", desc: "Export Zomato Customer Complaint Report." },
    { title: "P&L Statement", desc: "Export P&L Statement." },
    { title: "Transactions Report", desc: "Export Transactions Report." },
  ],
  "Miscellaneous": [
    { title: "Amount Due To Suppliers", desc: "Export Amount Due To Suppliers." },
    { title: "Branch Wise Assigned Restock", desc: "Export Branch Wise Assigned Restock." },
    { title: "Branch Wise Supplier", desc: "Export Branch Wise Supplier." },
    { title: "Purchase Order Payment", desc: "Export Purchase Order Payment." },
    { title: "Purchase Order Report", desc: "Export Purchase Order Report." },
    { title: "Inventory Report", desc: "Export Inventory Report." },
    { title: "Reservation Report", desc: "Export Reservation Report." },
    { title: "Supplier Performance", desc: "View Supplier Performance Analytics." },
    { title: "Stockout Predictions", desc: "ML-based predictions for inventory stockouts with reorder suggestions." },
  ],
  "Customer Analytics": [
    { title: "Cohort Analysis", desc: "Analyze customer retention by sign-up cohort." },
    { title: "Sales Heatmap", desc: "Visualize sales by day of week and hour." },
    { title: "Product Trends", desc: "Identify growing and declining products by sales trends." },
    { title: "Staff Performance", desc: "View staff leaderboard and performance metrics." },
    { title: "Menu Engineering", desc: "Analyze menu items by popularity and profitability." },
  ],
  "Custom Reports": [
    { title: "Custom Report Builder", desc: "Build custom reports with flexible filters and columns." },
    { title: "Saved Reports", desc: "View and manage your saved custom reports." },
    { title: "Report Comparison", desc: "Compare two time periods side by side." },
  ],
};

/* 🔗 ROUTE MAP */
const REPORT_ROUTES: Record<string, string> = {
  "Sales Summary": "sales-summary", // relative path
  "Sales Summary by Branch": "sales-summary-by-branch",
  "Sales Summary by Branch Label": "sales-summary-by-branch-label",
  "Sales Summary by Channel": "sales-summary-by-channel",
  "Sales Summary by Brand" : "sales-summary-by-brand",
  "Sales Summary by Day of Week" : "sales-summary-by-day-of-week",
  "Sales Summary by Session" : "sales-summary-by-session",
  "Sales Summary by Hour" : "sales-summary-by-hour",
  "Sales Summary by Branch & Time" : "sales-summary-by-branch-and-time",
  "Sales by Metrics" : "sales-by-metrics",
  "Sales by Brand" : "sales-by-brand",
  "Sales Trend (MoM, YoY)" : "sales-trend",
  "Location Comparison" : "location-comparison",

  "Sales by Resource" : "sales-by-resource",
  "Staff Performance": "staff-performance",
  "Sales by Customers": "sales-by-customer",

  "Aggregators Activity Log": "aggregators-activity-log",
  "Discount Analytics": "discount-analytics",
  "Feedback Analytics": "feedback-analytics",
  "Discount by Product": "discount-by-products",
  "Discounts by Transaction": "discounts-by-transaction",
  "Product Unavailability Time": "product-unavailability-time",
  "Product Unavailability Time in Aggregators": "product-unavailability-time-in-aggregators",
  "Payments" : "payments",
  "Bistro Bill Card Summary Report" : "bistro-bill-card-summary",
  "Bistro Bill Card Transactions Report" : "bistro-bill-card-transactions-report",
  "Sale Commission" : "sale-commission",
  "Settings Audit Log" : "settings-audit-log",
  "User Activity Audit Log" : "user-activity-audit-log",
  "Swiggy Customer Complaint Report" : "swiggy-customer-complaint-report",
  "Table Reservations" : "table-reservations",
  "Zomato Customer Complaint Report" : "zomato-customer-complaint-report",
  "P&L Statement" : "p-and-l-statement",
  "Transactions Report" : "transaction-reports",
  
  "Cancelled Transactions": "cancelled",
  "Non-Chargeable Sales": "non-chargeable",
  "Online Orders by Calendar Date": "online-orders",

  "Open Orders": "order-report",
  "Sales Transactions": "sal-transaction",
  "Sales Transactions Audit": "saladuit-transactions",
   "Cancelled Sales Items by Transaction":"cancelledsales-transactions",
  "Cost of Sale Items":"coastfiletranscation",
   "Sale Items by Channel":"salesitembychannel",
    "Sale Items by Channel & Resource" :"salesitemchannelresource",
   "Sale Items by Channel & Session":"salesitemsession",
   "Sales Items Quantity by Branch":"salesitemquantitybranch",
   "Sales Items Quantity by Hour":"salesitemhour",
   "Sales Items Quantity by Session":"salesemitembyquanitysession",
   "Sales Items by Brand":"salesitembybrand",
   "Sales Items by Transaction":"salesitembytranscation",

  "Amount Due by Company Report": "amount-due-company",
  "B2B Sale Transaction": "b2b-sales",
  "B2C Large Sale Transaction": "b2c-large",
  "B2C Small Sale Summary": "b2c-small",
  "HSN Tax Report": "hsn-report",
  "Amount Due To Suppliers":"amount-due-to-suppliers",
  "Branch Wise Assigned Restock":"branch-wise-assigned-restock",
  "Branch Wise Supplier":"branch-wise-supplier",
  "Purchase Order Payment":"purchase-order-payment",
  "Purchase Order Report":"purchase-order-report",
  "Inventory Report":"inventory-report",
  "Reservation Report":"reservation-report",
  "Supplier Performance":"supplier-performance",
  "Cohort Analysis":"cohort-analysis",
  "Sales Heatmap":"sales-heatmap",
  "Product Trends":"product-trends",
  "Revenue Waterfall":"revenue-waterfall",
  "Menu Engineering":"menu-engineering",
  "Custom Report Builder":"custom-report-builder",
  "Saved Reports":"saved-reports",
  "Report Comparison":"report-comparison",
  "Stockout Predictions":"stockout-predictions",
};

export default function AnalyticsReports() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { availableBranches, accessLevel } = useBranch();
  const isFranchiseAdmin = accessLevel === 'franchise_admin';
  const { user } = useAuth();
  const isSuperAdmin = user?.userType === 'SuperAdmin';

  const [boList, setBoList] = useState<BusinessOwnerListItem[]>([]);
  const [selectedBo, setSelectedBo] = useState<string>(getSelectedBoId() || '');
  const [boLoading, setBoLoading] = useState(false);

  const fetchBusinessOwners = useCallback(async () => {
    setBoLoading(true);
    try {
      const res = await getBusinessOwners({ limit: 100 });
      if (res.success && res.data) {
        setBoList(res.data.businessOwners);
      }
    } catch {
      // silently fail — dropdown will be empty
    } finally {
      setBoLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchBusinessOwners();
    }
  }, [isSuperAdmin, fetchBusinessOwners]);

  const handleBoChange = (boId: string) => {
    setSelectedBo(boId);
    setSelectedBoId(boId || null);
  };

  // Filter reports: Location Comparison only visible to franchise admins with multiple locations
  const getFilteredReports = (reports: ReportItem[]) => {
    if (!isFranchiseAdmin || availableBranches.length <= 1) {
      return reports.filter(r => r.title !== 'Location Comparison');
    }
    return reports;
  };

  // 👇 Detect root analytics page
  const isRootAnalytics = location.pathname === "/analytics-reports";

  return (
    <DashboardLayout>
      <div className="bg-bb-bg min-h-screen p-4 md:p-6 space-y-4">
        {/* Show title ONLY on root */}
        {isRootAnalytics && (
          <h1 className="text-2xl md:text-3xl font-semibold text-bb-text">
            Analytics & Reports
          </h1>
        )}

        {/* SA BO selector */}
        {isRootAnalytics && isSuperAdmin && (
          <div className="bg-white shadow-bb-card rounded-xl p-4">
            <label className="block text-sm font-medium text-bb-text mb-2">
              Select a restaurant to view reports
            </label>
            <select
              value={selectedBo}
              onChange={(e) => handleBoChange(e.target.value)}
              className="w-full md:w-96 border border-bb-border rounded-lg px-3 py-2 text-sm text-bb-text focus:outline-none focus:ring-2 focus:ring-bb-primary"
              disabled={boLoading}
            >
              <option value="">-- Select a Business Owner --</option>
              {boList.map((bo) => (
                <option key={bo.id} value={bo.id}>
                  {bo.restaurantName} ({bo.ownerName})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Placeholder when SA hasn't selected a BO */}
        {isRootAnalytics && isSuperAdmin && !selectedBo && (
          <div className="bg-white shadow-bb-card rounded-xl p-8 text-center text-bb-textSoft">
            <i className="bi bi-bar-chart-line text-4xl mb-3 block"></i>
            <p className="text-lg">Select a restaurant above to view their analytics reports.</p>
          </div>
        )}

        {/* ✅ Analytics list ONLY on root page (hidden for SA until BO selected) */}
        {isRootAnalytics && (!isSuperAdmin || selectedBo) &&
          SECTIONS.map((section) => {
            const isActive = activeSection === section;
            const reports = REPORTS_BY_SECTION[section];

            return (
              <div
                key={section}
                className={`border rounded-lg transition
                  ${
                    isActive
                      ? "bg-bb-hover border-coloredborder"
                      : "bg-bb-surface border-bb-border shadow-bb-card"
                  }`}
              >
                <div className="flex items-center justify-between px-4 py-2">
                  <span
                    className={`text-base md:text-lg font-medium
                      ${isActive ? "text-bb-text" : "text-bb-textSoft"}
                    `}
                  >
                    {section}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveSection(isActive ? null : section)
                    }
                    className="w-6 h-6 border border-black rounded
                               flex items-center justify-center hover:bg-bb-hover"
                  >
                    {isActive ? "−" : "+"}
                  </button>
                </div>

                {isActive && reports.length > 0 && (
                  <div className="p-3 pt-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {getFilteredReports(reports).map((item) => (
                      <div
                        key={item.title}
                        onClick={() => {
                          const path = REPORT_ROUTES[item.title];
                          if (path) navigate(path);
                        }}
                        className="bg-bb-surface border border-bb-border rounded-md p-1.5
                                   hover:border-bb-primary cursor-pointer"
                      >
                        <div className="text-sm font-medium text-bb-text">
                          {item.title}
                        </div>
                        <div className="text-xs text-bb-textSoft">
                          {item.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {/* 👇 Child pages (SalesSummary) render here */}
        <Suspense fallback={<div className="flex justify-center items-center py-12"><LoadingSpinner /></div>}>
          <Outlet />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

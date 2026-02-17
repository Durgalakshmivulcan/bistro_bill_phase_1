import { lazy, Suspense, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/Common/ProtectedRoute";
import { BranchProvider } from "./contexts/BranchContext";
import { OrderProvider } from "./contexts/OrderContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/Common/ErrorBoundary";
// import Dashboard from "./pages/Dashboard";
import PointOfSale from "./pages/PointOfSale";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import CheckEmail from "./pages/CheckEmail";
import ResetPassword from "./pages/ResetPassword";
import PasswordChanged from "./pages/PasswordChanged";
import BusinessOwnerLogin from "./pages/BusinessOwnerLogin";
import SelectUser from "./pages/SelectUserLogin";
import UserLogin from "./pages/UserLogin";

// import MyAccountPage from "./pages/SideBarPage";
import BODashboard from "./pages/BusinessOwnerDashboard";
import KitchenDisplaySystem from "./pages/KitchenDisplaySystem";
import AddProduct from "./pages/AddProduct";
// import TakeOrder from "./pages/takeOrderMain";
// import OdersPage from "./pages/POSOrdersPage";
import OrderHistory from "./pages/OrderHistory";
import OrderActivity from "./pages/OrderActivity";
import CatalogLayout from "./pages/Catalog";
import CatalogDashboard from "./components/Catalog/CatalogDashboard";
import CatalogProductsPage from "./components/Catalog/CatalogProducts";
import CatalogChannelMenu from "./components/Catalog/CatalogChannelMenu";
import CatalogConfiguration from "./components/Catalog/CatalogConfiguration";
import CustomerLayout from "./pages/customers";
import CustomersListing from "./components/Customers/customersCustomerList";
import CustomersGroup from "./components/Customers/customersCustomerGroup";
import CustomersTags from "./components/Customers/customersCustomerTags";

import TaxesPaymentsLayout from "./components/taxes-payments/businessSettingsTaxesPayments";
import GeneralSettingsLayout from "./components/general-settings/businessSettingsGeneralSettings";

import TaxPage from "./components/taxes-payments/TaxPage";
import TaxGroupPage from "./components/taxes-payments/TaxGroupPage";
import PaymentOptionsPage from "./components/taxes-payments/PaymentOptionsPage";

import BusinessProfilePage from "./components/general-settings/businessProfilePage";
import PreferencesPage from "./components/general-settings/preferencesPage";
import SubscriptionPage from "./components/general-settings/subscriptionPage";
import SalesSettingsLayout from "./components/sales-settings/businessSettingsSalesSettings";
import SalesSettingsPage from "./components/sales-settings/SalesSettingsPage";
import ChargesLayout from "./components/charges/businessSettingsChargesSettings";
import ChargesPage from "./components/charges/chargesPage";
import ReasonsLayout from "./components/reasons/businessSettingsReasonsSettings";
import DiscountReasonsPage from "./components/reasons/discountReasonsPage";
import BranchCloseReasonsPage from "./components/reasons/BranchCloseReasonsPage";
import OrderCancelReasonsPage from "./components/reasons/OrderCancelReasonsPage";
import RefundReasonsPage from "./components/reasons/RefundReasonsPage";
import NonChargeableReasonsPage from "./components/reasons/NonChargeableReasonsPage";
import InventoryAdjustmentReasonsPage from "./components/reasons/InventoryAdjustmentReasonsPage";
import ReservationReasonsPage from "./components/reasons/ReservationReasonsPage";
import SalesReturnReasonsPage from "./components/reasons/SalesReturnReasonsPage";

import PurchaseOrderLayout from "./pages/purchaseOrder";
import PurchaseOrderSuppliersList from "./components/PurchaseOrder/purchaseOrderSuppliersList";
import PurchaseOrderPOList from "./components/PurchaseOrder/purchaseOrderListing";
// import PurchaseOrdersAddSupplier from "./components/PurchaseOrder/purchaseOrderAddSuppliers";
// import PurchaseOrdersAddPO from "./components/PurchaseOrder/purchaseOrderAddPO";

import InventoryLayout from "./pages/inventory";
import InventoryList from "./components/Inventory/inventoryList";
import AddInventoryProduct from "./components/Inventory/addProduct";
import LowStockAlerts from "./components/Inventory/LowStockAlerts";

import MarketingPage from "./pages/marketing";

import DiscountsList from "./components/Marketing/marketingDiscountsList";
import CreateDiscount from "./components/Marketing/addDiscount";
import AdvertisementsList from "./components/Marketing/advertisementsList";
import CreateAdvertisement from "./components/Marketing/addAdvertisement";
import ViewAdvertisement from "./components/Marketing/ViewAdvertisement";
import FeedbackFormsPage from "./components/Marketing/feedbackFormsPage";
import SubmitFeedbackForm from "./components/Marketing/submitFeedbackForm";
import FeedbackResponsesList from "./components/Marketing/feedbackResponsesList";
import FeedbackResponsesPage from "./components/Marketing/feedbackResponsesPage";

import TakeOrder from "./pages/posTakeOrder";
import OdersPage from "./pages/posMyOrders";
import TableViewPage from "./pages/posTableView";
import ReservationsPage from "./pages/ReservationsPage";

import ReservationMain from "./pages/Reservationmain";

import ManageResourcesLayout from "./pages/manageResources/ManageResourcesLayout";
import ManageStaffLayout from "./pages/manageResources/ManageStaffLayout";

import StaffListingPage from "./pages/manageResources/staff/StaffListingPage";
import RolesPermissionsPage from "./pages/manageResources/staff/RolesPermissionsPage";
import BranchesPage from "./pages/manageResources/branches/BranchesPage";

import SubscriptionPlansLayout from "./pages/subscriptionPlans";
import PlansPage from "./components/subscriptionPlans/PlansPage";
import CreatePlanPage from "./pages/subscriptionCreatePlan";
import SubscriptionEditPlan from "./pages/subscriptionEditPlan";
import DashboardSummaryPage from "./components/superAdmin/dashboard";
import ContactRequestsPage from "./pages/contactRequests";
import StaffCreatePage from "./pages/staffCreate";
// import StaffEditPage from "./pages/staffEdit";

import MyAccount from "./components/superAdmin/myProfile";
import ManagePassword from "./components/superAdmin/managePassword";
import StaffCreateRolePage from "./pages/staffCreateRole";
// import StaffEditRolePage from "./pages/staffEditRole";

import AnalyticsReports from "./pages/AnalyticsReports";
import BusinessOwnersLayout from "./pages/businessOwners";
import BusinessOwnersList from "./components/superAdmin/businessOwner/businessOwnersList";
import CreateBusinessOwner from "./components/superAdmin/businessOwner/createBusinessOwner";
import OrdersListingPage from "./components/superAdmin/ordersListingPage";
import BlogsPage from "./pages/blogManagement/BlogsPage";
import BlogCategoriesPage from "./pages/blogManagement/BlogCategoriesPage";
import CreateBlogPage from "./pages/blogManagement/CreateBlogPage";
import CreateBlogCategoryPage from "./pages/blogManagement/CreateBlogCategoryPage";
import BlogTagsPage from "./pages/blogManagement/BlogTagsPage";
import CreateBlogTagPage from "./pages/blogManagement/CreateBlogTagPage";
import IntegrationSettings from "./pages/settings/IntegrationSettings";
import AggregatorConfigPage from "./components/businessSettings/AggregatorConfigPage";
import LoyaltyProgram from "./pages/LoyaltyProgram";
import Reviews from "./pages/Reviews";
import PaymentsHub from "./pages/PaymentsHub";
import RoleManagement from "./pages/settings/RoleManagement";
import SettingsPage from "./pages/settingsLayout";
import BasicSettings from "./components/superAdmin/settings/basicSettings";
import ManagePasswordSettings from "./components/superAdmin/settings/passwordSettings";
import MenuConfigPage from "./components/superAdmin/settings/MenuConfigPage";
import CreateAllergyPage from "./components/masterData/CreateAllergyPage";
import MasterDataLayout from "./pages/masterData";
import AllergiesPage from "./components/masterData/AllergiesPage";
import MeasuringPage from "./components/masterData/MeasuringUnits";
import CreateMeasuringPage from "./components/masterData/CreateMeasuringUnits";
import CreateTaxPage from "./components/masterData/CreateTaxPage";
import CreateTaxGroupPage from "./components/masterData/CreateTaxGroupPage";
import MasterTaxPage from "./components/masterData/TaxPage";
import MasterTaxGroupPage from "./components/masterData/TaxGroupPage";
import AddNewReservation from "./components/POSReservations/AddNewReservation";
import EditReservation from "./components/POSReservations/EditReservation";
import ViewReservation from "./components/POSReservations/ViewReservation";
import EditDiscount from "./components/Marketing/EditDiscount";
import EditAdvertisement from "./components/Marketing/EditAdvertisement";
import EditFeedbackForm from "./components/Marketing/EditFeedbackForm";
import EditSupplier from "./components/PurchaseOrder/editSupplier";
import ViewSupplier from "./components/PurchaseOrder/viewSupplier";
import AddSupplier from "./components/PurchaseOrder/AddSupplier";
import AddPO from "./components/PurchaseOrder/AddPO";
import EditPO from "./components/PurchaseOrder/EditPO";
import ViewPO from "./components/PurchaseOrder/ViewPO";
import WebsiteLayout from "./pages/bistroWebsite";
import CompleteRestaurantFeatures from "./components/website/featurespage";
import BlogPage from "./components/website/blogpage";
import SupportPage from "./components/website/supportpage";
import TestimonialsPage from "./components/website/testimonialspage";
import PricingPage from "./components/website/pricing/pricingPage";
import ContactUsDemo from "./components/website/contactUsDemo";
import PaidOrderActivity from "./components/order-activity/PaidOrderActivity";
import UnpaidOrderActivity from "./components/order-activity/UnpaidOrderActivity";
import DueOrderActivity from "./components/order-activity/DueOrderActivity";
import PointOfSaleLayout from "./layout/PointOfSaleLayout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";

// Lazy load analytics report components
const SalesSummary = lazy(() => import("./components/AnalyticsReports/saleSummary/salesSummary"));
const SalesSummaryByBranch = lazy(() => import("./components/AnalyticsReports/saleSummary/salesSummaryByBranch"));
const SalesSummaryByBranchLabel = lazy(() => import("./components/AnalyticsReports/saleSummary/salesSummaryByBranchLabel"));
const SalesSummaryByChannel = lazy(() => import("./components/AnalyticsReports/saleSummary/salesSummaryByChannel"));
const SalesSummaryByBrand = lazy(() => import("./components/AnalyticsReports/saleSummary/salesSummaryByBrand"));
const SalesSummaryByDayOfWeek = lazy(() => import("./components/AnalyticsReports/saleSummary/salesSummaryByDayOfWeek"));
const SalesSummaryBySession = lazy(() => import("./components/AnalyticsReports/saleSummary/salesSummaryBySession"));
const SalesSummaryByHour = lazy(() => import("./components/AnalyticsReports/saleSummary/salesSummaryByHour"));
const SalesSummaryByBranchAndTime = lazy(() => import("./components/AnalyticsReports/saleSummary/salesSummaryByBranchAndTime"));
const SalesByMetrics = lazy(() => import("./components/AnalyticsReports/saleSummary/salesByMetrics"));
const SalesTrend = lazy(() => import("./components/AnalyticsReports/saleSummary/salesTrend"));
const SalesByBrand = lazy(() => import("./components/AnalyticsReports/saleSummary/salesByBrand"));
const LocationComparison = lazy(() => import("./components/AnalyticsReports/saleSummary/LocationComparison"));
const SalesByResource = lazy(() => import("./components/AnalyticsReports/resource/salesByResource"));
const StaffPerformanceAnalytics = lazy(() => import("./components/AnalyticsReports/resource/staffPerformanceAnalytics"));
const SalesByCustomer = lazy(() => import("./components/AnalyticsReports/customer/salesByCustomer"));
const AggregatorsActivityLog = lazy(() => import("./components/AnalyticsReports/others/aggregatorsActivityLog"));
const DiscountAnalyticsPage = lazy(() => import("./components/AnalyticsReports/others/discountAnalytics"));
const FeedbackResponseAnalytics = lazy(() => import("./components/AnalyticsReports/others/feedbackResponseAnalytics"));
const DiscountByProducts = lazy(() => import("./components/AnalyticsReports/others/discountByProducts"));
const DiscountsByTransaction = lazy(() => import("./components/AnalyticsReports/others/discountsByTransaction"));
const ProductUnavailabilityTime = lazy(() => import("./components/AnalyticsReports/others/productUnavailabilityTime"));
const ProductUnavailabilityTimeInAggregators = lazy(() => import("./components/AnalyticsReports/others/productUnavailabilityTimeInAggregators"));
const Payments = lazy(() => import("./components/AnalyticsReports/others/payments"));
const BistroBillCardSummary = lazy(() => import("./components/AnalyticsReports/others/bistroBillCardSummary"));
const BistroBillCardTransactionReport = lazy(() => import("./components/AnalyticsReports/others/bistroBillCardTransactionsReport"));
const SaleCommission = lazy(() => import("./components/AnalyticsReports/others/saleCommission"));
const SettingsAuditLog = lazy(() => import("./components/AnalyticsReports/others/settingsAuditLog"));
const UserActivityAuditLog = lazy(() => import("./components/AnalyticsReports/others/userActivityAuditLog"));
const SwiggyCustomerComplaintReport = lazy(() => import("./components/AnalyticsReports/others/swiggyCustomerComplaintReport"));
const TableReservations = lazy(() => import("./components/AnalyticsReports/others/tableReservations"));
const ZomatoCustomerComplaintReport = lazy(() => import("./components/AnalyticsReports/others/zomatoCustomerComplaintReport"));
const PAndLStatement = lazy(() => import("./components/AnalyticsReports/others/PAndLStatement"));
const TransactionReports = lazy(() => import("./components/AnalyticsReports/others/transactionsReports"));
const AmountDueToSuppliers = lazy(() => import("./components/AnalyticsReports/extraReports/amountduetosuppliers"));
const BranchwiseSuppliersReport = lazy(() => import("./components/AnalyticsReports/extraReports/branchwisesupplier"));
const BranchwiseRestockReport = lazy(() => import("./components/AnalyticsReports/extraReports/branchwiseassignedrestock"));
const PurchaseOrdersReport = lazy(() => import("./components/AnalyticsReports/extraReports/purchaseorderreport"));
const PurchaseOrderPaymentReport = lazy(() => import("./components/AnalyticsReports/extraReports/purchaseorderpayment"));
const ReservationReport = lazy(() => import("./components/AnalyticsReports/extraReports/reservationreport"));
const InventoryReport = lazy(() => import("./components/AnalyticsReports/extraReports/inventoryreport"));
const SupplierPerformanceAnalytics = lazy(() => import("./components/AnalyticsReports/extraReports/supplierPerformanceAnalytics"));
const StockoutPredictions = lazy(() => import("./pages/inventory/StockoutPredictions"));
const CohortAnalysis = lazy(() => import("./pages/analytics-reports/CohortAnalysis"));
const SalesHeatmap = lazy(() => import("./pages/analytics-reports/SalesHeatmap"));
const ProductTrends = lazy(() => import("./pages/analytics-reports/ProductTrends"));
const RevenueWaterfallChart = lazy(() => import("./components/AnalyticsReports/RevenueWaterfallChart"));
const MenuEngineering = lazy(() => import("./pages/analytics-reports/MenuEngineering"));
const ReportBuilder = lazy(() => import("./pages/analytics-reports/ReportBuilder"));
const CustomReportBuilder = lazy(() => import("./pages/analytics-reports/CustomReportBuilder"));
const SavedReports = lazy(() => import("./pages/analytics-reports/SavedReports"));
const SharedReport = lazy(() => import("./pages/SharedReport"));
const CancelledTransactions = lazy(() => import("./components/AnalyticsReports/salestransactions/cancelledtranscations"));
const Nonchargeebletranscation = lazy(() => import("./components/AnalyticsReports/salestransactions/nonchargebletranscation"));
const OnlineOrders = lazy(() => import("./components/AnalyticsReports/salestransactions/onlineorders"));
const AmountDuecompany = lazy(() => import("./components/AnalyticsReports/gstreports/amountduecompanyreports"));
const BsaleTranscation = lazy(() => import("./components/AnalyticsReports/gstreports/b2btranscationsale"));
const BLargesaleTranscation = lazy(() => import("./components/AnalyticsReports/gstreports/b2clargetransaction"));
const B2smallTrasaction = lazy(() => import("./components/AnalyticsReports/gstreports/b2smallsalesummary"));
const Hsnxreport = lazy(() => import("./components/AnalyticsReports/gstreports/hsnxreport"));
const CancelledSalesTranscations = lazy(() => import("./components/AnalyticsReports/salesitems/cancelledsalestranscations"));
const CoastFileTranscation = lazy(() => import("./components/AnalyticsReports/salesitems/coastfiletranscations"));
const SalesItemChannel = lazy(() => import("./components/AnalyticsReports/salesitems/salesitembychannel"));
const SalesItemChannelResource = lazy(() => import("./components/AnalyticsReports/salesitems/salesitembychannelresource"));
const SalesItemChannelSession = lazy(() => import("./components/AnalyticsReports/salesitems/salesitemssession"));
const SalesItemQuantityBranch = lazy(() => import("./components/AnalyticsReports/salesitems/salesitembybranch"));
const SalesItemHour = lazy(() => import("./components/AnalyticsReports/salesitems/salesitemshour"));
const SalesemItemByQuanitySession = lazy(() => import("./components/AnalyticsReports/salesitems/salesitemquanitysession"));
const SalesItemByBrand = lazy(() => import("./components/AnalyticsReports/salesitems/salesitemsbrand"));
const SalesItemByTranscation = lazy(() => import("./components/AnalyticsReports/salesitems/salesitembytranscation"));
const OrderByTransaction = lazy(() => import("./components/AnalyticsReports/salestransactions/orderbytranscations"));
const SalesByTransaction = lazy(() => import("./components/AnalyticsReports/salestransactions/salesbytransactions"));
const SalesAduitTransaction = lazy(() => import("./components/AnalyticsReports/salestransactions/salesaduittransactions"));
const RefundManagement = lazy(() => import("./pages/payments/RefundManagement"));
const Reconciliation = lazy(() => import("./pages/payments/Reconciliation"));
const UPIAutoPayManagement = lazy(() => import("./pages/subscriptions/UPIAutoPayManagement"));
const PaymentGatewaySettings = lazy(() => import("./pages/settings/PaymentGatewaySettings"));

export default function App() {
  // View mode state for TableView page
  const [tableViewMode, setTableViewMode] = useState<"grid" | "list">("grid");

  return (
    <ErrorBoundary>
      <ThemeProvider>
      <AuthProvider>
        <BranchProvider>
        <OrderProvider>
          <Routes>
      {/* Public routes - no authentication required */}
      <Route path="/login" element={<Login />} />
      <Route path="/shared-reports/:token" element={<SharedReport />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/check-email" element={<CheckEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/password-changed" element={<PasswordChanged />} />
      <Route path="/business-owner-login" element={<BusinessOwnerLogin />} />
      <Route path="/select-user" element={<SelectUser />} />
      <Route path="/user-login" element={<UserLogin />} />
      <Route path="/payment/success/:orderId" element={<PaymentSuccess />} />
      <Route path="/payment/failure/:orderId" element={<PaymentFailure />} />
      <Route path="website" element={<WebsiteLayout />} />
      <Route path="/websitefeatures" element={<CompleteRestaurantFeatures />} />
      <Route path="/websiteblog" element={<BlogPage />} />
      <Route path="/websitesupport" element={<SupportPage />} />
      <Route path="/websitetestimonial" element={<TestimonialsPage />} />
      <Route path="/websitepricing" element={<PricingPage />} />
      <Route path="/websitedemo" element={<ContactUsDemo />} />

      {/* Protected routes - authentication required */}
      <Route element={<ProtectedRoute />}>
      <Route path="/payments" element={<PaymentsHub />} />
      <Route path="/payments/refunds" element={<RefundManagement />} />
      <Route path="/payments/reconciliation" element={<Reconciliation />} />
      <Route path="/subscriptions/autopay" element={<UPIAutoPayManagement />} />
      <Route path="/business-settings/payment-gateway" element={<PaymentGatewaySettings />} />
      <Route path="/business-settings/roles" element={<RoleManagement />} />

      <Route path="/catalog" element={<CatalogLayout />}>
        <Route index element={<CatalogDashboard />} />
        <Route path="products" element={<CatalogProductsPage />}>
          <Route path="add" element={<AddProduct />} />
          <Route path="edit/:id" element={<AddProduct />} />
          <Route path="view/:id" element={<AddProduct />} />
        </Route>
        <Route path="channel-menu" element={<CatalogChannelMenu />} />
        <Route path="configuration" element={<CatalogConfiguration />} />
      </Route>
      <Route path="/customers" element={<CustomerLayout />}>
        <Route path="customer" element={<CustomersListing />} />
        <Route path="customerGroup" element={<CustomersGroup />} />
        <Route path="tags" element={<CustomersTags />} />
      </Route>
      <Route path="/purchaseorder" element={<PurchaseOrderLayout />}>
        <Route index element={<PurchaseOrderSuppliersList />} />
        <Route path="suppliers/add" element={<AddSupplier />} />
        <Route path="suppliers/edit/:id" element={<EditSupplier />} />
        <Route path="suppliers/view/:id" element={<ViewSupplier />} />

        <Route path="polist" element={<PurchaseOrderPOList />} />
        <Route path="polist/add" element={<AddPO />} />
        <Route path="polist/edit/:id" element={<EditPO />} />
        <Route path="polist/view/:id" element={<ViewPO />} />
      </Route>
      <Route path="/inventory" element={<InventoryLayout />}>
        <Route index element={<InventoryList />} />
        <Route path="addproduct" element={<AddInventoryProduct />} />
        <Route path="low-stock" element={<LowStockAlerts />} />
        <Route path="editproduct/:id" element={<AddInventoryProduct />} />
        <Route path="viewproduct/:id" element={<AddInventoryProduct />} />

      </Route>

      <Route path="/marketing" element={<MarketingPage />}>
        <Route path="discounts" element={<DiscountsList />} />
        <Route path="discounts/add" element={<CreateDiscount />} />
        <Route
          path="discounts/edit/:id"
          element={<EditDiscount />}
        />
        <Route path="advertisements" element={<AdvertisementsList />} />
        <Route path="advertisements/add" element={<CreateAdvertisement />} />
        <Route
          path="advertisements/view/:id"
          element={<ViewAdvertisement />}
        />
        <Route
          path="advertisements/edit/:id"
          element={<EditAdvertisement />}
        />
        <Route path="feedbackCampaign" element={<FeedbackFormsPage />} />
        <Route path="feedbackCampaign/add" element={<SubmitFeedbackForm />} />
        <Route
          path="feedbackCampaign/edit/:id"
          element={<EditFeedbackForm />}
        />
        <Route path="feedback_responses" element={<FeedbackResponsesList />} />
        <Route
          path="feedback_responses/:id"
          element={<FeedbackResponsesPage />}
        />
      </Route>
      {/* <Route path="/" element={<Dashboard />} /> */}
      <Route path="/" element={<MyAccount />} />
      <Route path="/bodashboard" element={<BODashboard />} />
      <Route path="/kds" element={<KitchenDisplaySystem />} />
      <Route path="/loyalty" element={<LoyaltyProgram />} />
      <Route path="/reviews" element={<Reviews />} />

      <Route path="/addproduct" element={<AddProduct />} />
      <Route path="/orderhistory" element={<OrderHistory />} />
      <Route path="/order-activity/paid/:orderId" element={<PaidOrderActivity />} />
<Route path="/order-activity/unpaid/:orderId" element={<UnpaidOrderActivity />} />
<Route path="/order-activity/due/:orderId" element={<DueOrderActivity />} />
      <Route path="/orderactivity" element={<OrderActivity />} />
      <Route
        path="/business-settings/taxes-payments"
        element={<TaxesPaymentsLayout />}
      >
        <Route index element={<TaxPage />} />
        <Route path="tax" element={<TaxPage />} />
        <Route path="tax-group" element={<TaxGroupPage />} />
        <Route path="payment-options" element={<PaymentOptionsPage />} />
      </Route>
      <Route path="/superAdminDashboard" element={<DashboardSummaryPage />} />
      <Route path="/business-settings" element={<GeneralSettingsLayout />}>
        <Route index element={<BusinessProfilePage />} />
        <Route path="business-profile" element={<BusinessProfilePage />} />
        <Route path="preferences" element={<PreferencesPage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
      </Route>
      <Route
        path="/business-settings/sales-settings"
        element={<SalesSettingsLayout />}
      >
        <Route index element={<SalesSettingsPage />} />
      </Route>
      <Route path="/business-settings/charges" element={<ChargesLayout />}>
        <Route index element={<ChargesPage />} />
      </Route>
      <Route path="/business-settings/reasons" element={<ReasonsLayout />}>
        <Route index element={<DiscountReasonsPage />} />
        <Route path="discount-reasons" element={<DiscountReasonsPage />} />
        <Route path="branch-close-reasons" element={<BranchCloseReasonsPage />} />
        <Route path="order-cancel-reasons" element={<OrderCancelReasonsPage />} />
        <Route path="refund-reasons" element={<RefundReasonsPage />} />
        <Route path="non-chargeable" element={<NonChargeableReasonsPage />} />
        <Route path="inventory-adjustments" element={<InventoryAdjustmentReasonsPage />} />
        <Route path="reservations" element={<ReservationReasonsPage />} />
        <Route path="sales-return" element={<SalesReturnReasonsPage />} />
      </Route>
      <Route path="/business-settings/integrations" element={<IntegrationSettings />} />
      <Route path="/business-settings/aggregator-integrations" element={<AggregatorConfigPage />} />
      <Route path="/my-account" element={<MyAccount />} />
      <Route path="/manage-password" element={<ManagePassword />} />
      <Route path="/businessowners" element={<BusinessOwnersLayout />}>
        <Route index element={<BusinessOwnersList />} />
        <Route
          path="create"
          element={<CreateBusinessOwner />}
        />

        <Route
          path="edit/:id"
          element={<CreateBusinessOwner />}
        />

        <Route
          path="view/:id"
          element={<CreateBusinessOwner />}
        />

        {/* <Route path="addbusinessowner" element={<CreateBusinessOwner />} /> */}
      </Route>
      <Route path="/orders" element={<OrdersListingPage />} />
      <Route path="/pos" element={<PointOfSaleLayout />}>
        <Route index element={<PointOfSale />} />

        <Route path="takeorder" element={<TakeOrder />} />

        <Route path="orderspage" element={<OdersPage />} />

        <Route
          path="tableview"
          element={
            <TableViewPage
              viewMode={tableViewMode}
              setViewMode={setTableViewMode}
            />
          }
        />

        <Route
          path="reservations"
          element={<ReservationsPage />}
        />
      </Route>

      <Route path="/reservation-list" element={<ReservationMain />} />
      <Route path="/reservations/add" element={<AddNewReservation />} />
      <Route path="/reservations/edit/:id" element={<EditReservation />} />
      <Route path="/reservations/view/:id" element={<ViewReservation />} />

      <Route path="/manage-resources" element={<ManageResourcesLayout />}>
        <Route index element={<Navigate to="staff" replace />} />

        <Route path="staff" element={<ManageStaffLayout />}>
          <Route index element={<StaffListingPage />} />
          <Route path="roles-permissions" element={<RolesPermissionsPage />} />
        </Route>

        <Route path="branches" element={<BranchesPage />} />
      </Route>

      <Route element={<SubscriptionPlansLayout />}>
        <Route path="/subscription-plans" element={<PlansPage />} />
        <Route path="/subscription-plans/create" element={<CreatePlanPage />} />
        <Route
          path="/subscription-plans/edit/:id"
          element={<SubscriptionEditPlan />}
        />
      </Route>

      {/* Contact Requests */}
      <Route path="/contact-requests" element={<ContactRequestsPage />} />

      <Route path="/staff-management" element={<Navigate to="/manage-resources/staff" replace />} />
      <Route path="/staff-management/roles" element={<Navigate to="/manage-resources/staff/roles-permissions" replace />} />
      <Route path="/staff-management/create" element={<StaffCreatePage />} />
      <Route path="/staff-management/edit/:id" element={<StaffCreatePage />} />
      <Route
        path="/staff-management/roles-permissions/create"
        element={<StaffCreateRolePage />}
      />
      <Route
        path="/staff-management/roles-permissions/edit/:id"
        element={<StaffCreateRolePage />}
      />
      <Route path="analytics-reports" element={<AnalyticsReports />}>
        <Route path="sales-summary" element={<SalesSummary />} />
        <Route
          path="sales-summary-by-branch"
          element={<SalesSummaryByBranch />}
        />
        <Route
          path="sales-summary-by-branch-label"
          element={<SalesSummaryByBranchLabel />}
        />
        <Route
          path="sales-summary-by-channel"
          element={<SalesSummaryByChannel />}
        />
        <Route
          path="sales-summary-by-brand"
          element={<SalesSummaryByBrand />}
        />
        <Route
          path="sales-summary-by-day-of-week"
          element={<SalesSummaryByDayOfWeek />}
        />
        <Route
          path="sales-summary-by-session"
          element={<SalesSummaryBySession />}
        />
        <Route path="sales-summary-by-hour" element={<SalesSummaryByHour />} />
        <Route
          path="sales-summary-by-branch-and-time"
          element={<SalesSummaryByBranchAndTime />}
        />
        <Route path="sales-by-metrics" element={<SalesByMetrics />} />
        <Route path="sales-by-brand" element={<SalesByBrand />} />
        <Route path="sales-trend" element={<SalesTrend />} />
        <Route path="revenue-waterfall" element={<RevenueWaterfallChart />} />
        <Route path="location-comparison" element={<LocationComparison />} />

        <Route path="sales-by-resource" element={<SalesByResource />} />
        <Route path="staff-performance" element={<StaffPerformanceAnalytics />} />
        <Route path="sales-by-customer" element={<SalesByCustomer />} />

        <Route
          path="aggregators-activity-log"
          element={<AggregatorsActivityLog />}
        />
        <Route path="discount-by-products" element={<DiscountByProducts />} />
        <Route
          path="discounts-by-transaction"
          element={<DiscountsByTransaction />}
        />
        <Route path="discount-analytics" element={<DiscountAnalyticsPage />} />
        <Route path="feedback-analytics" element={<FeedbackResponseAnalytics />} />
        <Route
          path="product-unavailability-time"
          element={<ProductUnavailabilityTime />}
        />
        <Route
          path="product-unavailability-time-in-aggregators"
          element={<ProductUnavailabilityTimeInAggregators />}
        />
        <Route path="payments" element={<Payments />} />
        <Route
          path="bistro-bill-card-summary"
          element={<BistroBillCardSummary />}
        />
        <Route
          path="bistro-bill-card-transactions-report"
          element={<BistroBillCardTransactionReport />}
        />
        <Route path="sale-commission" element={<SaleCommission />} />
        <Route path="settings-audit-log" element={<SettingsAuditLog />} />
        <Route path="user-activity-audit-log" element={<UserActivityAuditLog />} />
        <Route
          path="swiggy-customer-complaint-report"
          element={<SwiggyCustomerComplaintReport />}
        />
        <Route path="table-reservations" element={<TableReservations />} />
        <Route
          path="zomato-customer-complaint-report"
          element={<ZomatoCustomerComplaintReport />}
        />
        <Route path="p-and-l-statement" element={<PAndLStatement />} />
        <Route path="transaction-reports" element={<TransactionReports />} />
        <Route
          path="amount-due-to-suppliers"
          element={<AmountDueToSuppliers />}
        />
        <Route
          path="branch-wise-assigned-restock"
          element={<BranchwiseRestockReport />}
        />
        <Route
          path="branch-wise-supplier"
          element={<BranchwiseSuppliersReport />}
        />
        <Route
          path="purchase-order-payment"
          element={<PurchaseOrdersReport />}
        />
        <Route
          path="purchase-order-report"
          element={<PurchaseOrderPaymentReport />}
        />
        <Route path="reservation-report" element={<ReservationReport />} />
        <Route path="inventory-report" element={<InventoryReport />} />
        <Route path="supplier-performance" element={<SupplierPerformanceAnalytics />} />
        <Route path="stockout-predictions" element={<StockoutPredictions />} />
        <Route path="cohort-analysis" element={<CohortAnalysis />} />
        <Route path="sales-heatmap" element={<SalesHeatmap />} />
        <Route path="product-trends" element={<ProductTrends />} />
        <Route path="menu-engineering" element={<MenuEngineering />} />
        <Route path="report-comparison" element={<ReportBuilder />} />
        <Route path="custom-report-builder" element={<CustomReportBuilder />} />
        <Route path="saved-reports" element={<SavedReports />} />
        <Route path="cancelled" element={<CancelledTransactions />} />
        <Route path="non-chargeable" element={<Nonchargeebletranscation />} />
        <Route path="online-orders" element={<OnlineOrders />} />

        <Route path="amount-due-company" element={<AmountDuecompany />} />
        <Route path="b2b-sales" element={<BsaleTranscation />} />
        <Route path="b2c-large" element={<BLargesaleTranscation />} />
        <Route path="b2c-small" element={<B2smallTrasaction />} />
        <Route path="hsn-report" element={<Hsnxreport />} />
        <Route path="order-report" element={<OrderByTransaction />} />
        <Route path="sal-transaction" element={<SalesByTransaction />} />
        <Route
          path="saladuit-transactions"
          element={<SalesAduitTransaction />}
        />
        <Route
          path="cancelledsales-transactions"
          element={<CancelledSalesTranscations />}
        />
        <Route path="coastfiletranscation" element={<CoastFileTranscation />} />
        <Route path="salesitembychannel" element={<SalesItemChannel />} />
        <Route
          path="salesitemchannelresource"
          element={<SalesItemChannelResource />}
        />
        <Route path="salesitemsession" element={<SalesItemChannelSession />} />
        <Route
          path="salesitemquantitybranch"
          element={<SalesItemQuantityBranch />}
        />
        <Route path="salesitemhour" element={<SalesItemHour />} />
        <Route
          path="salesemitembyquanitysession"
          element={<SalesemItemByQuanitySession />}
        />
        <Route path="salesitembybrand" element={<SalesItemByBrand />} />
        <Route
          path="salesitembytranscation"
          element={<SalesItemByTranscation />}
        />
      </Route>

      <Route path="/blog-management" element={<BlogsPage />} />
      <Route
        path="/blog-management/categories"
        element={<BlogCategoriesPage />}
      />
      <Route path="/blog-management/create" element={<CreateBlogPage />} />
      <Route path="/blog-management/edit/:id" element={<CreateBlogPage />} />
      <Route path="/blog-management/view/:id" element={<CreateBlogPage />} />

      <Route
        path="/blog-management/categories/create"
        element={<CreateBlogCategoryPage />}
      />
      <Route
        path="/blog-management/categories/:id/edit"
        element={<CreateBlogCategoryPage />}
      />
      <Route
        path="/blog-management/categories/:id/view"
        element={<CreateBlogCategoryPage />}
      />

      <Route path="/blog-management/tags" element={<BlogTagsPage />} />
      <Route
        path="/blog-management/tags/create"
        element={<CreateBlogTagPage />}
      />
      <Route
        path="/blog-management/tags/:id/edit"
        element={<CreateBlogTagPage />}
      />
      <Route
        path="/blog-management/tags/:id/view"
        element={<CreateBlogTagPage />}
      />

      <Route path="/settings" element={<SettingsPage />}>
        <Route index element={<BasicSettings />} />
        <Route path="password" element={<ManagePasswordSettings />} />
        <Route path="menu-config" element={<MenuConfigPage />} />
      </Route>

      {/* // Master Data - Allergies Page */}
      <Route path="/master-data" element={<MasterDataLayout />}>
        <Route index element={<AllergiesPage />} />
        <Route path="allergies/create" element={<CreateAllergyPage />} />
        <Route path="allergies/edit/:id" element={<CreateAllergyPage />} />
        <Route path="measuring-units" element={<MeasuringPage />} />
        <Route
          path="measuring-units/create"
          element={<CreateMeasuringPage />}
        />
        <Route
          path="measuring-units/edit/:id"
          element={<CreateMeasuringPage />}
        />
        <Route path="taxes" element={<MasterTaxPage />} />
        <Route path="taxes/create" element={<CreateTaxPage />} />
        <Route path="taxes/edit/:id" element={<CreateTaxPage />} />
        <Route path="taxgroup" element={<MasterTaxGroupPage />} />
        <Route path="taxgroup/create" element={<CreateTaxGroupPage />} />
        <Route path="taxgroup/edit/:id" element={<CreateTaxGroupPage />} />
      </Route>
      {/* <Route
          path="/master-data/allergies/edit/:id"
          element={<EditAllergyPage />}
        /> */}
      </Route>{/* end ProtectedRoute */}
        </Routes>
        </OrderProvider>
        </BranchProvider>
      </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

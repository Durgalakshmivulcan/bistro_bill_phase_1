--
-- PostgreSQL database dump
--

\restrict t4gTCcxnzHvcvaP2uE5BbCjKhCIN0rXmqqB9wn4kVLessWGLb70U9MrgcD8ed4Y

-- Dumped from database version 14.20 (Homebrew)
-- Dumped by pg_dump version 14.20 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AuditUserType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuditUserType" AS ENUM (
    'SuperAdmin',
    'BusinessOwner',
    'Staff'
);


--
-- Name: AutoPayStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AutoPayStatus" AS ENUM (
    'Created',
    'Authenticated',
    'Active',
    'Paused',
    'Cancelled',
    'Completed',
    'Expired'
);


--
-- Name: BlogStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BlogStatus" AS ENUM (
    'Draft',
    'Published'
);


--
-- Name: ChargeApplyTo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ChargeApplyTo" AS ENUM (
    'All',
    'DineIn',
    'TakeAway',
    'Delivery'
);


--
-- Name: ChargeType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ChargeType" AS ENUM (
    'Percentage',
    'Fixed'
);


--
-- Name: CustomerType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CustomerType" AS ENUM (
    'Regular',
    'Corporate',
    'VIP'
);


--
-- Name: DiscountType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DiscountType" AS ENUM (
    'ProductCategory',
    'OrderType',
    'Custom'
);


--
-- Name: DiscountValueType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DiscountValueType" AS ENUM (
    'Percentage',
    'Fixed',
    'BOGO'
);


--
-- Name: FloorType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."FloorType" AS ENUM (
    'AC',
    'NonAC',
    'Outdoor',
    'Family'
);


--
-- Name: GatewayProvider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."GatewayProvider" AS ENUM (
    'Razorpay',
    'Stripe',
    'PayU'
);


--
-- Name: IntegrationProvider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."IntegrationProvider" AS ENUM (
    'tally',
    'quickbooks',
    'zoho_books',
    'dunzo',
    'porter',
    'whatsapp_business',
    'sms_gateway',
    'google_my_business',
    'email_marketing',
    'loyalty_points',
    'hubspot',
    'salesforce',
    'slack',
    'supplier_portal',
    'cctv',
    'pos_hardware',
    'biometric',
    'voice_ordering'
);


--
-- Name: IntegrationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."IntegrationStatus" AS ENUM (
    'active',
    'inactive',
    'error'
);


--
-- Name: IntegrationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."IntegrationType" AS ENUM (
    'accounting',
    'delivery',
    'marketing',
    'payment',
    'review_management',
    'loyalty',
    'crm',
    'notifications',
    'inventory',
    'security',
    'hardware',
    'attendance',
    'voice_assistant'
);


--
-- Name: KOTStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."KOTStatus" AS ENUM (
    'New',
    'Preparing',
    'Ready',
    'Served'
);


--
-- Name: LeadStage; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LeadStage" AS ENUM (
    'NewRequest',
    'InitialContacted',
    'ScheduledDemo',
    'Completed',
    'ClosedWin',
    'ClosedLoss'
);


--
-- Name: OnlineOrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OnlineOrderStatus" AS ENUM (
    'Pending',
    'Accepted',
    'Rejected',
    'Preparing',
    'Ready',
    'Completed'
);


--
-- Name: OnlinePaymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OnlinePaymentStatus" AS ENUM (
    'Created',
    'Processing',
    'Completed',
    'Failed',
    'Refunded',
    'PartiallyRefunded'
);


--
-- Name: OrderAggregator; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderAggregator" AS ENUM (
    'BistroBill',
    'Swiggy',
    'Zomato',
    'UberEats'
);


--
-- Name: OrderItemStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderItemStatus" AS ENUM (
    'Pending',
    'Preparing',
    'Ready',
    'Served',
    'Cancelled'
);


--
-- Name: OrderSource; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderSource" AS ENUM (
    'BistroBill',
    'Zomato',
    'Swiggy',
    'UberEats',
    'VoiceAssistant'
);


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'Pending',
    'Confirmed',
    'Preparing',
    'Ready',
    'Served',
    'Completed',
    'Cancelled'
);


--
-- Name: OrderType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderType" AS ENUM (
    'DineIn',
    'TakeAway',
    'Delivery',
    'Catering',
    'Subscription'
);


--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'Unpaid',
    'PartiallyPaid',
    'Paid'
);


--
-- Name: PaymentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PaymentType" AS ENUM (
    'Cash',
    'Card',
    'UPI',
    'Wallet',
    'Other'
);


--
-- Name: ProductType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ProductType" AS ENUM (
    'Regular',
    'Combo',
    'Retail'
);


--
-- Name: PurchaseOrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PurchaseOrderStatus" AS ENUM (
    'Pending',
    'Approved',
    'Declined',
    'Received'
);


--
-- Name: ReasonType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReasonType" AS ENUM (
    'Discount',
    'BranchClose',
    'OrderCancel',
    'Refund',
    'NonChargeable',
    'InventoryAdjustment',
    'Reservation',
    'SalesReturn'
);


--
-- Name: ReconciliationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReconciliationStatus" AS ENUM (
    'Pending',
    'Reconciled',
    'Disputed',
    'Settled'
);


--
-- Name: RefundStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RefundStatus" AS ENUM (
    'Initiated',
    'Processing',
    'Completed',
    'Failed'
);


--
-- Name: ReservationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReservationStatus" AS ENUM (
    'Pending',
    'Confirmed',
    'Cancelled',
    'Completed'
);


--
-- Name: TableShape; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TableShape" AS ENUM (
    'square',
    'long',
    'round'
);


--
-- Name: TableStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TableStatus" AS ENUM (
    'available',
    'running',
    'reserved',
    'maintenance'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Advertisement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Advertisement" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    title text NOT NULL,
    description text,
    image text,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    status text DEFAULT 'active'::text NOT NULL,
    impressions integer DEFAULT 0 NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    conversions integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AdvertisementDiscount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AdvertisementDiscount" (
    "advertisementId" text NOT NULL,
    "discountId" text NOT NULL
);


--
-- Name: Aggregator; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Aggregator" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    logo text,
    "merchantId" text,
    "apiKey" text,
    "apiEndpoint" text,
    "callbackUrl" text,
    "isConnected" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Allergen; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Allergen" (
    id text NOT NULL,
    name text NOT NULL,
    icon text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "businessOwnerId" text,
    "userId" text NOT NULL,
    "userType" public."AuditUserType" NOT NULL,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text,
    "oldValue" jsonb,
    "newValue" jsonb,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Blog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Blog" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "categoryId" text NOT NULL,
    "authorId" text,
    title text NOT NULL,
    slug text NOT NULL,
    content text NOT NULL,
    excerpt text,
    "featuredImage" text,
    "featuredImageAlt" text,
    author text,
    status public."BlogStatus" DEFAULT 'Draft'::public."BlogStatus" NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: BlogCategory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BlogCategory" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: BlogRevision; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BlogRevision" (
    id text NOT NULL,
    "blogId" text NOT NULL,
    content text NOT NULL,
    title text NOT NULL,
    excerpt text,
    "authorId" text,
    "authorName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: BlogTag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BlogTag" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Branch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Branch" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "parentBranchId" text,
    name text NOT NULL,
    code text,
    phone text,
    email text,
    address text,
    city text,
    state text,
    country text,
    "zipCode" text,
    "isMainBranch" boolean DEFAULT false NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Brand; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Brand" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    image text,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: BusinessHours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BusinessHours" (
    id text NOT NULL,
    "branchId" text NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "openTime" text NOT NULL,
    "closeTime" text NOT NULL,
    "isClosed" boolean DEFAULT false NOT NULL
);


--
-- Name: BusinessOwner; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BusinessOwner" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "ownerName" text NOT NULL,
    "restaurantName" text NOT NULL,
    phone text,
    "businessType" text,
    "tinGstNumber" text,
    avatar text,
    country text,
    state text,
    city text,
    "zipCode" text,
    address text,
    "planId" text,
    "subscriptionStartDate" timestamp(3) without time zone,
    "subscriptionEndDate" timestamp(3) without time zone,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: BusinessPreference; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BusinessPreference" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    timezone text DEFAULT 'Asia/Kolkata'::text NOT NULL,
    "dateFormat" text DEFAULT 'DD/MM/YYYY'::text NOT NULL,
    "invoicePrefix" text DEFAULT 'INV'::text NOT NULL,
    "kotPrefix" text DEFAULT 'KOT'::text NOT NULL,
    "autoAcceptOrders" boolean DEFAULT false NOT NULL,
    "enableReservations" boolean DEFAULT true NOT NULL,
    settings jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    image text,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Charge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Charge" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    type public."ChargeType" DEFAULT 'Fixed'::public."ChargeType" NOT NULL,
    value numeric(10,2) NOT NULL,
    "applyTo" public."ChargeApplyTo" DEFAULT 'All'::public."ChargeApplyTo" NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CustomReport; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CustomReport" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    description text,
    "reportType" text NOT NULL,
    filters jsonb NOT NULL,
    columns jsonb NOT NULL,
    schedule jsonb,
    "createdBy" text NOT NULL,
    "lastRunAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Customer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Customer" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    gender text,
    dob timestamp(3) without time zone,
    type public."CustomerType" DEFAULT 'Regular'::public."CustomerType" NOT NULL,
    gstin text,
    "totalSpent" numeric(10,2) DEFAULT 0 NOT NULL,
    "customerGroupId" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "loyaltyPoints" integer DEFAULT 0 NOT NULL
);


--
-- Name: CustomerGroup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CustomerGroup" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    color text DEFAULT '#3B82F6'::text NOT NULL,
    rules jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CustomerReview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CustomerReview" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "externalReviewId" text NOT NULL,
    source text DEFAULT 'google'::text NOT NULL,
    "reviewerName" text NOT NULL,
    rating integer NOT NULL,
    comment text,
    "replyText" text,
    "repliedAt" timestamp(3) without time zone,
    "publishedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CustomerTag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CustomerTag" (
    "customerId" text NOT NULL,
    "tagId" text NOT NULL
);


--
-- Name: Discount; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Discount" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    code text,
    name text NOT NULL,
    description text,
    type public."DiscountType" DEFAULT 'Custom'::public."DiscountType" NOT NULL,
    "valueType" public."DiscountValueType" DEFAULT 'Percentage'::public."DiscountValueType" NOT NULL,
    value numeric(10,2) NOT NULL,
    "minOrderAmount" numeric(10,2),
    "maxDiscount" numeric(10,2),
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "usageLimit" integer,
    "usedCount" integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: DiscountCategory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DiscountCategory" (
    "discountId" text NOT NULL,
    "categoryId" text NOT NULL
);


--
-- Name: DiscountProduct; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DiscountProduct" (
    "discountId" text NOT NULL,
    "productId" text NOT NULL
);


--
-- Name: FeedbackForm; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FeedbackForm" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    title text NOT NULL,
    description text,
    questions jsonb NOT NULL,
    "qrCode" text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: FeedbackResponse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FeedbackResponse" (
    id text NOT NULL,
    "feedbackFormId" text NOT NULL,
    "customerId" text,
    responses jsonb NOT NULL,
    rating integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Floor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Floor" (
    id text NOT NULL,
    "branchId" text NOT NULL,
    name text NOT NULL,
    type public."FloorType" DEFAULT 'NonAC'::public."FloorType" NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Integration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Integration" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    provider public."IntegrationProvider" NOT NULL,
    type public."IntegrationType" NOT NULL,
    config jsonb NOT NULL,
    status public."IntegrationStatus" DEFAULT 'inactive'::public."IntegrationStatus" NOT NULL,
    "lastSyncAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: IntegrationLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."IntegrationLog" (
    id text NOT NULL,
    "integrationId" text NOT NULL,
    action text NOT NULL,
    status text NOT NULL,
    "requestPayload" jsonb,
    "responsePayload" jsonb,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: InventoryProduct; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InventoryProduct" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "branchId" text NOT NULL,
    name text NOT NULL,
    image text,
    "supplierId" text,
    "inStock" numeric(10,2) DEFAULT 0 NOT NULL,
    "quantitySold" numeric(10,2) DEFAULT 0 NOT NULL,
    "restockAlert" numeric(10,2),
    "costPrice" numeric(10,2) NOT NULL,
    "sellingPrice" numeric(10,2) NOT NULL,
    "expiryDate" timestamp(3) without time zone,
    unit text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Kitchen; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Kitchen" (
    id text NOT NULL,
    "branchId" text NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Lead; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Lead" (
    id text NOT NULL,
    "restaurantName" text NOT NULL,
    "ownerName" text NOT NULL,
    email text NOT NULL,
    phone text,
    "businessType" text,
    "inquiryType" text,
    country text,
    state text,
    city text,
    "zipCode" text,
    address text,
    description text,
    stage public."LeadStage" DEFAULT 'NewRequest'::public."LeadStage" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LoyaltyTransaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LoyaltyTransaction" (
    id text NOT NULL,
    "customerId" text NOT NULL,
    "branchId" text NOT NULL,
    "businessOwnerId" text NOT NULL,
    type text NOT NULL,
    points integer NOT NULL,
    description text,
    "orderId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: MeasuringUnit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MeasuringUnit" (
    id text NOT NULL,
    quantity text NOT NULL,
    unit text NOT NULL,
    symbol text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Menu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Menu" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: MenuVisibility; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MenuVisibility" (
    id text NOT NULL,
    "userType" text NOT NULL,
    "menuKey" text NOT NULL,
    "isVisible" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OnlineOrder; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OnlineOrder" (
    id text NOT NULL,
    "branchId" text NOT NULL,
    aggregator public."OrderAggregator" DEFAULT 'BistroBill'::public."OrderAggregator" NOT NULL,
    "externalOrderId" text,
    status public."OnlineOrderStatus" DEFAULT 'Pending'::public."OnlineOrderStatus" NOT NULL,
    "customerName" text NOT NULL,
    "customerPhone" text NOT NULL,
    items jsonb NOT NULL,
    amount numeric(10,2) NOT NULL,
    "deliveryTime" timestamp(3) without time zone,
    "prepTime" integer,
    "receivedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "acceptedAt" timestamp(3) without time zone,
    "rejectedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OnlinePayment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OnlinePayment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    "gatewayProvider" public."GatewayProvider" NOT NULL,
    "gatewayTransactionId" text,
    "gatewayOrderId" text,
    status public."OnlinePaymentStatus" DEFAULT 'Created'::public."OnlinePaymentStatus" NOT NULL,
    "paymentMethod" text,
    "failureReason" text,
    metadata jsonb,
    "paidAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "branchId" text NOT NULL,
    "orderNumber" text NOT NULL,
    type public."OrderType" DEFAULT 'DineIn'::public."OrderType" NOT NULL,
    source public."OrderSource" DEFAULT 'BistroBill'::public."OrderSource" NOT NULL,
    "tableId" text,
    "customerId" text,
    "staffId" text NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    "discountAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    "discountId" text,
    "chargesAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    "taxAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) NOT NULL,
    "paidAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    "dueAmount" numeric(10,2) DEFAULT 0 NOT NULL,
    "paymentStatus" public."PaymentStatus" DEFAULT 'Unpaid'::public."PaymentStatus" NOT NULL,
    "orderStatus" public."OrderStatus" DEFAULT 'Pending'::public."OrderStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    "variantId" text,
    name text NOT NULL,
    quantity integer NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL,
    "totalPrice" numeric(10,2) NOT NULL,
    status public."OrderItemStatus" DEFAULT 'Pending'::public."OrderItemStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OrderItemAddon; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrderItemAddon" (
    id text NOT NULL,
    "orderItemId" text NOT NULL,
    "addonId" text NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL
);


--
-- Name: OrderKOT; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrderKOT" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "kitchenId" text NOT NULL,
    "kotNumber" text NOT NULL,
    status public."KOTStatus" DEFAULT 'New'::public."KOTStatus" NOT NULL,
    "printedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: OrderPayment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrderPayment" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "paymentOptionId" text NOT NULL,
    amount numeric(10,2) NOT NULL,
    reference text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: OrderTimeline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrderTimeline" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    action text NOT NULL,
    description text,
    "staffId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PaymentGatewayConfig; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PaymentGatewayConfig" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    provider public."GatewayProvider" NOT NULL,
    "apiKey" text NOT NULL,
    "apiSecret" text NOT NULL,
    "webhookSecret" text,
    "isActive" boolean DEFAULT false NOT NULL,
    "isTestMode" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PaymentOption; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PaymentOption" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    type public."PaymentType" DEFAULT 'Cash'::public."PaymentType" NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PaymentReconciliation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PaymentReconciliation" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "settlementDate" date NOT NULL,
    "gatewayProvider" public."GatewayProvider" NOT NULL,
    "totalAmount" numeric(12,2) NOT NULL,
    "settledAmount" numeric(12,2) NOT NULL,
    fees numeric(10,2) DEFAULT 0 NOT NULL,
    "transactionCount" integer DEFAULT 0 NOT NULL,
    status public."ReconciliationStatus" DEFAULT 'Pending'::public."ReconciliationStatus" NOT NULL,
    "reconciledAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Permission" (
    id text NOT NULL,
    module text NOT NULL,
    action text NOT NULL,
    resource text,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PermissionAuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PermissionAuditLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    resource text NOT NULL,
    "resourceId" text,
    granted boolean NOT NULL,
    "deniedReason" text,
    "ipAddress" text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    sku text,
    type public."ProductType" DEFAULT 'Regular'::public."ProductType" NOT NULL,
    "categoryId" text,
    "subCategoryId" text,
    "brandId" text,
    "menuId" text,
    description text,
    "shortCode" text,
    "hsnCode" text,
    "preparationTime" integer,
    "servesCount" integer,
    "isVeg" boolean DEFAULT true NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ProductAddon; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductAddon" (
    id text NOT NULL,
    "productId" text NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ProductAllergen; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductAllergen" (
    "productId" text NOT NULL,
    "allergenId" text NOT NULL
);


--
-- Name: ProductImage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductImage" (
    id text NOT NULL,
    "productId" text NOT NULL,
    url text NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ProductKitchen; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductKitchen" (
    "productId" text NOT NULL,
    "kitchenId" text NOT NULL
);


--
-- Name: ProductNutrition; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductNutrition" (
    id text NOT NULL,
    "productId" text NOT NULL,
    calories integer,
    protein numeric(10,2),
    carbs numeric(10,2),
    fat numeric(10,2),
    fiber numeric(10,2),
    sugar numeric(10,2),
    sodium numeric(10,2),
    vitamins jsonb,
    minerals jsonb
);


--
-- Name: ProductPrice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductPrice" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "variantId" text,
    "channelType" text NOT NULL,
    "basePrice" numeric(10,2) NOT NULL,
    "discountPrice" numeric(10,2),
    "taxGroupId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ProductTag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductTag" (
    "productId" text NOT NULL,
    "tagId" text NOT NULL
);


--
-- Name: ProductVariant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductVariant" (
    id text NOT NULL,
    "productId" text NOT NULL,
    name text NOT NULL,
    sku text,
    "additionalPrice" numeric(10,2) DEFAULT 0 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PurchaseOrder; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PurchaseOrder" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "branchId" text NOT NULL,
    "supplierId" text NOT NULL,
    "invoiceNumber" text,
    "amountPaid" numeric(10,2) DEFAULT 0 NOT NULL,
    "grandTotal" numeric(10,2) NOT NULL,
    status public."PurchaseOrderStatus" DEFAULT 'Pending'::public."PurchaseOrderStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PurchaseOrderItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PurchaseOrderItem" (
    id text NOT NULL,
    "purchaseOrderId" text NOT NULL,
    "inventoryProductId" text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    "unitPrice" numeric(10,2) NOT NULL,
    "totalPrice" numeric(10,2) NOT NULL
);


--
-- Name: Reason; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Reason" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    type public."ReasonType" NOT NULL,
    text text NOT NULL,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Refund; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Refund" (
    id text NOT NULL,
    "onlinePaymentId" text NOT NULL,
    amount numeric(10,2) NOT NULL,
    reason text,
    status public."RefundStatus" DEFAULT 'Initiated'::public."RefundStatus" NOT NULL,
    "gatewayRefundId" text,
    "processedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ReportComment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ReportComment" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "reportType" text NOT NULL,
    "reportConfig" jsonb NOT NULL,
    "userId" text NOT NULL,
    "userName" text NOT NULL,
    comment text NOT NULL,
    mentions jsonb,
    "editedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ReportShare; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ReportShare" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "reportType" text NOT NULL,
    "reportConfig" jsonb NOT NULL,
    "reportData" jsonb NOT NULL,
    "shareToken" text NOT NULL,
    password text,
    "expiresAt" timestamp(3) without time zone,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ReportTemplate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ReportTemplate" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "reportType" text NOT NULL,
    filters jsonb NOT NULL,
    columns jsonb NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Reservation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Reservation" (
    id text NOT NULL,
    "branchId" text NOT NULL,
    "tableId" text,
    "roomId" text,
    "customerId" text,
    "customerName" text NOT NULL,
    "customerPhone" text NOT NULL,
    date date NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "guestCount" integer DEFAULT 1 NOT NULL,
    status public."ReservationStatus" DEFAULT 'Pending'::public."ReservationStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Role" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    description text,
    permissions jsonb NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL,
    "parentRoleId" text,
    level integer DEFAULT 5 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RolePermission" (
    id text NOT NULL,
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL,
    granted boolean DEFAULT true NOT NULL
);


--
-- Name: Room; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Room" (
    id text NOT NULL,
    "branchId" text NOT NULL,
    name text NOT NULL,
    capacity integer DEFAULT 10 NOT NULL,
    "hourlyRate" numeric(10,2),
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SalesAnomaly; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SalesAnomaly" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "branchId" text DEFAULT ''::text NOT NULL,
    date date NOT NULL,
    type text NOT NULL,
    "actualValue" numeric(12,2) NOT NULL,
    "expectedValue" numeric(12,2) NOT NULL,
    deviation numeric(10,2) NOT NULL,
    "standardDeviations" numeric(6,2) NOT NULL,
    resolved boolean DEFAULT false NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SalesChannel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SalesChannel" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ScheduledReport; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ScheduledReport" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "customReportId" text NOT NULL,
    frequency text NOT NULL,
    "time" text NOT NULL,
    "dayOfWeek" integer,
    "dayOfMonth" integer,
    emails jsonb NOT NULL,
    format text DEFAULT 'CSV'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastSentAt" timestamp(3) without time zone,
    "nextRunAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SecurityCamera; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SecurityCamera" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "branchId" text NOT NULL,
    name text NOT NULL,
    location text NOT NULL,
    "cameraId" text NOT NULL,
    "streamUrl" text,
    "nvrHost" text,
    "nvrPort" integer,
    protocol text DEFAULT 'http'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Staff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Staff" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "branchId" text NOT NULL,
    "roleId" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    phone text,
    avatar text,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: StaffAttendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StaffAttendance" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "branchId" text NOT NULL,
    "staffId" text NOT NULL,
    "punchType" text NOT NULL,
    "punchTime" timestamp(3) without time zone NOT NULL,
    "deviceId" text,
    "verifyMode" text,
    "workHours" double precision,
    "shiftDate" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: StockAdjustment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StockAdjustment" (
    id text NOT NULL,
    "inventoryProductId" text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "userId" text NOT NULL,
    "userType" public."AuditUserType" NOT NULL,
    "oldStock" numeric(10,2) NOT NULL,
    "newStock" numeric(10,2) NOT NULL,
    adjustment numeric(10,2) NOT NULL,
    reason text,
    undone boolean DEFAULT false NOT NULL,
    "undoneAt" timestamp(3) without time zone,
    "undoneBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: SubCategory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SubCategory" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "categoryId" text NOT NULL,
    name text NOT NULL,
    image text,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SubscriptionPlan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SubscriptionPlan" (
    id text NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    duration integer NOT NULL,
    "trialDays" integer DEFAULT 0 NOT NULL,
    features jsonb NOT NULL,
    "maxBranches" integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SuperAdmin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SuperAdmin" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    phone text,
    avatar text,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Supplier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Supplier" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    code text,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    "gstNumber" text,
    "tinNumber" text,
    "taxStateCode" text,
    "bankAccount" text,
    "bankName" text,
    "bankBranch" text,
    "ifscCode" text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SupplierContact; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SupplierContact" (
    id text NOT NULL,
    "supplierId" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SupplierRating; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SupplierRating" (
    id text NOT NULL,
    "supplierId" text NOT NULL,
    "businessOwnerId" text NOT NULL,
    rating integer NOT NULL,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Table; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Table" (
    id text NOT NULL,
    "floorId" text NOT NULL,
    label text NOT NULL,
    shape public."TableShape" DEFAULT 'square'::public."TableShape" NOT NULL,
    chairs integer DEFAULT 4 NOT NULL,
    status public."TableStatus" DEFAULT 'available'::public."TableStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Tag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Tag" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    color text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Tax; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Tax" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    symbol text,
    percentage numeric(5,2) NOT NULL,
    country text,
    state text,
    city text,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TaxGroup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TaxGroup" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TaxGroupItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TaxGroupItem" (
    "taxGroupId" text NOT NULL,
    "taxId" text NOT NULL
);


--
-- Name: UPIAutoPaySubscription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UPIAutoPaySubscription" (
    id text NOT NULL,
    "businessOwnerId" text NOT NULL,
    "planId" text NOT NULL,
    "customerId" text,
    "gatewaySubscriptionId" text,
    "gatewayProvider" public."GatewayProvider" DEFAULT 'Razorpay'::public."GatewayProvider" NOT NULL,
    "upiId" text,
    amount numeric(10,2) NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    "interval" text DEFAULT 'monthly'::text NOT NULL,
    status public."AutoPayStatus" DEFAULT 'Created'::public."AutoPayStatus" NOT NULL,
    "currentStart" timestamp(3) without time zone,
    "currentEnd" timestamp(3) without time zone,
    "nextBillingDate" timestamp(3) without time zone,
    "totalCount" integer,
    "paidCount" integer DEFAULT 0 NOT NULL,
    "failedCount" integer DEFAULT 0 NOT NULL,
    "lastPaymentAt" timestamp(3) without time zone,
    "lastPaymentId" text,
    "failureReason" text,
    metadata jsonb,
    "cancelledAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: UserRoleAssignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UserRoleAssignment" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "roleId" text NOT NULL,
    "branchId" text,
    "kitchenId" text,
    "expiresAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: _BlogToBlogTag; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_BlogToBlogTag" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: Advertisement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Advertisement" (id, "businessOwnerId", title, description, image, "startDate", "endDate", status, impressions, clicks, conversions, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AdvertisementDiscount; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AdvertisementDiscount" ("advertisementId", "discountId") FROM stdin;
\.


--
-- Data for Name: Aggregator; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Aggregator" (id, "businessOwnerId", name, logo, "merchantId", "apiKey", "apiEndpoint", "callbackUrl", "isConnected", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Allergen; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Allergen" (id, name, icon, "createdAt") FROM stdin;
7675b477-616a-4b5b-9764-7a2717d39ddf	Peanuts	peanut	2026-02-07 03:29:58.595
794877f1-1f44-414b-80a0-61dff19ba433	Tree Nuts	tree-nut	2026-02-07 03:29:58.595
793fcceb-4ef1-42c8-b859-e65b85424f5f	Milk	milk	2026-02-07 03:29:58.595
f1d2d762-ec71-42ab-a0cf-6387fbbc9871	Eggs	egg	2026-02-07 03:29:58.595
e67bd64e-d431-4dc0-ae50-42408254e4fc	Wheat	wheat	2026-02-07 03:29:58.595
68025cd8-e737-4d64-b0e3-8fe64ac43c3a	Soy	soybean	2026-02-07 03:29:58.595
c4144964-0bb7-45e2-a8d4-87276df16b99	Fish	fish	2026-02-07 03:29:58.595
395344db-1893-48df-a903-a71f067365ab	Shellfish	shellfish	2026-02-07 03:29:58.595
43e139be-d517-402f-b0de-e5ce0384652f	Sesame	sesame	2026-02-07 03:29:58.595
923f6af0-6b16-4f40-b41b-1d0666d3756a	Gluten	gluten	2026-02-07 03:29:58.595
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditLog" (id, "businessOwnerId", "userId", "userType", action, "entityType", "entityId", "oldValue", "newValue", "ipAddress", "createdAt") FROM stdin;
7c7dc595-f04f-4107-ab84-d015ff42faae	\N	502b4c94-d441-4376-8f68-921c34e6e80d	SuperAdmin	business_owner_status_update	BusinessOwner	6d42041e-157b-4152-a7e8-2d4867cd7457	{"status": "inactive"}	{"status": "active"}	::1	2026-02-06 23:56:02.848
8d57ba35-2674-4a41-b0bd-c35c947e37ce	\N	502b4c94-d441-4376-8f68-921c34e6e80d	SuperAdmin	business_owner_status_update	BusinessOwner	6d42041e-157b-4152-a7e8-2d4867cd7457	{"status": "active"}	{"status": "inactive"}	::1	2026-02-06 23:56:11.319
\.


--
-- Data for Name: Blog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Blog" (id, "businessOwnerId", "categoryId", "authorId", title, slug, content, excerpt, "featuredImage", "featuredImageAlt", author, status, "publishedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BlogCategory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BlogCategory" (id, "businessOwnerId", name, slug, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BlogRevision; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BlogRevision" (id, "blogId", content, title, excerpt, "authorId", "authorName", "createdAt") FROM stdin;
\.


--
-- Data for Name: BlogTag; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BlogTag" (id, "businessOwnerId", name, slug, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Branch; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Branch" (id, "businessOwnerId", "parentBranchId", name, code, phone, email, address, city, state, country, "zipCode", "isMainBranch", status, "createdAt", "updatedAt") FROM stdin;
aa1ce36f-4934-44a1-8f4d-d45f345030a5	111bd836-595b-4982-bb3d-a24ade82c52a	\N	Hitech City	HTC	+91 912345678	hitechcity@spiceparadise.com	123 Main Road, Hitech City	Hyderabad	Telangana	India	500081	t	active	2026-02-07 03:29:58.481	2026-02-07 03:29:58.481
d3ee3575-ad4b-41fc-89d1-682a2cbcdf11	7fdfb940-d78a-4609-a441-fd28eb9f9869	\N	Uppal	UPL	+91 912345699	uppal@spiceparadise.com	456 Uppal Main Road	Hyderabad	Telangana	India	500039	f	active	2026-02-07 03:29:58.482	2026-02-07 08:47:55.726
\.


--
-- Data for Name: Brand; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Brand" (id, "businessOwnerId", name, image, description, status, "createdAt", "updatedAt") FROM stdin;
c1323368-203b-4585-a039-492897d18422	111bd836-595b-4982-bb3d-a24ade82c52a	Coca-Cola	https://images.unsplash.com/photo-1600180758890-6b94519a8ba6	Classic carbonated soft drink known for its refreshing taste.	active	2026-02-07 03:29:58.551	2026-02-07 03:29:58.551
bbd68632-86ce-4cc0-9dc6-2406fb53b905	111bd836-595b-4982-bb3d-a24ade82c52a	Pepsi	https://images.unsplash.com/photo-1585238342028-4f3c9c2c6fa1	Sweet cola beverage with a slightly citrus flavor.	active	2026-02-07 03:29:58.551	2026-02-07 03:29:58.551
36e4996d-92f3-46c7-9aa7-ee1c9c7eeb15	111bd836-595b-4982-bb3d-a24ade82c52a	Sprite	https://images.unsplash.com/photo-1623945275525-02bcd3e8e2b1	Lemon-lime flavored soda that is crisp and refreshing.	active	2026-02-07 03:29:58.551	2026-02-07 03:29:58.551
56eab56d-1de7-4c3f-ba8b-67d7dbeb6bb1	7fdfb940-d78a-4609-a441-fd28eb9f9869	Tropicana	https://images.unsplash.com/photo-1613478223719-2ab802c9c55a	Premium fruit juices made from fresh, quality fruits.	inactive	2026-02-07 03:29:58.551	2026-02-07 03:29:58.551
f2b4b7fd-47f7-4319-9e29-4c50876d8268	7fdfb940-d78a-4609-a441-fd28eb9f9869	Real Fruit Juice	https://images.unsplash.com/photo-1571689936042-03e3b4dfb3f3	A range of 100% fruit juices without artificial flavors.	active	2026-02-07 03:29:58.551	2026-02-07 03:29:58.551
81bf70f2-4dc7-4fc8-92be-cfae577187ae	7fdfb940-d78a-4609-a441-fd28eb9f9869	Nescafe	https://images.unsplash.com/photo-1587738347119-05c0dfc16ef6	Instant coffee brand offering rich and aromatic coffee.	inactive	2026-02-07 03:29:58.551	2026-02-07 03:29:58.551
5d56ed57-9f28-406e-b78d-09f936cbcc77	7fdfb940-d78a-4609-a441-fd28eb9f9869	Tata Tea	https://images.unsplash.com/photo-1511920170033-f8396924c348	Popular tea brand known for premium quality and rich flavors.	active	2026-02-07 03:29:58.551	2026-02-07 03:29:58.551
\.


--
-- Data for Name: BusinessHours; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BusinessHours" (id, "branchId", "dayOfWeek", "openTime", "closeTime", "isClosed") FROM stdin;
3c8a9c94-7c79-4d2b-835e-d2a7cc3f68b6	aa1ce36f-4934-44a1-8f4d-d45f345030a5	0	10:00	22:00	f
594bb56c-9e18-4fad-b55a-8b113de30736	aa1ce36f-4934-44a1-8f4d-d45f345030a5	1	09:00	23:00	f
3ba5accf-bb8d-4056-9630-725bf7c85dca	aa1ce36f-4934-44a1-8f4d-d45f345030a5	2	09:00	23:00	f
8a15a212-54c5-43d0-9bdb-008be5a4122d	aa1ce36f-4934-44a1-8f4d-d45f345030a5	3	09:00	23:00	f
47029b3a-33dd-4fcd-8eca-a61fd84e8104	aa1ce36f-4934-44a1-8f4d-d45f345030a5	4	09:00	23:00	f
176b08cd-afdf-4476-9c8f-aef25794a596	aa1ce36f-4934-44a1-8f4d-d45f345030a5	5	09:00	00:00	f
4c6a1306-3f95-49a9-906e-c056b6395a80	aa1ce36f-4934-44a1-8f4d-d45f345030a5	6	10:00	00:00	f
\.


--
-- Data for Name: BusinessOwner; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BusinessOwner" (id, email, password, "ownerName", "restaurantName", phone, "businessType", "tinGstNumber", avatar, country, state, city, "zipCode", address, "planId", "subscriptionStartDate", "subscriptionEndDate", "resetToken", "resetTokenExpiry", status, "createdAt", "updatedAt") FROM stdin;
7fdfb940-d78a-4609-a441-fd28eb9f9869	priyagupta@gmail.com	$2a$10$yuI29Iw3d2CRWDTmJ0IB9Oo9YHVwoShfhlGQ71l6dJoRMTd3nvybW	Priya Gupta	Spice Paradise	+91 912345678	Casual Dining	\N	\N	India	Telangana	Hyderabad	500081	123 Main Road, Hitech City	705c6be9-f9ec-4546-89ef-2cadb8ca77cf	2026-02-07 03:29:58.477	2027-02-07 03:29:58.477	\N	\N	active	2026-02-07 03:29:58.478	2026-02-07 03:29:58.478
8af25f35-46c0-4e10-b37c-b41034848d2f	amitvarma@gmail.com	$2a$10$yuI29Iw3d2CRWDTmJ0IB9Oo9YHVwoShfhlGQ71l6dJoRMTd3nvybW	Amit Varma	Masala Magic	+91 912345679	Fine Dining	\N	\N	India	Maharashtra	Mumbai	\N	\N	8c5f6b86-73be-4bb1-9b13-15cc879e6bff	2026-02-07 03:29:58.479	2027-02-07 03:29:58.479	\N	\N	inactive	2026-02-07 03:29:58.48	2026-02-07 03:29:58.48
111bd836-595b-4981-bb3d-a24ade82c52a	neha@gmail.com	$2a$10$yuI29Iw3d2CRWDTmJ0IB9Oo9YHVwoShfhlGQ71l6dJoRMTd3nvybW	Neha Joshi	Curry House	+91 912345680	Fine Dining	\N	\N	India	Karnataka	Bangalore	\N	\N	f8bbd9bf-4e49-4cd6-b334-d2c3a9bb5b32	2026-02-07 03:29:58.48	2027-02-07 03:29:58.48	\N	\N	active	2026-02-07 03:29:58.48	2026-02-07 03:29:58.48
111bd836-595b-4982-bb3d-a24ade82c52a	durgalaxmi417@gmail.com	$2a$12$0wKiIvlrw5ZbZ7iaC4E19emMhCKit6lU/AT/2eEnsfHZZUwVBSS4i	Durga Lakshmi	Kitchen House	+91 7032760271	Fine Dining	\N	\N	India	Vizag	Vizag	\N	\N	f8bbd9bf-4e49-4cd6-b334-d2c3a9bb5b32	2026-02-07 03:29:58.49	2027-02-07 03:29:58.49	\N	\N	active	2026-02-07 03:29:58.49	2026-02-07 03:29:58.49
\.


--
-- Data for Name: BusinessPreference; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BusinessPreference" (id, "businessOwnerId", currency, timezone, "dateFormat", "invoicePrefix", "kotPrefix", "autoAcceptOrders", "enableReservations", settings, "createdAt", "updatedAt") FROM stdin;
1d2bc2b1-942c-4268-b52b-a07839613092	7fdfb940-d78a-4609-a441-fd28eb9f9869	INR	Asia/Kolkata	DD/MM/YYYY	INV	KOT	f	t	{"allowSplitPayments": true, "printKotOnOrderCreate": true, "requireCustomerForDineIn": false}	2026-02-07 03:29:58.591	2026-02-07 03:29:58.591
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Category" (id, "businessOwnerId", name, image, description, status, "sortOrder", "createdAt", "updatedAt") FROM stdin;
4b92eed7-1093-4464-acb8-39eca4627acd	111bd836-595b-4982-bb3d-a24ade82c52a	Appetizers	/images/categories/appetizers.jpg	Tasty starters to kick off your hunger.	active	1	2026-02-07 03:29:58.549	2026-02-07 03:29:58.549
cd7478a2-9e9d-4729-be0e-4d68bddf6e5d	111bd836-595b-4982-bb3d-a24ade82c52a	Main Courses	/images/categories/main-course.jpg	Hearty dishes that satisfy your hunger.	active	2	2026-02-07 03:29:58.549	2026-02-07 03:29:58.549
bb9678cb-2ae0-4303-a0f0-78aab1e45c69	111bd836-595b-4982-bb3d-a24ade82c52a	Thalis	/images/categories/thali.jpg	Platter of diverse flavors in one meal.	active	3	2026-02-07 03:29:58.549	2026-02-07 03:29:58.549
b519059a-524c-4437-8307-a039c8a9c4b1	7fdfb940-d78a-4609-a441-fd28eb9f9869	Rice Dishes	/images/categories/rice.jpg	Flavorful rice preparations for all tastes.	active	4	2026-02-07 03:29:58.55	2026-02-07 03:29:58.55
1fd6f200-b6bb-4d1f-af96-53f4ee7f076c	7fdfb940-d78a-4609-a441-fd28eb9f9869	Curries	/images/categories/curry.jpg	Rich and aromatic curries for spice lovers.	inactive	5	2026-02-07 03:29:58.55	2026-02-07 03:29:58.55
40d7b38b-6dec-4940-8ccb-7c94271d3454	7fdfb940-d78a-4609-a441-fd28eb9f9869	Combos	/images/categories/combo.jpg	Value meals combining dishes and drinks.	active	6	2026-02-07 03:29:58.55	2026-02-07 03:29:58.55
b9a0d6cc-866f-454e-aa94-bbab76b0e6a6	7fdfb940-d78a-4609-a441-fd28eb9f9869	Breakfast	/images/categories/breakfast.jpg	Start your day with our delicious breakfast options.	active	7	2026-02-07 03:29:58.551	2026-02-07 03:29:58.551
1e613ee9-1889-43c3-814d-10109d311ca0	7fdfb940-d78a-4609-a441-fd28eb9f9869	Snacks	/images/categories/snacks.jpg	Light bites for any time of the day.	active	8	2026-02-07 03:29:58.551	2026-02-07 03:29:58.551
\.


--
-- Data for Name: Charge; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Charge" (id, "businessOwnerId", name, type, value, "applyTo", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CustomReport; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CustomReport" (id, "businessOwnerId", name, description, "reportType", filters, columns, schedule, "createdBy", "lastRunAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Customer" (id, "businessOwnerId", name, phone, email, gender, dob, type, gstin, "totalSpent", "customerGroupId", notes, "createdAt", "updatedAt", "loyaltyPoints") FROM stdin;
c109960a-4560-4c1c-8c0b-c58c1cbe526d	111bd836-595b-4982-bb3d-a24ade82c52a	Elizabeth Brink	+91 7243657890	elizabeth@gmail.com	Female	2000-02-09 00:00:00	Regular	\N	1250.00	0566f450-0f8a-4e3d-a6f5-3b0a8a522a32	\N	2026-02-07 03:29:58.564	2026-02-07 03:29:58.564	0
a619748d-1246-429e-83ec-eda1bb9413d2	7fdfb940-d78a-4609-a441-fd28eb9f9869	Mark Taylor	+91 9564123574	mark@gmail.com	Male	2001-03-06 00:00:00	Corporate	\N	1450.00	84cd5023-9049-4ca8-8610-efc21d17125b	\N	2026-02-07 03:29:58.565	2026-02-07 03:29:58.565	0
4e0a84ae-3429-4681-8015-e8f54e86263d	7fdfb940-d78a-4609-a441-fd28eb9f9869	Jessica John	+91 7894561230	jessica@gmail.com	Female	2000-07-08 00:00:00	VIP	\N	1850.00	6a891362-7338-4f89-b931-34db31b76afc	\N	2026-02-07 03:29:58.565	2026-02-07 03:29:58.565	0
9f7c1c8b-bf40-4f12-9e2d-1c5c0a94d0a9	7fdfb940-d78a-4609-a441-fd28eb9f9869	Rahul Mehta	+91 9000012345	rahul.mehta@example.com	Male	1992-05-17 00:00:00	Regular	\N	620.00	0566f450-0f8a-4e3d-a6f5-3b0a8a522a32	Loves extra spice	2026-03-17 03:29:58.565	2026-03-17 03:29:58.565	0
1b2df2f9-88c3-4d0e-9b6c-0c6b6dfcae77	7fdfb940-d78a-4609-a441-fd28eb9f9869	Priya Nair	+91 9888899999	priya.nair@example.com	Female	1995-11-30 00:00:00	Corporate	\N	940.00	84cd5023-9049-4ca8-8610-efc21d17125b	Prefers window seating	2026-03-17 03:29:58.566	2026-03-17 03:29:58.566	0
\.


--
-- Data for Name: CustomerGroup; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CustomerGroup" (id, "businessOwnerId", name, status, color, rules, "createdAt", "updatedAt") FROM stdin;
6a891362-7338-4f89-b931-34db31b76afc	111bd836-595b-4982-bb3d-a24ade82c52a	VIP	active	#3B82F6	\N	2026-02-07 03:29:58.563	2026-02-07 03:29:58.563
84cd5023-9049-4ca8-8610-efc21d17125b	111bd836-595b-4982-bb3d-a24ade82c52a	Corporate Clients	inactive	#3B82F6	\N	2026-02-07 03:29:58.563	2026-02-07 03:29:58.563
0566f450-0f8a-4e3d-a6f5-3b0a8a522a32	7fdfb940-d78a-4609-a441-fd28eb9f9869	Regular	active	#3B82F6	\N	2026-02-07 03:29:58.563	2026-02-07 03:29:58.563
8391c52e-3654-499a-89ac-e0ee37b575ed	7fdfb940-d78a-4609-a441-fd28eb9f9869	Family	active	#3B82F6	\N	2026-02-07 03:29:58.564	2026-02-07 03:29:58.564
2022e5bc-0a12-4080-84f5-cbd1043732c3	7fdfb940-d78a-4609-a441-fd28eb9f9869	Staff	active	#3B82F6	\N	2026-02-07 03:29:58.564	2026-02-07 03:29:58.564
\.


--
-- Data for Name: CustomerReview; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CustomerReview" (id, "businessOwnerId", "externalReviewId", source, "reviewerName", rating, comment, "replyText", "repliedAt", "publishedAt", "createdAt", "updatedAt") FROM stdin;
9e8f3cbe-8f4a-4ab8-9fc8-5d41a26931a1	111bd836-595b-4982-bb3d-a24ade82c52a	google-111-0001	google	Ananya Reddy	5	Excellent food and quick service.	Thank you for your feedback!	2026-02-10 12:15:00	2026-02-10 11:45:00	2026-02-10 12:15:00	2026-02-10 12:15:00
2c9d8d4e-6a34-4b7a-8a2d-9db7b6c9f4a2	7fdfb940-d78a-4609-a441-fd28eb9f9869	zomato-777-0001	zomato	Rohan Mehta	4	Good taste, packaging can be improved.	Thanks, we are improving our packaging.	2026-02-11 10:10:00	2026-02-11 09:40:00	2026-02-11 10:10:00	2026-02-11 10:10:00
5f6a2cb7-94b3-4f2e-9b6a-c4b25d8d6d83	7fdfb940-d78a-4609-a441-fd28eb9f9869	swiggy-777-0002	swiggy	Sneha Kapoor	3	Delivery was late but food was decent.	We apologize for the delay and will improve.	2026-02-12 19:25:00	2026-02-12 19:00:00	2026-02-12 19:25:00	2026-02-12 19:25:00
\.


--
-- Data for Name: CustomerTag; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CustomerTag" ("customerId", "tagId") FROM stdin;
\.


--
-- Data for Name: Discount; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Discount" (id, "businessOwnerId", code, name, description, type, "valueType", value, "minOrderAmount", "maxDiscount", "startDate", "endDate", "usageLimit", "usedCount", status, "createdAt", "updatedAt") FROM stdin;
4dc86317-279d-4e53-8f18-21f28a70e968	7fdfb940-d78a-4609-a441-fd28eb9f9869	WELCOME100	First Order	\N	OrderType	Fixed	100.00	\N	\N	2025-03-08 00:00:00	2025-04-08 00:00:00	1000	0	active	2026-02-07 03:29:58.57	2026-02-07 03:29:58.57
0b671530-bd21-4688-abe3-0131ff423042	7fdfb940-d78a-4609-a441-fd28eb9f9869	PIZZA50	Happy Hour Special	\N	ProductCategory	Fixed	50.00	\N	\N	2025-02-09 00:00:00	2025-02-28 00:00:00	\N	0	inactive	2026-02-07 03:29:58.571	2026-02-07 03:29:58.571
c0e82633-f102-4315-a50e-96aebeeaf85b	7fdfb940-d78a-4609-a441-fd28eb9f9869	GRAB75	Exclusive Offer	\N	Custom	Percentage	75.00	\N	200.00	2025-02-09 00:00:00	2025-02-28 00:00:00	\N	0	active	2026-02-07 03:29:58.571	2026-02-07 03:29:58.571
6f864676-741f-4293-a198-2a1211eef64a	7fdfb940-d78a-4609-a441-fd28eb9f9869	PARTY500	Family Feast Deal	\N	OrderType	Fixed	500.00	2000.00	\N	2025-07-23 00:00:00	2025-08-08 00:00:00	\N	0	active	2026-02-07 03:29:58.571	2026-02-07 03:29:58.571
c281e122-56f5-437c-931c-ba6df90456e1	7fdfb940-d78a-4609-a441-fd28eb9f9869	BOGO2025	Weekend Brunch	\N	OrderType	BOGO	0.00	\N	\N	2025-02-09 00:00:00	2025-02-28 00:00:00	\N	0	active	2026-02-07 03:29:58.571	2026-02-07 03:29:58.571
3f7641e8-1ca0-466e-a2f3-d4770e4f4823	111bd836-595b-4982-bb3d-a24ade82c52a	HH50	Happy Hours	\N	OrderType	Percentage	50.00	\N	100.00	2025-03-08 00:00:00	2025-04-08 00:00:00	\N	0	active	2026-02-07 03:29:58.571	2026-02-07 03:29:58.571
1df3e01a-039e-4389-8ccb-6f3958148a2f	111bd836-595b-4982-bb3d-a24ade82c52a	HOLIDAY25	Holiday Special	\N	ProductCategory	Fixed	25.00	\N	\N	2025-02-09 00:00:00	2025-02-28 00:00:00	\N	0	active	2026-02-07 03:29:58.571	2026-02-07 03:29:58.571
5dd29ecd-1f4c-4936-8e90-5de20ce1f0a1	111bd836-595b-4982-bb3d-a24ade82c52a	FEST35	Festival Offers	\N	OrderType	Percentage	35.00	\N	150.00	2025-03-08 00:00:00	2025-04-08 00:00:00	\N	0	active	2026-02-07 03:29:58.571	2026-02-07 03:29:58.571
d0681287-b9bd-468a-a189-85ea0f9696c9	111bd836-595b-4982-bb3d-a24ade82c52a	MIDNIGHT15	Mid-Night Cravings	\N	ProductCategory	Percentage	15.00	\N	\N	2025-02-09 00:00:00	2025-02-28 00:00:00	\N	0	active	2026-02-07 03:29:58.571	2026-02-07 03:29:58.571
d7b8a6fb-0f2c-42e1-9af8-8e51e9a6d4f5	7fdfb940-d78a-4609-a441-fd28eb9f9869	TODAY20	Today Veg Saver	10% off on popular veg dishes for today only	Custom	Percentage	20.00	\N	150.00	2026-03-17 00:00:00	2026-03-18 23:59:59	\N	0	active	2026-03-17 00:00:00	2026-03-17 00:00:00
8f1c6c42-9d33-4fd8-8e68-e7d2b0b1b92e	7fdfb940-d78a-4609-a441-fd28eb9f9869	MEAL50	Lunch Combo Deal	Flat ₹50 off on select mains when ordered today	Custom	Fixed	50.00	300.00	\N	2026-03-17 00:00:00	2026-03-18 23:59:59	\N	0	active	2026-03-17 00:00:00	2026-03-17 00:00:00
\.


--
-- Data for Name: DiscountCategory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DiscountCategory" ("discountId", "categoryId") FROM stdin;
\.


--
-- Data for Name: DiscountProduct; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DiscountProduct" ("discountId", "productId") FROM stdin;
d7b8a6fb-0f2c-42e1-9af8-8e51e9a6d4f5	1a8e83a5-bb4b-4d78-8ccf-cf48c5ef5aa4
d7b8a6fb-0f2c-42e1-9af8-8e51e9a6d4f5	283433b6-4c6d-4a61-af0d-44278a75d223
8f1c6c42-9d33-4fd8-8e68-e7d2b0b1b92e	539490f7-c7e1-4129-83a9-1bebdb7095e4
8f1c6c42-9d33-4fd8-8e68-e7d2b0b1b92e	283433b6-4c6d-4a61-af0d-44278a75d223
\.


--
-- Data for Name: FeedbackForm; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FeedbackForm" (id, "businessOwnerId", title, description, questions, "qrCode", status, "createdAt", "updatedAt") FROM stdin;
f1111111-1111-1111-1111-111111111111	111bd836-595b-4982-bb3d-a24ade82c52a	Overall Experience Feedback Form	This form is designed to gather your valuable feedback on your dining experience.	[{"id":"q1","type":"rating","text":"Rate our Restaurant Food and Service.","options":["1","2","3","4","5"],"required":true},{"id":"q2","type":"multiple_choice","text":"Was your food served at the right temperature?","options":["Yes","No"],"required":true},{"id":"q3","type":"text","text":"Comments","required":true}]	http://localhost:3000/public/feedback/f1111111-1111-1111-1111-111111111111	active	2026-02-12 10:00:00	2026-02-12 10:00:00
f2222222-2222-2222-2222-222222222222	111bd836-595b-4982-bb3d-a24ade82c52a	Service Feedback Form	Help us improve our cleanliness and staff service quality.	[{"id":"q1","type":"rating","text":"Rate cleanliness","options":["1","2","3","4","5"],"required":true},{"id":"q2","type":"rating","text":"Rate staff behavior","options":["1","2","3","4","5"],"required":true},{"id":"q3","type":"multiple_choice","text":"Would you visit us again?","options":["Yes","No"],"required":true}]	http://localhost:3000/public/feedback/f2222222-2222-2222-2222-222222222222	active	2026-02-12 10:05:00	2026-02-12 10:05:00
\.


--
-- Data for Name: FeedbackResponse; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FeedbackResponse" (id, "feedbackFormId", "customerId", responses, rating, "createdAt") FROM stdin;
r1111111-1111-1111-1111-111111111111	f1111111-1111-1111-1111-111111111111	4e0a84ae-3429-4681-8015-e8f54e86263d	{"q1":5,"q2":"Yes","q3":"Food was tasty and service was quick."}	5	2026-02-12 11:00:00
r2222222-2222-2222-2222-222222222222	f2222222-2222-2222-2222-222222222222	4e0a84ae-3429-4681-8015-e8f54e86263d	{"q1":4,"q2":5,"q3":"Yes"}	4	2026-02-12 11:10:00
\.


--
-- Data for Name: Floor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Floor" (id, "branchId", name, type, status, "createdAt", "updatedAt") FROM stdin;
b5e1b7b3-0a73-46be-a0c7-40f5e8d09351	aa1ce36f-4934-44a1-8f4d-d45f345030a5	Non-AC Area	NonAC	active	2026-02-07 03:29:58.572	2026-02-07 03:29:58.572
b28f87be-c5e3-47b5-a15c-1afdd08bad3a	aa1ce36f-4934-44a1-8f4d-d45f345030a5	AC Area	AC	active	2026-02-07 03:29:58.573	2026-02-07 03:29:58.573
f5b87516-4c10-4cee-96ff-34d6c01ce1b7	aa1ce36f-4934-44a1-8f4d-d45f345030a5	Family Section	Family	active	2026-02-07 03:29:58.573	2026-02-07 03:29:58.573
\.


--
-- Data for Name: Integration; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Integration" (id, "businessOwnerId", provider, type, config, status, "lastSyncAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: IntegrationLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."IntegrationLog" (id, "integrationId", action, status, "requestPayload", "responsePayload", "errorMessage", "createdAt") FROM stdin;
\.


--
-- Data for Name: InventoryProduct; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InventoryProduct" (id, "businessOwnerId", "branchId", name, image, "supplierId", "inStock", "quantitySold", "restockAlert", "costPrice", "sellingPrice", "expiryDate", unit, status, "createdAt", "updatedAt") FROM stdin;
f542137f-007b-45d5-b4ce-c9c1860fd808	111bd836-595b-4982-bb3d-a24ade82c52a	aa1ce36f-4934-44a1-8f4d-d45f345030a5	Coca-Cola	/images/coke.png	995f2d55-7907-45fc-96e5-132237834872	9523.00	29523.00	20.00	20.00	45.00	2025-02-09 00:00:00	bottles	active	2026-02-07 03:29:58.579	2026-02-07 03:29:58.579
2c9aea87-69d8-4bb9-a337-b8d8ef59fd88	7fdfb940-d78a-4609-a441-fd28eb9f9869	aa1ce36f-4934-44a1-8f4d-d45f345030a5	Nescafe Coffee	/images/nescafe.png	0a658c7e-6cb0-4455-b402-1db703c35cf4	6353.00	15523.00	90.00	40.00	100.00	2025-03-08 00:00:00	packets	active	2026-02-07 03:29:58.58	2026-02-07 03:29:58.58
\.


--
-- Data for Name: Kitchen; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Kitchen" (id, "branchId", name, description, status, "createdAt", "updatedAt") FROM stdin;
ebf68b4e-0e70-47d7-b0ab-061f2f2cc7d2	aa1ce36f-4934-44a1-8f4d-d45f345030a5	Main Kitchen	Primary kitchen for all food preparation	active	2026-02-07 03:29:58.572	2026-02-07 03:29:58.572
\.


--
-- Data for Name: Lead; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Lead" (id, "restaurantName", "ownerName", email, phone, "businessType", "inquiryType", country, state, city, "zipCode", address, description, stage, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: LoyaltyTransaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LoyaltyTransaction" (id, "customerId", "branchId", "businessOwnerId", type, points, description, "orderId", "createdAt") FROM stdin;
17ab1d95-4db9-4f1d-b49e-5c3d70a4bd10	c109960a-4560-4c1c-8c0b-c58c1cbe526d	aa1ce36f-4934-44a1-8f4d-d45f345030a5	111bd836-595b-4982-bb3d-a24ade82c52a	EARN	120	Points earned from dine-in bill	\N	2026-02-10 13:00:00
40c9f4a9-0d8b-45b7-95bc-8f9819d2d8f2	c109960a-4560-4c1c-8c0b-c58c1cbe526d	aa1ce36f-4934-44a1-8f4d-d45f345030a5	111bd836-595b-4982-bb3d-a24ade82c52a	REDEEM	-50	Points redeemed on checkout	\N	2026-02-11 20:30:00
8c4d2a73-73d6-4bd8-a2cb-9ad8be0132c7	a619748d-1246-429e-83ec-eda1bb9413d2	d3ee3575-ad4b-41fc-89d1-682a2cbcdf11	7fdfb940-d78a-4609-a441-fd28eb9f9869	EARN	90	Points earned from online order	\N	2026-02-12 14:45:00
52d3d0ae-7e36-4638-a9d5-0f32489b7d0b	4e0a84ae-3429-4681-8015-e8f54e86263d	d3ee3575-ad4b-41fc-89d1-682a2cbcdf11	7fdfb940-d78a-4609-a441-fd28eb9f9869	EARN	200	VIP bonus points credited	\N	2026-02-13 18:15:00
\.


--
-- Data for Name: MeasuringUnit; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MeasuringUnit" (id, quantity, unit, symbol, "createdAt") FROM stdin;
0fb69fd7-b6f9-4bf4-8f08-3fb7ea7e5e65	1	Kilogram	kg	2026-02-07 03:29:58.570
4f5bc5ea-b0b7-4ef4-b2ec-ae799ebf01cb	1	Gram	g	2026-02-07 03:29:58.570
fb6b9db9-5c7d-4a6f-8df7-24e8c9b8eb5f	1	Litre	l	2026-02-07 03:29:58.570
17e46773-e2f8-4a76-a8a8-f4b30d9f1ef2	1	Milli Litre	ml	2026-02-07 03:29:58.570
84c9d962-2e7b-4a94-a7da-1e69bf6c0d14	1	Piece	pc	2026-02-07 03:29:58.570
\.


--
-- Data for Name: Menu; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Menu" (id, "businessOwnerId", name, description, status, "createdAt", "updatedAt") FROM stdin;
ffaefac3-f907-4241-bde3-05ed39c0089a	111bd836-595b-4982-bb3d-a24ade82c52a	Dine-In	Full menu available for dine-in customers	active	2026-02-07 03:29:58.552	2026-02-07 03:29:58.552
22d83029-ef32-4d88-9f3c-455322c41ae9	7fdfb940-d78a-4609-a441-fd28eb9f9869	Delivery	Menu items available for delivery	active	2026-02-07 03:29:58.553	2026-02-07 03:29:58.553
f69706ad-b902-450d-aeec-d1bc909f50c5	7fdfb940-d78a-4609-a441-fd28eb9f9869	TakeAway	Menu items available for takeaway	active	2026-02-07 03:29:58.553	2026-02-07 03:29:58.553
\.


--
-- Data for Name: MenuVisibility; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MenuVisibility" (id, "userType", "menuKey", "isVisible", "createdAt", "updatedAt") FROM stdin;
33489b9e-3c03-401e-923c-89efab30ee76	SuperAdmin	bo_dashboard	f	2026-02-07 03:29:58.652	2026-02-07 03:29:58.652
ac7937fd-748b-4fde-8a40-c4bd01cdd5cb	BusinessOwner	bo_dashboard	t	2026-02-07 03:29:58.653	2026-02-07 03:29:58.653
f4bd4554-ec4d-45d0-a30e-5c326a3f8160	Staff	bo_dashboard	t	2026-02-07 03:29:58.654	2026-02-07 03:29:58.654
bb679348-9e2a-41ed-a064-3b0960753871	SuperAdmin	pos	f	2026-02-07 03:29:58.654	2026-02-07 03:29:58.654
c81f9d87-2fd5-4c56-bfaf-fafd0cb3701f	BusinessOwner	pos	t	2026-02-07 03:29:58.655	2026-02-07 03:29:58.655
93801c16-ae84-495b-a2c6-a15a11750f95	Staff	pos	t	2026-02-07 03:29:58.655	2026-02-07 03:29:58.655
3dbab2be-ca55-4e3b-8635-bcde73767011	SuperAdmin	kds	f	2026-02-07 03:29:58.656	2026-02-07 03:29:58.656
a7a31a97-a8b0-4790-b1c1-ac2cc7d500d6	BusinessOwner	kds	t	2026-02-07 03:29:58.656	2026-02-07 03:29:58.656
64ed27da-7c56-45db-beb2-9fb23ef0dd92	Staff	kds	t	2026-02-07 03:29:58.657	2026-02-07 03:29:58.657
c506e7d8-0759-4e2b-8f28-4314cb23d06f	SuperAdmin	all_orders	f	2026-02-07 03:29:58.658	2026-02-07 03:29:58.658
dc141f4e-c4ff-4812-a37a-76f37b7be840	BusinessOwner	all_orders	t	2026-02-07 03:29:58.658	2026-02-07 03:29:58.658
b8bae85d-ad05-4f26-ace0-bf01873d16be	Staff	all_orders	t	2026-02-07 03:29:58.659	2026-02-07 03:29:58.659
3887e88b-a00b-45de-bcd4-c3960aebe894	SuperAdmin	reservations	f	2026-02-07 03:29:58.659	2026-02-07 03:29:58.659
00eaaca4-ffff-41eb-ab90-abaf2340c810	BusinessOwner	reservations	t	2026-02-07 03:29:58.66	2026-02-07 03:29:58.66
9c293c0d-eb2d-4bd1-a9c7-51e16e2503bc	Staff	reservations	t	2026-02-07 03:29:58.66	2026-02-07 03:29:58.66
f8c37282-89e0-4d4d-8c23-28bb91c44256	SuperAdmin	catalog	f	2026-02-07 03:29:58.661	2026-02-07 03:29:58.661
e7857ea0-7fdd-4e81-89a2-523c194600d3	BusinessOwner	catalog	t	2026-02-07 03:29:58.661	2026-02-07 03:29:58.661
b6ee693c-288d-4b68-b21c-ed9805e5bfa2	Staff	catalog	t	2026-02-07 03:29:58.662	2026-02-07 03:29:58.662
f0f9b852-3aea-4de9-a36b-c644d79927fe	SuperAdmin	inventory	f	2026-02-07 03:29:58.662	2026-02-07 03:29:58.662
1f68073d-7bc3-404b-ae29-6ae637de552c	BusinessOwner	inventory	t	2026-02-07 03:29:58.663	2026-02-07 03:29:58.663
9d06ef94-0eda-4f1b-b600-ae70a31743b5	Staff	inventory	t	2026-02-07 03:29:58.663	2026-02-07 03:29:58.663
4cbeb970-9910-4cad-a266-08ae842feb06	SuperAdmin	purchase_order	f	2026-02-07 03:29:58.664	2026-02-07 03:29:58.664
bca88f91-4e38-4683-9c72-a4547f72de74	BusinessOwner	purchase_order	t	2026-02-07 03:29:58.664	2026-02-07 03:29:58.664
562f806a-f2c0-4590-ad76-4462104854b9	Staff	purchase_order	t	2026-02-07 03:29:58.665	2026-02-07 03:29:58.665
e778cc5e-6475-419c-af5e-68bd6799d712	SuperAdmin	payments	f	2026-02-07 03:29:58.665	2026-02-07 03:29:58.665
bc1b80ae-1bbb-49ae-9e91-43d34df23b0c	BusinessOwner	payments	t	2026-02-07 03:29:58.665	2026-02-07 03:29:58.665
69ee564b-35c1-470e-8bb6-9f25407d921c	Staff	payments	f	2026-02-07 03:29:58.666	2026-02-07 03:29:58.666
7aaf5a7a-ac9a-47c9-8a55-bc1f857b9d1e	SuperAdmin	customers	f	2026-02-07 03:29:58.666	2026-02-07 03:29:58.666
c90497c1-4008-405b-9cf1-3c6df5e4ba8c	BusinessOwner	customers	t	2026-02-07 03:29:58.667	2026-02-07 03:29:58.667
3688fe22-2fa3-4e50-a9ab-4b90cb7d7755	Staff	customers	t	2026-02-07 03:29:58.667	2026-02-07 03:29:58.667
55476e62-2f82-4cb7-a232-841f01f25e6b	SuperAdmin	loyalty_program	f	2026-02-07 03:29:58.668	2026-02-07 03:29:58.668
1d4e6bb7-505f-44a7-8b0e-95111f391de1	BusinessOwner	loyalty_program	t	2026-02-07 03:29:58.668	2026-02-07 03:29:58.668
ed7605a4-4be9-4c71-8b8c-06862ae0c7a2	Staff	loyalty_program	t	2026-02-07 03:29:58.669	2026-02-07 03:29:58.669
54ee5154-fd0d-4ada-b399-b0f8e6c7790b	SuperAdmin	marketing	f	2026-02-07 03:29:58.669	2026-02-07 03:29:58.669
24dc316d-15cd-40c5-82fd-8e9f6236670c	BusinessOwner	marketing	t	2026-02-07 03:29:58.67	2026-02-07 03:29:58.67
ecaa5552-3b00-4040-ade3-766942784f3a	Staff	marketing	t	2026-02-07 03:29:58.67	2026-02-07 03:29:58.67
0969c04a-00fb-449a-97da-6f63119888ef	SuperAdmin	reviews	f	2026-02-07 03:29:58.671	2026-02-07 03:29:58.671
c7969969-a359-4f13-bb4b-97ef6f012509	BusinessOwner	reviews	t	2026-02-07 03:29:58.671	2026-02-07 03:29:58.671
bebcbea6-9314-4405-9139-66eead538b23	Staff	reviews	f	2026-02-07 03:29:58.671	2026-02-07 03:29:58.671
88ffe56c-1435-411a-b02c-5994e1e16868	BusinessOwner	analytics_reports	t	2026-02-07 03:29:58.672	2026-02-07 03:29:58.672
21f89e09-73c2-415f-b1cf-5432945ad9d7	Staff	analytics_reports	t	2026-02-07 03:29:58.673	2026-02-07 03:29:58.673
6ac2b556-042f-4a5e-aceb-2ebf83c0fda4	SuperAdmin	manage_resources	f	2026-02-07 03:29:58.673	2026-02-07 03:29:58.673
7abb334f-f750-47f0-af7f-a6ba1f77dbc7	BusinessOwner	manage_resources	t	2026-02-07 03:29:58.674	2026-02-07 03:29:58.674
f1ec23a5-ea41-4604-b677-23f3863c8aa6	Staff	manage_resources	t	2026-02-07 03:29:58.674	2026-02-07 03:29:58.674
1019c8f9-fec2-4900-9c2d-2e830881f354	SuperAdmin	business_settings	f	2026-02-07 03:29:58.675	2026-02-07 03:29:58.675
546723c5-a3cf-4145-8db4-2f5b9e8a9eaf	BusinessOwner	business_settings	t	2026-02-07 03:29:58.675	2026-02-07 03:29:58.675
261347af-19e9-46c7-a668-7d1e20544416	Staff	business_settings	f	2026-02-07 03:29:58.676	2026-02-07 03:29:58.676
34923388-f856-45a6-901b-f97a9c79ee2d	SuperAdmin	sa_dashboard	t	2026-02-07 03:29:58.676	2026-02-07 03:29:58.676
1a015667-e8e5-4936-936d-59fbedc7dab6	BusinessOwner	sa_dashboard	f	2026-02-07 03:29:58.677	2026-02-07 03:29:58.677
1097ee8e-44ac-4c9f-be18-67bad816edca	Staff	sa_dashboard	f	2026-02-07 03:29:58.677	2026-02-07 03:29:58.677
1314077a-a1f8-4197-8d44-3d22071f24cd	SuperAdmin	business_owners	t	2026-02-07 03:29:58.678	2026-02-07 03:29:58.678
154a6db0-379b-4b17-83c4-3678fa79a78b	BusinessOwner	business_owners	f	2026-02-07 03:29:58.678	2026-02-07 03:29:58.678
537c96dd-12e0-4783-9096-e2e98eab9034	Staff	business_owners	f	2026-02-07 03:29:58.678	2026-02-07 03:29:58.678
fc562f66-a084-4cc7-aaf9-a94472d871cd	SuperAdmin	subscription_plans	t	2026-02-07 03:29:58.679	2026-02-07 03:29:58.679
73886b2b-068c-488b-9294-41cb26511ac5	BusinessOwner	subscription_plans	f	2026-02-07 03:29:58.679	2026-02-07 03:29:58.679
db55dfe7-3e9d-4d03-a471-31765fde37e0	Staff	subscription_plans	f	2026-02-07 03:29:58.68	2026-02-07 03:29:58.68
ba4c84fe-9cd6-4180-b18a-443b9f7e86a8	BusinessOwner	sa_orders	f	2026-02-07 03:29:58.681	2026-02-07 03:29:58.681
36ac30a4-89fe-4b2e-85f7-0f0d927ac1e8	Staff	sa_orders	f	2026-02-07 03:29:58.682	2026-02-07 03:29:58.682
ae608b43-5d21-45a6-bf4a-9719779dc65e	SuperAdmin	contact_requests	t	2026-02-07 03:29:58.682	2026-02-07 03:29:58.682
b5eeb891-caf4-4f4a-a848-26ce4974a7fb	BusinessOwner	contact_requests	f	2026-02-07 03:29:58.683	2026-02-07 03:29:58.683
6225bc94-9493-4c2e-a683-4e89ca45832c	Staff	contact_requests	f	2026-02-07 03:29:58.683	2026-02-07 03:29:58.683
1c7b0578-20c6-46ce-9f0d-76194748a8ea	SuperAdmin	staff_management	t	2026-02-07 03:29:58.683	2026-02-07 03:29:58.683
d4645cb8-1e8c-42bb-8dcb-c44b4f67a329	BusinessOwner	staff_management	f	2026-02-07 03:29:58.684	2026-02-07 03:29:58.684
9187e0dd-2b96-483c-bae2-3301b3a2682c	Staff	staff_management	f	2026-02-07 03:29:58.684	2026-02-07 03:29:58.684
af644c34-2af4-4b2c-9133-590cf3e23fea	SuperAdmin	blog_management	t	2026-02-07 03:29:58.685	2026-02-07 03:29:58.685
990398a5-5dcf-4789-a95a-b0210ae6ccc5	BusinessOwner	blog_management	f	2026-02-07 03:29:58.685	2026-02-07 03:29:58.685
11a0d853-2f0f-4cf3-9100-03c3e6114d0d	Staff	blog_management	f	2026-02-07 03:29:58.686	2026-02-07 03:29:58.686
a3fc9796-f833-464c-8bb0-fd9255d6c6c0	SuperAdmin	master_data	t	2026-02-07 03:29:58.686	2026-02-07 03:29:58.686
9f4d0495-9269-43b0-9bf3-458dc03a96cc	BusinessOwner	master_data	f	2026-02-07 03:29:58.687	2026-02-07 03:29:58.687
45ebd964-4574-4a2c-ba61-06d4fc45a1d4	Staff	master_data	f	2026-02-07 03:29:58.687	2026-02-07 03:29:58.687
f8b2d9cb-5e2a-4dbf-aa50-ec185dbdddea	SuperAdmin	sa_settings	t	2026-02-07 03:29:58.687	2026-02-07 03:29:58.687
2360c056-04c3-4203-9379-7fb201b94a1a	BusinessOwner	sa_settings	f	2026-02-07 03:29:58.688	2026-02-07 03:29:58.688
a39808a0-5a6c-4b62-8efe-8db96d7fb637	Staff	sa_settings	f	2026-02-07 03:29:58.688	2026-02-07 03:29:58.688
3b62ba4e-a395-418c-9dfd-5f2e2af42d68	SuperAdmin	analytics_reports	t	2026-02-07 03:29:58.672	2026-02-07 03:29:58.691
06fb4ebe-938c-4481-926d-537088d7bd5a	SuperAdmin	website	t	2026-02-07 03:29:58.689	2026-02-07 03:29:58.689
ec144910-22f2-4aab-960f-140bdf3805e6	BusinessOwner	website	f	2026-02-07 03:29:58.689	2026-02-07 03:29:58.689
31560432-4711-48c5-ab06-6130f98c0559	Staff	website	f	2026-02-07 03:29:58.69	2026-02-07 03:29:58.69
1840df31-d769-4823-892c-a587bfa2bce3	SuperAdmin	sa_orders	t	2026-02-07 03:29:58.681	2026-02-07 03:29:58.69
\.


--
-- Data for Name: OnlineOrder; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OnlineOrder" (id, "branchId", aggregator, "externalOrderId", status, "customerName", "customerPhone", items, amount, "deliveryTime", "prepTime", "receivedAt", "acceptedAt", "rejectedAt", "createdAt", "updatedAt") FROM stdin;
o1111111-1111-1111-1111-111111111111	aa1ce36f-4934-44a1-8f4d-d45f345030a5	Zomato	ZOM12345	Pending	Rahul Sharma	9876543210	[{"item":"Pizza","qty":1,"price":500},{"item":"Coke","qty":2,"price":50}]	600	2026-02-12 19:00:00	30	2026-02-12 18:20:00	2026-02-12 18:25:00	\N	2026-02-12 18:20:00	2026-02-12 18:25:00
o2222222-2222-2222-2222-222222222222	aa1ce36f-4934-44a1-8f4d-d45f345030a5	Swiggy	SWG67890	Pending	Anita Verma	9123456780	[{"item":"Burger","qty":2,"price":150}]	300	2026-02-12 20:00:00	20	2026-02-12 19:10:00	\N	2026-02-12 19:15:00	2026-02-12 19:10:00	2026-02-12 19:15:00
\.

--
-- Data for Name: OnlinePayment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OnlinePayment" (id, "orderId", amount, currency, "gatewayProvider", "gatewayTransactionId", "gatewayOrderId", status, "paymentMethod", "failureReason", metadata, "paidAt", "createdAt", "updatedAt") FROM stdin;
p1111111-1111-1111-1111-111111111111	o1111111-1111-1111-1111-111111111111	600	INR	Razorpay	TXN123456	GW123456	Processing	UPI	\N	{"bank":"HDFC","upiId":"rahul@upi"}	2026-02-12 18:26:00	2026-02-12 18:20:00	2026-02-12 18:26:00
p2222222-2222-2222-2222-222222222222	o2222222-2222-2222-2222-222222222222	300	INR	Razorpay	TXN789012	GW789012	Completed	CARD	Insufficient balance	{"bank":"SBI","cardType":"Visa"}	\N	2026-02-12 19:10:00	2026-02-12 19:15:00
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Order" (id, "businessOwnerId", "branchId", "orderNumber", type, source, "tableId", "customerId", "staffId", subtotal, "discountAmount", "discountId", "chargesAmount", "taxAmount", total, "paidAmount", "dueAmount", "paymentStatus", "orderStatus", notes, "createdAt", "updatedAt") FROM stdin;
73959d8e-9f59-4604-afe3-84e70e59ca95	7fdfb940-d78a-4609-a441-fd28eb9f9869	aa1ce36f-4934-44a1-8f4d-d45f345030a5	ORD-3231	DineIn	BistroBill	cedc635c-5965-4fb5-8c1a-500059cc308c	4e0a84ae-3429-4681-8015-e8f54e86263d	854a0f8c-0d33-4434-acc0-9ba2ccaa4564	610.00	10.00	4dc86317-279d-4e53-8f18-21f28a70e968	10.00	40.00	650.00	650.00	0.00	Paid	Completed	\N	2026-02-07 03:29:58.583	2026-02-07 03:29:58.583
73959d8e-9f59-4604-afe3-84e70e59ca96	111bd836-595b-4982-bb3d-a24ade82c52a	aa1ce36f-4934-44a1-8f4d-d45f345030a5	ORD-3232	DineIn	BistroBill	cedc635c-5965-4fb5-8c1a-500059cc308c	4e0a84ae-3429-4681-8015-e8f54e86263d	854a0f8c-0d33-4434-acc0-9ba2ccaa4564	610.00	10.00	4dc86317-279d-4e53-8f18-21f28a70e968	10.00	40.00	650.00	650.00	0.00	Paid	Completed	\N	2026-02-07 03:29:58.584	2026-02-07 03:29:58.584
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OrderItem" (id, "orderId", "productId", "variantId", name, quantity, "unitPrice", "totalPrice", status, notes, "createdAt", "updatedAt") FROM stdin;
9cdfc5de-353e-4d7b-8f17-89e8d9b5863b	73959d8e-9f59-4604-afe3-84e70e59ca95	1a8e83a5-bb4b-4d78-8ccf-cf48c5ef5aa4	\N	Idly with Sambar	1	60.00	60.00	Served	\N	2026-02-07 03:29:58.583	2026-02-07 03:29:58.583
8c8d4e1a-d573-437f-a97a-0085223d6d83	73959d8e-9f59-4604-afe3-84e70e59ca95	539490f7-c7e1-4129-83a9-1bebdb7095e4	\N	Paneer Curry Combo	1	80.00	80.00	Served	\N	2026-02-07 03:29:58.583	2026-02-07 03:29:58.583
b2921d39-c3f9-44fe-8e18-2f643cb1d6c5	73959d8e-9f59-4604-afe3-84e70e59ca95	283433b6-4c6d-4a61-af0d-44278a75d223	\N	Veg Fried Rice	1	40.00	40.00	Served	\N	2026-02-07 03:29:58.583	2026-02-07 03:29:58.583
9062d4da-cc45-4e4a-b8f4-b30e1fb3cd9e	73959d8e-9f59-4604-afe3-84e70e59ca95	59fcb5ea-5ad9-4711-9615-69a4f3ba94e3	\N	Andhra Thali (Veg)	1	120.00	120.00	Served	\N	2026-02-07 03:29:58.583	2026-02-07 03:29:58.583
18d35ad2-0128-4235-9830-962f5e307b28	73959d8e-9f59-4604-afe3-84e70e59ca95	78ea8cb3-9992-402d-9493-1a019bd6ecdf	\N	Curd Rice	1	130.00	130.00	Served	\N	2026-02-07 03:29:58.583	2026-02-07 03:29:58.583
\.


--
-- Data for Name: OrderItemAddon; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OrderItemAddon" (id, "orderItemId", "addonId", name, price) FROM stdin;
\.


--
-- Data for Name: OrderKOT; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OrderKOT" (id, "orderId", "kitchenId", "kotNumber", status, "printedAt", "createdAt") FROM stdin;
f5e19b47-3dcb-4db6-8f72-3554d768d06a	73959d8e-9f59-4604-afe3-84e70e59ca95	ebf68b4e-0e70-47d7-b0ab-061f2f2cc7d2	KOT-001	Served	2026-02-07 03:29:58.582	2026-02-07 03:29:58.583
\.


--
-- Data for Name: OrderPayment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OrderPayment" (id, "orderId", "paymentOptionId", amount, reference, "createdAt") FROM stdin;
a5f2ba69-b1ff-49f5-8209-e54f95af0a25	73959d8e-9f59-4604-afe3-84e70e59ca95	afcd7035-b525-46e9-b479-bb23c0ee1c87	650.00	CASH-001	2026-02-07 03:29:58.583
\.


--
-- Data for Name: OrderTimeline; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OrderTimeline" (id, "orderId", action, description, "staffId", "createdAt") FROM stdin;
fb174c3f-e1f3-4d3f-a9e1-446934021d47	73959d8e-9f59-4604-afe3-84e70e59ca95	created	Order created	854a0f8c-0d33-4434-acc0-9ba2ccaa4564	2026-02-07 03:29:58.583
3bb95b32-de88-4155-a699-33978ac3f3b9	73959d8e-9f59-4604-afe3-84e70e59ca95	confirmed	Order confirmed	854a0f8c-0d33-4434-acc0-9ba2ccaa4564	2026-02-07 03:29:58.583
5bef3a6a-62c4-4d90-895f-a5a6b23f4e3d	73959d8e-9f59-4604-afe3-84e70e59ca95	preparing	Kitchen started preparing	854a0f8c-0d33-4434-acc0-9ba2ccaa4564	2026-02-07 03:29:58.583
7c8ab0ca-7cc0-4001-bad7-2c88322360fb	73959d8e-9f59-4604-afe3-84e70e59ca95	ready	Order ready for serving	854a0f8c-0d33-4434-acc0-9ba2ccaa4564	2026-02-07 03:29:58.583
8fc2f799-e08a-4cfe-b941-24ea5850dca4	73959d8e-9f59-4604-afe3-84e70e59ca95	served	Order served to customer	854a0f8c-0d33-4434-acc0-9ba2ccaa4564	2026-02-07 03:29:58.583
fcc43ec0-eca3-4b71-bde6-29ea35aec2e6	73959d8e-9f59-4604-afe3-84e70e59ca95	completed	Payment received and order completed	854a0f8c-0d33-4434-acc0-9ba2ccaa4564	2026-02-07 03:29:58.583
\.


--
-- Data for Name: PaymentGatewayConfig; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PaymentGatewayConfig" (id, "businessOwnerId", provider, "apiKey", "apiSecret", "webhookSecret", "isActive", "isTestMode", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PaymentOption; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PaymentOption" (id, "businessOwnerId", name, type, "isDefault", status, "createdAt", "updatedAt") FROM stdin;
afcd7035-b525-46e9-b479-bb23c0ee1c87	111bd836-595b-4982-bb3d-a24ade82c52a	Cash	Cash	t	active	2026-02-07 03:29:58.568	2026-02-07 03:29:58.568
66a9207e-ae5c-42a2-8cb7-197bda9817c4	111bd836-595b-4982-bb3d-a24ade82c52a	Credit Card	Card	f	active	2026-02-07 03:29:58.569	2026-02-07 03:29:58.569
ca420eda-0a62-48c7-8704-f04d8cca2448	7fdfb940-d78a-4609-a441-fd28eb9f9869	Debit Card	Card	f	active	2026-02-07 03:29:58.569	2026-02-07 03:29:58.569
6e1dfa01-14dd-4ebb-9f66-7dd0aaa9ff9b	7fdfb940-d78a-4609-a441-fd28eb9f9869	UPI	UPI	f	active	2026-02-07 03:29:58.569	2026-02-07 03:29:58.569
77246b77-08dd-48a7-a089-738aff02e3fb	7fdfb940-d78a-4609-a441-fd28eb9f9869	PhonePe	Wallet	f	active	2026-02-07 03:29:58.569	2026-02-07 03:29:58.569
4017f185-587e-4f5d-900b-ef9a1b6cba79	7fdfb940-d78a-4609-a441-fd28eb9f9869	Paytm	Wallet	f	active	2026-02-07 03:29:58.569	2026-02-07 03:29:58.569
9a3f1af3-4f12-4e22-92d8-1dff6eddd1a7	111bd836-595b-4982-bb3d-a24ade82c52a	Google Pay	UPI	f	active	2026-02-07 03:29:58.569	2026-02-07 03:29:58.569
18b7b7c1-8c79-4bcf-bcf2-7b9f08092d53	111bd836-595b-4982-bb3d-a24ade82c52a	Net Banking	Other	f	active	2026-02-07 03:29:58.569	2026-02-07 03:29:58.569
7ab7e864-d92f-4fa3-b8fc-8a74b4b2f0c8	7fdfb940-d78a-4609-a441-fd28eb9f9869	Amazon Pay	Wallet	f	active	2026-02-07 03:29:58.569	2026-02-07 03:29:58.569
\.


--
-- Data for Name: PaymentReconciliation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PaymentReconciliation" (id, "businessOwnerId", "settlementDate", "gatewayProvider", "totalAmount", "settledAmount", fees, "transactionCount", status, "reconciledAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Permission" (id, module, action, resource, description, "createdAt") FROM stdin;
13b58179-744f-4995-a76b-767978e06c9d	catalog	create	product	Create new products	2026-02-07 03:29:58.596
052210eb-57fa-4454-ab70-229638f72610	catalog	read	product	View products	2026-02-07 03:29:58.596
8af3ee70-6377-48fc-9521-d2e7ec552f5e	catalog	update	product	Edit products	2026-02-07 03:29:58.596
3b4c971b-ec7a-4734-b6b2-69c746fcc6a4	catalog	delete	product	Delete products	2026-02-07 03:29:58.596
6f1c0442-d26a-42ec-b778-6459f52e4bbc	catalog	create	category	Create categories	2026-02-07 03:29:58.596
94516341-d44c-4f17-a3cc-e2e2375d2509	catalog	read	category	View categories	2026-02-07 03:29:58.596
94a6518f-a4b2-4fe3-b947-0e7a8c0227da	catalog	update	category	Edit categories	2026-02-07 03:29:58.596
e329d844-6041-45f7-b12e-9896f0ce9b2a	catalog	delete	category	Delete categories	2026-02-07 03:29:58.596
7fbb4610-0b07-43d0-91ad-6743b15f398e	catalog	create	brand	Create brands	2026-02-07 03:29:58.596
9e18183c-25b6-406c-8859-458eae30b8d3	catalog	read	brand	View brands	2026-02-07 03:29:58.596
a9210be9-d213-4e37-97fa-72cc09c1fc23	catalog	update	brand	Edit brands	2026-02-07 03:29:58.596
b1d0d2e1-e295-40da-a344-c8ead60d6fc0	catalog	delete	brand	Delete brands	2026-02-07 03:29:58.596
35cdc465-f6ef-445c-a0c5-0546c85811c6	catalog	create	menu	Create channel menus	2026-02-07 03:29:58.596
1465d584-b059-4a84-98fe-11c95d239057	catalog	read	menu	View channel menus	2026-02-07 03:29:58.596
08c425a2-5732-4876-9b21-70e5154d2b2e	catalog	update	menu	Edit channel menus	2026-02-07 03:29:58.596
463888c1-f5ee-4a1f-b313-292df82b90bb	catalog	delete	menu	Delete channel menus	2026-02-07 03:29:58.596
813b27c1-6961-49a4-bcc6-402f69f1280f	catalog	export	\N	Export catalog data	2026-02-07 03:29:58.596
db7cfad6-7cba-4bf7-a687-17a5c822312c	inventory	create	stock	Create stock entries	2026-02-07 03:29:58.596
43e641c2-086c-48df-b4b6-f8277b47e5cf	inventory	read	stock	View stock levels	2026-02-07 03:29:58.596
62acc2d9-2663-48be-9f8e-656ab56fefca	inventory	update	stock	Adjust stock levels	2026-02-07 03:29:58.596
d9d578ea-b59f-4de9-aacb-4a093404da48	inventory	delete	stock	Delete stock entries	2026-02-07 03:29:58.596
e4b344b6-b8a7-4236-8f0a-4b04ff039646	inventory	create	item	Create inventory items	2026-02-07 03:29:58.596
0446fe29-eb53-49d5-9041-5c8cba7abd43	inventory	read	item	View inventory items	2026-02-07 03:29:58.596
bfab3bfb-d153-4f35-86af-f066ea03309d	inventory	update	item	Edit inventory items	2026-02-07 03:29:58.596
ffc5ca32-6627-42c8-9883-a6f30d9b5120	inventory	delete	item	Delete inventory items	2026-02-07 03:29:58.596
c6341a36-ad71-4153-990c-86b280a86966	inventory	export	\N	Export inventory data	2026-02-07 03:29:58.596
85a4bd06-56e9-4685-a453-b3eff5ae67d3	inventory	approve	adjustment	Approve stock adjustments	2026-02-07 03:29:58.596
4297135b-575d-484d-a0bf-0d2f8dfbd73e	orders	create	order	Create new orders	2026-02-07 03:29:58.596
be0f9ce3-5284-46f8-94ab-33b0f06f13c8	orders	read	order	View orders	2026-02-07 03:29:58.596
14a77b21-e522-48c2-9b63-3f81be5bbc11	orders	update	order	Edit orders	2026-02-07 03:29:58.596
b0f7fecc-7b7c-4fc6-beee-e853fafa83a4	orders	delete	order	Cancel/delete orders	2026-02-07 03:29:58.596
cb606a10-c96c-4560-a052-dd6f9d4c4783	orders	approve	order	Approve orders	2026-02-07 03:29:58.596
62151e68-96d5-4966-acef-5fc2c8f7eb04	orders	create	refund	Initiate refunds	2026-02-07 03:29:58.596
c7e724ee-0324-4509-9686-74e08ff3ba9f	orders	read	refund	View refund history	2026-02-07 03:29:58.596
714796e2-ee7e-4199-b7aa-60d113805354	orders	export	\N	Export order data	2026-02-07 03:29:58.596
e08b477b-7c42-4c3f-8f81-63d22435af05	orders	create	kot	Create KOT (Kitchen Order Ticket)	2026-02-07 03:29:58.596
debbde72-8ac6-4090-99b7-b5e7033f8b9e	orders	update	kot	Update KOT status	2026-02-07 03:29:58.596
cb0f661f-05e0-41b8-8757-cf1363228782	pos	create	order	Take POS orders	2026-02-07 03:29:58.596
1200eb94-7bad-48ec-891e-a8cb73631f69	pos	read	order	View POS orders	2026-02-07 03:29:58.596
ec575db7-c54a-4a2e-b8cd-1b4b3b209dfc	pos	update	order	Edit POS orders	2026-02-07 03:29:58.596
7591d17a-580e-40ac-8119-1e0a7f091914	pos	delete	order	Void POS orders	2026-02-07 03:29:58.596
3643bc48-babd-4302-a523-1f2485ca9bc8	pos	create	payment	Process POS payments	2026-02-07 03:29:58.596
32edcf03-ba82-4cdb-8ecd-e05dbe65b726	pos	create	discount	Apply discounts at POS	2026-02-07 03:29:58.596
2b20a51e-c97a-44b7-8527-39554859bf0c	pos	read	table	View table status at POS	2026-02-07 03:29:58.596
65bdd483-1f6e-4a36-a0a3-a42e2f8499b4	pos	update	table	Manage table assignments at POS	2026-02-07 03:29:58.596
19c88a8c-7c58-442c-8cd3-29dcdd295a75	pos	create	kot	Send to kitchen from POS	2026-02-07 03:29:58.596
318f72c2-cebb-4bc3-aa26-b2b270a2ce6a	pos	read	dashboard	Access POS dashboard	2026-02-07 03:29:58.596
69a4d277-14d2-41a3-bc31-6026ced1832b	customers	create	customer	Add new customers	2026-02-07 03:29:58.596
5465180d-5f1e-43e3-a09f-d668828e2200	customers	read	customer	View customers	2026-02-07 03:29:58.596
617dad95-b673-4dfe-b90b-5d02e5c09f5c	customers	update	customer	Edit customer details	2026-02-07 03:29:58.596
92cdd085-9e29-4b6a-b1a7-26616626622a	customers	delete	customer	Delete customers	2026-02-07 03:29:58.596
3a383c98-163e-4a4d-a74f-61f0936eade0	customers	create	group	Create customer groups	2026-02-07 03:29:58.596
40ac07d5-9f2d-4d6e-a4db-a9d1f6cfa074	customers	read	group	View customer groups	2026-02-07 03:29:58.596
e93ee241-d76a-4ba2-8563-9cca437b2717	customers	update	group	Edit customer groups	2026-02-07 03:29:58.596
8204ed93-87bb-4f3c-938e-cfe97b3a3808	customers	delete	group	Delete customer groups	2026-02-07 03:29:58.596
5fe27ce6-2e80-4000-80d6-4f463cc85cb8	customers	export	\N	Export customer data	2026-02-07 03:29:58.596
b563be50-f131-4975-ad03-ce6c5c2ad661	staff	create	staff	Add new staff members	2026-02-07 03:29:58.596
e4430f05-c334-4fd1-9944-0cc8c824d174	staff	read	staff	View staff members	2026-02-07 03:29:58.596
765885c2-9f1d-4a3f-8a84-bfa29474cb88	staff	update	staff	Edit staff details	2026-02-07 03:29:58.596
6eb59714-6f6a-432e-a10a-8e5c9b1049f9	staff	delete	staff	Deactivate/delete staff	2026-02-07 03:29:58.596
f8161e39-2443-4100-85f8-e72408f247d9	staff	create	role	Create staff roles	2026-02-07 03:29:58.596
b1a35303-045a-4ae9-8401-d17304016b78	staff	read	role	View staff roles	2026-02-07 03:29:58.596
13703203-6f5c-46fe-a039-c22b83b7d67a	staff	update	role	Edit staff roles	2026-02-07 03:29:58.596
d1ddc3ef-1cca-44c5-814f-e8bbc6a440d3	staff	delete	role	Delete staff roles	2026-02-07 03:29:58.596
b0988299-bd8d-44fd-a9f7-1e943d3eabd6	staff	create	attendance	Record staff attendance	2026-02-07 03:29:58.596
dc2fb26c-21b6-4ca6-b5b9-41888363a20e	staff	read	attendance	View staff attendance	2026-02-07 03:29:58.596
55a213ce-5e53-43ae-a3a9-b36941283315	kds	read	order	View kitchen orders	2026-02-07 03:29:58.596
441fd06d-eb48-4b05-8fe6-56425e345e52	kds	update	order	Update kitchen order status	2026-02-07 03:29:58.596
82e60564-36bb-4fa8-b638-ddc7833aff70	kds	read	dashboard	Access KDS dashboard	2026-02-07 03:29:58.596
3c5cd274-9dda-4442-bef6-a4af2187e72d	kds	update	settings	Configure KDS settings	2026-02-07 03:29:58.596
a525f2ed-502c-45b7-94e1-3965b1b5427f	purchase_orders	create	order	Create purchase orders	2026-02-07 03:29:58.596
78323801-713f-41b2-8734-fd0211440547	purchase_orders	read	order	View purchase orders	2026-02-07 03:29:58.596
9c4a4496-ad7e-4a65-a89c-00987a6a114f	purchase_orders	update	order	Edit purchase orders	2026-02-07 03:29:58.596
7e24fa85-4b1b-490e-8de8-273803635b61	purchase_orders	delete	order	Delete purchase orders	2026-02-07 03:29:58.596
d0bee950-ce57-4f2a-b34d-c275fccfad81	purchase_orders	approve	order	Approve purchase orders	2026-02-07 03:29:58.596
5897223a-bc1f-416d-99fb-2535a59da73f	purchase_orders	create	supplier	Add suppliers	2026-02-07 03:29:58.596
67746be9-9df0-46ce-b75c-da50c855639f	purchase_orders	read	supplier	View suppliers	2026-02-07 03:29:58.596
b9282ce6-a435-4e89-ad0e-534c21cc28dd	purchase_orders	update	supplier	Edit suppliers	2026-02-07 03:29:58.596
6bbff63d-a0e5-46f7-8fb1-d31d1cfef127	purchase_orders	delete	supplier	Delete suppliers	2026-02-07 03:29:58.596
6cc46304-a7ae-4c50-bd97-0c1e1c6a34cf	purchase_orders	export	\N	Export purchase order data	2026-02-07 03:29:58.596
086c2d7e-7119-471c-a611-8f8031361477	payments	create	payment	Process payments	2026-02-07 03:29:58.596
37e74a24-3f90-419b-9981-d348ae6ca202	payments	read	payment	View payment records	2026-02-07 03:29:58.596
5c2aa64e-eb62-404a-8d5f-1f2a5440ca6e	payments	update	payment	Edit payment records	2026-02-07 03:29:58.596
d2e70090-53cf-41ca-b345-436e2788955e	payments	create	refund	Process refunds	2026-02-07 03:29:58.596
a1ca5a38-ed05-4b21-b170-b2206112df8a	payments	read	option	View payment methods	2026-02-07 03:29:58.596
af04f9ff-52cf-4586-ae04-b0b9f780ccb3	payments	create	option	Add payment methods	2026-02-07 03:29:58.596
1c2645fc-77a5-4388-b326-f0c2ae18ff1f	payments	update	option	Edit payment methods	2026-02-07 03:29:58.596
9246413b-0a57-4815-90e5-c96ec53d576d	payments	delete	option	Remove payment methods	2026-02-07 03:29:58.596
8f7d0ec8-8584-4cc5-8931-73e03a92ef2c	payments	read	reconciliation	View payment reconciliation	2026-02-07 03:29:58.596
7b723a9e-3644-44fb-905b-46c7092d6ba5	payments	export	\N	Export payment data	2026-02-07 03:29:58.596
383d0c77-7eef-4f97-af69-56b71d74e365	taxes	create	tax	Create tax rules	2026-02-07 03:29:58.596
d29108a6-22cd-491f-ad51-82b03a2c87cb	taxes	read	tax	View tax configuration	2026-02-07 03:29:58.596
523c32b8-7f21-4a7b-89e6-c772ad2795d9	taxes	update	tax	Edit tax rules	2026-02-07 03:29:58.596
db9b17c3-1305-4de7-b957-f1d77565729a	taxes	delete	tax	Delete tax rules	2026-02-07 03:29:58.596
088aaf2c-cc70-49f4-aa8b-90f7159bc4e0	taxes	create	group	Create tax groups	2026-02-07 03:29:58.596
e74ad468-e5c2-48bc-a0c8-9dd521d63e4a	taxes	read	group	View tax groups	2026-02-07 03:29:58.596
9d167ef9-e731-408f-91e0-b7dc4d54204c	taxes	update	group	Edit tax groups	2026-02-07 03:29:58.596
8a0b6448-a589-4537-ba67-cba34cb0d66d	taxes	delete	group	Delete tax groups	2026-02-07 03:29:58.596
e63a74b8-e86d-4bb8-bf1e-9fa5f8e4ad78	marketing	create	discount	Create discounts	2026-02-07 03:29:58.596
1803d15d-09c6-4594-b7f8-8d034218dce1	marketing	read	discount	View discounts	2026-02-07 03:29:58.596
a4c4fd6e-edcb-43ff-be59-c59f1e5e09c5	marketing	update	discount	Edit discounts	2026-02-07 03:29:58.596
c1b11e2b-9080-46a7-a479-cf28a634169c	marketing	delete	discount	Delete discounts	2026-02-07 03:29:58.596
c1ed7d36-c76d-4ed0-9db4-bf1936db2170	marketing	create	advertisement	Create advertisements	2026-02-07 03:29:58.596
c017877c-20a8-41ed-b4e9-23d155d7a80a	marketing	read	advertisement	View advertisements	2026-02-07 03:29:58.596
f44caa7f-54fa-4610-bb8f-519cd3646236	marketing	update	advertisement	Edit advertisements	2026-02-07 03:29:58.596
f488f372-66da-487a-9baa-33be0937ac9a	marketing	delete	advertisement	Delete advertisements	2026-02-07 03:29:58.596
bcaffe57-4a6a-4683-ad3e-3e16cd667e39	marketing	create	feedback	Create feedback forms	2026-02-07 03:29:58.596
a95aded4-505a-4182-92b7-4dfc6081aa51	marketing	read	feedback	View customer feedback	2026-02-07 03:29:58.596
8aa0bc0a-52e4-4791-85ba-29319ab5b1b9	marketing	update	feedback	Edit feedback forms	2026-02-07 03:29:58.596
f0979a58-f237-45b7-9b67-82cc7f396a80	marketing	delete	feedback	Delete feedback entries	2026-02-07 03:29:58.596
bd7b9e83-59ed-4710-87b9-0ff9af9675c0	marketing	export	\N	Export marketing data	2026-02-07 03:29:58.596
5711ee01-8991-4a31-9aeb-2667755cbffe	reports	read	sales	View sales reports	2026-02-07 03:29:58.596
2aafb711-1086-402d-aa3a-229833d56b8d	reports	read	inventory	View inventory reports	2026-02-07 03:29:58.596
e58bc9e2-316e-4339-bb95-4ed989c19680	reports	read	financial	View financial reports	2026-02-07 03:29:58.596
89cc55e6-d2bb-4d8c-a8d3-63ee8e551201	reports	read	staff	View staff reports	2026-02-07 03:29:58.596
21c8b9ba-53bb-46b4-a740-b20208012651	reports	read	customer	View customer reports	2026-02-07 03:29:58.596
b768d8b8-5e57-47c7-9daa-049b7f74e454	reports	read	gst	View GST reports	2026-02-07 03:29:58.596
7aea2af9-5c2f-483e-b330-30b349c2c93a	reports	read	audit	View audit logs	2026-02-07 03:29:58.596
96d8b20c-4e12-4895-bb0b-3c13d95b3817	reports	read	dashboard	Access analytics dashboard	2026-02-07 03:29:58.596
c9cb57a5-8a39-4ef7-9b53-b76bbc52354b	reports	export	\N	Export reports	2026-02-07 03:29:58.596
aedc817f-6de3-4ab1-92f4-a1300ed933c0	settings	read	business	View business settings	2026-02-07 03:29:58.596
253cbc8c-d2d7-4a8e-bc39-639f364b7628	settings	update	business	Edit business settings	2026-02-07 03:29:58.596
b4813ddd-195d-44fb-b036-eb8eb41b0bd0	settings	read	preferences	View preferences	2026-02-07 03:29:58.596
5a079c52-e027-4664-bcdf-8efa30ee9140	settings	update	preferences	Edit preferences	2026-02-07 03:29:58.596
6a454435-81c6-435d-b0ca-2d081f51bef0	settings	read	sales	View sales settings	2026-02-07 03:29:58.596
9d3a35ab-f2a0-4bfc-b151-fcb3206d8d4f	settings	update	sales	Edit sales settings	2026-02-07 03:29:58.596
d4eab18e-e827-44f3-9c75-232e54de98a7	settings	read	integrations	View integrations	2026-02-07 03:29:58.596
ba9af3a9-0ec6-42f7-82bf-296f33b79585	settings	update	integrations	Configure integrations	2026-02-07 03:29:58.596
b1225038-bea9-4619-95eb-52e3d6945d20	resources	create	branch	Create branches	2026-02-07 03:29:58.596
1cd54cef-7fd5-4240-b9a2-83ffbfc75742	resources	read	branch	View branches	2026-02-07 03:29:58.596
dfe04089-bbed-465d-972b-7ca175919653	resources	update	branch	Edit branches	2026-02-07 03:29:58.596
4338ee80-fb05-485e-b856-68507e2cfd32	resources	delete	branch	Delete branches	2026-02-07 03:29:58.596
e834ec0d-0b24-4a8b-953c-af1af0c6d5d3	resources	create	kitchen	Create kitchens	2026-02-07 03:29:58.596
ae6a07bd-0af6-401c-9eed-7ba93932064a	resources	read	kitchen	View kitchens	2026-02-07 03:29:58.596
774a53f7-dd97-46ec-9e8a-b9ddb318e147	resources	update	kitchen	Edit kitchens	2026-02-07 03:29:58.596
8982b47b-3057-44bd-bb88-d57c9f880785	resources	delete	kitchen	Delete kitchens	2026-02-07 03:29:58.596
b3304141-24ef-414c-a6d7-5943538a2816	resources	create	floor	Create floor plans	2026-02-07 03:29:58.596
748ab168-0feb-4c03-ad00-cedb2488ac5b	resources	read	floor	View floor plans	2026-02-07 03:29:58.596
ac209511-5409-4337-bab1-26ecb9419261	resources	update	floor	Edit floor plans	2026-02-07 03:29:58.596
d590ac11-d5b3-4de6-80be-234822e0f11f	resources	delete	floor	Delete floor plans	2026-02-07 03:29:58.596
e4ca7d94-7a95-4b4b-9694-fd655852a646	resources	create	table	Create tables	2026-02-07 03:29:58.596
00371537-5f65-4617-9216-9dedaeffa8e2	resources	read	table	View tables	2026-02-07 03:29:58.596
55cec080-b24a-4757-a470-c79bc5dfccec	resources	update	table	Edit tables	2026-02-07 03:29:58.596
594ae81e-6636-4ead-bd55-c219707256a5	resources	delete	table	Delete tables	2026-02-07 03:29:58.596
3735f6f3-886c-4580-b5cf-68e0621c40c6	reservations	create	reservation	Create reservations	2026-02-07 03:29:58.596
1c68cbce-352d-4ff6-833b-d447a234858c	reservations	read	reservation	View reservations	2026-02-07 03:29:58.596
4ba83f41-cda5-42e2-8122-aaed9565ff60	reservations	update	reservation	Edit reservations	2026-02-07 03:29:58.596
0de45ad6-c4c5-4af1-ae3e-d06173a60904	reservations	delete	reservation	Cancel reservations	2026-02-07 03:29:58.596
5d2bff8b-268f-493d-89a3-a9f15b981410	dashboard	read	overview	View dashboard overview	2026-02-07 03:29:58.596
a2e37ad5-5c9e-4556-ae97-cb3e13edbb30	dashboard	read	analytics	View dashboard analytics	2026-02-07 03:29:58.596
5466df10-0968-4b29-b970-c2a75ef3c1b7	dashboard	read	alerts	View dashboard alerts	2026-02-07 03:29:58.596
b4d9d459-5ed8-40e5-b16c-5a2f94755c13	blog	create	post	Create blog posts	2026-02-07 03:29:58.596
0da7c411-620e-4501-9a3b-e96364d7aa4d	blog	read	post	View blog posts	2026-02-07 03:29:58.596
5c17b316-51b2-4699-8e0d-05229fd4d004	blog	update	post	Edit blog posts	2026-02-07 03:29:58.596
3b6e7821-3ecb-435b-9779-b4e64dd1a99d	blog	delete	post	Delete blog posts	2026-02-07 03:29:58.596
5617a585-75e3-4ddf-8474-c6aa5dc7ea08	online_orders	read	order	View online orders	2026-02-07 03:29:58.596
631f60d8-b881-4434-9046-22eef5adf1b5	online_orders	update	order	Update online order status	2026-02-07 03:29:58.596
8f9836a6-f80a-4729-9a3f-9c6146ca61a3	online_orders	read	settings	View online order settings	2026-02-07 03:29:58.596
73bdaa48-2d55-4492-be74-dc55fe5d1136	online_orders	update	settings	Configure online ordering	2026-02-07 03:29:58.596
4cd95349-310b-441f-a2bf-851e152bc3bf	super_admin	read	business_owners	View all business owners	2026-02-07 03:29:58.596
73e089c2-b8e7-4da3-8a10-8bc4a263576e	super_admin	create	business_owners	Create business owners	2026-02-07 03:29:58.596
d7b5e546-5398-4df5-aba1-c7131b7c9232	super_admin	update	business_owners	Edit business owners	2026-02-07 03:29:58.596
c149c1ce-7505-42c7-8270-c0b4b4117f7c	super_admin	delete	business_owners	Delete business owners	2026-02-07 03:29:58.596
8a9a43e5-1123-4928-b970-0b2309fe6429	super_admin	read	subscriptions	View subscriptions	2026-02-07 03:29:58.596
e24c6e8f-ca0a-46f2-9a66-68bc9bb2a2ad	super_admin	update	subscriptions	Manage subscriptions	2026-02-07 03:29:58.596
fe0d4f3a-60f6-4348-a846-4b66fdc22528	super_admin	read	platform_analytics	View platform analytics	2026-02-07 03:29:58.596
67c96648-6379-4562-8afa-d7073cef9ee8	super_admin	update	platform_settings	Edit platform settings	2026-02-07 03:29:58.596
\.


--
-- Data for Name: PermissionAuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PermissionAuditLog" (id, "userId", action, resource, "resourceId", granted, "deniedReason", "ipAddress", "timestamp") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Product" (id, "businessOwnerId", name, sku, type, "categoryId", "subCategoryId", "brandId", "menuId", description, "shortCode", "hsnCode", "preparationTime", "servesCount", "isVeg", status, "createdAt", "updatedAt") FROM stdin;
1a8e83a5-bb4b-4d78-8ccf-cf48c5ef5aa4	7fdfb940-d78a-4609-a441-fd28eb9f9869	Idly with Sambar	PRD-001	Regular	b9a0d6cc-866f-454e-aa94-bbab76b0e6a6	\N	\N	ffaefac3-f907-4241-bde3-05ed39c0089a	Soft steamed rice cakes served with sambar and chutney	IDLY	\N	15	1	t	active	2026-02-07 03:29:58.554	2026-02-07 03:29:58.554
539490f7-c7e1-4129-83a9-1bebdb7095e4	7fdfb940-d78a-4609-a441-fd28eb9f9869	Paneer Curry Combo	PRD-002	Regular	cd7478a2-9e9d-4729-be0e-4d68bddf6e5d	\N	\N	ffaefac3-f907-4241-bde3-05ed39c0089a	Creamy paneer curry served with rice and roti	PNRCRY	\N	20	1	t	active	2026-02-07 03:29:58.557	2026-02-07 03:29:58.557
283433b6-4c6d-4a61-af0d-44278a75d223	7fdfb940-d78a-4609-a441-fd28eb9f9869	Veg Fried Rice	PRD-003	Regular	b519059a-524c-4437-8307-a039c8a9c4b1	\N	\N	ffaefac3-f907-4241-bde3-05ed39c0089a	Stir-fried rice with fresh vegetables	VFRRC	\N	15	1	t	active	2026-02-07 03:29:58.558	2026-02-07 03:29:58.558
59fcb5ea-5ad9-4711-9615-69a4f3ba94e3	111bd836-595b-4982-bb3d-a24ade82c52a	Andhra Thali (Veg)	PRD-004	Combo	bb9678cb-2ae0-4303-a0f0-78aab1e45c69	\N	\N	ffaefac3-f907-4241-bde3-05ed39c0089a	Traditional Andhra thali with multiple curries, rice, and sweets	ANDTHL	\N	25	1	t	active	2026-02-07 03:29:58.559	2026-02-07 03:29:58.559
33ffde00-a67f-4a46-9dcc-bd4f6ffc8680	111bd836-595b-4982-bb3d-a24ade82c52a	Veg Grilled Sandwich	PRD-005	Regular	1e613ee9-1889-43c3-814d-10109d311ca0	\N	\N	ffaefac3-f907-4241-bde3-05ed39c0089a	Grilled sandwich with fresh vegetables and cheese	VGSND	\N	10	1	t	active	2026-02-07 03:29:58.561	2026-02-07 03:29:58.561
78ea8cb3-9992-402d-9493-1a019bd6ecdf	111bd836-595b-4982-bb3d-a24ade82c52a	Curd Rice	PRD-006	Regular	b519059a-524c-4437-8307-a039c8a9c4b1	\N	\N	ffaefac3-f907-4241-bde3-05ed39c0089a	South Indian style curd rice with tempering	CRDRC	\N	10	1	t	active	2026-02-07 03:29:58.562	2026-02-07 03:29:58.562
\.


--
-- Data for Name: ProductAddon; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductAddon" (id, "productId", name, price, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProductAllergen; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductAllergen" ("productId", "allergenId") FROM stdin;
\.


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductImage" (id, "productId", url, "isPrimary", "sortOrder", "createdAt") FROM stdin;
d35616c2-55d2-4908-9279-3b170cb13ebe	1a8e83a5-bb4b-4d78-8ccf-cf48c5ef5aa4	/images/products/Idli-Sambar.jpg	t	1	2026-02-07 03:29:58.554
2608a5b7-5db1-44e9-a9bd-0bc2e5c010e5	539490f7-c7e1-4129-83a9-1bebdb7095e4	/images/products/paneer-curry.jpg	t	1	2026-02-07 03:29:58.557
4b0b0df7-3d62-415c-acc5-9cc796db52e5	283433b6-4c6d-4a61-af0d-44278a75d223	/images/products/veg-fried-rice.jpg	t	1	2026-02-07 03:29:58.558
f283a9c4-a24d-444c-a6fd-ff343b457fb9	59fcb5ea-5ad9-4711-9615-69a4f3ba94e3	/images/products/Mini-Thali.webp	t	1	2026-02-07 03:29:58.559
adf836f1-1778-4640-8962-2c09c9101761	33ffde00-a67f-4a46-9dcc-bd4f6ffc8680	/images/products/veg-grilled-sandwich.jpg	t	1	2026-02-07 03:29:58.561
e903ad31-065d-4031-b7c2-b7a8940dc385	78ea8cb3-9992-402d-9493-1a019bd6ecdf	/images/products/South-indian-curd-rice.jpg	t	1	2026-02-07 03:29:58.562
\.


--
-- Data for Name: ProductKitchen; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductKitchen" ("productId", "kitchenId") FROM stdin;
\.


--
-- Data for Name: ProductNutrition; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductNutrition" (id, "productId", calories, protein, carbs, fat, fiber, sugar, sodium, vitamins, minerals) FROM stdin;
\.


--
-- Data for Name: ProductPrice; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductPrice" (id, "productId", "variantId", "channelType", "basePrice", "discountPrice", "taxGroupId", "createdAt", "updatedAt") FROM stdin;
cb5a9922-07bd-4d5a-bf18-a8b1add2e9db	1a8e83a5-bb4b-4d78-8ccf-cf48c5ef5aa4	\N	DineIn	60.00	\N	\N	2026-02-07 03:29:58.554	2026-02-07 03:29:58.554
ed9f50dd-40db-4843-9c87-cc1b98daedba	539490f7-c7e1-4129-83a9-1bebdb7095e4	\N	DineIn	80.00	\N	\N	2026-02-07 03:29:58.557	2026-02-07 03:29:58.557
af98c47d-5815-45b9-9083-7d8f23cafaca	283433b6-4c6d-4a61-af0d-44278a75d223	\N	DineIn	40.00	\N	\N	2026-02-07 03:29:58.558	2026-02-07 03:29:58.558
3f7edad8-4de4-4b15-a6d3-0b757e827648	59fcb5ea-5ad9-4711-9615-69a4f3ba94e3	\N	DineIn	120.00	\N	\N	2026-02-07 03:29:58.559	2026-02-07 03:29:58.559
407c5f9d-9d67-46a9-b3ae-776418f6ba73	33ffde00-a67f-4a46-9dcc-bd4f6ffc8680	\N	DineIn	80.00	\N	\N	2026-02-07 03:29:58.561	2026-02-07 03:29:58.561
f0c8f32a-4990-4154-b7d7-d72b1f5a1a0b	78ea8cb3-9992-402d-9493-1a019bd6ecdf	\N	DineIn	130.00	\N	\N	2026-02-07 03:29:58.562	2026-02-07 03:29:58.562
\.


--
-- Data for Name: ProductTag; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductTag" ("productId", "tagId") FROM stdin;
\.


--
-- Data for Name: ProductVariant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductVariant" (id, "productId", name, sku, "additionalPrice", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PurchaseOrder; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PurchaseOrder" (id, "businessOwnerId", "branchId", "supplierId", "invoiceNumber", "amountPaid", "grandTotal", status, notes, "createdAt", "updatedAt") FROM stdin;
e70dc0d6-3b09-4c40-bff7-92b9ecaa0ccd	111bd836-595b-4982-bb3d-a24ade82c52a	aa1ce36f-4934-44a1-8f4d-d45f345030a5	2e248362-ff14-49c9-b408-44b02ade2884	INV-2025-0001	116000.00	116000.00	Approved	\N	2026-02-07 03:29:58.58	2026-02-07 03:29:58.58
9b576e6c-26ad-4cb4-b428-e1513952127b	7fdfb940-d78a-4609-a441-fd28eb9f9869	d3ee3575-ad4b-41fc-89d1-682a2cbcdf11	6b305730-8702-4c80-bec9-ef2e14f0ef7d	INV-2025-0002	0.00	638000.00	Pending	\N	2026-02-07 03:29:58.582	2026-02-07 03:29:58.582
\.


--
-- Data for Name: PurchaseOrderItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PurchaseOrderItem" (id, "purchaseOrderId", "inventoryProductId", quantity, "unitPrice", "totalPrice") FROM stdin;
c6f36d2d-2f72-49bd-91f5-cc6151beaa0e	e70dc0d6-3b09-4c40-bff7-92b9ecaa0ccd	f542137f-007b-45d5-b4ce-c9c1860fd808	1000.00	20.00	20000.00
4d05f242-9759-4ea4-b20e-cd1928b98ce0	9b576e6c-26ad-4cb4-b428-e1513952127b	2c9aea87-69d8-4bb9-a337-b8d8ef59fd88	500.00	40.00	20000.00
\.


--
-- Data for Name: Reason; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Reason" (id, "businessOwnerId", type, text, description, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Refund; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Refund" (id, "onlinePaymentId", amount, reason, status, "gatewayRefundId", "processedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ReportComment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ReportComment" (id, "businessOwnerId", "reportType", "reportConfig", "userId", "userName", comment, mentions, "editedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ReportShare; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ReportShare" (id, "businessOwnerId", "reportType", "reportConfig", "reportData", "shareToken", password, "expiresAt", "viewCount", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ReportTemplate; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ReportTemplate" (id, name, description, "reportType", filters, columns, "isDefault", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Reservation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Reservation" (id, "branchId", "tableId", "roomId", "customerId", "customerName", "customerPhone", date, "startTime", "endTime", "guestCount", status, notes, "createdAt", "updatedAt") FROM stdin;
660e8400-e29b-41d4-a716-446655440000	aa1ce36f-4934-44a1-8f4d-d45f345030a5	19b1ebe9-2c57-4e5c-b906-2c0d407d889f	550e8400-e29b-41d4-a716-446655440000	c109960a-4560-4c1c-8c0b-c58c1cbe526d	Rahul Sharma	9876543210	2026-02-15	18:00:00	20:00:00	4	Confirmed	Birthday celebration	2026-02-12 10:30:00	2026-02-12 10:30:00
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Role" (id, "businessOwnerId", name, description, permissions, "isSystem", "parentRoleId", level, status, "createdAt", "updatedAt") FROM stdin;
5f05852f-d7f6-4b41-b06a-c7a307013ce3	111bd836-595b-4982-bb3d-a24ade82c52a	Manager	\N	{"pos": {"edit": true, "view": true, "create": true, "delete": true}, "staff": {"edit": true, "view": true, "create": true, "delete": true}, "reports": {"view": true}, "settings": {"edit": true, "view": true}, "inventory": {"edit": true, "view": true, "create": true, "delete": true}}	f	\N	5	inactive	2026-02-07 03:29:58.482	2026-02-07 03:29:58.482
ea4502e2-8119-4fe5-8089-0f05f90a285a	111bd836-595b-4982-bb3d-a24ade82c52a	Staff	\N	{"pos": {"edit": false, "view": true, "create": true, "delete": false}, "reports": {"view": false}, "inventory": {"view": true}}	f	\N	5	active	2026-02-07 03:29:58.483	2026-02-07 03:29:58.483
422396ab-73d6-4b9d-b051-645119f67d31	7fdfb940-d78a-4609-a441-fd28eb9f9869	Accountant	\N	{"pos": {"view": true}, "reports": {"view": true}, "settings": {"view": true}, "inventory": {"view": true}}	f	\N	5	inactive	2026-02-07 03:29:58.484	2026-02-07 03:29:58.484
9f2899c0-a911-4b55-8692-d1c96c14ccaf	7fdfb940-d78a-4609-a441-fd28eb9f9869	Business Analyst	\N	{"pos": {"view": true}, "reports": {"view": true}}	f	\N	5	active	2026-02-07 03:29:58.484	2026-02-07 03:29:58.484
d6d01f6e-82e5-497a-88dc-95f4302b171a	7fdfb940-d78a-4609-a441-fd28eb9f9869	Support	\N	{"pos": {"view": true}}	f	\N	5	inactive	2026-02-07 03:29:58.484	2026-02-07 03:29:58.484
08da3f4c-cf10-47e4-98b5-9646ac27c02a	7fdfb940-d78a-4609-a441-fd28eb9f9869	Sales Executives	\N	{"pos": {"view": true, "create": true}, "customers": {"view": true, "create": true}}	f	\N	5	active	2026-02-07 03:29:58.485	2026-02-07 03:29:58.485
9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	7fdfb940-d78a-4609-a441-fd28eb9f9869	Super Admin	Platform-wide administrator with full access to all modules	{}	t	\N	1	active	2026-02-07 03:29:58.608	2026-02-07 03:29:58.608
134af9e8-ce05-4cd1-8378-46f54506c1d7	7fdfb940-d78a-4609-a441-fd28eb9f9869	Business Owner	Owner of the business with full access within their organization	{}	t	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	2	active	2026-02-07 03:29:58.627	2026-02-07 03:29:58.627
28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	7fdfb940-d78a-4609-a441-fd28eb9f9869	Branch Manager	Manager of a specific branch with full operational access	{}	t	134af9e8-ce05-4cd1-8378-46f54506c1d7	3	active	2026-02-07 03:29:58.641	2026-02-07 03:29:58.641
0c0be0db-b6ff-4311-88e3-8b05bd40865d	7fdfb940-d78a-4609-a441-fd28eb9f9869	Kitchen Manager	Manager of a kitchen area with KDS, inventory, and staff access	{}	t	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	4	active	2026-02-07 03:29:58.646	2026-02-07 03:29:58.646
c2daf791-e946-4f73-9e99-894bdcb173fb	7fdfb940-d78a-4609-a441-fd28eb9f9869	Waiter	Front-of-house staff with POS order and table management access	{}	t	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	5	active	2026-02-07 03:29:58.648	2026-02-07 03:29:58.648
5c3f918b-5d8d-4aa9-8a0c-d78b3f1ad8b7	7fdfb940-d78a-4609-a441-fd28eb9f9869	Captain	Front-of-house lead with table assignment and order oversight	{}	t	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	5	active	2026-02-07 03:29:58.649	2026-02-07 03:29:58.649
eb3b1da4-5430-4689-88da-c0f8500e08e7	7fdfb940-d78a-4609-a441-fd28eb9f9869	Cashier	Payment processing staff with access to payments and invoices	{}	t	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	5	active	2026-02-07 03:29:58.65	2026-02-07 03:29:58.65
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RolePermission" (id, "roleId", "permissionId", granted) FROM stdin;
813e8f5d-6ce9-4c39-803a-0de7cca025db	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	13b58179-744f-4995-a76b-767978e06c9d	t
8012d0db-6bc8-44ca-91bf-41c7cb8155fb	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	052210eb-57fa-4454-ab70-229638f72610	t
8e03fb80-c1f9-4376-bb4f-81d23e43656c	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	8af3ee70-6377-48fc-9521-d2e7ec552f5e	t
8c2e9cbe-aa0c-447c-964a-3af0dc8752e4	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	3b4c971b-ec7a-4734-b6b2-69c746fcc6a4	t
7ef1aaa5-a80d-4d9c-9ed8-e3087dd3d75d	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	6f1c0442-d26a-42ec-b778-6459f52e4bbc	t
745e17e1-8ab7-46b9-8196-1addaf86fa86	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	94516341-d44c-4f17-a3cc-e2e2375d2509	t
9beb5b48-1094-46d1-9ce7-4188532fb3df	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	94a6518f-a4b2-4fe3-b947-0e7a8c0227da	t
50e8d571-d55e-4fce-a78e-b29242d9b600	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	e329d844-6041-45f7-b12e-9896f0ce9b2a	t
90f73dda-82ec-4d43-9159-c4ee049dcbba	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	7fbb4610-0b07-43d0-91ad-6743b15f398e	t
163abd42-855c-4ad3-acd8-6312fc365f51	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	9e18183c-25b6-406c-8859-458eae30b8d3	t
4c16456e-b29f-4385-a412-fd8f0c6289c9	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	a9210be9-d213-4e37-97fa-72cc09c1fc23	t
f8f93a4a-87fd-4180-930c-3363a0781b80	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	b1d0d2e1-e295-40da-a344-c8ead60d6fc0	t
30a38f00-a046-434c-8af6-10ab8051c761	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	35cdc465-f6ef-445c-a0c5-0546c85811c6	t
a9eabd4b-1ab6-4a89-8c85-d987654c3ab9	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	1465d584-b059-4a84-98fe-11c95d239057	t
13a7dc0a-e1d7-45ca-9688-df9d6b4d2321	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	08c425a2-5732-4876-9b21-70e5154d2b2e	t
4e8b522f-8612-4931-a83c-8cf1f066209a	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	463888c1-f5ee-4a1f-b313-292df82b90bb	t
4df6fc2b-23f4-48d6-ad3e-fb6e1e73c0f1	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	813b27c1-6961-49a4-bcc6-402f69f1280f	t
0685706d-f5e4-4c63-8a78-76fe7362d2c8	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	db7cfad6-7cba-4bf7-a687-17a5c822312c	t
91ed7945-bc96-4af9-b2bd-c0f67d44f483	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	43e641c2-086c-48df-b4b6-f8277b47e5cf	t
76874e83-f6ec-487f-934e-f8276102d595	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	62acc2d9-2663-48be-9f8e-656ab56fefca	t
3755f6b2-a2a3-4a51-b6a5-c9d4bfebd9b0	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	d9d578ea-b59f-4de9-aacb-4a093404da48	t
c0215e3e-5fc8-485e-b410-621a5ed0ad9e	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	e4b344b6-b8a7-4236-8f0a-4b04ff039646	t
91f64a19-4bce-4456-8430-1c0a747e0121	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	0446fe29-eb53-49d5-9041-5c8cba7abd43	t
d787c290-86fc-4cd5-9911-8a6ebd511828	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	bfab3bfb-d153-4f35-86af-f066ea03309d	t
c047246c-ba2d-4f1c-993b-aae06aa9718a	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	ffc5ca32-6627-42c8-9883-a6f30d9b5120	t
4284136d-c1f6-430f-9719-6a7ff66e4229	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	c6341a36-ad71-4153-990c-86b280a86966	t
8fad694c-8e55-47f1-8e1e-e55b6f061f7d	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	85a4bd06-56e9-4685-a453-b3eff5ae67d3	t
64ca5c86-3192-48b1-8112-d31bd63c2848	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	4297135b-575d-484d-a0bf-0d2f8dfbd73e	t
6fe6d551-ac8e-404e-9018-ecbda417216f	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	be0f9ce3-5284-46f8-94ab-33b0f06f13c8	t
26b2e919-0dbf-4310-b261-9740952d5f54	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	14a77b21-e522-48c2-9b63-3f81be5bbc11	t
6cabf92c-95b5-4861-b6c2-5fccf627bc24	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	b0f7fecc-7b7c-4fc6-beee-e853fafa83a4	t
97446f57-3288-4d5c-b1aa-bfccc1876775	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	cb606a10-c96c-4560-a052-dd6f9d4c4783	t
cdaea259-c0d9-4abc-bf42-41141cabfc65	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	62151e68-96d5-4966-acef-5fc2c8f7eb04	t
0cdd7658-ddba-4541-a65f-84bf37ebe9f8	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	c7e724ee-0324-4509-9686-74e08ff3ba9f	t
17603f0b-326a-49a5-a75a-6f1c64798c1a	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	714796e2-ee7e-4199-b7aa-60d113805354	t
60a5e7c4-fa16-46a1-9bec-fa15eb06c16f	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	e08b477b-7c42-4c3f-8f81-63d22435af05	t
9c0ff73e-207a-41ba-81cf-32ad0298c6ff	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	debbde72-8ac6-4090-99b7-b5e7033f8b9e	t
69167aef-768b-4678-a732-95d0ef583420	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	cb0f661f-05e0-41b8-8757-cf1363228782	t
fbd59db2-ac86-412d-b989-292f306ca8e2	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	1200eb94-7bad-48ec-891e-a8cb73631f69	t
38b85d12-a1c7-4b80-9f69-2a4c5451dc2f	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	ec575db7-c54a-4a2e-b8cd-1b4b3b209dfc	t
2fe4c024-73fc-42a7-9eb6-78fab4c7e2ca	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	7591d17a-580e-40ac-8119-1e0a7f091914	t
edb3cd62-8a08-456c-931f-34a7bbc7bdc8	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	3643bc48-babd-4302-a523-1f2485ca9bc8	t
24693f46-ff12-43ef-883c-327a66b9eefc	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	32edcf03-ba82-4cdb-8ecd-e05dbe65b726	t
aaf3bfcd-0b48-4df0-a0f8-be3658fb038a	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	2b20a51e-c97a-44b7-8527-39554859bf0c	t
720bbe0f-0c5d-47b8-9640-c04bb1ef22cd	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	65bdd483-1f6e-4a36-a0a3-a42e2f8499b4	t
87bd63fc-92de-4f11-baa7-766ac8cf3228	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	19c88a8c-7c58-442c-8cd3-29dcdd295a75	t
f5270065-fc4b-4006-aa3d-ce280f9c7181	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	318f72c2-cebb-4bc3-aa26-b2b270a2ce6a	t
fe4d02c1-93f9-49af-9bbd-d8211f45c2fa	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	69a4d277-14d2-41a3-bc31-6026ced1832b	t
8f7a1bca-4020-47ff-b914-8ed24b1e3f1f	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	5465180d-5f1e-43e3-a09f-d668828e2200	t
b13c9e67-b12f-4b97-b751-c071971ec0b2	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	617dad95-b673-4dfe-b90b-5d02e5c09f5c	t
79474c09-1e32-42c2-8612-a613a6423456	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	92cdd085-9e29-4b6a-b1a7-26616626622a	t
d33b6726-4512-4dd1-8b5d-8b8a5317180b	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	3a383c98-163e-4a4d-a74f-61f0936eade0	t
c46f2473-4828-4845-a138-24c49f72eea3	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	40ac07d5-9f2d-4d6e-a4db-a9d1f6cfa074	t
22c70063-65f1-49fb-aba4-2bb2e21975c4	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	e93ee241-d76a-4ba2-8563-9cca437b2717	t
09d64dde-d0cf-490d-8f09-3eadd0ae9375	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	8204ed93-87bb-4f3c-938e-cfe97b3a3808	t
87ba3401-fbc8-4f38-88b8-8ba430fe4baf	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	5fe27ce6-2e80-4000-80d6-4f463cc85cb8	t
9ac1293a-8dfc-40c5-b97c-82de518569e8	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	b563be50-f131-4975-ad03-ce6c5c2ad661	t
70fe0359-2e89-4cdf-8e9c-85de800eabb7	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	e4430f05-c334-4fd1-9944-0cc8c824d174	t
fae5892b-3641-4b5b-a500-7ba740c2f5bd	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	765885c2-9f1d-4a3f-8a84-bfa29474cb88	t
69346b31-b778-45f9-8c51-8fa30eb1e547	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	6eb59714-6f6a-432e-a10a-8e5c9b1049f9	t
d0cf0061-14e3-42ac-a565-827fdf4e7ee7	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	f8161e39-2443-4100-85f8-e72408f247d9	t
ab6f046d-2a0e-4374-ba0a-63f97465f265	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	b1a35303-045a-4ae9-8401-d17304016b78	t
c4e17bee-6b08-40fa-a54b-0b96893d9ff3	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	13703203-6f5c-46fe-a039-c22b83b7d67a	t
ffb28c7f-0688-46b9-8dc2-0cd320892c45	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	d1ddc3ef-1cca-44c5-814f-e8bbc6a440d3	t
5f1fa2c3-ed48-4b9d-a38a-5c013acf386d	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	b0988299-bd8d-44fd-a9f7-1e943d3eabd6	t
909df99d-ab46-4939-9133-50fc48cf8bbf	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	dc2fb26c-21b6-4ca6-b5b9-41888363a20e	t
33e21982-8864-4256-956c-0dbb86d1c944	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	55a213ce-5e53-43ae-a3a9-b36941283315	t
d557133e-b657-41c7-a6a7-ad7cfab69dc3	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	441fd06d-eb48-4b05-8fe6-56425e345e52	t
49e78e1a-2c17-4c2b-9caa-71eac28f6817	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	82e60564-36bb-4fa8-b638-ddc7833aff70	t
e688c188-6e23-43e8-972b-13784f8543ce	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	3c5cd274-9dda-4442-bef6-a4af2187e72d	t
47b396fb-2710-4fc3-832d-3836b687cf69	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	a525f2ed-502c-45b7-94e1-3965b1b5427f	t
c3ecb3b8-da03-4eda-a66b-db45c67dab11	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	78323801-713f-41b2-8734-fd0211440547	t
efbb105e-28de-48e4-8bcc-59b8d7f1290d	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	9c4a4496-ad7e-4a65-a89c-00987a6a114f	t
d941d815-375c-49f4-b0ef-7a9f3a741d20	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	7e24fa85-4b1b-490e-8de8-273803635b61	t
2f73db70-b146-456c-bbb8-73e81e32c03b	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	d0bee950-ce57-4f2a-b34d-c275fccfad81	t
2f52f9e6-f0f8-403c-abe5-33a71bd8eec5	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	5897223a-bc1f-416d-99fb-2535a59da73f	t
2199ee18-5512-4bac-b394-0a37c2f317e6	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	67746be9-9df0-46ce-b75c-da50c855639f	t
a1470c41-75fe-455e-9d9b-89c381e3e056	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	b9282ce6-a435-4e89-ad0e-534c21cc28dd	t
bca188d4-f1a5-45ac-8e51-c571b8115a7c	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	6bbff63d-a0e5-46f7-8fb1-d31d1cfef127	t
4bef8401-966e-4654-b6e8-e529eceabe16	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	6cc46304-a7ae-4c50-bd97-0c1e1c6a34cf	t
210be629-117b-4e5d-a344-0b453bcf2f04	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	086c2d7e-7119-471c-a611-8f8031361477	t
b04f56b2-1065-4382-a954-dcee9bab4445	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	37e74a24-3f90-419b-9981-d348ae6ca202	t
982d9924-b4df-4556-afce-492e2e03d55f	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	5c2aa64e-eb62-404a-8d5f-1f2a5440ca6e	t
f718d80d-b954-468d-b4bd-78b73340ca9e	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	d2e70090-53cf-41ca-b345-436e2788955e	t
5e3f6300-6d93-4633-a6d6-25bf9446c2a6	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	a1ca5a38-ed05-4b21-b170-b2206112df8a	t
99c5102e-dd2b-4b90-9f1e-bf2d22a6e79b	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	af04f9ff-52cf-4586-ae04-b0b9f780ccb3	t
1d81b6c0-a46a-47fa-a678-32bd4900ee78	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	1c2645fc-77a5-4388-b326-f0c2ae18ff1f	t
7410f1d1-5e45-4851-aadd-356aab9d73c8	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	9246413b-0a57-4815-90e5-c96ec53d576d	t
fb94c740-ff21-4907-bf4e-72a77f83c82a	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	8f7d0ec8-8584-4cc5-8931-73e03a92ef2c	t
d2825926-b56c-4bf1-9f55-ba00233d3209	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	7b723a9e-3644-44fb-905b-46c7092d6ba5	t
5d911fbf-8224-405b-ba4e-a59c78c10ac1	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	383d0c77-7eef-4f97-af69-56b71d74e365	t
f392ca21-b8cc-41b6-97fe-345207b524b2	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	d29108a6-22cd-491f-ad51-82b03a2c87cb	t
0c035fad-6723-4280-8624-6a18379759d4	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	523c32b8-7f21-4a7b-89e6-c772ad2795d9	t
e1e35b9a-5068-44d6-9fef-56c502204281	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	db9b17c3-1305-4de7-b957-f1d77565729a	t
d054fda9-4101-4cd1-94af-60ad1d0be893	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	088aaf2c-cc70-49f4-aa8b-90f7159bc4e0	t
c0406c17-b3db-41b0-aa1c-e4129de308dc	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	e74ad468-e5c2-48bc-a0c8-9dd521d63e4a	t
11d566bd-d0ab-4a50-b070-d055fe486161	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	9d167ef9-e731-408f-91e0-b7dc4d54204c	t
dc480d84-ded5-42de-be8b-591b043a3b73	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	8a0b6448-a589-4537-ba67-cba34cb0d66d	t
12e233a6-b591-4e3d-9b68-7c96045c3a9a	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	e63a74b8-e86d-4bb8-bf1e-9fa5f8e4ad78	t
dec45c44-10d2-4a1d-86eb-b4f9d12d07fc	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	1803d15d-09c6-4594-b7f8-8d034218dce1	t
96887108-5c2d-4e86-88fd-368e38373b1c	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	a4c4fd6e-edcb-43ff-be59-c59f1e5e09c5	t
bf07461f-4bd0-48bf-bab8-cd8ea8a51bf8	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	c1b11e2b-9080-46a7-a479-cf28a634169c	t
2094d310-3d28-42d3-925c-e8e72b65c3fe	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	c1ed7d36-c76d-4ed0-9db4-bf1936db2170	t
596ff460-21a3-4246-802d-8b91cf7c2c90	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	c017877c-20a8-41ed-b4e9-23d155d7a80a	t
d3bfd2c2-5adc-4055-9478-d0ec55ebd567	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	f44caa7f-54fa-4610-bb8f-519cd3646236	t
3f00e2b1-ae33-4b3d-864a-0837729c1a2d	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	f488f372-66da-487a-9baa-33be0937ac9a	t
1bd0578a-32be-4e04-9a56-8dff5a0fe688	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	bcaffe57-4a6a-4683-ad3e-3e16cd667e39	t
cedeb1fd-508b-4ef7-a70f-22f711cd4c00	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	a95aded4-505a-4182-92b7-4dfc6081aa51	t
8b849324-2040-4c09-a9e7-374584752b46	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	8aa0bc0a-52e4-4791-85ba-29319ab5b1b9	t
1636e48c-c6c0-4cda-81e6-b4b2b1dafbf3	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	f0979a58-f237-45b7-9b67-82cc7f396a80	t
3a690cee-c6af-4c38-933a-5c6c01a5737e	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	bd7b9e83-59ed-4710-87b9-0ff9af9675c0	t
c195f14c-8c8e-4431-89f8-a8abf439ec36	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	5711ee01-8991-4a31-9aeb-2667755cbffe	t
f66e9b2e-e45b-49bd-9f00-2e71b89030b7	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	2aafb711-1086-402d-aa3a-229833d56b8d	t
701ce8ba-2a95-4f70-aeac-e75af876ff4e	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	e58bc9e2-316e-4339-bb95-4ed989c19680	t
05743290-5028-4057-80fa-0bdeaba3406f	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	89cc55e6-d2bb-4d8c-a8d3-63ee8e551201	t
e04a429a-bf9a-4481-9220-d2c9e380493f	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	21c8b9ba-53bb-46b4-a740-b20208012651	t
27f934c6-39af-4f4a-9494-41df9b569506	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	b768d8b8-5e57-47c7-9daa-049b7f74e454	t
4bcc0325-25dd-4ba8-938d-67664f657d08	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	7aea2af9-5c2f-483e-b330-30b349c2c93a	t
1568c246-a0ac-4cee-b315-573aae14173a	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	96d8b20c-4e12-4895-bb0b-3c13d95b3817	t
9d87da0c-9609-4d7e-b351-ea268c7e05c1	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	c9cb57a5-8a39-4ef7-9b53-b76bbc52354b	t
ab9d915a-705f-4399-bf69-c01b464e99c3	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	aedc817f-6de3-4ab1-92f4-a1300ed933c0	t
1933b434-5701-474c-865c-7d9461878476	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	253cbc8c-d2d7-4a8e-bc39-639f364b7628	t
0c869b9f-6f0e-401b-9ea4-e7146375f25a	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	b4813ddd-195d-44fb-b036-eb8eb41b0bd0	t
ba8a7c42-c06f-41e6-b85c-40c7c60ffb8c	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	5a079c52-e027-4664-bcdf-8efa30ee9140	t
71f7ae89-fed7-427f-8bb7-cb09cbe4f1d8	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	6a454435-81c6-435d-b0ca-2d081f51bef0	t
2474a17b-1532-4577-9902-85b172eedd8f	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	9d3a35ab-f2a0-4bfc-b151-fcb3206d8d4f	t
2763b370-f0de-4171-8f77-29f4fe74d0ac	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	d4eab18e-e827-44f3-9c75-232e54de98a7	t
ea9f8220-8699-4936-8c5e-ea4685a8c29b	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	ba9af3a9-0ec6-42f7-82bf-296f33b79585	t
485c8492-97b3-43f7-8ea8-69b52ecd6829	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	b1225038-bea9-4619-95eb-52e3d6945d20	t
5cd46b1c-7368-4f3a-8c9a-1cee6122b6ad	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	1cd54cef-7fd5-4240-b9a2-83ffbfc75742	t
5d38c3a4-85ba-4793-980f-9d05a54ece6d	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	dfe04089-bbed-465d-972b-7ca175919653	t
6e45a79d-6961-44b8-9db5-2b81724e9f8e	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	4338ee80-fb05-485e-b856-68507e2cfd32	t
62d2beb6-0a19-4426-8030-872a4abc5512	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	e834ec0d-0b24-4a8b-953c-af1af0c6d5d3	t
97df648b-d6a4-453f-afff-17a55c633051	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	ae6a07bd-0af6-401c-9eed-7ba93932064a	t
1831bfcd-966e-4686-b954-a3232849b2f6	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	774a53f7-dd97-46ec-9e8a-b9ddb318e147	t
4a0ca987-38a6-4e2f-ba6e-8c1431a8e22f	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	8982b47b-3057-44bd-bb88-d57c9f880785	t
e057f770-35c1-472e-8154-9bb1c0a9e181	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	b3304141-24ef-414c-a6d7-5943538a2816	t
a832e196-1b51-471e-b6c5-0ea28ed85b24	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	748ab168-0feb-4c03-ad00-cedb2488ac5b	t
a5cfb91b-d27e-4981-b94c-bea46b7fa2f2	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	ac209511-5409-4337-bab1-26ecb9419261	t
ab1e29bd-3932-4db7-a8b0-3174f80654a4	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	d590ac11-d5b3-4de6-80be-234822e0f11f	t
b2b74866-138a-4c85-9c1b-e3087902c656	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	e4ca7d94-7a95-4b4b-9694-fd655852a646	t
1a708caa-94de-478c-8989-c6f5bafc5824	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	00371537-5f65-4617-9216-9dedaeffa8e2	t
3e6def2d-a57f-4b31-8121-852b660a293a	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	55cec080-b24a-4757-a470-c79bc5dfccec	t
7e782317-4501-4dea-9c2c-7d93967c2a8c	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	594ae81e-6636-4ead-bd55-c219707256a5	t
be09bc42-c07b-47b2-9d69-50e313e2db16	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	3735f6f3-886c-4580-b5cf-68e0621c40c6	t
9ef00f3f-c277-430a-9230-44e7eed77b65	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	1c68cbce-352d-4ff6-833b-d447a234858c	t
0fb260da-0547-4108-ac01-d41310b625b1	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	4ba83f41-cda5-42e2-8122-aaed9565ff60	t
d7950191-66de-478a-8caf-fd94b7f8b5fb	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	0de45ad6-c4c5-4af1-ae3e-d06173a60904	t
8bf8f60b-1d5b-485c-abfc-59f18c0535be	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	5d2bff8b-268f-493d-89a3-a9f15b981410	t
64b3387c-3a60-44cf-b153-43d6aa4d97a5	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	a2e37ad5-5c9e-4556-ae97-cb3e13edbb30	t
84e21df2-9f48-45d6-a398-1cd3a4f54075	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	5466df10-0968-4b29-b970-c2a75ef3c1b7	t
4f271676-68a2-405f-b8e1-9f57a2d1ad9c	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	b4d9d459-5ed8-40e5-b16c-5a2f94755c13	t
e2d22941-adf1-45b2-acfd-ef83e5cc6617	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	0da7c411-620e-4501-9a3b-e96364d7aa4d	t
fd9d8d1c-c231-4b66-bc2e-b3880936dcc8	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	5c17b316-51b2-4699-8e0d-05229fd4d004	t
d744a3db-5c28-47fe-af27-b37de7ee8a8e	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	3b6e7821-3ecb-435b-9779-b4e64dd1a99d	t
77cc0fd5-ff89-4dee-9a93-454637c1a811	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	5617a585-75e3-4ddf-8474-c6aa5dc7ea08	t
a95966f1-521b-4dca-8c7b-8ac2dc58be33	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	631f60d8-b881-4434-9046-22eef5adf1b5	t
5dc13a1b-fa35-4967-98d7-712d070320e5	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	8f9836a6-f80a-4729-9a3f-9c6146ca61a3	t
e465c256-c9df-455e-81ea-49374aa9c8d8	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	73bdaa48-2d55-4492-be74-dc55fe5d1136	t
a4d0478a-02d5-415f-b694-00b33f5f39b9	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	4cd95349-310b-441f-a2bf-851e152bc3bf	t
f97802ca-3afd-4f6d-8dea-a30f5c0e8877	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	73e089c2-b8e7-4da3-8a10-8bc4a263576e	t
dfb73152-e943-4cbe-a501-6f985250f1d1	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	d7b5e546-5398-4df5-aba1-c7131b7c9232	t
9b68353e-704f-4e37-95d4-20f4f6df01bf	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	c149c1ce-7505-42c7-8270-c0b4b4117f7c	t
51195201-6474-489b-9ff0-e99a25b4cea9	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	8a9a43e5-1123-4928-b970-0b2309fe6429	t
e9b3e52f-67fc-43ca-bbaf-4d9045681851	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	e24c6e8f-ca0a-46f2-9a66-68bc9bb2a2ad	t
28092d5b-bd82-4ba8-850f-06dcdde817ae	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	fe0d4f3a-60f6-4348-a846-4b66fdc22528	t
b6bc7185-e323-4b7c-88b7-6af6fc0396b4	9a90b91f-acf9-4aec-a2c7-3d1f794e05b4	67c96648-6379-4562-8afa-d7073cef9ee8	t
e76064f4-0dd2-4997-8be5-ea65073607e7	134af9e8-ce05-4cd1-8378-46f54506c1d7	13b58179-744f-4995-a76b-767978e06c9d	t
15196b55-e04b-4836-8599-0d685a929f45	134af9e8-ce05-4cd1-8378-46f54506c1d7	052210eb-57fa-4454-ab70-229638f72610	t
3bd05a5a-1636-40f3-a391-864d732aba8f	134af9e8-ce05-4cd1-8378-46f54506c1d7	8af3ee70-6377-48fc-9521-d2e7ec552f5e	t
86595054-1602-4f48-86e0-2429ada5e26e	134af9e8-ce05-4cd1-8378-46f54506c1d7	3b4c971b-ec7a-4734-b6b2-69c746fcc6a4	t
04b88487-05bc-4eff-8cce-fee3c5c190d6	134af9e8-ce05-4cd1-8378-46f54506c1d7	6f1c0442-d26a-42ec-b778-6459f52e4bbc	t
44785c46-566e-40aa-82e7-bde170cc6f52	134af9e8-ce05-4cd1-8378-46f54506c1d7	94516341-d44c-4f17-a3cc-e2e2375d2509	t
9e36e747-fd50-42bb-b520-49d064a4c9d5	134af9e8-ce05-4cd1-8378-46f54506c1d7	94a6518f-a4b2-4fe3-b947-0e7a8c0227da	t
f30f2218-44eb-429f-912b-e0e9fe865f31	134af9e8-ce05-4cd1-8378-46f54506c1d7	e329d844-6041-45f7-b12e-9896f0ce9b2a	t
de2cd87d-95ee-4a33-8795-2904b285ea18	134af9e8-ce05-4cd1-8378-46f54506c1d7	7fbb4610-0b07-43d0-91ad-6743b15f398e	t
bccf285b-ebce-42cd-b523-90a5dc304108	134af9e8-ce05-4cd1-8378-46f54506c1d7	9e18183c-25b6-406c-8859-458eae30b8d3	t
97ba34cc-a9cc-42d1-b6a4-4f0a50fa86e9	134af9e8-ce05-4cd1-8378-46f54506c1d7	a9210be9-d213-4e37-97fa-72cc09c1fc23	t
b661158f-d73d-432b-b28f-b919bb042b40	134af9e8-ce05-4cd1-8378-46f54506c1d7	b1d0d2e1-e295-40da-a344-c8ead60d6fc0	t
cf5ab9c1-10a7-4068-a664-0cf37589c7cc	134af9e8-ce05-4cd1-8378-46f54506c1d7	35cdc465-f6ef-445c-a0c5-0546c85811c6	t
80439c5b-078c-4448-b4fc-a41a2051fa38	134af9e8-ce05-4cd1-8378-46f54506c1d7	1465d584-b059-4a84-98fe-11c95d239057	t
7c7841e6-7701-40c6-89ba-2e388ad95b97	134af9e8-ce05-4cd1-8378-46f54506c1d7	08c425a2-5732-4876-9b21-70e5154d2b2e	t
831a3ed2-4ab4-4cd3-9b80-de967f136916	134af9e8-ce05-4cd1-8378-46f54506c1d7	463888c1-f5ee-4a1f-b313-292df82b90bb	t
b7a8a684-fc40-44ec-ae22-31293990f46b	134af9e8-ce05-4cd1-8378-46f54506c1d7	813b27c1-6961-49a4-bcc6-402f69f1280f	t
cfff2072-4c5b-4360-a81b-dfd31b5fdbb5	134af9e8-ce05-4cd1-8378-46f54506c1d7	db7cfad6-7cba-4bf7-a687-17a5c822312c	t
4254a941-6812-406d-afb2-3e01c124ac9a	134af9e8-ce05-4cd1-8378-46f54506c1d7	43e641c2-086c-48df-b4b6-f8277b47e5cf	t
bacd83b7-9cc6-464b-ade4-04b961ddf111	134af9e8-ce05-4cd1-8378-46f54506c1d7	62acc2d9-2663-48be-9f8e-656ab56fefca	t
aa0eef4e-9f8c-4449-b94d-d6c85b2e94a2	134af9e8-ce05-4cd1-8378-46f54506c1d7	d9d578ea-b59f-4de9-aacb-4a093404da48	t
e40356c7-c198-46fc-8e72-03305983500d	134af9e8-ce05-4cd1-8378-46f54506c1d7	e4b344b6-b8a7-4236-8f0a-4b04ff039646	t
f15e7008-736a-4b99-920f-49efaa9afc89	134af9e8-ce05-4cd1-8378-46f54506c1d7	0446fe29-eb53-49d5-9041-5c8cba7abd43	t
e98a0715-5a07-4970-b529-015ffdf70587	134af9e8-ce05-4cd1-8378-46f54506c1d7	bfab3bfb-d153-4f35-86af-f066ea03309d	t
aadaf7c0-d27a-45ea-a417-090ab0589eb6	134af9e8-ce05-4cd1-8378-46f54506c1d7	ffc5ca32-6627-42c8-9883-a6f30d9b5120	t
ec9d5e8e-c66b-4bfd-ae41-f2c7f6c1ab32	134af9e8-ce05-4cd1-8378-46f54506c1d7	c6341a36-ad71-4153-990c-86b280a86966	t
4f34e0d0-2bc0-48df-972b-5aefd97e2adf	134af9e8-ce05-4cd1-8378-46f54506c1d7	85a4bd06-56e9-4685-a453-b3eff5ae67d3	t
b10fec1c-da75-41f8-8dc7-3b62bb644e01	134af9e8-ce05-4cd1-8378-46f54506c1d7	4297135b-575d-484d-a0bf-0d2f8dfbd73e	t
a79f33ad-226a-4172-b347-fa18ba6cd1eb	134af9e8-ce05-4cd1-8378-46f54506c1d7	be0f9ce3-5284-46f8-94ab-33b0f06f13c8	t
da433028-b2e3-4afb-90e7-564f161daa23	134af9e8-ce05-4cd1-8378-46f54506c1d7	14a77b21-e522-48c2-9b63-3f81be5bbc11	t
554bda53-e314-41ee-bdfb-0c5fb965db00	134af9e8-ce05-4cd1-8378-46f54506c1d7	b0f7fecc-7b7c-4fc6-beee-e853fafa83a4	t
a428e24b-1443-4340-b51b-855c5a07a0f7	134af9e8-ce05-4cd1-8378-46f54506c1d7	cb606a10-c96c-4560-a052-dd6f9d4c4783	t
7b30f444-1280-4139-9e08-fd3ec72a0b64	134af9e8-ce05-4cd1-8378-46f54506c1d7	62151e68-96d5-4966-acef-5fc2c8f7eb04	t
611de672-a216-4f22-be50-db865202e21e	134af9e8-ce05-4cd1-8378-46f54506c1d7	c7e724ee-0324-4509-9686-74e08ff3ba9f	t
61c17774-3048-48f9-b01e-d754a0a21f10	134af9e8-ce05-4cd1-8378-46f54506c1d7	714796e2-ee7e-4199-b7aa-60d113805354	t
27ca4dc9-8b51-4dbd-a4d9-c2898b5d77a0	134af9e8-ce05-4cd1-8378-46f54506c1d7	e08b477b-7c42-4c3f-8f81-63d22435af05	t
557db520-7de3-4e4a-9087-bd0797233362	134af9e8-ce05-4cd1-8378-46f54506c1d7	debbde72-8ac6-4090-99b7-b5e7033f8b9e	t
fa69df45-4b74-4e74-be7a-8951c976204b	134af9e8-ce05-4cd1-8378-46f54506c1d7	cb0f661f-05e0-41b8-8757-cf1363228782	t
007b73d5-4d18-4245-aeda-d9725dea685e	134af9e8-ce05-4cd1-8378-46f54506c1d7	1200eb94-7bad-48ec-891e-a8cb73631f69	t
2158ff2a-a2f1-4940-85c0-8833a8ca7fe3	134af9e8-ce05-4cd1-8378-46f54506c1d7	ec575db7-c54a-4a2e-b8cd-1b4b3b209dfc	t
d2fe2ad3-0268-41f8-946e-cb907657c710	134af9e8-ce05-4cd1-8378-46f54506c1d7	7591d17a-580e-40ac-8119-1e0a7f091914	t
68efd7b7-9864-46a2-bf44-a4357c6f7685	134af9e8-ce05-4cd1-8378-46f54506c1d7	3643bc48-babd-4302-a523-1f2485ca9bc8	t
f7b1ae6c-e6c7-4c1c-9e59-8e0412968314	134af9e8-ce05-4cd1-8378-46f54506c1d7	32edcf03-ba82-4cdb-8ecd-e05dbe65b726	t
b9a047ee-7cfa-4a56-b53b-6b5d152d9190	134af9e8-ce05-4cd1-8378-46f54506c1d7	2b20a51e-c97a-44b7-8527-39554859bf0c	t
4f0828ad-34df-477e-9653-4339f5d3617f	134af9e8-ce05-4cd1-8378-46f54506c1d7	65bdd483-1f6e-4a36-a0a3-a42e2f8499b4	t
7eb64fbe-4ec5-48b2-9c3b-f34268e7321f	134af9e8-ce05-4cd1-8378-46f54506c1d7	19c88a8c-7c58-442c-8cd3-29dcdd295a75	t
92bf6c23-b454-42e3-8f37-3329d3882c8c	134af9e8-ce05-4cd1-8378-46f54506c1d7	318f72c2-cebb-4bc3-aa26-b2b270a2ce6a	t
2c1055bf-b093-442f-8366-0243404f6e42	134af9e8-ce05-4cd1-8378-46f54506c1d7	69a4d277-14d2-41a3-bc31-6026ced1832b	t
77326f7e-9727-44e2-9121-aed866a7824e	134af9e8-ce05-4cd1-8378-46f54506c1d7	5465180d-5f1e-43e3-a09f-d668828e2200	t
ad85d126-cf90-485e-824b-a9f6794d05fa	134af9e8-ce05-4cd1-8378-46f54506c1d7	617dad95-b673-4dfe-b90b-5d02e5c09f5c	t
27343532-acd3-4281-84e5-115e77136e7a	134af9e8-ce05-4cd1-8378-46f54506c1d7	92cdd085-9e29-4b6a-b1a7-26616626622a	t
504de981-0229-4370-a121-08ea3cd4d3e7	134af9e8-ce05-4cd1-8378-46f54506c1d7	3a383c98-163e-4a4d-a74f-61f0936eade0	t
55438c92-2d87-4583-b59f-efb251585795	134af9e8-ce05-4cd1-8378-46f54506c1d7	40ac07d5-9f2d-4d6e-a4db-a9d1f6cfa074	t
d1f5b726-77ff-4e2d-90d6-650a09b74dcc	134af9e8-ce05-4cd1-8378-46f54506c1d7	e93ee241-d76a-4ba2-8563-9cca437b2717	t
d0c71e45-c070-4177-bd84-d0b981e34b6d	134af9e8-ce05-4cd1-8378-46f54506c1d7	8204ed93-87bb-4f3c-938e-cfe97b3a3808	t
3ee526d8-185c-4a45-85d0-2a8ba733318e	134af9e8-ce05-4cd1-8378-46f54506c1d7	5fe27ce6-2e80-4000-80d6-4f463cc85cb8	t
306bc40c-3918-4635-babf-fb76e2e17b3b	134af9e8-ce05-4cd1-8378-46f54506c1d7	b563be50-f131-4975-ad03-ce6c5c2ad661	t
32626832-ad93-4251-9efd-cb821f6287fe	134af9e8-ce05-4cd1-8378-46f54506c1d7	e4430f05-c334-4fd1-9944-0cc8c824d174	t
700363b3-ad31-4760-bc8e-308b07ec28c7	134af9e8-ce05-4cd1-8378-46f54506c1d7	765885c2-9f1d-4a3f-8a84-bfa29474cb88	t
515f9f29-2dbb-4eb7-9546-36051a32e086	134af9e8-ce05-4cd1-8378-46f54506c1d7	6eb59714-6f6a-432e-a10a-8e5c9b1049f9	t
a0deb2ca-b46a-4fa8-90f3-516b2047ef11	134af9e8-ce05-4cd1-8378-46f54506c1d7	f8161e39-2443-4100-85f8-e72408f247d9	t
1470fba8-afcc-4c56-81c0-c12c2a2c8224	134af9e8-ce05-4cd1-8378-46f54506c1d7	b1a35303-045a-4ae9-8401-d17304016b78	t
1c913cfd-65b7-4627-8475-f9ef8e28dc5b	134af9e8-ce05-4cd1-8378-46f54506c1d7	13703203-6f5c-46fe-a039-c22b83b7d67a	t
b07ad613-1601-4313-8574-c86ead53d259	134af9e8-ce05-4cd1-8378-46f54506c1d7	d1ddc3ef-1cca-44c5-814f-e8bbc6a440d3	t
ce9aab6f-8d22-4816-a84d-cd9e93d1fe72	134af9e8-ce05-4cd1-8378-46f54506c1d7	b0988299-bd8d-44fd-a9f7-1e943d3eabd6	t
843e3636-d43c-4d73-b697-d7a73c87e66f	134af9e8-ce05-4cd1-8378-46f54506c1d7	dc2fb26c-21b6-4ca6-b5b9-41888363a20e	t
6ccaf72a-e92e-4c48-bda7-4a902d9f2a58	134af9e8-ce05-4cd1-8378-46f54506c1d7	55a213ce-5e53-43ae-a3a9-b36941283315	t
b53b19c2-71b1-406b-bac8-b2c3324d4100	134af9e8-ce05-4cd1-8378-46f54506c1d7	441fd06d-eb48-4b05-8fe6-56425e345e52	t
716cd2a9-0468-45af-9c6d-01733b5d521f	134af9e8-ce05-4cd1-8378-46f54506c1d7	82e60564-36bb-4fa8-b638-ddc7833aff70	t
e37ad686-2bcf-4149-acad-8519ec1b0cb9	134af9e8-ce05-4cd1-8378-46f54506c1d7	3c5cd274-9dda-4442-bef6-a4af2187e72d	t
0fda9c12-3162-48eb-ba7e-afa9ba0552b9	134af9e8-ce05-4cd1-8378-46f54506c1d7	a525f2ed-502c-45b7-94e1-3965b1b5427f	t
0a2eeb3e-2a3e-4d74-99ad-af014d773da9	134af9e8-ce05-4cd1-8378-46f54506c1d7	78323801-713f-41b2-8734-fd0211440547	t
30a7c2f7-176c-4b68-86fb-f8d68871b9dc	134af9e8-ce05-4cd1-8378-46f54506c1d7	9c4a4496-ad7e-4a65-a89c-00987a6a114f	t
a9cfc156-8f8c-4d03-8eaf-d9d27c461615	134af9e8-ce05-4cd1-8378-46f54506c1d7	7e24fa85-4b1b-490e-8de8-273803635b61	t
27886511-8891-4ad1-af4c-8754ed5043fa	134af9e8-ce05-4cd1-8378-46f54506c1d7	d0bee950-ce57-4f2a-b34d-c275fccfad81	t
d10f9638-a31c-4dfa-9d8e-2fbfe8e1f8c4	134af9e8-ce05-4cd1-8378-46f54506c1d7	5897223a-bc1f-416d-99fb-2535a59da73f	t
6934995e-9313-4266-a269-82a7cc148aca	134af9e8-ce05-4cd1-8378-46f54506c1d7	67746be9-9df0-46ce-b75c-da50c855639f	t
c128aae5-74d2-44d4-81c2-e1f9ca42d62e	134af9e8-ce05-4cd1-8378-46f54506c1d7	b9282ce6-a435-4e89-ad0e-534c21cc28dd	t
dc73be89-5e26-4786-9c29-50de40982b1a	134af9e8-ce05-4cd1-8378-46f54506c1d7	6bbff63d-a0e5-46f7-8fb1-d31d1cfef127	t
20527cea-b5b2-479a-83d0-7800bd14cc1e	134af9e8-ce05-4cd1-8378-46f54506c1d7	6cc46304-a7ae-4c50-bd97-0c1e1c6a34cf	t
0f3f4e7f-39a1-475a-b7de-78c19fb1f671	134af9e8-ce05-4cd1-8378-46f54506c1d7	086c2d7e-7119-471c-a611-8f8031361477	t
ade01208-7b8e-46a4-9acc-81fe34979c96	134af9e8-ce05-4cd1-8378-46f54506c1d7	37e74a24-3f90-419b-9981-d348ae6ca202	t
ccbe6a14-7f61-4d65-a952-4a5d402647a9	134af9e8-ce05-4cd1-8378-46f54506c1d7	5c2aa64e-eb62-404a-8d5f-1f2a5440ca6e	t
27a2e4e6-1d66-489a-bae3-d16c5b677bd5	134af9e8-ce05-4cd1-8378-46f54506c1d7	d2e70090-53cf-41ca-b345-436e2788955e	t
0aa2f10d-e6ca-4ae4-9bed-5cbeff177e40	134af9e8-ce05-4cd1-8378-46f54506c1d7	a1ca5a38-ed05-4b21-b170-b2206112df8a	t
3288ea54-72b3-44aa-9171-0231c223d1c8	134af9e8-ce05-4cd1-8378-46f54506c1d7	af04f9ff-52cf-4586-ae04-b0b9f780ccb3	t
32e729ec-b5ed-4ce9-b347-f1f4aac508fe	134af9e8-ce05-4cd1-8378-46f54506c1d7	1c2645fc-77a5-4388-b326-f0c2ae18ff1f	t
3c3efd78-7124-4aa6-87e3-64ec01c5d09a	134af9e8-ce05-4cd1-8378-46f54506c1d7	9246413b-0a57-4815-90e5-c96ec53d576d	t
0d24853a-7c97-4a2e-992f-d41592f2dd56	134af9e8-ce05-4cd1-8378-46f54506c1d7	8f7d0ec8-8584-4cc5-8931-73e03a92ef2c	t
cf95987d-5f0b-4bef-b166-4f3b21868ab0	134af9e8-ce05-4cd1-8378-46f54506c1d7	7b723a9e-3644-44fb-905b-46c7092d6ba5	t
b31238d0-ecc7-48de-a690-b9f8fd75f44c	134af9e8-ce05-4cd1-8378-46f54506c1d7	383d0c77-7eef-4f97-af69-56b71d74e365	t
9aa5681e-a9c8-4654-809e-5c231afcb61d	134af9e8-ce05-4cd1-8378-46f54506c1d7	d29108a6-22cd-491f-ad51-82b03a2c87cb	t
a77752aa-4c87-462a-b065-c8df921bce59	134af9e8-ce05-4cd1-8378-46f54506c1d7	523c32b8-7f21-4a7b-89e6-c772ad2795d9	t
c29f94be-0bab-49c3-a209-e896209872b3	134af9e8-ce05-4cd1-8378-46f54506c1d7	db9b17c3-1305-4de7-b957-f1d77565729a	t
82b438d1-6452-4117-8626-babf7ee1c5e5	134af9e8-ce05-4cd1-8378-46f54506c1d7	088aaf2c-cc70-49f4-aa8b-90f7159bc4e0	t
9f12403b-76cd-4739-b85d-91d5237e3f32	134af9e8-ce05-4cd1-8378-46f54506c1d7	e74ad468-e5c2-48bc-a0c8-9dd521d63e4a	t
63cbe03f-8b3e-4e83-9615-669824a749bb	134af9e8-ce05-4cd1-8378-46f54506c1d7	9d167ef9-e731-408f-91e0-b7dc4d54204c	t
d86fb6b7-5709-4dcc-9f8e-ef53e1d46500	134af9e8-ce05-4cd1-8378-46f54506c1d7	8a0b6448-a589-4537-ba67-cba34cb0d66d	t
0d02842b-57cf-4711-bc49-7ac20b32df76	134af9e8-ce05-4cd1-8378-46f54506c1d7	e63a74b8-e86d-4bb8-bf1e-9fa5f8e4ad78	t
187c7c4a-9e7a-45c0-9227-c5ba30bf8278	134af9e8-ce05-4cd1-8378-46f54506c1d7	1803d15d-09c6-4594-b7f8-8d034218dce1	t
89c17dce-fd30-490d-a7ab-d3bf54f244ea	134af9e8-ce05-4cd1-8378-46f54506c1d7	a4c4fd6e-edcb-43ff-be59-c59f1e5e09c5	t
59dae3b0-cbd7-4011-905c-4da64d27e7dc	134af9e8-ce05-4cd1-8378-46f54506c1d7	c1b11e2b-9080-46a7-a479-cf28a634169c	t
97043467-6fe3-4a71-a3f7-51476a902d9c	134af9e8-ce05-4cd1-8378-46f54506c1d7	c1ed7d36-c76d-4ed0-9db4-bf1936db2170	t
8a8580a3-e35f-416e-a095-188e02779287	134af9e8-ce05-4cd1-8378-46f54506c1d7	c017877c-20a8-41ed-b4e9-23d155d7a80a	t
96290dc7-5a0d-480d-a5fe-3ee8f0201ee0	134af9e8-ce05-4cd1-8378-46f54506c1d7	f44caa7f-54fa-4610-bb8f-519cd3646236	t
87e3bb00-439b-4370-b138-fd3f299dc16a	134af9e8-ce05-4cd1-8378-46f54506c1d7	f488f372-66da-487a-9baa-33be0937ac9a	t
213b4189-853f-466e-9e22-2717da2a9f25	134af9e8-ce05-4cd1-8378-46f54506c1d7	bcaffe57-4a6a-4683-ad3e-3e16cd667e39	t
bc3fd7d2-3de9-4f79-9346-54239b8cd08c	134af9e8-ce05-4cd1-8378-46f54506c1d7	a95aded4-505a-4182-92b7-4dfc6081aa51	t
d54a376b-9d0f-4a21-a71c-f4476362bbcf	134af9e8-ce05-4cd1-8378-46f54506c1d7	8aa0bc0a-52e4-4791-85ba-29319ab5b1b9	t
d7aab51e-93dc-4c0b-bb05-80bfcabd719f	134af9e8-ce05-4cd1-8378-46f54506c1d7	f0979a58-f237-45b7-9b67-82cc7f396a80	t
40c35c02-f35b-493e-928a-7795e1a51fd8	134af9e8-ce05-4cd1-8378-46f54506c1d7	bd7b9e83-59ed-4710-87b9-0ff9af9675c0	t
162931fb-e29c-48d8-a24a-0240f899aa69	134af9e8-ce05-4cd1-8378-46f54506c1d7	5711ee01-8991-4a31-9aeb-2667755cbffe	t
88897548-9a99-490d-aeea-3efc67b000af	134af9e8-ce05-4cd1-8378-46f54506c1d7	2aafb711-1086-402d-aa3a-229833d56b8d	t
dc9a7e9d-af38-4951-bbdf-8886f22313bf	134af9e8-ce05-4cd1-8378-46f54506c1d7	e58bc9e2-316e-4339-bb95-4ed989c19680	t
bd1b32f5-42f6-40de-b6f4-6501e40ae418	134af9e8-ce05-4cd1-8378-46f54506c1d7	89cc55e6-d2bb-4d8c-a8d3-63ee8e551201	t
0cc4b062-8e46-4d6f-9fba-b30dabd47989	134af9e8-ce05-4cd1-8378-46f54506c1d7	21c8b9ba-53bb-46b4-a740-b20208012651	t
8491127d-cd8e-4015-85a7-62f673e444f7	134af9e8-ce05-4cd1-8378-46f54506c1d7	b768d8b8-5e57-47c7-9daa-049b7f74e454	t
c841de72-dcc9-4088-8fff-7011d0e07871	134af9e8-ce05-4cd1-8378-46f54506c1d7	7aea2af9-5c2f-483e-b330-30b349c2c93a	t
922a6063-5f03-4121-9e31-ed1331ef00fa	134af9e8-ce05-4cd1-8378-46f54506c1d7	96d8b20c-4e12-4895-bb0b-3c13d95b3817	t
e2d104cf-da94-4022-b6c2-ae5c9952f281	134af9e8-ce05-4cd1-8378-46f54506c1d7	c9cb57a5-8a39-4ef7-9b53-b76bbc52354b	t
30e3a9ae-dd14-4720-9b6a-4955dc9b555c	134af9e8-ce05-4cd1-8378-46f54506c1d7	aedc817f-6de3-4ab1-92f4-a1300ed933c0	t
0a4213b5-9521-4f11-8fc9-3a06b9812bbf	134af9e8-ce05-4cd1-8378-46f54506c1d7	253cbc8c-d2d7-4a8e-bc39-639f364b7628	t
5cc5aecd-062a-4b2a-b6f8-9d102442af4e	134af9e8-ce05-4cd1-8378-46f54506c1d7	b4813ddd-195d-44fb-b036-eb8eb41b0bd0	t
a0544d66-0368-4adb-87b2-6b4490fcb063	134af9e8-ce05-4cd1-8378-46f54506c1d7	5a079c52-e027-4664-bcdf-8efa30ee9140	t
6ec47990-9583-4a5a-9e1d-b7dd38cbf8d3	134af9e8-ce05-4cd1-8378-46f54506c1d7	6a454435-81c6-435d-b0ca-2d081f51bef0	t
52e0e085-7cc0-4915-b982-5fe8498511f9	134af9e8-ce05-4cd1-8378-46f54506c1d7	9d3a35ab-f2a0-4bfc-b151-fcb3206d8d4f	t
ecd626cd-81ca-4d62-94a4-b16250568d3b	134af9e8-ce05-4cd1-8378-46f54506c1d7	d4eab18e-e827-44f3-9c75-232e54de98a7	t
a603acd2-8d45-4909-83b8-fa2c8893d8e8	134af9e8-ce05-4cd1-8378-46f54506c1d7	ba9af3a9-0ec6-42f7-82bf-296f33b79585	t
bfc1824f-aa09-43c7-9258-4c66fe0db02a	134af9e8-ce05-4cd1-8378-46f54506c1d7	b1225038-bea9-4619-95eb-52e3d6945d20	t
9c1394f8-60b2-42e9-bf5d-94704d3372f2	134af9e8-ce05-4cd1-8378-46f54506c1d7	1cd54cef-7fd5-4240-b9a2-83ffbfc75742	t
67397a3e-2a63-4dbb-8f80-4751ed78d44b	134af9e8-ce05-4cd1-8378-46f54506c1d7	dfe04089-bbed-465d-972b-7ca175919653	t
11d4009a-de24-4c96-9b02-f427a83c422e	134af9e8-ce05-4cd1-8378-46f54506c1d7	4338ee80-fb05-485e-b856-68507e2cfd32	t
75208d6b-439c-42dd-ad10-c6874aa2e2d6	134af9e8-ce05-4cd1-8378-46f54506c1d7	e834ec0d-0b24-4a8b-953c-af1af0c6d5d3	t
b853e6f3-8192-450d-9aff-c39dbb3595f6	134af9e8-ce05-4cd1-8378-46f54506c1d7	ae6a07bd-0af6-401c-9eed-7ba93932064a	t
6e2bab57-e463-496a-ac5d-4b1412619c88	134af9e8-ce05-4cd1-8378-46f54506c1d7	774a53f7-dd97-46ec-9e8a-b9ddb318e147	t
b9636c52-fa32-4631-b075-ab7b3e974f29	134af9e8-ce05-4cd1-8378-46f54506c1d7	8982b47b-3057-44bd-bb88-d57c9f880785	t
b5eda44e-d953-44f7-9ef4-f4f8537245f0	134af9e8-ce05-4cd1-8378-46f54506c1d7	b3304141-24ef-414c-a6d7-5943538a2816	t
ca66ffe6-583d-43a1-9ff3-a8a7e6cc2577	134af9e8-ce05-4cd1-8378-46f54506c1d7	748ab168-0feb-4c03-ad00-cedb2488ac5b	t
876b87fa-94d8-46cb-89e5-7845a2a15fd1	134af9e8-ce05-4cd1-8378-46f54506c1d7	ac209511-5409-4337-bab1-26ecb9419261	t
66ccd557-00cd-4eda-b4d5-557622b7a49a	134af9e8-ce05-4cd1-8378-46f54506c1d7	d590ac11-d5b3-4de6-80be-234822e0f11f	t
49acddab-af28-48f3-9b92-10360daf9079	134af9e8-ce05-4cd1-8378-46f54506c1d7	e4ca7d94-7a95-4b4b-9694-fd655852a646	t
b93f459b-3a5d-42dd-a56e-cfb65ee4eae1	134af9e8-ce05-4cd1-8378-46f54506c1d7	00371537-5f65-4617-9216-9dedaeffa8e2	t
26235d58-02f2-4e62-9744-a307b6e85984	134af9e8-ce05-4cd1-8378-46f54506c1d7	55cec080-b24a-4757-a470-c79bc5dfccec	t
07c0bb62-4bf8-4f6c-a76e-28a061709f6b	134af9e8-ce05-4cd1-8378-46f54506c1d7	594ae81e-6636-4ead-bd55-c219707256a5	t
706962d3-ed14-4ae3-b35b-4acf89900655	134af9e8-ce05-4cd1-8378-46f54506c1d7	3735f6f3-886c-4580-b5cf-68e0621c40c6	t
0728a92f-23b3-41fa-86e5-51179929413f	134af9e8-ce05-4cd1-8378-46f54506c1d7	1c68cbce-352d-4ff6-833b-d447a234858c	t
904042a7-4126-48e3-8c26-eddc152040d3	134af9e8-ce05-4cd1-8378-46f54506c1d7	4ba83f41-cda5-42e2-8122-aaed9565ff60	t
7a1a56a9-d9e9-4879-a143-c13872112889	134af9e8-ce05-4cd1-8378-46f54506c1d7	0de45ad6-c4c5-4af1-ae3e-d06173a60904	t
3b91a1d7-5b41-4fda-952d-8e059351197b	134af9e8-ce05-4cd1-8378-46f54506c1d7	5d2bff8b-268f-493d-89a3-a9f15b981410	t
85b13644-d33b-4463-b97a-732d3cf46021	134af9e8-ce05-4cd1-8378-46f54506c1d7	a2e37ad5-5c9e-4556-ae97-cb3e13edbb30	t
157b386d-f646-41a2-926e-3cc02e20ce3d	134af9e8-ce05-4cd1-8378-46f54506c1d7	5466df10-0968-4b29-b970-c2a75ef3c1b7	t
5bf51b98-a788-4b5a-a3e1-36475200fafd	134af9e8-ce05-4cd1-8378-46f54506c1d7	b4d9d459-5ed8-40e5-b16c-5a2f94755c13	t
6ea8b213-1105-4db7-8ac2-6c10da0ea707	134af9e8-ce05-4cd1-8378-46f54506c1d7	0da7c411-620e-4501-9a3b-e96364d7aa4d	t
e00d296c-484e-4849-a0fe-8e80cc569c5a	134af9e8-ce05-4cd1-8378-46f54506c1d7	5c17b316-51b2-4699-8e0d-05229fd4d004	t
cb5a68a4-32b7-4a0b-91ec-7923a08e38ca	134af9e8-ce05-4cd1-8378-46f54506c1d7	3b6e7821-3ecb-435b-9779-b4e64dd1a99d	t
9808b87d-b9d7-40fa-a1fa-446579ef506a	134af9e8-ce05-4cd1-8378-46f54506c1d7	5617a585-75e3-4ddf-8474-c6aa5dc7ea08	t
553bc81f-f733-4e1f-9da8-990c6b835f04	134af9e8-ce05-4cd1-8378-46f54506c1d7	631f60d8-b881-4434-9046-22eef5adf1b5	t
b3b43a65-3302-43f2-a4d7-2d8f9af9b074	134af9e8-ce05-4cd1-8378-46f54506c1d7	8f9836a6-f80a-4729-9a3f-9c6146ca61a3	t
937a3034-9afd-4d76-800f-0d69ae6df22b	134af9e8-ce05-4cd1-8378-46f54506c1d7	73bdaa48-2d55-4492-be74-dc55fe5d1136	t
2720356f-bfc4-4d06-b618-93c19c661c59	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	35cdc465-f6ef-445c-a0c5-0546c85811c6	t
4b277945-4e53-4ad6-a1fd-7739bb4f47e8	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	1465d584-b059-4a84-98fe-11c95d239057	t
54b06dda-79bb-49ed-bab1-f16d3844150b	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	08c425a2-5732-4876-9b21-70e5154d2b2e	t
2791c484-a6ed-4067-a094-1cbf860a9fde	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	463888c1-f5ee-4a1f-b313-292df82b90bb	t
7035d824-4e53-4bc4-8995-2acb0396d0c2	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	813b27c1-6961-49a4-bcc6-402f69f1280f	t
257a7283-34d3-4c58-90f1-09f78709dfea	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	e4b344b6-b8a7-4236-8f0a-4b04ff039646	t
b6ab5ad4-3ac1-4033-9ede-248d568ab92d	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	0446fe29-eb53-49d5-9041-5c8cba7abd43	t
1cc9c9f8-ae10-4668-b90f-343a0f747799	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	bfab3bfb-d153-4f35-86af-f066ea03309d	t
1b508db7-72cb-466c-ad32-5ccb5c6adbc5	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	ffc5ca32-6627-42c8-9883-a6f30d9b5120	t
b68a8720-432b-418c-a6f4-d3d4938955c2	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	c6341a36-ad71-4153-990c-86b280a86966	t
fc609f2a-b56f-4a72-97a0-c14ad2951732	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	85a4bd06-56e9-4685-a453-b3eff5ae67d3	t
f227915c-022b-4e8b-85d4-d8b098514a92	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	e08b477b-7c42-4c3f-8f81-63d22435af05	t
b0c19bb2-bba6-48df-b666-9de8b5db9603	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	c7e724ee-0324-4509-9686-74e08ff3ba9f	t
2b2c7c04-3000-473f-9d0d-f3746f12ff35	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	debbde72-8ac6-4090-99b7-b5e7033f8b9e	t
7b2e818e-24c3-42f9-946f-c4f73c706ad9	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	b0f7fecc-7b7c-4fc6-beee-e853fafa83a4	t
d8402cdf-3efe-44b7-9957-47d3ad342c21	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	cb606a10-c96c-4560-a052-dd6f9d4c4783	t
8c8faeb9-8caa-498f-a283-7331269bb44b	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	714796e2-ee7e-4199-b7aa-60d113805354	t
6abb7826-f5af-47cd-b271-e2fad8feb2aa	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	19c88a8c-7c58-442c-8cd3-29dcdd295a75	t
03bd00e0-e81e-4ef8-9a1a-044e6eccd98f	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	318f72c2-cebb-4bc3-aa26-b2b270a2ce6a	t
c9694dea-4f58-451e-ad84-6f784fc2c5af	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	65bdd483-1f6e-4a36-a0a3-a42e2f8499b4	t
4fb0c979-6910-433b-9677-66f99858235e	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	7591d17a-580e-40ac-8119-1e0a7f091914	t
6a54469f-bffc-4571-afe5-efb4980cddf8	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	3a383c98-163e-4a4d-a74f-61f0936eade0	t
aaffb44b-72b7-4c9a-9799-0f3385b83b73	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	40ac07d5-9f2d-4d6e-a4db-a9d1f6cfa074	t
ed020708-f611-4b5e-bf8e-d73b2b04af84	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	e93ee241-d76a-4ba2-8563-9cca437b2717	t
a43d1720-5574-4601-8890-ece0fbaeeff9	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	8204ed93-87bb-4f3c-938e-cfe97b3a3808	t
06dea4c3-275e-435a-8984-a1e9a9c7f2a4	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	5fe27ce6-2e80-4000-80d6-4f463cc85cb8	t
ccee55f5-d5e7-4a21-9e15-5792bf67979e	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	b0988299-bd8d-44fd-a9f7-1e943d3eabd6	t
7b513340-9a4e-4958-8669-f34ed87415c0	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	dc2fb26c-21b6-4ca6-b5b9-41888363a20e	t
19e5b342-640c-48f0-ab29-9add885cbbf8	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	13703203-6f5c-46fe-a039-c22b83b7d67a	t
d4e5fec3-b35d-46ed-ac95-d32dcc803145	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	d1ddc3ef-1cca-44c5-814f-e8bbc6a440d3	t
31f05df4-2668-434f-8ded-a51421f8bf12	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	82e60564-36bb-4fa8-b638-ddc7833aff70	t
7fd3aa50-50a4-4fc9-9366-f9587f8aa45d	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	3c5cd274-9dda-4442-bef6-a4af2187e72d	t
f8fd5087-f9b3-4293-8f3c-26345476430d	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	5897223a-bc1f-416d-99fb-2535a59da73f	t
fceef9e4-8031-4eac-8301-78e9cef13fbc	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	67746be9-9df0-46ce-b75c-da50c855639f	t
419cff65-6c39-4df3-9e49-c274509f28df	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	b9282ce6-a435-4e89-ad0e-534c21cc28dd	t
2333f024-0845-4b2e-ab41-6b7b22c9ed80	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	6bbff63d-a0e5-46f7-8fb1-d31d1cfef127	t
ddb4211f-4806-41a8-9331-95f03e44b84e	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	d0bee950-ce57-4f2a-b34d-c275fccfad81	t
d8711a01-31f7-4c20-a24a-b945544dce08	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	6cc46304-a7ae-4c50-bd97-0c1e1c6a34cf	t
76648b0d-b76d-4af5-811a-0c9109bfbb66	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	af04f9ff-52cf-4586-ae04-b0b9f780ccb3	t
1dd72f84-92b6-486c-82a8-58ff768819ed	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	8f7d0ec8-8584-4cc5-8931-73e03a92ef2c	t
ccde81f0-2e51-425e-8892-bf072c453846	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	1c2645fc-77a5-4388-b326-f0c2ae18ff1f	t
bd423ffb-a746-4629-99e7-2613fd264eb9	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	7b723a9e-3644-44fb-905b-46c7092d6ba5	t
bdb75881-fdf1-4c4a-8b5b-911bb9c3593b	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	e74ad468-e5c2-48bc-a0c8-9dd521d63e4a	t
839c742b-a5b2-4a4d-a863-1b44d66ff77b	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	bcaffe57-4a6a-4683-ad3e-3e16cd667e39	t
53cedca3-ca89-42a3-8043-dc6f902e9ec2	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	a95aded4-505a-4182-92b7-4dfc6081aa51	t
71270880-2a0c-4c01-8788-6c169b510c10	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	8aa0bc0a-52e4-4791-85ba-29319ab5b1b9	t
f99d40dd-6644-43ee-bf5f-989dfd27d78d	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	f0979a58-f237-45b7-9b67-82cc7f396a80	t
908a3569-2a9c-4b61-8f1e-435b4b34afad	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	bd7b9e83-59ed-4710-87b9-0ff9af9675c0	t
fd889c07-edeb-4966-8bb1-400dd36a6385	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	96d8b20c-4e12-4895-bb0b-3c13d95b3817	t
b3cbf004-e0b1-41db-b2c2-2d307a8a692f	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	c9cb57a5-8a39-4ef7-9b53-b76bbc52354b	t
5b39a5bb-4334-481c-b12d-6707eba12ca5	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	d4eab18e-e827-44f3-9c75-232e54de98a7	t
ba5409ab-786f-4589-91c2-db3d117a4cd1	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	ba9af3a9-0ec6-42f7-82bf-296f33b79585	t
ec0240ef-9d8f-40d5-a5d1-379d034d11b7	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	e4ca7d94-7a95-4b4b-9694-fd655852a646	t
3f57addf-b206-4da3-85b3-aa5f32df4c7a	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	00371537-5f65-4617-9216-9dedaeffa8e2	t
f960fbb9-9dfd-4ae3-a821-2cebabf6ba0c	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	55cec080-b24a-4757-a470-c79bc5dfccec	t
f82621da-3848-433b-a8c6-6aff97a15b2b	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	594ae81e-6636-4ead-bd55-c219707256a5	t
a24a0989-26c1-44ac-aba9-bb5b8a7ad0a0	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	3735f6f3-886c-4580-b5cf-68e0621c40c6	t
7aeffc47-c10f-4c19-b781-6e15094c9d69	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	1c68cbce-352d-4ff6-833b-d447a234858c	t
0f1e0cd3-d5c7-46f0-a98e-a86d08c3a31e	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	4ba83f41-cda5-42e2-8122-aaed9565ff60	t
8f0deea4-fae7-45ac-8d5d-2f46ecfcebba	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	0de45ad6-c4c5-4af1-ae3e-d06173a60904	t
d3f82793-f0dc-4d07-8769-de1f86348403	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	5466df10-0968-4b29-b970-c2a75ef3c1b7	t
6b63f245-c461-4bfd-b07a-e7bf90153bcc	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	8f9836a6-f80a-4729-9a3f-9c6146ca61a3	t
480f526f-7753-4b60-88c7-785caa9ddf4b	28f8eede-d6e5-4a70-9ab3-482eb7f3ca6b	73bdaa48-2d55-4492-be74-dc55fe5d1136	t
784d04b2-171e-43f2-aa77-8c97333c096e	0c0be0db-b6ff-4311-88e3-8b05bd40865d	82e60564-36bb-4fa8-b638-ddc7833aff70	t
c936b9e5-a2d8-41f6-832e-854e48881962	0c0be0db-b6ff-4311-88e3-8b05bd40865d	3c5cd274-9dda-4442-bef6-a4af2187e72d	t
38d7708e-fa8d-49f0-84b7-cd8c2a3fe717	0c0be0db-b6ff-4311-88e3-8b05bd40865d	e4b344b6-b8a7-4236-8f0a-4b04ff039646	t
28dfff87-16e3-4683-8ed4-be9ba47c2926	0c0be0db-b6ff-4311-88e3-8b05bd40865d	0446fe29-eb53-49d5-9041-5c8cba7abd43	t
92f58045-14c1-4d29-8686-ee1acd0693c8	0c0be0db-b6ff-4311-88e3-8b05bd40865d	bfab3bfb-d153-4f35-86af-f066ea03309d	t
5c0917ba-45b9-4ae5-8547-03fd2e21eb4c	0c0be0db-b6ff-4311-88e3-8b05bd40865d	dc2fb26c-21b6-4ca6-b5b9-41888363a20e	t
cb17b0e9-8ad0-402d-b9a6-30a6c487c520	0c0be0db-b6ff-4311-88e3-8b05bd40865d	c7e724ee-0324-4509-9686-74e08ff3ba9f	t
6b399ae5-b266-4402-84ff-f858e467263c	0c0be0db-b6ff-4311-88e3-8b05bd40865d	debbde72-8ac6-4090-99b7-b5e7033f8b9e	t
286825df-12cd-4b1b-abb4-fdbb9590e091	0c0be0db-b6ff-4311-88e3-8b05bd40865d	1465d584-b059-4a84-98fe-11c95d239057	t
5a444037-d292-45c3-9d42-aaf40c415e92	0c0be0db-b6ff-4311-88e3-8b05bd40865d	5466df10-0968-4b29-b970-c2a75ef3c1b7	t
05df94ac-37af-4455-b193-351e10ca8222	c2daf791-e946-4f73-9e99-894bdcb173fb	19c88a8c-7c58-442c-8cd3-29dcdd295a75	t
c5b7e19a-ec86-4022-a30b-be8b17cb048b	c2daf791-e946-4f73-9e99-894bdcb173fb	318f72c2-cebb-4bc3-aa26-b2b270a2ce6a	t
c9a0a348-061c-4a73-9698-d99ff57fc190	c2daf791-e946-4f73-9e99-894bdcb173fb	65bdd483-1f6e-4a36-a0a3-a42e2f8499b4	t
4519278d-fc27-48c8-be65-a0ed878847a4	c2daf791-e946-4f73-9e99-894bdcb173fb	e08b477b-7c42-4c3f-8f81-63d22435af05	t
a4ad199f-9d83-4129-a005-2c3809fc91e9	c2daf791-e946-4f73-9e99-894bdcb173fb	c7e724ee-0324-4509-9686-74e08ff3ba9f	t
9653ab46-2fcb-41b3-a8f8-dffbf96fabb3	c2daf791-e946-4f73-9e99-894bdcb173fb	debbde72-8ac6-4090-99b7-b5e7033f8b9e	t
59ff437e-3b79-487f-b46b-0888eb33b612	c2daf791-e946-4f73-9e99-894bdcb173fb	3a383c98-163e-4a4d-a74f-61f0936eade0	t
eb9be2df-3b5a-41e6-9879-6489543a7e18	c2daf791-e946-4f73-9e99-894bdcb173fb	40ac07d5-9f2d-4d6e-a4db-a9d1f6cfa074	t
d1864aee-3b40-44b1-8ac3-6bc33eb3360d	c2daf791-e946-4f73-9e99-894bdcb173fb	3735f6f3-886c-4580-b5cf-68e0621c40c6	t
3cdd5081-78d7-4f59-988f-6dadf5bdff92	c2daf791-e946-4f73-9e99-894bdcb173fb	1c68cbce-352d-4ff6-833b-d447a234858c	t
55be4a9d-4abb-4a35-955d-26ff9a5e02e5	c2daf791-e946-4f73-9e99-894bdcb173fb	4ba83f41-cda5-42e2-8122-aaed9565ff60	t
09ec3dd4-6184-4be6-97ee-99d08a0c282a	c2daf791-e946-4f73-9e99-894bdcb173fb	00371537-5f65-4617-9216-9dedaeffa8e2	t
bd1d49e2-9a9e-4ce9-a2fa-03878569265a	c2daf791-e946-4f73-9e99-894bdcb173fb	1465d584-b059-4a84-98fe-11c95d239057	t
18e5c57d-2ea8-4289-9f69-5824a621d761	c2daf791-e946-4f73-9e99-894bdcb173fb	82e60564-36bb-4fa8-b638-ddc7833aff70	t
cfff3516-43c3-497d-a102-4211b9970336	eb3b1da4-5430-4689-88da-c0f8500e08e7	af04f9ff-52cf-4586-ae04-b0b9f780ccb3	t
498bafe1-76b2-4242-8c96-7945af0d87b6	eb3b1da4-5430-4689-88da-c0f8500e08e7	8f7d0ec8-8584-4cc5-8931-73e03a92ef2c	t
b44bf5b4-f1fb-4c15-a1b5-b9e5439f6293	eb3b1da4-5430-4689-88da-c0f8500e08e7	1c2645fc-77a5-4388-b326-f0c2ae18ff1f	t
2cbb63d1-f454-46fa-95f2-e4cb9594f57b	eb3b1da4-5430-4689-88da-c0f8500e08e7	c7e724ee-0324-4509-9686-74e08ff3ba9f	t
e89061f4-8486-46a2-8059-7b8893aea303	eb3b1da4-5430-4689-88da-c0f8500e08e7	318f72c2-cebb-4bc3-aa26-b2b270a2ce6a	t
8c3a47d8-4454-4486-bb68-a392de0fa1c4	eb3b1da4-5430-4689-88da-c0f8500e08e7	40ac07d5-9f2d-4d6e-a4db-a9d1f6cfa074	t
53c46e46-8148-4e00-9b46-769b3429e998	eb3b1da4-5430-4689-88da-c0f8500e08e7	96d8b20c-4e12-4895-bb0b-3c13d95b3817	t
3225d624-dff9-47f2-b223-e5e391c24bee	eb3b1da4-5430-4689-88da-c0f8500e08e7	5466df10-0968-4b29-b970-c2a75ef3c1b7	t
\.


--
-- Data for Name: Room; Type: TABLE DATA; Schema: public; Owner: -
--


COPY public."Room" (id, "branchId", name, capacity, "hourlyRate", status, "createdAt", "updatedAt") FROM stdin;
550e8400-e29b-41d4-a716-446655440000	aa1ce36f-4934-44a1-8f4d-d45f345030a5	Conference Room A	10	500	AVAILABLE	2026-02-12 10:00:00	2026-02-12 10:00:00
\.


--
-- Data for Name: SalesAnomaly; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SalesAnomaly" (id, "businessOwnerId", "branchId", date, type, "actualValue", "expectedValue", deviation, "standardDeviations", resolved, "resolvedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SalesChannel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SalesChannel" (id, "businessOwnerId", name, enabled, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ScheduledReport; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ScheduledReport" (id, "businessOwnerId", "customReportId", frequency, "time", "dayOfWeek", "dayOfMonth", emails, format, "isActive", "lastSentAt", "nextRunAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SecurityCamera; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SecurityCamera" (id, "businessOwnerId", "branchId", name, location, "cameraId", "streamUrl", "nvrHost", "nvrPort", protocol, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Staff; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Staff" (id, "businessOwnerId", "branchId", "roleId", "firstName", "lastName", email, password, phone, avatar, "resetToken", "resetTokenExpiry", status, "createdAt", "updatedAt") FROM stdin;
854a0f8c-0d33-4434-acc0-9ba2ccaa4564	111bd836-595b-4982-bb3d-a24ade82c52a	aa1ce36f-4934-44a1-8f4d-d45f345030a5	5f05852f-d7f6-4b41-b06a-c7a307013ce3	Rahul	Sharma	rahul.sharma@example.com	$2a$10$6HP2gotaiZc.2kA.aMG2FuqrXyPgJvRI0iNeoo5dVnwxRAjAcV.ze	+91 9876543210	/images/staff1.jpg	\N	\N	active	2026-02-07 03:29:58.546	2026-02-07 03:29:58.546
45c2b7ae-d8eb-48b9-a81e-cefaddd1b9a8	7fdfb940-d78a-4609-a441-fd28eb9f9869	aa1ce36f-4934-44a1-8f4d-d45f345030a5	ea4502e2-8119-4fe5-8089-0f05f90a285a	Priya	Verma	priya.verma@example.com	$2a$10$6HP2gotaiZc.2kA.aMG2FuqrXyPgJvRI0iNeoo5dVnwxRAjAcV.ze	+91 9123456789	/images/staff2.jpg	\N	\N	active	2026-02-07 03:29:58.547	2026-02-07 03:29:58.547
de2da6d3-e110-4b21-9cbd-b9183c599bd7	7fdfb940-d78a-4609-a441-fd28eb9f9869	aa1ce36f-4934-44a1-8f4d-d45f345030a5	422396ab-73d6-4b9d-b051-645119f67d31	Amit	Kumar	amit.kumar@example.com	$2a$10$6HP2gotaiZc.2kA.aMG2FuqrXyPgJvRI0iNeoo5dVnwxRAjAcV.ze	+91 9988776655	/images/staff3.jpg	\N	\N	inactive	2026-02-07 03:29:58.548	2026-02-07 03:29:58.548
ef944f11-8f30-47d1-8641-32e509406dc9	7fdfb940-d78a-4609-a441-fd28eb9f9869	d3ee3575-ad4b-41fc-89d1-682a2cbcdf11	ea4502e2-8119-4fe5-8089-0f05f90a285a	Neha	Singh	neha.singh@example.com	$2a$10$6HP2gotaiZc.2kA.aMG2FuqrXyPgJvRI0iNeoo5dVnwxRAjAcV.ze	+91 9090909090	/images/staff4.jpg	\N	\N	active	2026-02-07 03:29:58.548	2026-02-07 03:29:58.548
f3b9b3d8-1d9d-4f6f-95f5-0a4c4f9c1f10	7fdfb940-d78a-4609-a441-fd28eb9f9869	aa1ce36f-4934-44a1-8f4d-d45f345030a5	5c3f918b-5d8d-4aa9-8a0c-d78b3f1ad8b7	Arjun	Rao	arjun.rao@example.com	$2a$10$6HP2gotaiZc.2kA.aMG2FuqrXyPgJvRI0iNeoo5dVnwxRAjAcV.ze	+91 9876501234	/images/staff5.jpg	\N	\N	active	2026-02-07 03:29:58.549	2026-02-07 03:29:58.549
7a59f4c4-8c8e-4b50-82c5-f32e6f53682c	7fdfb940-d78a-4609-a441-fd28eb9f9869	d3ee3575-ad4b-41fc-89d1-682a2cbcdf11	5c3f918b-5d8d-4aa9-8a0c-d78b3f1ad8b7	Sneha	Iyer	sneha.iyer@example.com	$2a$10$6HP2gotaiZc.2kA.aMG2FuqrXyPgJvRI0iNeoo5dVnwxRAjAcV.ze	+91 9123409876	/images/staff6.jpg	\N	\N	active	2026-02-07 03:29:58.55	2026-02-07 03:29:58.55
\.


--
-- Data for Name: StaffAttendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StaffAttendance" (id, "businessOwnerId", "branchId", "staffId", "punchType", "punchTime", "deviceId", "verifyMode", "workHours", "shiftDate", "createdAt") FROM stdin;
\.


--
-- Data for Name: StockAdjustment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StockAdjustment" (id, "inventoryProductId", "businessOwnerId", "userId", "userType", "oldStock", "newStock", adjustment, reason, undone, "undoneAt", "undoneBy", "createdAt") FROM stdin;
\.


--
-- Data for Name: SubCategory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SubCategory" (id, "businessOwnerId", "categoryId", name, image, description, status, "sortOrder", "createdAt", "updatedAt") FROM stdin;
6f1e3a1a-8f4f-4f88-ae28-7f8d12b9d101	111bd836-595b-4982-bb3d-a24ade82c52a	4b92eed7-1093-4464-acb8-39eca4627acd	Soups	/images/subcategories/soups.jpg	Warm and flavorful soup starters	active	1	2026-02-07 03:29:58.552	2026-02-07 03:29:58.552
8d0b8e0b-7b29-4ff0-9ed9-98dbf6ee5202	111bd836-595b-4982-bb3d-a24ade82c52a	4b92eed7-1093-4464-acb8-39eca4627acd	Chaats	/images/subcategories/chaats.jpg	Popular street-style chaats	active	2	2026-02-07 03:29:58.552	2026-02-07 03:29:58.552
2a1a61b7-7a8a-4c5f-87d4-3b55ebfbc903	111bd836-595b-4982-bb3d-a24ade82c52a	cd7478a2-9e9d-4729-be0e-4d68bddf6e5d	North Indian	/images/subcategories/north-indian.jpg	Rich gravies and tandoor items	active	1	2026-02-07 03:29:58.552	2026-02-07 03:29:58.552
9bfb53da-2f08-4b4a-a46d-4379b3c6fd04	111bd836-595b-4982-bb3d-a24ade82c52a	bb9678cb-2ae0-4303-a0f0-78aab1e45c69	Mini Thali	/images/subcategories/mini-thali.jpg	Compact thali meal combinations	active	1	2026-02-07 03:29:58.552	2026-02-07 03:29:58.552
7f0f4e47-9ea9-4b8c-9c14-e9de79f13605	7fdfb940-d78a-4609-a441-fd28eb9f9869	b519059a-524c-4437-8307-a039c8a9c4b1	Biryani	/images/subcategories/biryani.jpg	Aromatic biryani selections	active	1	2026-02-07 03:29:58.552	2026-02-07 03:29:58.552
c0d41e95-7a35-4b6f-9c92-9a2a8861b006	7fdfb940-d78a-4609-a441-fd28eb9f9869	1e613ee9-1889-43c3-814d-10109d311ca0	Quick Bites	/images/subcategories/quick-bites.jpg	Fast moving snack items	active	1	2026-02-07 03:29:58.552	2026-02-07 03:29:58.552
\.


--
-- Data for Name: SubscriptionPlan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SubscriptionPlan" (id, name, price, duration, "trialDays", features, "maxBranches", status, "createdAt", "updatedAt") FROM stdin;
705c6be9-f9ec-4546-89ef-2cadb8ca77cf	Free	0.00	36500	0	["Basic POS", "Single Branch", "Basic Reports"]	1	active	2026-02-07 03:29:58.416	2026-02-07 03:29:58.416
8c5f6b86-73be-4bb1-9b13-15cc879e6bff	Gold	3639.00	365	35	["Full POS", "Up to 3 Branches", "Advanced Reports", "Inventory Management", "Customer Management"]	3	active	2026-02-07 03:29:58.416	2026-02-07 03:29:58.416
f8bbd9bf-4e49-4cd6-b334-d2c3a9bb5b32	Platinum	9412.00	365	49	["Full POS", "Unlimited Branches", "Premium Reports", "Inventory Management", "Customer Management", "Marketing Tools", "API Access", "Priority Support"]	99	inactive	2026-02-07 03:29:58.416	2026-02-07 03:29:58.416
\.


--
-- Data for Name: SuperAdmin; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SuperAdmin" (id, email, password, name, phone, avatar, "resetToken", "resetTokenExpiry", "createdAt", "updatedAt") FROM stdin;
0a2e2b75-df23-435b-99ef-494eb0698922	admin@bistrobill.com	$2a$12$0wKiIvlrw5ZbZ7iaC4E19emMhCKit6lU/AT/2eEnsfHZZUwVBSS4i	Super Admin	\N	\N	\N	\N	2026-02-07 03:29:58.413	2026-02-07 03:29:58.413
\.


--
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Supplier" (id, "businessOwnerId", code, name, phone, email, address, "gstNumber", "tinNumber", "taxStateCode", "bankAccount", "bankName", "bankBranch", "ifscCode", status, "createdAt", "updatedAt") FROM stdin;
2e248362-ff14-49c9-b408-44b02ade2884	111bd836-595b-4982-bb3d-a24ade82c52a	43215	TechNova	+91 9123456789	tech@nova.com	768 Reach Street, Baltimore, MD 21202	\N	\N	\N	\N	\N	\N	\N	active	2026-02-07 03:29:58.577	2026-02-07 03:29:58.577
6b305730-8702-4c80-bec9-ef2e14f0ef7d	7fdfb940-d78a-4609-a441-fd28eb9f9869	22120	Gear Glow	+91 7569842135	gear@glow.com	102 West Street, Columbus, OH 43215	\N	\N	\N	\N	\N	\N	\N	active	2026-02-07 03:29:58.578	2026-02-07 03:29:58.578
995f2d55-7907-45fc-96e5-132237834872	7fdfb940-d78a-4609-a441-fd28eb9f9869	33456	Nature's Pure	+91 8765432109	contact@naturespure.com	45 Green Valley Road, Hyderabad	\N	\N	\N	\N	\N	\N	\N	active	2026-02-07 03:29:58.578	2026-02-07 03:29:58.578
0a658c7e-6cb0-4455-b402-1db703c35cf4	7fdfb940-d78a-4609-a441-fd28eb9f9869	44567	Artisan Roasters	+91 9876123456	sales@artisanroasters.com	78 Coffee Lane, Bangalore	\N	\N	\N	\N	\N	\N	\N	active	2026-02-07 03:29:58.579	2026-02-07 03:29:58.579
\.


--
-- Data for Name: SupplierContact; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SupplierContact" (id, "supplierId", name, email, phone, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SupplierRating; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SupplierRating" (id, "supplierId", "businessOwnerId", rating, comment, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Table; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Table" (id, "floorId", label, shape, chairs, status, "createdAt", "updatedAt") FROM stdin;
19b1ebe9-2c57-4e5c-b906-2c0d407d889f	b5e1b7b3-0a73-46be-a0c7-40f5e8d09351	T-01	square	4	running	2026-02-07 03:29:58.573	2026-02-07 03:29:58.573
c69b5270-f105-4986-99ca-ae6787c4cabf	b5e1b7b3-0a73-46be-a0c7-40f5e8d09351	T-03	square	4	running	2026-02-07 03:29:58.573	2026-02-07 03:29:58.573
7e9ced78-863e-4753-8836-db6f86f8b98f	b5e1b7b3-0a73-46be-a0c7-40f5e8d09351	T-04	square	4	available	2026-02-07 03:29:58.573	2026-02-07 03:29:58.573
40c828c1-edc5-4e7c-8459-5e4c77983420	b5e1b7b3-0a73-46be-a0c7-40f5e8d09351	T-07	square	4	available	2026-02-07 03:29:58.573	2026-02-07 03:29:58.573
ed08064b-d17e-48a3-847c-180321f37fb3	b5e1b7b3-0a73-46be-a0c7-40f5e8d09351	T-10	square	4	available	2026-02-07 03:29:58.573	2026-02-07 03:29:58.573
f6eb9f2c-2299-46f7-8a85-2a5c23151a04	b5e1b7b3-0a73-46be-a0c7-40f5e8d09351	T-11	square	4	available	2026-02-07 03:29:58.573	2026-02-07 03:29:58.573
c332efdb-f9e6-489b-bb65-4f080f7bb80f	b5e1b7b3-0a73-46be-a0c7-40f5e8d09351	T-12	square	4	running	2026-02-07 03:29:58.573	2026-02-07 03:29:58.573
aac7320d-3dc7-4e5d-b58e-b508056e5583	b5e1b7b3-0a73-46be-a0c7-40f5e8d09351	T-13	square	4	reserved	2026-02-07 03:29:58.573	2026-02-07 03:29:58.573
accba4d9-8f09-46ac-815a-486527e8f4a1	b5e1b7b3-0a73-46be-a0c7-40f5e8d09351	T-14	square	4	running	2026-02-07 03:29:58.573	2026-02-07 03:29:58.573
cedc635c-5965-4fb5-8c1a-500059cc308c	b28f87be-c5e3-47b5-a15c-1afdd08bad3a	A-01	square	4	available	2026-02-07 03:29:58.575	2026-02-07 03:29:58.575
486053a5-278b-41f7-a7fd-70672ab5bd1d	b28f87be-c5e3-47b5-a15c-1afdd08bad3a	A-02	long	10	reserved	2026-02-07 03:29:58.575	2026-02-07 03:29:58.575
758a4fab-540f-4a0e-94ba-c501f584c620	b28f87be-c5e3-47b5-a15c-1afdd08bad3a	A-03	square	4	running	2026-02-07 03:29:58.575	2026-02-07 03:29:58.575
08ddd3cb-1809-4086-b53e-ebdb20f6fe5f	b28f87be-c5e3-47b5-a15c-1afdd08bad3a	A-04	long	10	reserved	2026-02-07 03:29:58.575	2026-02-07 03:29:58.575
14135912-bf56-4ece-8f9b-682e6720ef98	b28f87be-c5e3-47b5-a15c-1afdd08bad3a	A-05	long	8	running	2026-02-07 03:29:58.575	2026-02-07 03:29:58.575
d9dd42cd-2e50-495a-b134-ead29728e466	f5b87516-4c10-4cee-96ff-34d6c01ce1b7	F-06	square	4	running	2026-02-07 03:29:58.576	2026-02-07 03:29:58.576
205f9de8-58b3-46ff-ae42-c32fe98c8504	f5b87516-4c10-4cee-96ff-34d6c01ce1b7	F-07	square	4	available	2026-02-07 03:29:58.576	2026-02-07 03:29:58.576
2fec2a29-3fd0-42c4-b0a2-124745d6a7c6	f5b87516-4c10-4cee-96ff-34d6c01ce1b7	F-08	square	4	running	2026-02-07 03:29:58.576	2026-02-07 03:29:58.576
69992c31-4f1a-49aa-b72c-877df5e5acaf	f5b87516-4c10-4cee-96ff-34d6c01ce1b7	F-09	square	4	available	2026-02-07 03:29:58.576	2026-02-07 03:29:58.576
09767714-1708-4b75-bfdd-a34fe2f2abb1	f5b87516-4c10-4cee-96ff-34d6c01ce1b7	F-10	square	4	available	2026-02-07 03:29:58.576	2026-02-07 03:29:58.576
db598c98-de5c-4503-80ce-d2e4f6efa6da	f5b87516-4c10-4cee-96ff-34d6c01ce1b7	F-11	square	4	running	2026-02-07 03:29:58.576	2026-02-07 03:29:58.576
6acc5252-c7eb-420e-b125-ce20e669ddb9	f5b87516-4c10-4cee-96ff-34d6c01ce1b7	F-12	square	4	available	2026-02-07 03:29:58.576	2026-02-07 03:29:58.576
d95187e8-04c2-49cd-888a-74f556786dba	f5b87516-4c10-4cee-96ff-34d6c01ce1b7	F-13	square	4	reserved	2026-02-07 03:29:58.576	2026-02-07 03:29:58.576
e08d600d-3b38-4b0e-ad7a-a8741bc500fb	f5b87516-4c10-4cee-96ff-34d6c01ce1b7	F-14	square	4	running	2026-02-07 03:29:58.576	2026-02-07 03:29:58.576
\.


--
-- Data for Name: Tag; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Tag" (id, "businessOwnerId", name, color, status, "createdAt", "updatedAt") FROM stdin;
639cb808-dba7-4e69-a4c2-c1e2541d3f74	111bd836-595b-4982-bb3d-a24ade82c52a	Spicy	#FF5733	active	2026-02-07 03:29:58.553	2026-02-07 03:29:58.553
337afb60-b8ab-438c-b607-ba38cf6e0490	111bd836-595b-4982-bb3d-a24ade82c52a	Vegan	#27AE60	active	2026-02-07 03:29:58.553	2026-02-07 03:29:58.553
93b9b3d2-a576-4eec-8077-ddb3fab374eb	7fdfb940-d78a-4609-a441-fd28eb9f9869	Bestseller	#F1C40F	active	2026-02-07 03:29:58.553	2026-02-07 03:29:58.553
faddeed4-7077-4b8f-a816-0cc944c132fe	7fdfb940-d78a-4609-a441-fd28eb9f9869	New	#3498DB	active	2026-02-07 03:29:58.553	2026-02-07 03:29:58.553
7c38b90b-1dc2-47c5-a7b0-1b2dc2ce73af	7fdfb940-d78a-4609-a441-fd28eb9f9869	Gluten-Free	#9B59B6	active	2026-02-07 03:29:58.553	2026-02-07 03:29:58.553
\.


--
-- Data for Name: Tax; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Tax" (id, "businessOwnerId", name, symbol, percentage, country, state, city, status, "createdAt", "updatedAt") FROM stdin;
e6a988fe-dcc0-45bf-8df2-0121a856dc4d	111bd836-595b-4982-bb3d-a24ade82c52a	CGST (Central Goods and Services Tax)	CGST	9.00	India	\N	\N	active	2026-02-07 03:29:58.566	2026-02-07 03:29:58.566
9481cf52-426a-4c73-a004-a6669cd72d4a	7fdfb940-d78a-4609-a441-fd28eb9f9869	SGST (State Goods and Services Tax)	SGST	9.00	India	Telangana	\N	active	2026-02-07 03:29:58.567	2026-02-07 03:29:58.567
946d2c1c-083c-49e5-b31a-d622ae9887bc	7fdfb940-d78a-4609-a441-fd28eb9f9869	IGST (Integrated Goods and Services Tax)	IGST	18.00	India	\N	\N	active	2026-02-07 03:29:58.567	2026-02-07 03:29:58.567
b8f84585-d7fd-4b11-92a8-1f63283ac2aa	111bd836-595b-4982-bb3d-a24ade82c52a	SGST (State Goods and Services Tax)	SGST	9.00	India	Telangana	\N	active	2026-02-07 03:29:58.567	2026-02-07 03:29:58.567
1d0ee4a6-6d4a-4c85-8ba8-82f0d3f694a1	111bd836-595b-4982-bb3d-a24ade82c52a	Service Tax	ST	5.00	India	Telangana	Hyderabad	active	2026-02-07 03:29:58.567	2026-02-07 03:29:58.567
4c935133-9781-4a3f-b4ab-2d56f75d7c32	7fdfb940-d78a-4609-a441-fd28eb9f9869	CGST (Central Goods and Services Tax)	CGST	9.00	India	\N	\N	active	2026-02-07 03:29:58.567	2026-02-07 03:29:58.567
\.


--
-- Data for Name: TaxGroup; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TaxGroup" (id, "businessOwnerId", name, status, "createdAt", "updatedAt") FROM stdin;
29351e96-e188-4f33-b506-643019935afc	7fdfb940-d78a-4609-a441-fd28eb9f9869	GST 18%	active	2026-02-07 03:29:58.567	2026-02-07 03:29:58.567
29351e96-e188-4f33-b506-643019935afd	111bd836-595b-4982-bb3d-a24ade82c52a	GST 18%	active	2026-02-07 03:29:58.567	2026-02-07 03:29:58.567
\.


--
-- Data for Name: TaxGroupItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TaxGroupItem" ("taxGroupId", "taxId") FROM stdin;
29351e96-e188-4f33-b506-643019935afc	e6a988fe-dcc0-45bf-8df2-0121a856dc4d
29351e96-e188-4f33-b506-643019935afc	9481cf52-426a-4c73-a004-a6669cd72d4a
\.


--
-- Data for Name: UPIAutoPaySubscription; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UPIAutoPaySubscription" (id, "businessOwnerId", "planId", "customerId", "gatewaySubscriptionId", "gatewayProvider", "upiId", amount, currency, "interval", status, "currentStart", "currentEnd", "nextBillingDate", "totalCount", "paidCount", "failedCount", "lastPaymentAt", "lastPaymentId", "failureReason", metadata, "cancelledAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: UserRoleAssignment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UserRoleAssignment" (id, "userId", "roleId", "branchId", "kitchenId", "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _BlogToBlogTag; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."_BlogToBlogTag" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
d3d42403-4d7d-466c-8396-06d6eb7b358a	a9a12df62a5a616df078039d8985e49fb0deafda79cec45bccff5685e9a4ad66	2026-02-06 21:14:57.841203+05:30	20260203190154_add_multi_tenant_core_tables		\N	2026-02-06 21:14:57.841203+05:30	0
67b04d6d-d7d8-46f7-81a3-efc932640441	ddd8107c1bbec6615fdc2370b8db211778634b43fd0886290ad3747322b6f65d	2026-02-06 21:14:58.092225+05:30	20260203190421_add_staff_roles_tables		\N	2026-02-06 21:14:58.092225+05:30	0
db5dcd12-deb7-4bcf-a54d-b010b1f9fff9	86959445b1206e990a44401e29e894501b2104617f433c7d55c42b56540ab33e	2026-02-06 21:14:58.340684+05:30	20260203190631_add_catalog_configuration_tables		\N	2026-02-06 21:14:58.340684+05:30	0
e68f0924-bccf-4919-a0e1-d711a6986aec	7429640113cde0b5333eca64b30fae7bc02e6767516aba1a9c1f1ead07fb6c53	2026-02-06 21:14:58.58913+05:30	20260203191018_add_product_tables		\N	2026-02-06 21:14:58.58913+05:30	0
ef3761b4-c9d1-48ea-8850-810021c41217	9e87708d8fa6344b4246c5bc5876ac62615a35dd123f1d55bea1f240132e871d	2026-02-06 21:14:58.842192+05:30	20260203191328_add_inventory_tables		\N	2026-02-06 21:14:58.842192+05:30	0
bd5b0018-748b-4370-a851-d001e7a729e7	0ddf7c493599c0ffb929f4788836f86ac2a4258167bc66a27f287327f0f75d1c	2026-02-06 21:14:59.092883+05:30	20260203191545_add_customer_tables		\N	2026-02-06 21:14:59.092883+05:30	0
f520f76d-37a7-480d-b59c-29d2dc89ee37	43f2fe3dc2352e246d273c54c74de3725d58c800a6d866f7d0ad6016817435f2	2026-02-06 21:15:15.471641+05:30	20260203191833_add_marketing_tables		\N	2026-02-06 21:15:15.471641+05:30	0
22917ddb-0e1e-4b5e-9dca-21af70bd3f55	c00c6fe3e6f5f1ffdfffbe557789a340dc04f2b7beb829d53700b7e0c39a4f38	2026-02-06 21:15:15.724142+05:30	20260203195352_add_branch_resource_tables		\N	2026-02-06 21:15:15.724142+05:30	0
eec1aea6-b1ec-47b1-9ade-fc905dc7455a	722526950fbeff150a4a44ae3c9607806ceaf72ff3473debc63c4a7473fb54b1	2026-02-06 21:15:15.976203+05:30	20260203195938_add_order_tables		\N	2026-02-06 21:15:15.976203+05:30	0
90185f64-6c56-4a0d-8f48-62f34a5702de	074079c4a00cf689ca1caa52a36dea85325318a229a44d57ef56d545bd48cbbc	2026-02-06 21:15:16.226764+05:30	20260203200241_add_business_settings_tables		\N	2026-02-06 21:15:16.226764+05:30	0
a4c3d213-de2a-40a6-9512-3df0d838a144	837e1a286c0bb3990587e5d0c8de3f9077c5dee3346b60aeffb7600fc45de34f	2026-02-06 21:15:16.485131+05:30	20260203200514_add_blog_tables		\N	2026-02-06 21:15:16.485131+05:30	0
0a5db97f-21c6-456d-a4bd-6c3088db08a9	2af5c3d7ea07590e44b47e8b27db0318d0c0d18d88f6a27bf490986f4c8bd1ce	2026-02-06 21:15:16.734712+05:30	20260203200729_add_super_admin_tables		\N	2026-02-06 21:15:16.734712+05:30	0
21941fed-75af-4e51-8593-20b5df7f1acb	ab9c7b54685ed854beee91ea618371a90c1ea47a2c761ab4053b6e77bd131ef4	2026-02-06 21:15:16.990505+05:30	20260203212142_add_password_reset_fields		\N	2026-02-06 21:15:16.990505+05:30	0
392502c5-5f45-450c-8f06-fb30f8103d78	5b20b3d34f6b07a485a3c61b7765876fe66f351b78d55b63f657a25abe47b05b	2026-02-06 21:15:17.234577+05:30	20260204012307_add_received_status_to_purchase_order		\N	2026-02-06 21:15:17.234577+05:30	0
611d11e5-12ab-4786-9346-4e8b037986ed	1da18d1dd7d9045a5f38f6442bf7843f9b857de019fe54394a3cd8177685ab46	2026-02-06 21:15:17.487534+05:30	20260204051728_add_customer_gstin_field		\N	2026-02-06 21:15:17.487534+05:30	0
c9413ad9-28cf-4235-aa6b-38288e89e216	3b468d71a924012d7434dff400f06a4b950259b73287b4af56bdc448afcefced	2026-02-06 21:15:17.747865+05:30	20260205113759_add_online_order_model		\N	2026-02-06 21:15:17.747865+05:30	0
f28cec04-5161-4e9f-bf52-88232e7c1f40	96d507ad3873ac77a8b529ebabd11fec83f2069b576ecde82db41bbdd1eedf0d	2026-02-06 21:15:18.012015+05:30	20260205193511_add_supplier_contacts		\N	2026-02-06 21:15:18.012015+05:30	0
0b10681b-34a5-47ee-a2ab-e2e3a2b824d7	31b1a370f44388f82ade7a66c953beabbb2e2ec0ae79cb805fb45d5b8120aa84	2026-02-06 21:15:18.271707+05:30	20260205201701_add_color_to_customer_group		\N	2026-02-06 21:15:18.271707+05:30	0
83fc5831-9d93-4b82-bb2d-6cb31377994f	2a8d791362ebe6b5b34c7a16b099ff685647e2781392a2e34fd3dcfd16507c13	2026-02-06 21:15:18.525525+05:30	20260205202348_add_sales_channels_and_aggregators		\N	2026-02-06 21:15:18.525525+05:30	0
315d43ce-15cf-4cc6-8b2b-708324dded99	6a6f8d83f3c2a3a8c0ad78a86b1179dd082e063000a9517869332ca5f272c95d	2026-02-06 21:15:18.774671+05:30	20260206091205_add_supplier_financial_fields		\N	2026-02-06 21:15:18.774671+05:30	0
2f0fbbd0-9470-481b-b215-5c40d9973174	9811c7e1b2192bafd0605f19f43842648ac8de2f02bdd6b5b2b46d8d63286724	2026-02-06 21:15:19.020381+05:30	20260206092803_add_blog_author_and_tags		\N	2026-02-06 21:15:19.020381+05:30	0
600673ce-2b55-4444-b090-4ce8cae43678	542f098fc9a79409baad9ef24d7ce565f90a338bfb9b91a624e017a45b395ce9	2026-02-06 21:15:19.274493+05:30	20260206095102_add_featured_image_alt_to_blog		\N	2026-02-06 21:15:19.274493+05:30	0
35c08d3a-4117-4afb-a876-d9be522a2743	ea8ea2355cec0edbab09182e842da063f42fb97a00ccb597f82c21661e9604d6	2026-02-06 21:15:19.525748+05:30	20260206100000_add_phone_avatar_to_super_admin		\N	2026-02-06 21:15:19.525748+05:30	0
1dcebe75-1566-466b-8054-a800e25b9a9c	25e41506e4094c9c701a52a9ba415db03d7b0d2b3cf6f6d2fab338425b6be24b	2026-02-06 21:15:19.777496+05:30	20260206102722_add_campaign_metrics_to_advertisement		\N	2026-02-06 21:15:19.777496+05:30	0
ab1f0351-6a7f-4d18-a85d-dd37b79f5a88	e839e9592157080ce127ea1c56c36947bb04719bc2a095b55c488b0aa1602af9	2026-02-06 21:15:20.034184+05:30	20260206103334_add_rules_to_customer_group		\N	2026-02-06 21:15:20.034184+05:30	0
0f1d9480-eb40-4c24-8a6e-bd31277955da	7675456df0179b4d20c4f5042c85ee99415a02370129ab7b52e0b20248eefd1f	2026-02-06 21:15:20.287166+05:30	20260206104304_add_customer_tags		\N	2026-02-06 21:15:20.287166+05:30	0
8e0c3407-8e0f-4510-adff-820c05f7c0f0	e80a1e96f07a8232887cd991f25a4dd6490797c56553b706ebca4afe8e639b53	2026-02-06 21:15:20.541004+05:30	20260206114708_add_custom_report_builder_models		\N	2026-02-06 21:15:20.541004+05:30	0
a2132565-35aa-4a23-b8d3-8cf17eee1fdf	2db293cdd4fed295663120948821f2980640dfacad3060461cbab91335cd2739	2026-02-06 21:15:20.788868+05:30	20260206130000_add_product_kitchen_assignment		\N	2026-02-06 21:15:20.788868+05:30	0
ef83d503-b784-4188-971f-183b5ec8f991	0f431f29e2db477fb27e89ebfce12e8d5f22a7aeec6ee780ea88cc168c4e2cae	2026-02-06 21:15:21.040052+05:30	20260206140000_add_sales_anomaly_model		\N	2026-02-06 21:15:21.040052+05:30	0
f06ee7bc-f057-41f2-8cdb-edac6111458f	0072e1cc97d7c1542b76a37131af2667bd0ad9e5f0dddd0b06590fd44bcd380f	2026-02-06 21:15:21.293007+05:30	20260206150000_add_report_share_model		\N	2026-02-06 21:15:21.293007+05:30	0
930922a9-abf9-4220-873d-865715332f7f	b11dc93012ec0968545c00bdbb32dfb37fa744ead11f1fdc50c5a757069d26af	2026-02-06 21:15:21.546267+05:30	20260206160000_add_report_comment_model		\N	2026-02-06 21:15:21.546267+05:30	0
901ecb5b-8809-4c1d-87f8-5ba6c4b4df48	14f1c2c5acd71e8fc6696b5bf335018d823e5384d49c42b9d095518fefff0f5d	2026-02-06 21:15:21.798903+05:30	20260206170000_add_integration_tables		\N	2026-02-06 21:15:21.798903+05:30	0
5e261f43-fd5e-4570-a390-7587123240b1	6d4dd546e92d5dd1f08e1c9d485b553d1b53fa1bfa4910ea032c751fd433dc2c	2026-02-06 21:15:22.049973+05:30	20260206170000_add_payment_gateway_models		\N	2026-02-06 21:15:22.049973+05:30	0
3d27594d-ccb7-450a-a179-b094c8388d59	e486d7463659d368dbc6e490c9b94c8739b3db9d514ddc492ade7c4b8f114e9e	2026-02-06 21:15:22.307832+05:30	20260206180000_seed_rbac_permissions_and_roles		\N	2026-02-06 21:15:22.307832+05:30	0
bb0fdcb8-e421-4f23-833d-6a4942e05464	4edccb69c4a877e57cc9c1ecb32f7c72dd02156f1d78b57690b180e460fd6a5c	2026-02-06 21:15:22.566946+05:30	20260206190000_add_missing_schema_models		\N	2026-02-06 21:15:22.566946+05:30	0
\.


--
-- Name: AdvertisementDiscount AdvertisementDiscount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AdvertisementDiscount"
    ADD CONSTRAINT "AdvertisementDiscount_pkey" PRIMARY KEY ("advertisementId", "discountId");


--
-- Name: Advertisement Advertisement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Advertisement"
    ADD CONSTRAINT "Advertisement_pkey" PRIMARY KEY (id);


--
-- Name: Aggregator Aggregator_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Aggregator"
    ADD CONSTRAINT "Aggregator_pkey" PRIMARY KEY (id);


--
-- Name: Allergen Allergen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Allergen"
    ADD CONSTRAINT "Allergen_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: BlogCategory BlogCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BlogCategory"
    ADD CONSTRAINT "BlogCategory_pkey" PRIMARY KEY (id);


--
-- Name: BlogRevision BlogRevision_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BlogRevision"
    ADD CONSTRAINT "BlogRevision_pkey" PRIMARY KEY (id);


--
-- Name: BlogTag BlogTag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BlogTag"
    ADD CONSTRAINT "BlogTag_pkey" PRIMARY KEY (id);


--
-- Name: Blog Blog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Blog"
    ADD CONSTRAINT "Blog_pkey" PRIMARY KEY (id);


--
-- Name: Branch Branch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_pkey" PRIMARY KEY (id);


--
-- Name: Brand Brand_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Brand"
    ADD CONSTRAINT "Brand_pkey" PRIMARY KEY (id);


--
-- Name: BusinessHours BusinessHours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BusinessHours"
    ADD CONSTRAINT "BusinessHours_pkey" PRIMARY KEY (id);


--
-- Name: BusinessOwner BusinessOwner_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BusinessOwner"
    ADD CONSTRAINT "BusinessOwner_pkey" PRIMARY KEY (id);


--
-- Name: BusinessPreference BusinessPreference_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BusinessPreference"
    ADD CONSTRAINT "BusinessPreference_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Charge Charge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Charge"
    ADD CONSTRAINT "Charge_pkey" PRIMARY KEY (id);


--
-- Name: CustomReport CustomReport_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CustomReport"
    ADD CONSTRAINT "CustomReport_pkey" PRIMARY KEY (id);


--
-- Name: CustomerGroup CustomerGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CustomerGroup"
    ADD CONSTRAINT "CustomerGroup_pkey" PRIMARY KEY (id);


--
-- Name: CustomerReview CustomerReview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CustomerReview"
    ADD CONSTRAINT "CustomerReview_pkey" PRIMARY KEY (id);


--
-- Name: CustomerTag CustomerTag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CustomerTag"
    ADD CONSTRAINT "CustomerTag_pkey" PRIMARY KEY ("customerId", "tagId");


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: DiscountCategory DiscountCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DiscountCategory"
    ADD CONSTRAINT "DiscountCategory_pkey" PRIMARY KEY ("discountId", "categoryId");


--
-- Name: DiscountProduct DiscountProduct_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DiscountProduct"
    ADD CONSTRAINT "DiscountProduct_pkey" PRIMARY KEY ("discountId", "productId");


--
-- Name: Discount Discount_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Discount"
    ADD CONSTRAINT "Discount_pkey" PRIMARY KEY (id);


--
-- Name: FeedbackForm FeedbackForm_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FeedbackForm"
    ADD CONSTRAINT "FeedbackForm_pkey" PRIMARY KEY (id);


--
-- Name: FeedbackResponse FeedbackResponse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FeedbackResponse"
    ADD CONSTRAINT "FeedbackResponse_pkey" PRIMARY KEY (id);


--
-- Name: Floor Floor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Floor"
    ADD CONSTRAINT "Floor_pkey" PRIMARY KEY (id);


--
-- Name: IntegrationLog IntegrationLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IntegrationLog"
    ADD CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY (id);


--
-- Name: Integration Integration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Integration"
    ADD CONSTRAINT "Integration_pkey" PRIMARY KEY (id);


--
-- Name: InventoryProduct InventoryProduct_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryProduct"
    ADD CONSTRAINT "InventoryProduct_pkey" PRIMARY KEY (id);


--
-- Name: Kitchen Kitchen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Kitchen"
    ADD CONSTRAINT "Kitchen_pkey" PRIMARY KEY (id);


--
-- Name: Lead Lead_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_pkey" PRIMARY KEY (id);


--
-- Name: LoyaltyTransaction LoyaltyTransaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LoyaltyTransaction"
    ADD CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY (id);


--
-- Name: MeasuringUnit MeasuringUnit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeasuringUnit"
    ADD CONSTRAINT "MeasuringUnit_pkey" PRIMARY KEY (id);


--
-- Name: MenuVisibility MenuVisibility_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MenuVisibility"
    ADD CONSTRAINT "MenuVisibility_pkey" PRIMARY KEY (id);


--
-- Name: Menu Menu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Menu"
    ADD CONSTRAINT "Menu_pkey" PRIMARY KEY (id);


--
-- Name: OnlineOrder OnlineOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnlineOrder"
    ADD CONSTRAINT "OnlineOrder_pkey" PRIMARY KEY (id);


--
-- Name: OnlinePayment OnlinePayment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnlinePayment"
    ADD CONSTRAINT "OnlinePayment_pkey" PRIMARY KEY (id);


--
-- Name: OrderItemAddon OrderItemAddon_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItemAddon"
    ADD CONSTRAINT "OrderItemAddon_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: OrderKOT OrderKOT_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderKOT"
    ADD CONSTRAINT "OrderKOT_pkey" PRIMARY KEY (id);


--
-- Name: OrderPayment OrderPayment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderPayment"
    ADD CONSTRAINT "OrderPayment_pkey" PRIMARY KEY (id);


--
-- Name: OrderTimeline OrderTimeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderTimeline"
    ADD CONSTRAINT "OrderTimeline_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: PaymentGatewayConfig PaymentGatewayConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentGatewayConfig"
    ADD CONSTRAINT "PaymentGatewayConfig_pkey" PRIMARY KEY (id);


--
-- Name: PaymentOption PaymentOption_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentOption"
    ADD CONSTRAINT "PaymentOption_pkey" PRIMARY KEY (id);


--
-- Name: PaymentReconciliation PaymentReconciliation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentReconciliation"
    ADD CONSTRAINT "PaymentReconciliation_pkey" PRIMARY KEY (id);


--
-- Name: PermissionAuditLog PermissionAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PermissionAuditLog"
    ADD CONSTRAINT "PermissionAuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: ProductAddon ProductAddon_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductAddon"
    ADD CONSTRAINT "ProductAddon_pkey" PRIMARY KEY (id);


--
-- Name: ProductAllergen ProductAllergen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductAllergen"
    ADD CONSTRAINT "ProductAllergen_pkey" PRIMARY KEY ("productId", "allergenId");


--
-- Name: ProductImage ProductImage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_pkey" PRIMARY KEY (id);


--
-- Name: ProductKitchen ProductKitchen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductKitchen"
    ADD CONSTRAINT "ProductKitchen_pkey" PRIMARY KEY ("productId", "kitchenId");


--
-- Name: ProductNutrition ProductNutrition_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductNutrition"
    ADD CONSTRAINT "ProductNutrition_pkey" PRIMARY KEY (id);


--
-- Name: ProductPrice ProductPrice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductPrice"
    ADD CONSTRAINT "ProductPrice_pkey" PRIMARY KEY (id);


--
-- Name: ProductTag ProductTag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductTag"
    ADD CONSTRAINT "ProductTag_pkey" PRIMARY KEY ("productId", "tagId");


--
-- Name: ProductVariant ProductVariant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductVariant"
    ADD CONSTRAINT "ProductVariant_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseOrderItem PurchaseOrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PurchaseOrderItem"
    ADD CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseOrder PurchaseOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY (id);


--
-- Name: Reason Reason_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reason"
    ADD CONSTRAINT "Reason_pkey" PRIMARY KEY (id);


--
-- Name: Refund Refund_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Refund"
    ADD CONSTRAINT "Refund_pkey" PRIMARY KEY (id);


--
-- Name: ReportComment ReportComment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportComment"
    ADD CONSTRAINT "ReportComment_pkey" PRIMARY KEY (id);


--
-- Name: ReportShare ReportShare_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportShare"
    ADD CONSTRAINT "ReportShare_pkey" PRIMARY KEY (id);


--
-- Name: ReportTemplate ReportTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportTemplate"
    ADD CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Reservation Reservation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: Room Room_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Room"
    ADD CONSTRAINT "Room_pkey" PRIMARY KEY (id);


--
-- Name: SalesAnomaly SalesAnomaly_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SalesAnomaly"
    ADD CONSTRAINT "SalesAnomaly_pkey" PRIMARY KEY (id);


--
-- Name: SalesChannel SalesChannel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SalesChannel"
    ADD CONSTRAINT "SalesChannel_pkey" PRIMARY KEY (id);


--
-- Name: ScheduledReport ScheduledReport_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ScheduledReport"
    ADD CONSTRAINT "ScheduledReport_pkey" PRIMARY KEY (id);


--
-- Name: SecurityCamera SecurityCamera_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SecurityCamera"
    ADD CONSTRAINT "SecurityCamera_pkey" PRIMARY KEY (id);


--
-- Name: StaffAttendance StaffAttendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StaffAttendance"
    ADD CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY (id);


--
-- Name: Staff Staff_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_pkey" PRIMARY KEY (id);


--
-- Name: StockAdjustment StockAdjustment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StockAdjustment"
    ADD CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY (id);


--
-- Name: SubCategory SubCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubCategory"
    ADD CONSTRAINT "SubCategory_pkey" PRIMARY KEY (id);


--
-- Name: SubscriptionPlan SubscriptionPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubscriptionPlan"
    ADD CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY (id);


--
-- Name: SuperAdmin SuperAdmin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SuperAdmin"
    ADD CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY (id);


--
-- Name: SupplierContact SupplierContact_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupplierContact"
    ADD CONSTRAINT "SupplierContact_pkey" PRIMARY KEY (id);


--
-- Name: SupplierRating SupplierRating_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupplierRating"
    ADD CONSTRAINT "SupplierRating_pkey" PRIMARY KEY (id);


--
-- Name: Supplier Supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY (id);


--
-- Name: Table Table_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Table"
    ADD CONSTRAINT "Table_pkey" PRIMARY KEY (id);


--
-- Name: Tag Tag_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tag"
    ADD CONSTRAINT "Tag_pkey" PRIMARY KEY (id);


--
-- Name: TaxGroupItem TaxGroupItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TaxGroupItem"
    ADD CONSTRAINT "TaxGroupItem_pkey" PRIMARY KEY ("taxGroupId", "taxId");


--
-- Name: TaxGroup TaxGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TaxGroup"
    ADD CONSTRAINT "TaxGroup_pkey" PRIMARY KEY (id);


--
-- Name: Tax Tax_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tax"
    ADD CONSTRAINT "Tax_pkey" PRIMARY KEY (id);


--
-- Name: UPIAutoPaySubscription UPIAutoPaySubscription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UPIAutoPaySubscription"
    ADD CONSTRAINT "UPIAutoPaySubscription_pkey" PRIMARY KEY (id);


--
-- Name: UserRoleAssignment UserRoleAssignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRoleAssignment"
    ADD CONSTRAINT "UserRoleAssignment_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AdvertisementDiscount_advertisementId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AdvertisementDiscount_advertisementId_idx" ON public."AdvertisementDiscount" USING btree ("advertisementId");


--
-- Name: AdvertisementDiscount_discountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AdvertisementDiscount_discountId_idx" ON public."AdvertisementDiscount" USING btree ("discountId");


--
-- Name: Advertisement_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Advertisement_businessOwnerId_idx" ON public."Advertisement" USING btree ("businessOwnerId");


--
-- Name: Aggregator_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Aggregator_businessOwnerId_idx" ON public."Aggregator" USING btree ("businessOwnerId");


--
-- Name: Aggregator_businessOwnerId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Aggregator_businessOwnerId_name_key" ON public."Aggregator" USING btree ("businessOwnerId", name);


--
-- Name: AuditLog_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_businessOwnerId_idx" ON public."AuditLog" USING btree ("businessOwnerId");


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_entityType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_entityType_idx" ON public."AuditLog" USING btree ("entityType");


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");


--
-- Name: AuditLog_userType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_userType_idx" ON public."AuditLog" USING btree ("userType");


--
-- Name: BlogCategory_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BlogCategory_businessOwnerId_idx" ON public."BlogCategory" USING btree ("businessOwnerId");


--
-- Name: BlogCategory_businessOwnerId_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BlogCategory_businessOwnerId_slug_key" ON public."BlogCategory" USING btree ("businessOwnerId", slug);


--
-- Name: BlogRevision_blogId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BlogRevision_blogId_idx" ON public."BlogRevision" USING btree ("blogId");


--
-- Name: BlogRevision_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BlogRevision_createdAt_idx" ON public."BlogRevision" USING btree ("createdAt");


--
-- Name: BlogTag_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BlogTag_businessOwnerId_idx" ON public."BlogTag" USING btree ("businessOwnerId");


--
-- Name: BlogTag_businessOwnerId_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BlogTag_businessOwnerId_slug_key" ON public."BlogTag" USING btree ("businessOwnerId", slug);


--
-- Name: Blog_authorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Blog_authorId_idx" ON public."Blog" USING btree ("authorId");


--
-- Name: Blog_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Blog_businessOwnerId_idx" ON public."Blog" USING btree ("businessOwnerId");


--
-- Name: Blog_businessOwnerId_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Blog_businessOwnerId_slug_key" ON public."Blog" USING btree ("businessOwnerId", slug);


--
-- Name: Blog_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Blog_categoryId_idx" ON public."Blog" USING btree ("categoryId");


--
-- Name: Blog_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Blog_publishedAt_idx" ON public."Blog" USING btree ("publishedAt");


--
-- Name: Blog_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Blog_status_idx" ON public."Blog" USING btree (status);


--
-- Name: Branch_businessOwnerId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Branch_businessOwnerId_code_key" ON public."Branch" USING btree ("businessOwnerId", code);


--
-- Name: Branch_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Branch_businessOwnerId_idx" ON public."Branch" USING btree ("businessOwnerId");


--
-- Name: Branch_parentBranchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Branch_parentBranchId_idx" ON public."Branch" USING btree ("parentBranchId");


--
-- Name: Brand_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Brand_businessOwnerId_idx" ON public."Brand" USING btree ("businessOwnerId");


--
-- Name: BusinessHours_branchId_dayOfWeek_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BusinessHours_branchId_dayOfWeek_key" ON public."BusinessHours" USING btree ("branchId", "dayOfWeek");


--
-- Name: BusinessHours_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BusinessHours_branchId_idx" ON public."BusinessHours" USING btree ("branchId");


--
-- Name: BusinessOwner_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BusinessOwner_email_key" ON public."BusinessOwner" USING btree (email);


--
-- Name: BusinessOwner_planId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BusinessOwner_planId_idx" ON public."BusinessOwner" USING btree ("planId");


--
-- Name: BusinessPreference_businessOwnerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BusinessPreference_businessOwnerId_key" ON public."BusinessPreference" USING btree ("businessOwnerId");


--
-- Name: Category_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Category_businessOwnerId_idx" ON public."Category" USING btree ("businessOwnerId");


--
-- Name: Charge_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Charge_businessOwnerId_idx" ON public."Charge" USING btree ("businessOwnerId");


--
-- Name: CustomReport_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CustomReport_businessOwnerId_idx" ON public."CustomReport" USING btree ("businessOwnerId");


--
-- Name: CustomReport_reportType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CustomReport_reportType_idx" ON public."CustomReport" USING btree ("reportType");


--
-- Name: CustomerGroup_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CustomerGroup_businessOwnerId_idx" ON public."CustomerGroup" USING btree ("businessOwnerId");


--
-- Name: CustomerReview_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CustomerReview_businessOwnerId_idx" ON public."CustomerReview" USING btree ("businessOwnerId");


--
-- Name: CustomerReview_externalReviewId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CustomerReview_externalReviewId_key" ON public."CustomerReview" USING btree ("externalReviewId");


--
-- Name: CustomerReview_publishedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CustomerReview_publishedAt_idx" ON public."CustomerReview" USING btree ("publishedAt");


--
-- Name: CustomerReview_rating_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CustomerReview_rating_idx" ON public."CustomerReview" USING btree (rating);


--
-- Name: CustomerTag_customerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CustomerTag_customerId_idx" ON public."CustomerTag" USING btree ("customerId");


--
-- Name: CustomerTag_tagId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CustomerTag_tagId_idx" ON public."CustomerTag" USING btree ("tagId");


--
-- Name: Customer_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Customer_businessOwnerId_idx" ON public."Customer" USING btree ("businessOwnerId");


--
-- Name: Customer_businessOwnerId_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Customer_businessOwnerId_phone_key" ON public."Customer" USING btree ("businessOwnerId", phone);


--
-- Name: Customer_customerGroupId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Customer_customerGroupId_idx" ON public."Customer" USING btree ("customerGroupId");


--
-- Name: DiscountCategory_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DiscountCategory_categoryId_idx" ON public."DiscountCategory" USING btree ("categoryId");


--
-- Name: DiscountCategory_discountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DiscountCategory_discountId_idx" ON public."DiscountCategory" USING btree ("discountId");


--
-- Name: DiscountProduct_discountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DiscountProduct_discountId_idx" ON public."DiscountProduct" USING btree ("discountId");


--
-- Name: DiscountProduct_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "DiscountProduct_productId_idx" ON public."DiscountProduct" USING btree ("productId");


--
-- Name: Discount_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Discount_businessOwnerId_idx" ON public."Discount" USING btree ("businessOwnerId");


--
-- Name: FeedbackForm_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FeedbackForm_businessOwnerId_idx" ON public."FeedbackForm" USING btree ("businessOwnerId");


--
-- Name: FeedbackResponse_customerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FeedbackResponse_customerId_idx" ON public."FeedbackResponse" USING btree ("customerId");


--
-- Name: FeedbackResponse_feedbackFormId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FeedbackResponse_feedbackFormId_idx" ON public."FeedbackResponse" USING btree ("feedbackFormId");


--
-- Name: Floor_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Floor_branchId_idx" ON public."Floor" USING btree ("branchId");


--
-- Name: IntegrationLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IntegrationLog_createdAt_idx" ON public."IntegrationLog" USING btree ("createdAt");


--
-- Name: IntegrationLog_integrationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IntegrationLog_integrationId_idx" ON public."IntegrationLog" USING btree ("integrationId");


--
-- Name: Integration_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Integration_businessOwnerId_idx" ON public."Integration" USING btree ("businessOwnerId");


--
-- Name: Integration_businessOwnerId_provider_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Integration_businessOwnerId_provider_key" ON public."Integration" USING btree ("businessOwnerId", provider);


--
-- Name: Integration_provider_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Integration_provider_idx" ON public."Integration" USING btree (provider);


--
-- Name: InventoryProduct_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InventoryProduct_branchId_idx" ON public."InventoryProduct" USING btree ("branchId");


--
-- Name: InventoryProduct_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InventoryProduct_businessOwnerId_idx" ON public."InventoryProduct" USING btree ("businessOwnerId");


--
-- Name: InventoryProduct_supplierId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "InventoryProduct_supplierId_idx" ON public."InventoryProduct" USING btree ("supplierId");


--
-- Name: Kitchen_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Kitchen_branchId_idx" ON public."Kitchen" USING btree ("branchId");


--
-- Name: Lead_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Lead_createdAt_idx" ON public."Lead" USING btree ("createdAt");


--
-- Name: Lead_stage_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Lead_stage_idx" ON public."Lead" USING btree (stage);


--
-- Name: LoyaltyTransaction_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LoyaltyTransaction_branchId_idx" ON public."LoyaltyTransaction" USING btree ("branchId");


--
-- Name: LoyaltyTransaction_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LoyaltyTransaction_businessOwnerId_idx" ON public."LoyaltyTransaction" USING btree ("businessOwnerId");


--
-- Name: LoyaltyTransaction_customerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LoyaltyTransaction_customerId_idx" ON public."LoyaltyTransaction" USING btree ("customerId");


--
-- Name: LoyaltyTransaction_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LoyaltyTransaction_orderId_idx" ON public."LoyaltyTransaction" USING btree ("orderId");


--
-- Name: MenuVisibility_userType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MenuVisibility_userType_idx" ON public."MenuVisibility" USING btree ("userType");


--
-- Name: MenuVisibility_userType_menuKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MenuVisibility_userType_menuKey_key" ON public."MenuVisibility" USING btree ("userType", "menuKey");


--
-- Name: Menu_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Menu_businessOwnerId_idx" ON public."Menu" USING btree ("businessOwnerId");


--
-- Name: OnlineOrder_aggregator_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OnlineOrder_aggregator_idx" ON public."OnlineOrder" USING btree (aggregator);


--
-- Name: OnlineOrder_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OnlineOrder_branchId_idx" ON public."OnlineOrder" USING btree ("branchId");


--
-- Name: OnlineOrder_receivedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OnlineOrder_receivedAt_idx" ON public."OnlineOrder" USING btree ("receivedAt");


--
-- Name: OnlineOrder_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OnlineOrder_status_idx" ON public."OnlineOrder" USING btree (status);


--
-- Name: OnlinePayment_gatewayOrderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OnlinePayment_gatewayOrderId_idx" ON public."OnlinePayment" USING btree ("gatewayOrderId");


--
-- Name: OnlinePayment_gatewayTransactionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OnlinePayment_gatewayTransactionId_idx" ON public."OnlinePayment" USING btree ("gatewayTransactionId");


--
-- Name: OnlinePayment_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OnlinePayment_orderId_idx" ON public."OnlinePayment" USING btree ("orderId");


--
-- Name: OnlinePayment_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OnlinePayment_status_idx" ON public."OnlinePayment" USING btree (status);


--
-- Name: OrderItemAddon_addonId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderItemAddon_addonId_idx" ON public."OrderItemAddon" USING btree ("addonId");


--
-- Name: OrderItemAddon_orderItemId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderItemAddon_orderItemId_idx" ON public."OrderItemAddon" USING btree ("orderItemId");


--
-- Name: OrderItem_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderItem_orderId_idx" ON public."OrderItem" USING btree ("orderId");


--
-- Name: OrderItem_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderItem_productId_idx" ON public."OrderItem" USING btree ("productId");


--
-- Name: OrderItem_variantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderItem_variantId_idx" ON public."OrderItem" USING btree ("variantId");


--
-- Name: OrderKOT_kitchenId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderKOT_kitchenId_idx" ON public."OrderKOT" USING btree ("kitchenId");


--
-- Name: OrderKOT_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderKOT_orderId_idx" ON public."OrderKOT" USING btree ("orderId");


--
-- Name: OrderPayment_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderPayment_orderId_idx" ON public."OrderPayment" USING btree ("orderId");


--
-- Name: OrderPayment_paymentOptionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderPayment_paymentOptionId_idx" ON public."OrderPayment" USING btree ("paymentOptionId");


--
-- Name: OrderTimeline_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderTimeline_createdAt_idx" ON public."OrderTimeline" USING btree ("createdAt");


--
-- Name: OrderTimeline_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderTimeline_orderId_idx" ON public."OrderTimeline" USING btree ("orderId");


--
-- Name: OrderTimeline_staffId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OrderTimeline_staffId_idx" ON public."OrderTimeline" USING btree ("staffId");


--
-- Name: Order_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_branchId_idx" ON public."Order" USING btree ("branchId");


--
-- Name: Order_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_businessOwnerId_idx" ON public."Order" USING btree ("businessOwnerId");


--
-- Name: Order_businessOwnerId_orderNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Order_businessOwnerId_orderNumber_key" ON public."Order" USING btree ("businessOwnerId", "orderNumber");


--
-- Name: Order_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_createdAt_idx" ON public."Order" USING btree ("createdAt");


--
-- Name: Order_customerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_customerId_idx" ON public."Order" USING btree ("customerId");


--
-- Name: Order_discountId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_discountId_idx" ON public."Order" USING btree ("discountId");


--
-- Name: Order_staffId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_staffId_idx" ON public."Order" USING btree ("staffId");


--
-- Name: Order_tableId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_tableId_idx" ON public."Order" USING btree ("tableId");


--
-- Name: PaymentGatewayConfig_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PaymentGatewayConfig_businessOwnerId_idx" ON public."PaymentGatewayConfig" USING btree ("businessOwnerId");


--
-- Name: PaymentGatewayConfig_businessOwnerId_provider_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PaymentGatewayConfig_businessOwnerId_provider_key" ON public."PaymentGatewayConfig" USING btree ("businessOwnerId", provider);


--
-- Name: PaymentOption_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PaymentOption_businessOwnerId_idx" ON public."PaymentOption" USING btree ("businessOwnerId");


--
-- Name: PaymentReconciliation_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PaymentReconciliation_businessOwnerId_idx" ON public."PaymentReconciliation" USING btree ("businessOwnerId");


--
-- Name: PaymentReconciliation_gatewayProvider_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PaymentReconciliation_gatewayProvider_idx" ON public."PaymentReconciliation" USING btree ("gatewayProvider");


--
-- Name: PaymentReconciliation_settlementDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PaymentReconciliation_settlementDate_idx" ON public."PaymentReconciliation" USING btree ("settlementDate");


--
-- Name: PaymentReconciliation_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PaymentReconciliation_status_idx" ON public."PaymentReconciliation" USING btree (status);


--
-- Name: PermissionAuditLog_granted_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PermissionAuditLog_granted_idx" ON public."PermissionAuditLog" USING btree (granted);


--
-- Name: PermissionAuditLog_resource_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PermissionAuditLog_resource_idx" ON public."PermissionAuditLog" USING btree (resource);


--
-- Name: PermissionAuditLog_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PermissionAuditLog_timestamp_idx" ON public."PermissionAuditLog" USING btree ("timestamp");


--
-- Name: PermissionAuditLog_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PermissionAuditLog_userId_idx" ON public."PermissionAuditLog" USING btree ("userId");


--
-- Name: Permission_module_action_resource_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Permission_module_action_resource_key" ON public."Permission" USING btree (module, action, resource);


--
-- Name: Permission_module_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Permission_module_idx" ON public."Permission" USING btree (module);


--
-- Name: ProductAddon_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductAddon_productId_idx" ON public."ProductAddon" USING btree ("productId");


--
-- Name: ProductAllergen_allergenId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductAllergen_allergenId_idx" ON public."ProductAllergen" USING btree ("allergenId");


--
-- Name: ProductAllergen_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductAllergen_productId_idx" ON public."ProductAllergen" USING btree ("productId");


--
-- Name: ProductImage_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductImage_productId_idx" ON public."ProductImage" USING btree ("productId");


--
-- Name: ProductKitchen_kitchenId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductKitchen_kitchenId_idx" ON public."ProductKitchen" USING btree ("kitchenId");


--
-- Name: ProductKitchen_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductKitchen_productId_idx" ON public."ProductKitchen" USING btree ("productId");


--
-- Name: ProductNutrition_productId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ProductNutrition_productId_key" ON public."ProductNutrition" USING btree ("productId");


--
-- Name: ProductPrice_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductPrice_productId_idx" ON public."ProductPrice" USING btree ("productId");


--
-- Name: ProductPrice_taxGroupId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductPrice_taxGroupId_idx" ON public."ProductPrice" USING btree ("taxGroupId");


--
-- Name: ProductPrice_variantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductPrice_variantId_idx" ON public."ProductPrice" USING btree ("variantId");


--
-- Name: ProductTag_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductTag_productId_idx" ON public."ProductTag" USING btree ("productId");


--
-- Name: ProductTag_tagId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductTag_tagId_idx" ON public."ProductTag" USING btree ("tagId");


--
-- Name: ProductVariant_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProductVariant_productId_idx" ON public."ProductVariant" USING btree ("productId");


--
-- Name: Product_brandId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_brandId_idx" ON public."Product" USING btree ("brandId");


--
-- Name: Product_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_businessOwnerId_idx" ON public."Product" USING btree ("businessOwnerId");


--
-- Name: Product_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_categoryId_idx" ON public."Product" USING btree ("categoryId");


--
-- Name: Product_menuId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_menuId_idx" ON public."Product" USING btree ("menuId");


--
-- Name: Product_subCategoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_subCategoryId_idx" ON public."Product" USING btree ("subCategoryId");


--
-- Name: PurchaseOrderItem_inventoryProductId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PurchaseOrderItem_inventoryProductId_idx" ON public."PurchaseOrderItem" USING btree ("inventoryProductId");


--
-- Name: PurchaseOrderItem_purchaseOrderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON public."PurchaseOrderItem" USING btree ("purchaseOrderId");


--
-- Name: PurchaseOrder_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PurchaseOrder_branchId_idx" ON public."PurchaseOrder" USING btree ("branchId");


--
-- Name: PurchaseOrder_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PurchaseOrder_businessOwnerId_idx" ON public."PurchaseOrder" USING btree ("businessOwnerId");


--
-- Name: PurchaseOrder_supplierId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PurchaseOrder_supplierId_idx" ON public."PurchaseOrder" USING btree ("supplierId");


--
-- Name: Reason_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Reason_businessOwnerId_idx" ON public."Reason" USING btree ("businessOwnerId");


--
-- Name: Reason_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Reason_type_idx" ON public."Reason" USING btree (type);


--
-- Name: Refund_onlinePaymentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Refund_onlinePaymentId_idx" ON public."Refund" USING btree ("onlinePaymentId");


--
-- Name: Refund_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Refund_status_idx" ON public."Refund" USING btree (status);


--
-- Name: ReportComment_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportComment_businessOwnerId_idx" ON public."ReportComment" USING btree ("businessOwnerId");


--
-- Name: ReportComment_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportComment_createdAt_idx" ON public."ReportComment" USING btree ("createdAt");


--
-- Name: ReportComment_reportType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportComment_reportType_idx" ON public."ReportComment" USING btree ("reportType");


--
-- Name: ReportShare_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportShare_businessOwnerId_idx" ON public."ReportShare" USING btree ("businessOwnerId");


--
-- Name: ReportShare_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportShare_expiresAt_idx" ON public."ReportShare" USING btree ("expiresAt");


--
-- Name: ReportShare_shareToken_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportShare_shareToken_idx" ON public."ReportShare" USING btree ("shareToken");


--
-- Name: ReportShare_shareToken_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ReportShare_shareToken_key" ON public."ReportShare" USING btree ("shareToken");


--
-- Name: ReportTemplate_reportType_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ReportTemplate_reportType_idx" ON public."ReportTemplate" USING btree ("reportType");


--
-- Name: Reservation_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Reservation_branchId_idx" ON public."Reservation" USING btree ("branchId");


--
-- Name: Reservation_customerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Reservation_customerId_idx" ON public."Reservation" USING btree ("customerId");


--
-- Name: Reservation_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Reservation_date_idx" ON public."Reservation" USING btree (date);


--
-- Name: Reservation_roomId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Reservation_roomId_idx" ON public."Reservation" USING btree ("roomId");


--
-- Name: Reservation_tableId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Reservation_tableId_idx" ON public."Reservation" USING btree ("tableId");


--
-- Name: RolePermission_permissionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RolePermission_permissionId_idx" ON public."RolePermission" USING btree ("permissionId");


--
-- Name: RolePermission_roleId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "RolePermission_roleId_idx" ON public."RolePermission" USING btree ("roleId");


--
-- Name: RolePermission_roleId_permissionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON public."RolePermission" USING btree ("roleId", "permissionId");


--
-- Name: Role_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Role_businessOwnerId_idx" ON public."Role" USING btree ("businessOwnerId");


--
-- Name: Role_parentRoleId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Role_parentRoleId_idx" ON public."Role" USING btree ("parentRoleId");


--
-- Name: Room_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Room_branchId_idx" ON public."Room" USING btree ("branchId");


--
-- Name: SalesAnomaly_businessOwnerId_branchId_date_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SalesAnomaly_businessOwnerId_branchId_date_key" ON public."SalesAnomaly" USING btree ("businessOwnerId", "branchId", date);


--
-- Name: SalesAnomaly_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SalesAnomaly_businessOwnerId_idx" ON public."SalesAnomaly" USING btree ("businessOwnerId");


--
-- Name: SalesAnomaly_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SalesAnomaly_date_idx" ON public."SalesAnomaly" USING btree (date);


--
-- Name: SalesAnomaly_resolved_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SalesAnomaly_resolved_idx" ON public."SalesAnomaly" USING btree (resolved);


--
-- Name: SalesChannel_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SalesChannel_businessOwnerId_idx" ON public."SalesChannel" USING btree ("businessOwnerId");


--
-- Name: SalesChannel_businessOwnerId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SalesChannel_businessOwnerId_name_key" ON public."SalesChannel" USING btree ("businessOwnerId", name);


--
-- Name: ScheduledReport_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScheduledReport_businessOwnerId_idx" ON public."ScheduledReport" USING btree ("businessOwnerId");


--
-- Name: ScheduledReport_nextRunAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ScheduledReport_nextRunAt_idx" ON public."ScheduledReport" USING btree ("nextRunAt");


--
-- Name: SecurityCamera_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SecurityCamera_branchId_idx" ON public."SecurityCamera" USING btree ("branchId");


--
-- Name: SecurityCamera_businessOwnerId_cameraId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SecurityCamera_businessOwnerId_cameraId_key" ON public."SecurityCamera" USING btree ("businessOwnerId", "cameraId");


--
-- Name: SecurityCamera_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SecurityCamera_businessOwnerId_idx" ON public."SecurityCamera" USING btree ("businessOwnerId");


--
-- Name: StaffAttendance_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "StaffAttendance_branchId_idx" ON public."StaffAttendance" USING btree ("branchId");


--
-- Name: StaffAttendance_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "StaffAttendance_businessOwnerId_idx" ON public."StaffAttendance" USING btree ("businessOwnerId");


--
-- Name: StaffAttendance_punchTime_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "StaffAttendance_punchTime_idx" ON public."StaffAttendance" USING btree ("punchTime");


--
-- Name: StaffAttendance_shiftDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "StaffAttendance_shiftDate_idx" ON public."StaffAttendance" USING btree ("shiftDate");


--
-- Name: StaffAttendance_staffId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "StaffAttendance_staffId_idx" ON public."StaffAttendance" USING btree ("staffId");


--
-- Name: Staff_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Staff_branchId_idx" ON public."Staff" USING btree ("branchId");


--
-- Name: Staff_businessOwnerId_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Staff_businessOwnerId_email_key" ON public."Staff" USING btree ("businessOwnerId", email);


--
-- Name: Staff_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Staff_businessOwnerId_idx" ON public."Staff" USING btree ("businessOwnerId");


--
-- Name: Staff_roleId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Staff_roleId_idx" ON public."Staff" USING btree ("roleId");


--
-- Name: StockAdjustment_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "StockAdjustment_businessOwnerId_idx" ON public."StockAdjustment" USING btree ("businessOwnerId");


--
-- Name: StockAdjustment_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "StockAdjustment_createdAt_idx" ON public."StockAdjustment" USING btree ("createdAt");


--
-- Name: StockAdjustment_inventoryProductId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "StockAdjustment_inventoryProductId_idx" ON public."StockAdjustment" USING btree ("inventoryProductId");


--
-- Name: SubCategory_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SubCategory_businessOwnerId_idx" ON public."SubCategory" USING btree ("businessOwnerId");


--
-- Name: SubCategory_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SubCategory_categoryId_idx" ON public."SubCategory" USING btree ("categoryId");


--
-- Name: SuperAdmin_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SuperAdmin_email_key" ON public."SuperAdmin" USING btree (email);


--
-- Name: SupplierContact_supplierId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SupplierContact_supplierId_idx" ON public."SupplierContact" USING btree ("supplierId");


--
-- Name: SupplierRating_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SupplierRating_businessOwnerId_idx" ON public."SupplierRating" USING btree ("businessOwnerId");


--
-- Name: SupplierRating_supplierId_businessOwnerId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SupplierRating_supplierId_businessOwnerId_key" ON public."SupplierRating" USING btree ("supplierId", "businessOwnerId");


--
-- Name: SupplierRating_supplierId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SupplierRating_supplierId_idx" ON public."SupplierRating" USING btree ("supplierId");


--
-- Name: Supplier_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Supplier_businessOwnerId_idx" ON public."Supplier" USING btree ("businessOwnerId");


--
-- Name: Table_floorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Table_floorId_idx" ON public."Table" USING btree ("floorId");


--
-- Name: Tag_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Tag_businessOwnerId_idx" ON public."Tag" USING btree ("businessOwnerId");


--
-- Name: TaxGroupItem_taxGroupId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TaxGroupItem_taxGroupId_idx" ON public."TaxGroupItem" USING btree ("taxGroupId");


--
-- Name: TaxGroupItem_taxId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TaxGroupItem_taxId_idx" ON public."TaxGroupItem" USING btree ("taxId");


--
-- Name: TaxGroup_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "TaxGroup_businessOwnerId_idx" ON public."TaxGroup" USING btree ("businessOwnerId");


--
-- Name: Tax_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Tax_businessOwnerId_idx" ON public."Tax" USING btree ("businessOwnerId");


--
-- Name: UPIAutoPaySubscription_businessOwnerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UPIAutoPaySubscription_businessOwnerId_idx" ON public."UPIAutoPaySubscription" USING btree ("businessOwnerId");


--
-- Name: UPIAutoPaySubscription_gatewaySubscriptionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UPIAutoPaySubscription_gatewaySubscriptionId_idx" ON public."UPIAutoPaySubscription" USING btree ("gatewaySubscriptionId");


--
-- Name: UPIAutoPaySubscription_nextBillingDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UPIAutoPaySubscription_nextBillingDate_idx" ON public."UPIAutoPaySubscription" USING btree ("nextBillingDate");


--
-- Name: UPIAutoPaySubscription_planId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UPIAutoPaySubscription_planId_idx" ON public."UPIAutoPaySubscription" USING btree ("planId");


--
-- Name: UPIAutoPaySubscription_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UPIAutoPaySubscription_status_idx" ON public."UPIAutoPaySubscription" USING btree (status);


--
-- Name: UserRoleAssignment_branchId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UserRoleAssignment_branchId_idx" ON public."UserRoleAssignment" USING btree ("branchId");


--
-- Name: UserRoleAssignment_kitchenId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UserRoleAssignment_kitchenId_idx" ON public."UserRoleAssignment" USING btree ("kitchenId");


--
-- Name: UserRoleAssignment_roleId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UserRoleAssignment_roleId_idx" ON public."UserRoleAssignment" USING btree ("roleId");


--
-- Name: UserRoleAssignment_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UserRoleAssignment_userId_idx" ON public."UserRoleAssignment" USING btree ("userId");


--
-- Name: UserRoleAssignment_userId_roleId_branchId_kitchenId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UserRoleAssignment_userId_roleId_branchId_kitchenId_key" ON public."UserRoleAssignment" USING btree ("userId", "roleId", "branchId", "kitchenId");


--
-- Name: _BlogToBlogTag_AB_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "_BlogToBlogTag_AB_unique" ON public."_BlogToBlogTag" USING btree ("A", "B");


--
-- Name: _BlogToBlogTag_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_BlogToBlogTag_B_index" ON public."_BlogToBlogTag" USING btree ("B");


--
-- Name: AdvertisementDiscount AdvertisementDiscount_advertisementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AdvertisementDiscount"
    ADD CONSTRAINT "AdvertisementDiscount_advertisementId_fkey" FOREIGN KEY ("advertisementId") REFERENCES public."Advertisement"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AdvertisementDiscount AdvertisementDiscount_discountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AdvertisementDiscount"
    ADD CONSTRAINT "AdvertisementDiscount_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES public."Discount"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Advertisement Advertisement_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Advertisement"
    ADD CONSTRAINT "Advertisement_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Aggregator Aggregator_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Aggregator"
    ADD CONSTRAINT "Aggregator_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AuditLog AuditLog_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BlogCategory BlogCategory_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BlogCategory"
    ADD CONSTRAINT "BlogCategory_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BlogRevision BlogRevision_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BlogRevision"
    ADD CONSTRAINT "BlogRevision_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BlogRevision BlogRevision_blogId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BlogRevision"
    ADD CONSTRAINT "BlogRevision_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES public."Blog"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BlogTag BlogTag_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BlogTag"
    ADD CONSTRAINT "BlogTag_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Blog Blog_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Blog"
    ADD CONSTRAINT "Blog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Blog Blog_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Blog"
    ADD CONSTRAINT "Blog_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Blog Blog_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Blog"
    ADD CONSTRAINT "Blog_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."BlogCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Branch Branch_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Branch Branch_parentBranchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_parentBranchId_fkey" FOREIGN KEY ("parentBranchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Brand Brand_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Brand"
    ADD CONSTRAINT "Brand_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BusinessHours BusinessHours_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BusinessHours"
    ADD CONSTRAINT "BusinessHours_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BusinessOwner BusinessOwner_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BusinessOwner"
    ADD CONSTRAINT "BusinessOwner_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."SubscriptionPlan"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BusinessPreference BusinessPreference_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BusinessPreference"
    ADD CONSTRAINT "BusinessPreference_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Category Category_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Charge Charge_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Charge"
    ADD CONSTRAINT "Charge_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CustomReport CustomReport_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CustomReport"
    ADD CONSTRAINT "CustomReport_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CustomerGroup CustomerGroup_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CustomerGroup"
    ADD CONSTRAINT "CustomerGroup_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CustomerReview CustomerReview_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CustomerReview"
    ADD CONSTRAINT "CustomerReview_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CustomerTag CustomerTag_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CustomerTag"
    ADD CONSTRAINT "CustomerTag_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CustomerTag CustomerTag_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CustomerTag"
    ADD CONSTRAINT "CustomerTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public."Tag"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Customer Customer_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Customer Customer_customerGroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_customerGroupId_fkey" FOREIGN KEY ("customerGroupId") REFERENCES public."CustomerGroup"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DiscountCategory DiscountCategory_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DiscountCategory"
    ADD CONSTRAINT "DiscountCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DiscountCategory DiscountCategory_discountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DiscountCategory"
    ADD CONSTRAINT "DiscountCategory_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES public."Discount"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DiscountProduct DiscountProduct_discountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DiscountProduct"
    ADD CONSTRAINT "DiscountProduct_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES public."Discount"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DiscountProduct DiscountProduct_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DiscountProduct"
    ADD CONSTRAINT "DiscountProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Discount Discount_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Discount"
    ADD CONSTRAINT "Discount_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FeedbackForm FeedbackForm_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FeedbackForm"
    ADD CONSTRAINT "FeedbackForm_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FeedbackResponse FeedbackResponse_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FeedbackResponse"
    ADD CONSTRAINT "FeedbackResponse_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FeedbackResponse FeedbackResponse_feedbackFormId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FeedbackResponse"
    ADD CONSTRAINT "FeedbackResponse_feedbackFormId_fkey" FOREIGN KEY ("feedbackFormId") REFERENCES public."FeedbackForm"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Floor Floor_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Floor"
    ADD CONSTRAINT "Floor_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IntegrationLog IntegrationLog_integrationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IntegrationLog"
    ADD CONSTRAINT "IntegrationLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES public."Integration"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Integration Integration_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Integration"
    ADD CONSTRAINT "Integration_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InventoryProduct InventoryProduct_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryProduct"
    ADD CONSTRAINT "InventoryProduct_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InventoryProduct InventoryProduct_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryProduct"
    ADD CONSTRAINT "InventoryProduct_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InventoryProduct InventoryProduct_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryProduct"
    ADD CONSTRAINT "InventoryProduct_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Kitchen Kitchen_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Kitchen"
    ADD CONSTRAINT "Kitchen_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LoyaltyTransaction LoyaltyTransaction_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LoyaltyTransaction"
    ADD CONSTRAINT "LoyaltyTransaction_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LoyaltyTransaction LoyaltyTransaction_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LoyaltyTransaction"
    ADD CONSTRAINT "LoyaltyTransaction_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LoyaltyTransaction LoyaltyTransaction_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LoyaltyTransaction"
    ADD CONSTRAINT "LoyaltyTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LoyaltyTransaction LoyaltyTransaction_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LoyaltyTransaction"
    ADD CONSTRAINT "LoyaltyTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Menu Menu_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Menu"
    ADD CONSTRAINT "Menu_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OnlineOrder OnlineOrder_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnlineOrder"
    ADD CONSTRAINT "OnlineOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OnlinePayment OnlinePayment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnlinePayment"
    ADD CONSTRAINT "OnlinePayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItemAddon OrderItemAddon_addonId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItemAddon"
    ADD CONSTRAINT "OrderItemAddon_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES public."ProductAddon"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItemAddon OrderItemAddon_orderItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItemAddon"
    ADD CONSTRAINT "OrderItemAddon_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES public."OrderItem"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItem OrderItem_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public."ProductVariant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderKOT OrderKOT_kitchenId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderKOT"
    ADD CONSTRAINT "OrderKOT_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES public."Kitchen"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderKOT OrderKOT_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderKOT"
    ADD CONSTRAINT "OrderKOT_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderPayment OrderPayment_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderPayment"
    ADD CONSTRAINT "OrderPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderPayment OrderPayment_paymentOptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderPayment"
    ADD CONSTRAINT "OrderPayment_paymentOptionId_fkey" FOREIGN KEY ("paymentOptionId") REFERENCES public."PaymentOption"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderTimeline OrderTimeline_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderTimeline"
    ADD CONSTRAINT "OrderTimeline_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderTimeline OrderTimeline_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderTimeline"
    ADD CONSTRAINT "OrderTimeline_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Order Order_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_discountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES public."Discount"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_tableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES public."Table"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PaymentGatewayConfig PaymentGatewayConfig_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentGatewayConfig"
    ADD CONSTRAINT "PaymentGatewayConfig_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PaymentOption PaymentOption_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentOption"
    ADD CONSTRAINT "PaymentOption_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PaymentReconciliation PaymentReconciliation_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentReconciliation"
    ADD CONSTRAINT "PaymentReconciliation_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductAddon ProductAddon_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductAddon"
    ADD CONSTRAINT "ProductAddon_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductAllergen ProductAllergen_allergenId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductAllergen"
    ADD CONSTRAINT "ProductAllergen_allergenId_fkey" FOREIGN KEY ("allergenId") REFERENCES public."Allergen"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductAllergen ProductAllergen_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductAllergen"
    ADD CONSTRAINT "ProductAllergen_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductImage ProductImage_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductKitchen ProductKitchen_kitchenId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductKitchen"
    ADD CONSTRAINT "ProductKitchen_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES public."Kitchen"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductKitchen ProductKitchen_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductKitchen"
    ADD CONSTRAINT "ProductKitchen_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductNutrition ProductNutrition_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductNutrition"
    ADD CONSTRAINT "ProductNutrition_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductPrice ProductPrice_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductPrice"
    ADD CONSTRAINT "ProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductPrice ProductPrice_taxGroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductPrice"
    ADD CONSTRAINT "ProductPrice_taxGroupId_fkey" FOREIGN KEY ("taxGroupId") REFERENCES public."TaxGroup"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProductPrice ProductPrice_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductPrice"
    ADD CONSTRAINT "ProductPrice_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public."ProductVariant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductTag ProductTag_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductTag"
    ADD CONSTRAINT "ProductTag_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductTag ProductTag_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductTag"
    ADD CONSTRAINT "ProductTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public."Tag"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProductVariant ProductVariant_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductVariant"
    ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_brandId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES public."Brand"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_menuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES public."Menu"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_subCategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES public."SubCategory"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PurchaseOrderItem PurchaseOrderItem_inventoryProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PurchaseOrderItem"
    ADD CONSTRAINT "PurchaseOrderItem_inventoryProductId_fkey" FOREIGN KEY ("inventoryProductId") REFERENCES public."InventoryProduct"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PurchaseOrderItem PurchaseOrderItem_purchaseOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PurchaseOrderItem"
    ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES public."PurchaseOrder"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PurchaseOrder PurchaseOrder_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PurchaseOrder PurchaseOrder_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PurchaseOrder PurchaseOrder_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PurchaseOrder"
    ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reason Reason_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reason"
    ADD CONSTRAINT "Reason_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Refund Refund_onlinePaymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Refund"
    ADD CONSTRAINT "Refund_onlinePaymentId_fkey" FOREIGN KEY ("onlinePaymentId") REFERENCES public."OnlinePayment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReportComment ReportComment_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportComment"
    ADD CONSTRAINT "ReportComment_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReportShare ReportShare_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReportShare"
    ADD CONSTRAINT "ReportShare_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reservation Reservation_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Reservation Reservation_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Reservation Reservation_roomId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES public."Room"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Reservation Reservation_tableId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Reservation"
    ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES public."Table"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RolePermission RolePermission_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Role Role_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Role Role_parentRoleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_parentRoleId_fkey" FOREIGN KEY ("parentRoleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Room Room_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Room"
    ADD CONSTRAINT "Room_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SalesAnomaly SalesAnomaly_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SalesAnomaly"
    ADD CONSTRAINT "SalesAnomaly_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SalesChannel SalesChannel_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SalesChannel"
    ADD CONSTRAINT "SalesChannel_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ScheduledReport ScheduledReport_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ScheduledReport"
    ADD CONSTRAINT "ScheduledReport_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SecurityCamera SecurityCamera_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SecurityCamera"
    ADD CONSTRAINT "SecurityCamera_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SecurityCamera SecurityCamera_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SecurityCamera"
    ADD CONSTRAINT "SecurityCamera_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StaffAttendance StaffAttendance_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StaffAttendance"
    ADD CONSTRAINT "StaffAttendance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StaffAttendance StaffAttendance_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StaffAttendance"
    ADD CONSTRAINT "StaffAttendance_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StaffAttendance StaffAttendance_staffId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StaffAttendance"
    ADD CONSTRAINT "StaffAttendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES public."Staff"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Staff Staff_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Staff Staff_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Staff Staff_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Staff"
    ADD CONSTRAINT "Staff_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: StockAdjustment StockAdjustment_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StockAdjustment"
    ADD CONSTRAINT "StockAdjustment_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StockAdjustment StockAdjustment_inventoryProductId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StockAdjustment"
    ADD CONSTRAINT "StockAdjustment_inventoryProductId_fkey" FOREIGN KEY ("inventoryProductId") REFERENCES public."InventoryProduct"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SubCategory SubCategory_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubCategory"
    ADD CONSTRAINT "SubCategory_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SubCategory SubCategory_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SubCategory"
    ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupplierContact SupplierContact_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupplierContact"
    ADD CONSTRAINT "SupplierContact_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupplierRating SupplierRating_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupplierRating"
    ADD CONSTRAINT "SupplierRating_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SupplierRating SupplierRating_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupplierRating"
    ADD CONSTRAINT "SupplierRating_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Supplier Supplier_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Table Table_floorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Table"
    ADD CONSTRAINT "Table_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES public."Floor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Tag Tag_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tag"
    ADD CONSTRAINT "Tag_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TaxGroupItem TaxGroupItem_taxGroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TaxGroupItem"
    ADD CONSTRAINT "TaxGroupItem_taxGroupId_fkey" FOREIGN KEY ("taxGroupId") REFERENCES public."TaxGroup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TaxGroupItem TaxGroupItem_taxId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TaxGroupItem"
    ADD CONSTRAINT "TaxGroupItem_taxId_fkey" FOREIGN KEY ("taxId") REFERENCES public."Tax"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TaxGroup TaxGroup_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TaxGroup"
    ADD CONSTRAINT "TaxGroup_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Tax Tax_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tax"
    ADD CONSTRAINT "Tax_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UPIAutoPaySubscription UPIAutoPaySubscription_businessOwnerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UPIAutoPaySubscription"
    ADD CONSTRAINT "UPIAutoPaySubscription_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES public."BusinessOwner"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UPIAutoPaySubscription UPIAutoPaySubscription_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UPIAutoPaySubscription"
    ADD CONSTRAINT "UPIAutoPaySubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."SubscriptionPlan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserRoleAssignment UserRoleAssignment_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRoleAssignment"
    ADD CONSTRAINT "UserRoleAssignment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRoleAssignment UserRoleAssignment_kitchenId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRoleAssignment"
    ADD CONSTRAINT "UserRoleAssignment_kitchenId_fkey" FOREIGN KEY ("kitchenId") REFERENCES public."Kitchen"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserRoleAssignment UserRoleAssignment_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UserRoleAssignment"
    ADD CONSTRAINT "UserRoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _BlogToBlogTag _BlogToBlogTag_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_BlogToBlogTag"
    ADD CONSTRAINT "_BlogToBlogTag_A_fkey" FOREIGN KEY ("A") REFERENCES public."Blog"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _BlogToBlogTag _BlogToBlogTag_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_BlogToBlogTag"
    ADD CONSTRAINT "_BlogToBlogTag_B_fkey" FOREIGN KEY ("B") REFERENCES public."BlogTag"(id) ON UPDATE CASCADE ON DELETE CASCADE;

--
-- Name: Product add dropdown backing columns; Type: COMMENT/DDL PATCH; Schema: public; Owner: -
--

ALTER TABLE public."Product"
    ADD COLUMN IF NOT EXISTS "measuringUnit" text,
    ADD COLUMN IF NOT EXISTS "includesTax" boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS "taxId" text,
    ADD COLUMN IF NOT EXISTS "eligibleForDiscount" boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS "discountType" text;

UPDATE public."Product"
SET
    "includesTax" = COALESCE("includesTax", true),
    "eligibleForDiscount" = COALESCE("eligibleForDiscount", true);

--
-- Name: Catalog dashboard seed data (top/least selling); Type: DATA PATCH; Schema: public; Owner: -
--
-- Purpose:
--  - Creates one completed order for "yesterday" with weighted order items.
--  - Ensures /reports/products/top and /reports/products/least return data.
--  - Idempotent: safe to run multiple times.

INSERT INTO public."Order" (
    "id",
    "businessOwnerId",
    "branchId",
    "orderNumber",
    "type",
    "source",
    "staffId",
    "subtotal",
    "discountAmount",
    "chargesAmount",
    "taxAmount",
    "total",
    "paidAmount",
    "dueAmount",
    "paymentStatus",
    "orderStatus",
    "createdAt",
    "updatedAt"
)
SELECT
    '1b1161bd-a79f-4cc6-b2fd-3c06c8d14c01',
    ctx."businessOwnerId",
    ctx."branchId",
    'DASH-YDAY-001',
    'DineIn',
    'BistroBill',
    ctx."staffId",
    2080.00,
    0.00,
    0.00,
    0.00,
    2080.00,
    2080.00,
    0.00,
    'Paid',
    'Completed',
    date_trunc('day', now() - interval '1 day'),
    date_trunc('day', now() - interval '1 day')
FROM (
    SELECT
        s."businessOwnerId",
        s."branchId",
        s."id" AS "staffId"
    FROM public."Staff" s
    WHERE s."status" = 'active'
    ORDER BY s."createdAt" ASC
    LIMIT 1
) ctx
WHERE EXISTS (
    SELECT 1
    FROM public."Product" p
    WHERE p."businessOwnerId" = ctx."businessOwnerId"
      AND p."status" = 'active'
)
ON CONFLICT ("id") DO NOTHING;

WITH ctx AS (
    SELECT
        o."id" AS "orderId",
        o."businessOwnerId"
    FROM public."Order" o
    WHERE o."id" = '1b1161bd-a79f-4cc6-b2fd-3c06c8d14c01'
),
ranked_products AS (
    SELECT
        p."id",
        p."name",
        row_number() OVER (ORDER BY p."createdAt" ASC, p."id" ASC) AS rn
    FROM public."Product" p
    JOIN ctx ON ctx."businessOwnerId" = p."businessOwnerId"
    WHERE p."status" = 'active'
),
picked AS (
    SELECT
        max(CASE WHEN rn = 1 THEN "id" END) AS p1_id,
        max(CASE WHEN rn = 1 THEN "name" END) AS p1_name,
        max(CASE WHEN rn = 2 THEN "id" END) AS p2_id,
        max(CASE WHEN rn = 2 THEN "name" END) AS p2_name,
        max(CASE WHEN rn = 3 THEN "id" END) AS p3_id,
        max(CASE WHEN rn = 3 THEN "name" END) AS p3_name,
        max(CASE WHEN rn = 4 THEN "id" END) AS p4_id,
        max(CASE WHEN rn = 4 THEN "name" END) AS p4_name,
        max(CASE WHEN rn = 5 THEN "id" END) AS p5_id,
        max(CASE WHEN rn = 5 THEN "name" END) AS p5_name,
        max(CASE WHEN rn = 6 THEN "id" END) AS p6_id,
        max(CASE WHEN rn = 6 THEN "name" END) AS p6_name
    FROM ranked_products
)
INSERT INTO public."OrderItem" (
    "id",
    "orderId",
    "productId",
    "variantId",
    "name",
    "quantity",
    "unitPrice",
    "totalPrice",
    "status",
    "createdAt",
    "updatedAt"
)
SELECT
    seed."id",
    ctx."orderId",
    seed."productId",
    NULL,
    seed."name",
    seed."quantity",
    seed."unitPrice",
    seed."totalPrice",
    'Served',
    date_trunc('day', now() - interval '1 day'),
    date_trunc('day', now() - interval '1 day')
FROM ctx
JOIN picked ON true
JOIN (
    SELECT
        'ab2e1c43-835e-4a6e-9d73-128f7ae11b01'::uuid AS "id",
        picked.p1_id AS "productId",
        COALESCE(picked.p1_name, 'Top Product 1') AS "name",
        5 AS "quantity",
        220.00::numeric AS "unitPrice",
        1100.00::numeric AS "totalPrice"
    FROM picked
    UNION ALL
    SELECT
        'ab2e1c43-835e-4a6e-9d73-128f7ae11b02'::uuid,
        picked.p2_id,
        COALESCE(picked.p2_name, 'Top Product 2'),
        3,
        180.00::numeric,
        540.00::numeric
    FROM picked
    UNION ALL
    SELECT
        'ab2e1c43-835e-4a6e-9d73-128f7ae11b03'::uuid,
        picked.p3_id,
        COALESCE(picked.p3_name, 'Mid Product'),
        2,
        120.00::numeric,
        240.00::numeric
    FROM picked
    UNION ALL
    SELECT
        'ab2e1c43-835e-4a6e-9d73-128f7ae11b04'::uuid,
        picked.p4_id,
        COALESCE(picked.p4_name, 'Low Product 1'),
        1,
        90.00::numeric,
        90.00::numeric
    FROM picked
    UNION ALL
    SELECT
        'ab2e1c43-835e-4a6e-9d73-128f7ae11b05'::uuid,
        picked.p5_id,
        COALESCE(picked.p5_name, 'Low Product 2'),
        1,
        60.00::numeric,
        60.00::numeric
    FROM picked
    UNION ALL
    SELECT
        'ab2e1c43-835e-4a6e-9d73-128f7ae11b06'::uuid,
        picked.p6_id,
        COALESCE(picked.p6_name, 'Least Product'),
        1,
        50.00::numeric,
        50.00::numeric
    FROM picked
) seed ON true
WHERE seed."productId" IS NOT NULL
ON CONFLICT ("id") DO NOTHING;


--
-- PostgreSQL database dump complete
--

\unrestrict t4gTCcxnzHvcvaP2uE5BbCjKhCIN0rXmqqB9wn4kVLessWGLb70U9MrgcD8ed4Y

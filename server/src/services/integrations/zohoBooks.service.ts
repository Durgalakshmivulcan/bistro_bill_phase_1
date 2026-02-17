import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

// ─── Zoho Books API Types ────────────────────────────────────────────

interface ZohoBooksTokens {
  [key: string]: string | number;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: number; // Unix timestamp
  organizationId: string;
}

interface ZohoBooksConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  region?: 'us' | 'eu' | 'in' | 'au' | 'jp';
  tokens?: ZohoBooksTokens;
}

interface ZohoBooksLineItem {
  name: string;
  description: string;
  quantity: number;
  rate: number;
  tax_id?: string;
}

interface ZohoBooksInvoice {
  customer_id: string;
  invoice_number?: string;
  date?: string;
  line_items: ZohoBooksLineItem[];
  tax_total?: number;
  notes?: string;
  gst_treatment?: string;
  gst_no?: string;
  place_of_supply?: string;
}

interface ZohoBooksCustomer {
  contact_name: string;
  contact_type: 'customer';
  gst_treatment?: string;
  phone?: string;
  email?: string;
}

export interface ZohoBooksSyncResult {
  success: boolean;
  message: string;
  invoiceId?: string;
  zohoResponse?: unknown;
}

// ─── Zoho Books API Base URLs ────────────────────────────────────────

const ZOHO_API_BASE: Record<string, string> = {
  us: 'https://www.zohoapis.com/books/v3',
  eu: 'https://www.zohoapis.eu/books/v3',
  in: 'https://www.zohoapis.in/books/v3',
  au: 'https://www.zohoapis.com.au/books/v3',
  jp: 'https://www.zohoapis.jp/books/v3',
};

const ZOHO_AUTH_BASE: Record<string, string> = {
  us: 'https://accounts.zoho.com',
  eu: 'https://accounts.zoho.eu',
  in: 'https://accounts.zoho.in',
  au: 'https://accounts.zoho.com.au',
  jp: 'https://accounts.zoho.jp',
};

// ─── OAuth2 Authentication ──────────────────────────────────────────

/**
 * Generate the Zoho Books OAuth2 authorization URL.
 * The business owner is redirected here to grant access.
 */
export function getAuthorizationUrl(businessOwnerId: string, config: ZohoBooksConfig): string {
  const { clientId, redirectUri, region } = config;
  if (!clientId || !redirectUri) {
    throw new Error('Zoho Books clientId and redirectUri are required');
  }

  const authBase = ZOHO_AUTH_BASE[region || 'in'];
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'ZohoBooks.invoices.CREATE,ZohoBooks.invoices.READ,ZohoBooks.contacts.CREATE,ZohoBooks.contacts.READ,ZohoBooks.settings.READ',
    access_type: 'offline',
    prompt: 'consent',
    state: businessOwnerId,
  });

  return `${authBase}/oauth/v2/auth?${params.toString()}`;
}

/**
 * Exchange an authorization code for OAuth2 tokens.
 * Called after the business owner authorizes access via the Zoho OAuth flow.
 */
export async function exchangeAuthorizationCode(
  businessOwnerId: string,
  authorizationCode: string,
  organizationId: string
): Promise<ZohoBooksTokens> {
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'zoho_books',
      },
    },
  });

  if (!integration) {
    throw new Error('Zoho Books integration not configured');
  }

  const config = integration.config as ZohoBooksConfig;
  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    throw new Error('Zoho Books OAuth credentials are incomplete');
  }

  const region = config.region || 'in';
  const authBase = ZOHO_AUTH_BASE[region];

  const response = await fetch(`${authBase}/oauth/v2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      code: authorizationCode,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zoho Books token exchange failed: ${errorText}`);
  }

  const tokenData = await response.json() as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };

  const tokens: ZohoBooksTokens = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    tokenType: tokenData.token_type,
    expiresIn: tokenData.expires_in,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    organizationId,
  };

  // Store tokens in integration config and activate
  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      config: { ...config, tokens },
      status: 'active',
    },
  });

  return tokens;
}

/**
 * Refresh an expired access token using the refresh token
 */
async function refreshAccessToken(integrationId: string, config: ZohoBooksConfig): Promise<ZohoBooksTokens> {
  const tokens = config.tokens;
  if (!tokens || !tokens.refreshToken) {
    throw new Error('No refresh token available - re-authorization required');
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error('Zoho Books OAuth credentials are incomplete');
  }

  const region = config.region || 'in';
  const authBase = ZOHO_AUTH_BASE[region];

  const response = await fetch(`${authBase}/oauth/v2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: tokens.refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zoho Books token refresh failed: ${errorText}`);
  }

  const tokenData = await response.json() as {
    access_token: string;
    token_type: string;
    expires_in: number;
  };

  // Zoho does not return a new refresh_token on refresh - keep the existing one
  const newTokens: ZohoBooksTokens = {
    accessToken: tokenData.access_token,
    refreshToken: tokens.refreshToken,
    tokenType: tokenData.token_type,
    expiresIn: tokenData.expires_in,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    organizationId: tokens.organizationId,
  };

  // Update stored tokens
  await prisma.integration.update({
    where: { id: integrationId },
    data: {
      config: { ...config, tokens: newTokens },
    },
  });

  return newTokens;
}

/**
 * Get a valid access token, refreshing if expired
 */
async function getValidAccessToken(
  integrationId: string,
  config: ZohoBooksConfig
): Promise<{ accessToken: string; organizationId: string }> {
  const tokens = config.tokens;
  if (!tokens) {
    throw new Error('Zoho Books not authenticated - OAuth authorization required');
  }

  // Refresh if token expires within 5 minutes
  if (Date.now() >= tokens.expiresAt - 5 * 60 * 1000) {
    const newTokens = await refreshAccessToken(integrationId, config);
    return { accessToken: newTokens.accessToken, organizationId: newTokens.organizationId };
  }

  return { accessToken: tokens.accessToken, organizationId: tokens.organizationId };
}

// ─── Zoho Books API Helpers ─────────────────────────────────────────

/**
 * Make an authenticated request to the Zoho Books API
 */
async function zohoApiRequest(
  method: 'GET' | 'POST',
  endpoint: string,
  accessToken: string,
  organizationId: string,
  region: string,
  body?: unknown
): Promise<unknown> {
  const baseUrl = ZOHO_API_BASE[region] || ZOHO_API_BASE['in'];
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${baseUrl}/${endpoint}${separator}organization_id=${organizationId}`;

  const headers: Record<string, string> = {
    'Authorization': `Zoho-oauthtoken ${accessToken}`,
    'Accept': 'application/json',
  };

  const fetchOptions: RequestInit = { method, headers };

  if (body) {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  const responseData = await response.json() as { code?: number; message?: string };

  if (!response.ok || (responseData.code !== undefined && responseData.code !== 0)) {
    const errorMessage = responseData.message || 'Unknown Zoho Books API error';
    throw new Error(`Zoho Books API error (${response.status}): ${errorMessage}`);
  }

  return responseData;
}

// ─── Invoice Sync ────────────────────────────────────────────────────

/**
 * Format a Date as YYYY-MM-DD for Zoho Books
 */
function formatZohoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Map order data to Zoho Books invoice fields
 */
function mapOrderToZohoInvoice(
  order: {
    orderNumber: string;
    createdAt: Date;
    taxAmount: { toString(): string };
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: { toString(): string };
    }>;
  },
  customerId: string
): ZohoBooksInvoice {
  const lineItems: ZohoBooksLineItem[] = order.items.map((item) => ({
    name: item.name,
    description: item.name,
    quantity: item.quantity,
    rate: parseFloat(item.unitPrice.toString()),
  }));

  return {
    customer_id: customerId,
    invoice_number: order.orderNumber,
    date: formatZohoDate(order.createdAt),
    line_items: lineItems,
    tax_total: parseFloat(order.taxAmount.toString()),
  };
}

/**
 * Find or create a customer (contact) in Zoho Books.
 * Searches by contact_name first; creates if not found.
 */
async function findOrCreateZohoCustomer(
  customerName: string,
  accessToken: string,
  organizationId: string,
  region: string
): Promise<string> {
  // Search for existing contact by name
  const searchResult = await zohoApiRequest(
    'GET',
    `contacts?contact_name=${encodeURIComponent(customerName)}`,
    accessToken,
    organizationId,
    region
  ) as { contacts?: Array<{ contact_id: string }> };

  const existingContacts = searchResult?.contacts;
  if (existingContacts && existingContacts.length > 0) {
    return existingContacts[0].contact_id;
  }

  // Create new contact
  const newCustomer: ZohoBooksCustomer = {
    contact_name: customerName,
    contact_type: 'customer',
  };

  const createResult = await zohoApiRequest(
    'POST',
    'contacts',
    accessToken,
    organizationId,
    region,
    newCustomer
  ) as { contact?: { contact_id: string } };

  if (!createResult?.contact?.contact_id) {
    throw new Error('Failed to create customer in Zoho Books');
  }

  return createResult.contact.contact_id;
}

/**
 * Sync an order as an invoice to Zoho Books.
 *
 * Fetches the order with items and customer, authenticates with Zoho Books,
 * finds or creates the customer, creates the invoice with GST tax mapping,
 * updates Integration.lastSyncAt, and logs the attempt in IntegrationLog.
 *
 * @param orderId - The order ID to sync
 * @returns ZohoBooksSyncResult with success/failure info
 */
export async function syncInvoice(orderId: string): Promise<ZohoBooksSyncResult> {
  // Fetch the order with items, customer, and business owner
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      customer: true,
      branch: {
        include: {
          businessOwner: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // Find the Zoho Books integration for this business owner
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId: order.businessOwnerId,
        provider: 'zoho_books',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    throw new Error('Zoho Books integration is not configured or inactive');
  }

  const config = integration.config as ZohoBooksConfig;
  const region = config.region || 'in';

  try {
    // Get valid access token (refreshes if expired)
    const { accessToken, organizationId } = await getValidAccessToken(integration.id, config);

    // Determine customer name
    const customerName = order.customer ? order.customer.name : 'Walk-in Customer';

    // Find or create customer in Zoho Books
    const customerId = await findOrCreateZohoCustomer(
      customerName,
      accessToken,
      organizationId,
      region
    );

    // Map order to Zoho Books invoice format
    const zohoInvoice = mapOrderToZohoInvoice(order, customerId);

    // Create invoice in Zoho Books
    const invoiceResult = await zohoApiRequest(
      'POST',
      'invoices',
      accessToken,
      organizationId,
      region,
      zohoInvoice
    ) as { invoice?: { invoice_id: string } };

    const invoiceId = invoiceResult?.invoice?.invoice_id;

    // Update Integration lastSyncAt
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    // Log successful sync
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        action: 'sync_invoice',
        status: 'success',
        requestPayload: { orderId, orderNumber: order.orderNumber },
        responsePayload: { invoiceId: invoiceId || null },
        errorMessage: null,
      },
    });

    return {
      success: true,
      message: `Invoice ${order.orderNumber} synced to Zoho Books successfully`,
      invoiceId: invoiceId || undefined,
      zohoResponse: invoiceResult,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown Zoho Books error';

    // Update Integration lastSyncAt even on failure
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    // Log failed sync
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        action: 'sync_invoice',
        status: 'failure',
        requestPayload: { orderId, orderNumber: order.orderNumber },
        responsePayload: Prisma.JsonNull,
        errorMessage,
      },
    });

    return {
      success: false,
      message: `Failed to sync invoice to Zoho Books: ${errorMessage}`,
      zohoResponse: undefined,
    };
  }
}

import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

// ─── QuickBooks API Types ────────────────────────────────────────────

interface QuickBooksTokens {
  [key: string]: string | number;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: number; // Unix timestamp
  realmId: string;
}

interface QuickBooksConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  environment?: 'sandbox' | 'production';
  tokens?: QuickBooksTokens;
}

interface QuickBooksLineItem {
  DetailType: 'SalesItemLineDetail';
  Amount: number;
  Description: string;
  SalesItemLineDetail: {
    Qty: number;
    UnitPrice: number;
  };
}

interface QuickBooksInvoice {
  Line: QuickBooksLineItem[];
  CustomerRef: { value: string; name?: string };
  DocNumber?: string;
  TxnDate?: string;
  TxnTaxDetail?: {
    TotalTax: number;
  };
}

interface QuickBooksPayment {
  TotalAmt: number;
  CustomerRef: { value: string };
  Line: Array<{
    Amount: number;
    LinkedTxn: Array<{
      TxnId: string;
      TxnType: 'Invoice';
    }>;
  }>;
}

interface QuickBooksCustomer {
  DisplayName: string;
  PrimaryPhone?: { FreeFormNumber: string };
  PrimaryEmailAddr?: { Address: string };
}

export interface QuickBooksSyncResult {
  success: boolean;
  message: string;
  invoiceId?: string;
  quickBooksResponse?: unknown;
}

// ─── QuickBooks API Base URLs ────────────────────────────────────────

const QB_API_BASE = {
  sandbox: 'https://sandbox-quickbooks.api.intuit.com/v3/company',
  production: 'https://quickbooks.api.intuit.com/v3/company',
};

const QB_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

// ─── OAuth2 Authentication ──────────────────────────────────────────

/**
 * Generate the QuickBooks OAuth2 authorization URL.
 * The business owner is redirected here to grant access.
 */
export function getAuthorizationUrl(businessOwnerId: string, config: QuickBooksConfig): string {
  const { clientId, redirectUri } = config;
  if (!clientId || !redirectUri) {
    throw new Error('QuickBooks clientId and redirectUri are required');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'com.intuit.quickbooks.accounting',
    state: businessOwnerId,
  });

  return `${QB_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for OAuth2 tokens.
 * Called after the business owner authorizes access via the QuickBooks OAuth flow.
 */
export async function exchangeAuthorizationCode(
  businessOwnerId: string,
  authorizationCode: string,
  realmId: string
): Promise<QuickBooksTokens> {
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'quickbooks',
      },
    },
  });

  if (!integration) {
    throw new Error('QuickBooks integration not configured');
  }

  const config = integration.config as QuickBooksConfig;
  if (!config.clientId || !config.clientSecret || !config.redirectUri) {
    throw new Error('QuickBooks OAuth credentials are incomplete');
  }

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const response = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: authorizationCode,
      redirect_uri: config.redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QuickBooks token exchange failed: ${errorText}`);
  }

  const tokenData = await response.json() as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };

  const tokens: QuickBooksTokens = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    tokenType: tokenData.token_type,
    expiresIn: tokenData.expires_in,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    realmId,
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
async function refreshAccessToken(integrationId: string, config: QuickBooksConfig): Promise<QuickBooksTokens> {
  const tokens = config.tokens;
  if (!tokens || !tokens.refreshToken) {
    throw new Error('No refresh token available - re-authorization required');
  }

  if (!config.clientId || !config.clientSecret) {
    throw new Error('QuickBooks OAuth credentials are incomplete');
  }

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const response = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QuickBooks token refresh failed: ${errorText}`);
  }

  const tokenData = await response.json() as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };

  const newTokens: QuickBooksTokens = {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    tokenType: tokenData.token_type,
    expiresIn: tokenData.expires_in,
    expiresAt: Date.now() + tokenData.expires_in * 1000,
    realmId: tokens.realmId,
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
async function getValidAccessToken(integrationId: string, config: QuickBooksConfig): Promise<{ accessToken: string; realmId: string }> {
  const tokens = config.tokens;
  if (!tokens) {
    throw new Error('QuickBooks not authenticated - OAuth authorization required');
  }

  // Refresh if token expires within 5 minutes
  if (Date.now() >= tokens.expiresAt - 5 * 60 * 1000) {
    const newTokens = await refreshAccessToken(integrationId, config);
    return { accessToken: newTokens.accessToken, realmId: newTokens.realmId };
  }

  return { accessToken: tokens.accessToken, realmId: tokens.realmId };
}

// ─── QuickBooks API Helpers ─────────────────────────────────────────

/**
 * Make an authenticated request to the QuickBooks API
 */
async function qbApiRequest(
  method: 'GET' | 'POST',
  endpoint: string,
  accessToken: string,
  realmId: string,
  environment: 'sandbox' | 'production',
  body?: unknown
): Promise<unknown> {
  const baseUrl = QB_API_BASE[environment];
  const url = `${baseUrl}/${realmId}/${endpoint}`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json',
  };

  const fetchOptions: RequestInit = { method, headers };

  if (body) {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);
  const responseData = await response.json();

  if (!response.ok) {
    const fault = (responseData as { Fault?: { Error?: Array<{ Detail?: string }> } })?.Fault;
    const errorDetail = fault?.Error?.[0]?.Detail || 'Unknown QuickBooks API error';
    throw new Error(`QuickBooks API error (${response.status}): ${errorDetail}`);
  }

  return responseData;
}

// ─── Invoice Sync ────────────────────────────────────────────────────

/**
 * Format a Date as YYYY-MM-DD for QuickBooks
 */
function formatQBDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Map order data to QuickBooks invoice fields
 */
function mapOrderToQBInvoice(
  order: {
    orderNumber: string;
    createdAt: Date;
    subtotal: { toString(): string };
    taxAmount: { toString(): string };
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: { toString(): string };
      totalPrice: { toString(): string };
    }>;
  },
  customerRefId: string,
  customerName?: string
): QuickBooksInvoice {
  const lineItems: QuickBooksLineItem[] = order.items.map((item) => ({
    DetailType: 'SalesItemLineDetail' as const,
    Amount: parseFloat(item.totalPrice.toString()),
    Description: item.name,
    SalesItemLineDetail: {
      Qty: item.quantity,
      UnitPrice: parseFloat(item.unitPrice.toString()),
    },
  }));

  return {
    Line: lineItems,
    CustomerRef: { value: customerRefId, name: customerName },
    DocNumber: order.orderNumber,
    TxnDate: formatQBDate(order.createdAt),
    TxnTaxDetail: {
      TotalTax: parseFloat(order.taxAmount.toString()),
    },
  };
}

/**
 * Find or create a customer in QuickBooks
 */
async function findOrCreateQBCustomer(
  customerName: string,
  accessToken: string,
  realmId: string,
  environment: 'sandbox' | 'production'
): Promise<string> {
  // Query for existing customer by name
  const query = `SELECT * FROM Customer WHERE DisplayName = '${customerName.replace(/'/g, "\\'")}'`;
  const queryResult = await qbApiRequest(
    'GET',
    `query?query=${encodeURIComponent(query)}`,
    accessToken,
    realmId,
    environment
  ) as { QueryResponse?: { Customer?: Array<{ Id: string }> } };

  const existingCustomers = queryResult?.QueryResponse?.Customer;
  if (existingCustomers && existingCustomers.length > 0) {
    return existingCustomers[0].Id;
  }

  // Create new customer
  const newCustomer: QuickBooksCustomer = {
    DisplayName: customerName,
  };

  const createResult = await qbApiRequest(
    'POST',
    'customer',
    accessToken,
    realmId,
    environment,
    newCustomer
  ) as { Customer?: { Id: string } };

  if (!createResult?.Customer?.Id) {
    throw new Error('Failed to create customer in QuickBooks');
  }

  return createResult.Customer.Id;
}

/**
 * Sync an order as an invoice to QuickBooks Online.
 *
 * Fetches the order with items and customer, authenticates with QuickBooks,
 * finds or creates the customer, creates the invoice, updates Integration.lastSyncAt,
 * and logs the attempt in IntegrationLog.
 *
 * @param orderId - The order ID to sync
 * @returns QuickBooksSyncResult with success/failure info
 */
export async function syncInvoice(orderId: string): Promise<QuickBooksSyncResult> {
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

  // Find the QuickBooks integration for this business owner
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId: order.businessOwnerId,
        provider: 'quickbooks',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    throw new Error('QuickBooks integration is not configured or inactive');
  }

  const config = integration.config as QuickBooksConfig;
  const environment = config.environment || 'sandbox';

  try {
    // Get valid access token (refreshes if expired)
    const { accessToken, realmId } = await getValidAccessToken(integration.id, config);

    // Determine customer name
    const customerName = order.customer ? order.customer.name : 'Walk-in Customer';

    // Find or create customer in QuickBooks
    const customerRefId = await findOrCreateQBCustomer(
      customerName,
      accessToken,
      realmId,
      environment
    );

    // Map order to QuickBooks invoice format
    const qbInvoice = mapOrderToQBInvoice(order, customerRefId, customerName);

    // Create invoice in QuickBooks
    const invoiceResult = await qbApiRequest(
      'POST',
      'invoice',
      accessToken,
      realmId,
      environment,
      qbInvoice
    ) as { Invoice?: { Id: string } };

    const invoiceId = invoiceResult?.Invoice?.Id;

    // If payment was made, record it against the invoice
    if (invoiceId && parseFloat(order.paidAmount.toString()) > 0) {
      const payment: QuickBooksPayment = {
        TotalAmt: parseFloat(order.paidAmount.toString()),
        CustomerRef: { value: customerRefId },
        Line: [
          {
            Amount: parseFloat(order.paidAmount.toString()),
            LinkedTxn: [{ TxnId: invoiceId, TxnType: 'Invoice' }],
          },
        ],
      };

      await qbApiRequest('POST', 'payment', accessToken, realmId, environment, payment);
    }

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
      message: `Invoice ${order.orderNumber} synced to QuickBooks successfully`,
      invoiceId: invoiceId || undefined,
      quickBooksResponse: invoiceResult,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown QuickBooks error';

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
      message: `Failed to sync invoice to QuickBooks: ${errorMessage}`,
      quickBooksResponse: undefined,
    };
  }
}

// ─── Webhook Handler ─────────────────────────────────────────────────

/**
 * Payload structure for QuickBooks webhook notifications
 */
interface QuickBooksWebhookPayload {
  eventNotifications?: Array<{
    realmId: string;
    dataChangeEvent?: {
      entities: Array<{
        name: string;
        id: string;
        operation: 'Create' | 'Update' | 'Delete' | 'Merge' | 'Void';
        lastUpdated: string;
      }>;
    };
  }>;
}

/**
 * Handle incoming QuickBooks webhook notifications.
 *
 * QuickBooks sends webhook events when entities are created, updated, or deleted.
 * This handler logs the events and can trigger reconciliation logic.
 *
 * @param payload - The webhook payload from QuickBooks
 * @param webhookVerifierToken - The verifier token for HMAC signature validation
 * @param signature - The HMAC-SHA256 signature from the request header
 * @returns Processing result
 */
export async function handleWebhook(
  payload: QuickBooksWebhookPayload,
  webhookVerifierToken: string,
  signature: string
): Promise<{ processed: boolean; message: string }> {
  // Verify webhook signature using HMAC-SHA256
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(webhookVerifierToken),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const payloadString = JSON.stringify(payload);
  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadString)
  );

  const computedSignature = Buffer.from(signatureBytes).toString('base64');

  if (computedSignature !== signature) {
    return { processed: false, message: 'Invalid webhook signature' };
  }

  // Process each event notification
  const notifications = payload.eventNotifications || [];
  for (const notification of notifications) {
    const realmId = notification.realmId;
    const entities = notification.dataChangeEvent?.entities || [];

    // Find integration by realmId
    const integrations = await prisma.integration.findMany({
      where: { provider: 'quickbooks', status: 'active' },
    });

    const integration = integrations.find((i) => {
      const cfg = i.config as QuickBooksConfig;
      return cfg.tokens?.realmId === realmId;
    });

    if (!integration) {
      continue;
    }

    // Log each entity change
    for (const entity of entities) {
      await prisma.integrationLog.create({
        data: {
          integrationId: integration.id,
          action: `webhook_${entity.operation.toLowerCase()}`,
          status: 'success',
          requestPayload: {
            entityName: entity.name,
            entityId: entity.id,
            operation: entity.operation,
            lastUpdated: entity.lastUpdated,
          },
          responsePayload: Prisma.JsonNull,
          errorMessage: null,
        },
      });
    }
  }

  return {
    processed: true,
    message: `Processed ${notifications.length} webhook notification(s)`,
  };
}

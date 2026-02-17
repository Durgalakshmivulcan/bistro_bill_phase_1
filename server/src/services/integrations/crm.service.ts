import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

/**
 * CRM Integration Service (Salesforce / HubSpot)
 *
 * Syncs customer contacts and deals/opportunities to an external CRM.
 * Supports OAuth2 authentication for both providers.
 * Config stored in Integration model determines which CRM provider to use.
 */

interface CRMConfig {
  provider: 'salesforce' | 'hubspot';
  // OAuth2 credentials
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  refreshToken?: string;
  // Salesforce-specific
  instanceUrl?: string; // e.g., https://yourorg.salesforce.com
  // HubSpot-specific
  portalId?: string;
  // Settings
  syncLifetimeValue?: boolean; // sync CLV to CRM
  largeDealThreshold?: number; // order total above which to create a deal (default: 5000)
}

export interface CRMSyncResult {
  success: boolean;
  message: string;
  contactId?: string;
  dealId?: string;
}

export interface CRMWebhookPayload {
  provider: 'salesforce' | 'hubspot';
  eventType: string; // contact_updated, deal_closed, etc.
  objectId: string;
  properties: Record<string, unknown>;
}

/**
 * Find the CRM integration for a business owner.
 */
async function findIntegration(businessOwnerId: string) {
  // Try HubSpot first, then Salesforce
  let integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'hubspot',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    integration = await prisma.integration.findUnique({
      where: {
        businessOwnerId_provider: {
          businessOwnerId,
          provider: 'salesforce',
        },
      },
    });
  }

  if (!integration || integration.status !== 'active') {
    return null;
  }

  return integration;
}

/**
 * Log an action to IntegrationLog.
 */
async function logAction(
  integrationId: string,
  action: string,
  status: string,
  requestPayload: Record<string, unknown> | null,
  responsePayload: Record<string, unknown> | null,
  errorMessage: string | null
): Promise<void> {
  try {
    await prisma.integrationLog.create({
      data: {
        integrationId,
        action,
        status,
        requestPayload: requestPayload
          ? JSON.parse(JSON.stringify(requestPayload))
          : Prisma.JsonNull,
        responsePayload: responsePayload
          ? JSON.parse(JSON.stringify(responsePayload))
          : Prisma.JsonNull,
        errorMessage,
      },
    });
  } catch {
    // Never let logging failure affect main flow
    console.error('[CRM] Failed to write IntegrationLog');
  }
}

/**
 * Refresh OAuth2 access token.
 */
async function refreshAccessToken(
  config: CRMConfig,
  integrationId: string
): Promise<string | null> {
  if (!config.clientId || !config.clientSecret || !config.refreshToken) {
    return null;
  }

  try {
    let tokenUrl: string;
    let body: URLSearchParams;

    if (config.provider === 'salesforce') {
      tokenUrl = 'https://login.salesforce.com/services/oauth2/token';
      body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
      });
    } else {
      // HubSpot
      tokenUrl = 'https://api.hubapi.com/oauth/v1/token';
      body = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
      });
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      await logAction(integrationId, 'refresh_token', 'failure', null, null, `Token refresh failed: ${errorText}`);
      return null;
    }

    const data = (await response.json()) as { access_token: string; instance_url?: string };

    // Update the stored access token (and instance URL for Salesforce)
    const existingIntegration = await prisma.integration.findUnique({ where: { id: integrationId } });
    if (existingIntegration) {
      const updatedConfig: CRMConfig = {
        ...(existingIntegration.config as unknown as CRMConfig),
        accessToken: data.access_token,
      };
      if (data.instance_url) {
        updatedConfig.instanceUrl = data.instance_url;
      }
      await prisma.integration.update({
        where: { id: integrationId },
        data: { config: JSON.parse(JSON.stringify(updatedConfig)) },
      });
    }

    return data.access_token;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await logAction(integrationId, 'refresh_token', 'failure', null, null, msg);
    return null;
  }
}

/**
 * Get a valid access token, refreshing if needed.
 */
async function getValidAccessToken(
  config: CRMConfig,
  integrationId: string
): Promise<string | null> {
  if (config.accessToken) {
    return config.accessToken;
  }
  return refreshAccessToken(config, integrationId);
}

// ===== Salesforce Contact Sync =====

async function syncContactSalesforce(
  config: CRMConfig,
  accessToken: string,
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    totalSpent: unknown;
    type: string;
    tags: string[];
  }
): Promise<CRMSyncResult> {
  const baseUrl = config.instanceUrl || 'https://login.salesforce.com';

  // Search for existing contact by phone
  const searchUrl = `${baseUrl}/services/data/v58.0/query?q=${encodeURIComponent(
    `SELECT Id FROM Contact WHERE Phone = '${customer.phone}' LIMIT 1`
  )}`;

  const searchResponse = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const contactData: Record<string, unknown> = {
    LastName: customer.name,
    Phone: customer.phone,
    Email: customer.email || undefined,
    Description: `Customer Type: ${customer.type}. Tags: ${customer.tags.join(', ')}`,
  };

  if (config.syncLifetimeValue) {
    contactData['Customer_Lifetime_Value__c'] = Number(customer.totalSpent);
  }

  if (searchResponse.ok) {
    const searchResult = (await searchResponse.json()) as { records: Array<{ Id: string }> };

    if (searchResult.records.length > 0) {
      // Update existing contact
      const contactId = searchResult.records[0].Id;
      const updateResponse = await fetch(
        `${baseUrl}/services/data/v58.0/sobjects/Contact/${contactId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contactData),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        return { success: false, message: `Salesforce update error: ${errorText}` };
      }

      return { success: true, message: 'Contact updated in Salesforce', contactId };
    }
  }

  // Create new contact
  const createResponse = await fetch(
    `${baseUrl}/services/data/v58.0/sobjects/Contact`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    }
  );

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    return { success: false, message: `Salesforce create error: ${errorText}` };
  }

  const createResult = (await createResponse.json()) as { id: string };
  return { success: true, message: 'Contact created in Salesforce', contactId: createResult.id };
}

// ===== HubSpot Contact Sync =====

async function syncContactHubSpot(
  accessToken: string,
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    totalSpent: unknown;
    type: string;
    tags: string[];
  }
): Promise<CRMSyncResult> {
  const baseUrl = 'https://api.hubapi.com';

  // Search for existing contact by phone
  const searchResponse = await fetch(`${baseUrl}/crm/v3/objects/contacts/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            { propertyName: 'phone', operator: 'EQ', value: customer.phone },
          ],
        },
      ],
      limit: 1,
    }),
  });

  const properties: Record<string, string> = {
    firstname: customer.name.split(' ')[0] || customer.name,
    lastname: customer.name.split(' ').slice(1).join(' ') || '-',
    phone: customer.phone,
    customer_type: customer.type,
    customer_tags: customer.tags.join(', '),
    lifetime_value: String(Number(customer.totalSpent)),
  };

  if (customer.email) {
    properties.email = customer.email;
  }

  if (searchResponse.ok) {
    const searchResult = (await searchResponse.json()) as { results: Array<{ id: string }> };

    if (searchResult.results.length > 0) {
      // Update existing contact
      const contactId = searchResult.results[0].id;
      const updateResponse = await fetch(
        `${baseUrl}/crm/v3/objects/contacts/${contactId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ properties }),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        return { success: false, message: `HubSpot update error: ${errorText}` };
      }

      return { success: true, message: 'Contact updated in HubSpot', contactId };
    }
  }

  // Create new contact
  const createResponse = await fetch(`${baseUrl}/crm/v3/objects/contacts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    return { success: false, message: `HubSpot create error: ${errorText}` };
  }

  const createResult = (await createResponse.json()) as { id: string };
  return { success: true, message: 'Contact created in HubSpot', contactId: createResult.id };
}

// ===== Salesforce Deal Sync =====

async function syncDealSalesforce(
  config: CRMConfig,
  accessToken: string,
  order: {
    id: string;
    orderNumber: string;
    total: unknown;
    customerId: string | null;
    customerName: string;
    items: Array<{ name: string; quantity: number; totalPrice: unknown }>;
  }
): Promise<CRMSyncResult> {
  const baseUrl = config.instanceUrl || 'https://login.salesforce.com';

  const opportunityData = {
    Name: `Order ${order.orderNumber} - ${order.customerName}`,
    Amount: Number(order.total),
    StageName: 'Closed Won',
    CloseDate: new Date().toISOString().split('T')[0],
    Description: `Order ${order.orderNumber}\nItems: ${order.items
      .map((i) => `${i.name} x${i.quantity}`)
      .join(', ')}`,
  };

  const response = await fetch(
    `${baseUrl}/services/data/v58.0/sobjects/Opportunity`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(opportunityData),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, message: `Salesforce deal creation error: ${errorText}` };
  }

  const result = (await response.json()) as { id: string };
  return { success: true, message: 'Opportunity created in Salesforce', dealId: result.id };
}

// ===== HubSpot Deal Sync =====

async function syncDealHubSpot(
  accessToken: string,
  order: {
    id: string;
    orderNumber: string;
    total: unknown;
    customerId: string | null;
    customerName: string;
    items: Array<{ name: string; quantity: number; totalPrice: unknown }>;
  }
): Promise<CRMSyncResult> {
  const baseUrl = 'https://api.hubapi.com';

  const dealData = {
    properties: {
      dealname: `Order ${order.orderNumber} - ${order.customerName}`,
      amount: String(Number(order.total)),
      dealstage: 'closedwon',
      closedate: new Date().toISOString(),
      description: `Order ${order.orderNumber}\nItems: ${order.items
        .map((i) => `${i.name} x${i.quantity}`)
        .join(', ')}`,
      pipeline: 'default',
    },
  };

  const response = await fetch(`${baseUrl}/crm/v3/objects/deals`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dealData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, message: `HubSpot deal creation error: ${errorText}` };
  }

  const result = (await response.json()) as { id: string };
  return { success: true, message: 'Deal created in HubSpot', dealId: result.id };
}

// ===== Public API =====

/**
 * Sync a customer contact to the configured CRM (Salesforce or HubSpot).
 * Creates or updates the contact with customer data, tags, and lifetime value.
 */
export async function syncContact(
  customerId: string,
  businessOwnerId: string
): Promise<CRMSyncResult> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      customerTags: {
        include: { tag: true },
      },
    },
  });

  if (!customer) {
    return { success: false, message: `Customer not found: ${customerId}` };
  }

  const integration = await findIntegration(businessOwnerId);
  if (!integration) {
    return { success: false, message: 'CRM integration is not configured or inactive' };
  }

  const config = integration.config as unknown as CRMConfig;
  const accessToken = await getValidAccessToken(config, integration.id);
  if (!accessToken) {
    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'error' },
    });
    return { success: false, message: 'Failed to obtain CRM access token' };
  }

  const tags = customer.customerTags.map((ct) => ct.tag.name);

  let result: CRMSyncResult;

  try {
    if (config.provider === 'salesforce') {
      result = await syncContactSalesforce(config, accessToken, {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        totalSpent: customer.totalSpent,
        type: customer.type,
        tags,
      });
    } else if (config.provider === 'hubspot') {
      result = await syncContactHubSpot(accessToken, {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        totalSpent: customer.totalSpent,
        type: customer.type,
        tags,
      });
    } else {
      result = { success: false, message: `Unsupported CRM provider: ${config.provider}` };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error syncing contact';
    result = { success: false, message: msg };
  }

  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  await logAction(
    integration.id,
    'sync_contact',
    result.success ? 'success' : 'failure',
    { customerId, name: customer.name, phone: customer.phone },
    result.contactId ? { contactId: result.contactId } : null,
    result.success ? null : result.message
  );

  return result;
}

/**
 * Sync an order as a deal/opportunity in the CRM.
 * Only creates deals for orders above the configured threshold.
 */
export async function syncDeal(
  orderId: string,
  businessOwnerId: string
): Promise<CRMSyncResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      customer: true,
    },
  });

  if (!order) {
    return { success: false, message: `Order not found: ${orderId}` };
  }

  const integration = await findIntegration(businessOwnerId);
  if (!integration) {
    return { success: false, message: 'CRM integration is not configured or inactive' };
  }

  const config = integration.config as unknown as CRMConfig;
  const threshold = config.largeDealThreshold || 5000;
  const orderTotal = Number(order.total);

  if (orderTotal < threshold) {
    return {
      success: true,
      message: `Order total (${orderTotal}) below deal threshold (${threshold}), skipping`,
    };
  }

  const accessToken = await getValidAccessToken(config, integration.id);
  if (!accessToken) {
    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'error' },
    });
    return { success: false, message: 'Failed to obtain CRM access token' };
  }

  const customerName = order.customer?.name || 'Walk-in Customer';
  const orderData = {
    id: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
    customerId: order.customerId,
    customerName,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      totalPrice: item.totalPrice,
    })),
  };

  let result: CRMSyncResult;

  try {
    if (config.provider === 'salesforce') {
      result = await syncDealSalesforce(config, accessToken, orderData);
    } else if (config.provider === 'hubspot') {
      result = await syncDealHubSpot(accessToken, orderData);
    } else {
      result = { success: false, message: `Unsupported CRM provider: ${config.provider}` };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error syncing deal';
    result = { success: false, message: msg };
  }

  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  await logAction(
    integration.id,
    'sync_deal',
    result.success ? 'success' : 'failure',
    { orderId, orderNumber: order.orderNumber, total: orderTotal },
    result.dealId ? { dealId: result.dealId } : null,
    result.success ? null : result.message
  );

  return result;
}

/**
 * Sync customer lifetime value and order history summary to CRM.
 */
export async function syncCustomerLifetimeValue(
  customerId: string,
  businessOwnerId: string
): Promise<CRMSyncResult> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      orders: {
        select: { id: true, total: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      customerTags: {
        include: { tag: true },
      },
    },
  });

  if (!customer) {
    return { success: false, message: `Customer not found: ${customerId}` };
  }

  // Sync contact first (updates lifetime value and tags)
  return syncContact(customerId, businessOwnerId);
}

/**
 * Handle incoming webhook from CRM (Salesforce or HubSpot).
 * Processes contact updates and deal closures.
 */
export async function handleWebhook(
  payload: CRMWebhookPayload,
  businessOwnerId: string
): Promise<CRMSyncResult> {
  const integration = await findIntegration(businessOwnerId);
  if (!integration) {
    return { success: false, message: 'CRM integration not found' };
  }

  const config = integration.config as unknown as CRMConfig;

  try {
    switch (payload.eventType) {
      case 'contact_updated': {
        // Update local customer data if CRM contact was modified
        const phone = payload.properties.phone as string | undefined;
        if (phone) {
          const customer = await prisma.customer.findFirst({
            where: { businessOwnerId, phone },
          });
          if (customer) {
            const updateData: Record<string, unknown> = {};
            if (payload.properties.email) {
              updateData.email = payload.properties.email as string;
            }
            if (payload.properties.name || payload.properties.firstname) {
              const name =
                (payload.properties.name as string) ||
                `${payload.properties.firstname || ''} ${payload.properties.lastname || ''}`.trim();
              if (name) {
                updateData.name = name;
              }
            }
            if (Object.keys(updateData).length > 0) {
              await prisma.customer.update({
                where: { id: customer.id },
                data: updateData,
              });
            }
          }
        }

        await logAction(
          integration.id,
          'webhook_contact_updated',
          'success',
          { provider: config.provider, objectId: payload.objectId },
          payload.properties as Record<string, unknown>,
          null
        );

        return { success: true, message: 'Contact update processed' };
      }

      case 'deal_closed': {
        // Log deal closure from CRM side
        await logAction(
          integration.id,
          'webhook_deal_closed',
          'success',
          { provider: config.provider, objectId: payload.objectId },
          payload.properties as Record<string, unknown>,
          null
        );

        return { success: true, message: 'Deal closure logged' };
      }

      default: {
        await logAction(
          integration.id,
          `webhook_${payload.eventType}`,
          'skipped',
          { provider: config.provider, objectId: payload.objectId, eventType: payload.eventType },
          null,
          `Unhandled webhook event type: ${payload.eventType}`
        );

        return { success: true, message: `Webhook event ${payload.eventType} logged (no action taken)` };
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown webhook error';

    await logAction(
      integration.id,
      `webhook_${payload.eventType}`,
      'failure',
      { provider: config.provider, objectId: payload.objectId },
      null,
      msg
    );

    return { success: false, message: msg };
  }
}

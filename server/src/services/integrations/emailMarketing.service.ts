import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

/**
 * Email Marketing Integration Service
 *
 * Supports syncing customers and sending campaigns via SendGrid or Mailchimp.
 * Config stored in Integration model determines which provider to use.
 */

interface EmailMarketingConfig {
  provider: 'sendgrid' | 'mailchimp';
  // SendGrid config
  sendgridApiKey?: string;
  sendgridFromEmail?: string;
  sendgridFromName?: string;
  // Mailchimp config
  mailchimpApiKey?: string;
  mailchimpServerPrefix?: string; // e.g., "us21"
  mailchimpListId?: string; // audience/list ID
}

export interface EmailMarketingResult {
  success: boolean;
  message: string;
  contactId?: string;
  campaignId?: string;
}

interface CustomerSegmentFilter {
  type?: string; // VIP, Regular, etc.
  tags?: string[]; // tag names
  minSpent?: number;
  groupId?: string;
}

/**
 * Sync a customer to the email marketing platform (add or update).
 */
export async function syncCustomer(
  customerId: string,
  businessOwnerId: string
): Promise<EmailMarketingResult> {
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

  if (!customer.email) {
    return { success: false, message: 'Customer has no email address' };
  }

  const integration = await findIntegration(businessOwnerId);
  if (!integration) {
    return { success: false, message: 'Email marketing integration is not configured or inactive' };
  }

  const config = integration.config as unknown as EmailMarketingConfig;

  // Extract customer tags for segmentation
  const tags = customer.customerTags.map((ct) => ct.tag.name);

  let result: EmailMarketingResult;

  try {
    if (config.provider === 'sendgrid') {
      result = await syncCustomerSendGrid(config, customer.email, customer.name, tags);
    } else if (config.provider === 'mailchimp') {
      result = await syncCustomerMailchimp(config, customer.email, customer.name, tags);
    } else {
      result = { success: false, message: `Unsupported email provider: ${config.provider}` };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error syncing customer';
    result = { success: false, message: msg };
  }

  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  await logAction(
    integration.id,
    'sync_customer',
    result.success ? 'success' : 'failure',
    { customerId, email: customer.email, tags },
    result.contactId ? { contactId: result.contactId } : null,
    result.success ? null : result.message
  );

  return result;
}

/**
 * Create and send an email campaign to a segment of customers.
 */
export async function createCampaign(
  businessOwnerId: string,
  subject: string,
  content: string,
  segmentFilter?: CustomerSegmentFilter
): Promise<EmailMarketingResult> {
  const integration = await findIntegration(businessOwnerId);
  if (!integration) {
    return { success: false, message: 'Email marketing integration is not configured or inactive' };
  }

  const config = integration.config as unknown as EmailMarketingConfig;

  // Build customer query based on segment filter
  const whereClause: Record<string, unknown> = {
    businessOwnerId,
    email: { not: null },
  };

  if (segmentFilter?.type) {
    whereClause.type = segmentFilter.type;
  }
  if (segmentFilter?.groupId) {
    whereClause.customerGroupId = segmentFilter.groupId;
  }
  if (segmentFilter?.minSpent !== undefined) {
    whereClause.totalSpent = { gte: segmentFilter.minSpent };
  }
  if (segmentFilter?.tags && segmentFilter.tags.length > 0) {
    whereClause.customerTags = {
      some: {
        tag: {
          name: { in: segmentFilter.tags },
        },
      },
    };
  }

  const customers = await prisma.customer.findMany({
    where: whereClause,
    select: { email: true, name: true },
  });

  if (customers.length === 0) {
    return { success: false, message: 'No customers match the segment filter' };
  }

  const recipients = customers
    .filter((c) => c.email)
    .map((c) => ({ email: c.email!, name: c.name }));

  if (recipients.length === 0) {
    return { success: false, message: 'No customers with email addresses in this segment' };
  }

  let result: EmailMarketingResult;

  try {
    if (config.provider === 'sendgrid') {
      result = await createCampaignSendGrid(config, subject, content, recipients);
    } else if (config.provider === 'mailchimp') {
      result = await createCampaignMailchimp(config, subject, content, recipients);
    } else {
      result = { success: false, message: `Unsupported email provider: ${config.provider}` };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error creating campaign';
    result = { success: false, message: msg };
  }

  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  await logAction(
    integration.id,
    'create_campaign',
    result.success ? 'success' : 'failure',
    { subject, recipientCount: recipients.length, segmentFilter },
    result.campaignId ? { campaignId: result.campaignId } : null,
    result.success ? null : result.message
  );

  return result;
}

/**
 * Handle unsubscribe webhook from email provider.
 * Removes the customer tag or marks them as unsubscribed.
 */
export async function handleUnsubscribeWebhook(
  payload: {
    email: string;
    reason?: string;
    timestamp?: string;
  },
  businessOwnerId: string
): Promise<void> {
  const integration = await findIntegration(businessOwnerId);

  // Find customer by email
  const customer = await prisma.customer.findFirst({
    where: {
      businessOwnerId,
      email: payload.email,
    },
  });

  if (!customer) {
    if (integration) {
      await logAction(
        integration.id,
        'unsubscribe_webhook',
        'skipped',
        payload,
        null,
        `Customer not found for email: ${payload.email}`
      );
    }
    return;
  }

  // Find or create "email_unsubscribed" tag
  let tag = await prisma.tag.findFirst({
    where: {
      businessOwnerId,
      name: 'email_unsubscribed',
    },
  });

  if (!tag) {
    tag = await prisma.tag.create({
      data: {
        businessOwnerId,
        name: 'email_unsubscribed',
      },
    });
  }

  // Add the unsubscribed tag to the customer (if not already present)
  await prisma.customerTag.upsert({
    where: {
      customerId_tagId: {
        customerId: customer.id,
        tagId: tag.id,
      },
    },
    create: {
      customerId: customer.id,
      tagId: tag.id,
    },
    update: {},
  });

  if (integration) {
    await logAction(
      integration.id,
      'unsubscribe_webhook',
      'success',
      payload,
      { customerId: customer.id, tagId: tag.id },
      null
    );
  }
}

// ============================================
// Private Helper Functions
// ============================================

/**
 * Find the email marketing integration for a business owner.
 */
async function findIntegration(businessOwnerId: string) {
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'email_marketing',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    return null;
  }

  return integration;
}

/**
 * Sync customer to SendGrid Contacts API.
 */
async function syncCustomerSendGrid(
  config: EmailMarketingConfig,
  email: string,
  name: string,
  tags: string[]
): Promise<EmailMarketingResult> {
  const apiKey = config.sendgridApiKey || '';

  if (!apiKey) {
    return { success: false, message: 'SendGrid API key not configured' };
  }

  const nameParts = name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const response = await fetch('https://api.sendgrid.com/v3/marketing/contacts', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contacts: [
        {
          email,
          first_name: firstName,
          last_name: lastName,
          custom_fields: {
            tags: tags.join(', '),
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, message: `SendGrid API error (${response.status}): ${errorText}` };
  }

  const data = (await response.json()) as { job_id: string };

  return {
    success: true,
    message: 'Customer synced to SendGrid',
    contactId: data.job_id,
  };
}

/**
 * Sync customer to Mailchimp list.
 */
async function syncCustomerMailchimp(
  config: EmailMarketingConfig,
  email: string,
  name: string,
  tags: string[]
): Promise<EmailMarketingResult> {
  const apiKey = config.mailchimpApiKey || '';
  const serverPrefix = config.mailchimpServerPrefix || '';
  const listId = config.mailchimpListId || '';

  if (!apiKey || !serverPrefix || !listId) {
    return { success: false, message: 'Mailchimp credentials not configured' };
  }

  const nameParts = name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Mailchimp uses MD5 hash of lowercase email as subscriber ID
  const crypto = await import('crypto');
  const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

  const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;

  const response = await fetch(url, {
    method: 'PUT', // PUT creates or updates
    headers: {
      'Authorization': `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: email,
      status_if_new: 'subscribed',
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName,
      },
      tags: tags.map((t) => ({ name: t, status: 'active' })),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, message: `Mailchimp API error (${response.status}): ${errorText}` };
  }

  const data = (await response.json()) as { id: string };

  return {
    success: true,
    message: 'Customer synced to Mailchimp',
    contactId: data.id,
  };
}

/**
 * Create and send a campaign via SendGrid Single Sends API.
 */
async function createCampaignSendGrid(
  config: EmailMarketingConfig,
  subject: string,
  content: string,
  recipients: Array<{ email: string; name: string }>
): Promise<EmailMarketingResult> {
  const apiKey = config.sendgridApiKey || '';
  const fromEmail = config.sendgridFromEmail || '';
  const fromName = config.sendgridFromName || '';

  if (!apiKey || !fromEmail) {
    return { success: false, message: 'SendGrid campaign credentials not configured' };
  }

  // Send individual emails via SendGrid Mail Send API (v3/mail/send)
  const personalizations = recipients.map((r) => ({
    to: [{ email: r.email, name: r.name }],
  }));

  // SendGrid allows max 1000 personalizations per request
  const batchSize = 1000;
  let sentCount = 0;

  for (let i = 0; i < personalizations.length; i += batchSize) {
    const batch = personalizations.slice(i, i + batchSize);

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: batch,
        from: { email: fromEmail, name: fromName },
        subject,
        content: [
          { type: 'text/html', value: content },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `SendGrid send error (${response.status}): ${errorText}. Sent ${sentCount}/${recipients.length} emails.`,
      };
    }

    sentCount += batch.length;
  }

  return {
    success: true,
    message: `Campaign sent to ${sentCount} recipients via SendGrid`,
    campaignId: `sg_${Date.now()}`,
  };
}

/**
 * Create and send a campaign via Mailchimp.
 */
async function createCampaignMailchimp(
  config: EmailMarketingConfig,
  subject: string,
  content: string,
  _recipients: Array<{ email: string; name: string }>
): Promise<EmailMarketingResult> {
  const apiKey = config.mailchimpApiKey || '';
  const serverPrefix = config.mailchimpServerPrefix || '';
  const listId = config.mailchimpListId || '';

  if (!apiKey || !serverPrefix || !listId) {
    return { success: false, message: 'Mailchimp campaign credentials not configured' };
  }

  const baseUrl = `https://${serverPrefix}.api.mailchimp.com/3.0`;
  const authHeader = `Basic ${Buffer.from(`anystring:${apiKey}`).toString('base64')}`;

  // Step 1: Create campaign
  const createResponse = await fetch(`${baseUrl}/campaigns`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'regular',
      recipients: { list_id: listId },
      settings: {
        subject_line: subject,
        from_name: 'Bistro Bill',
        reply_to: 'noreply@bistrobill.com',
      },
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    return { success: false, message: `Mailchimp campaign creation error (${createResponse.status}): ${errorText}` };
  }

  const campaignData = (await createResponse.json()) as { id: string };
  const campaignId = campaignData.id;

  // Step 2: Set campaign content
  const contentResponse = await fetch(`${baseUrl}/campaigns/${campaignId}/content`, {
    method: 'PUT',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      html: content,
    }),
  });

  if (!contentResponse.ok) {
    const errorText = await contentResponse.text();
    return { success: false, message: `Mailchimp content update error (${contentResponse.status}): ${errorText}` };
  }

  // Step 3: Send campaign
  const sendResponse = await fetch(`${baseUrl}/campaigns/${campaignId}/actions/send`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
  });

  if (!sendResponse.ok) {
    const errorText = await sendResponse.text();
    return { success: false, message: `Mailchimp send error (${sendResponse.status}): ${errorText}` };
  }

  return {
    success: true,
    message: `Campaign sent via Mailchimp`,
    campaignId,
  };
}

/**
 * Log an email marketing action to IntegrationLog.
 */
async function logAction(
  integrationId: string,
  action: string,
  status: string,
  requestData: unknown,
  responseData: unknown,
  errorMessage: string | null
): Promise<void> {
  await prisma.integrationLog.create({
    data: {
      integrationId,
      action,
      status,
      requestPayload: JSON.parse(JSON.stringify(requestData)),
      responsePayload: responseData
        ? JSON.parse(JSON.stringify(responseData))
        : Prisma.JsonNull,
      errorMessage,
    },
  });
}

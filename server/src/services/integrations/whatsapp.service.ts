import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

/**
 * WhatsApp Business API types
 *
 * Supports sending messages via Twilio WhatsApp or Meta Cloud API.
 * Config stored in Integration model determines which provider to use.
 */

interface WhatsAppConfig {
  provider: 'twilio' | 'meta';
  // Twilio config
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string; // e.g., "whatsapp:+14155238886"
  // Meta Cloud API config
  metaAccessToken?: string;
  metaPhoneNumberId?: string;
  metaBusinessAccountId?: string;
  // Common
  baseUrl?: string;
  templateNamespace?: string;
}

interface WhatsAppMessageRequest {
  to: string;
  template?: {
    name: string;
    language: string;
    components: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text?: string;
      }>;
    }>;
  };
  text?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  message: string;
  messageId?: string;
}

/**
 * Normalize phone number to E.164 format for WhatsApp.
 * Adds country code +91 (India) if not already present.
 */
function normalizePhoneNumber(phone: string): string {
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');

  // If starts with 0, remove leading 0
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If doesn't start with +, add India country code
  if (!cleaned.startsWith('+')) {
    cleaned = `+91${cleaned}`;
  }

  return cleaned;
}

/**
 * Check if a customer has opted out of WhatsApp notifications.
 *
 * Uses customer tags to track opt-in/opt-out status.
 * A tag with name "whatsapp_optout" means the customer has opted out.
 */
async function isCustomerOptedOut(customerId: string): Promise<boolean> {
  const optOutTag = await prisma.customerTag.findFirst({
    where: {
      customerId,
      tag: {
        name: 'whatsapp_optout',
      },
    },
  });

  return !!optOutTag;
}

/**
 * Set WhatsApp opt-in/opt-out status for a customer.
 *
 * Creates or removes the "whatsapp_optout" tag on the customer.
 */
export async function setWhatsAppOptOut(
  customerId: string,
  businessOwnerId: string,
  optOut: boolean
): Promise<void> {
  // Find or create the whatsapp_optout tag
  let tag = await prisma.tag.findFirst({
    where: {
      businessOwnerId,
      name: 'whatsapp_optout',
    },
  });

  if (!tag) {
    tag = await prisma.tag.create({
      data: {
        businessOwnerId,
        name: 'whatsapp_optout',
        color: '#808080',
      },
    });
  }

  if (optOut) {
    // Add opt-out tag (upsert to avoid duplicates)
    const existing = await prisma.customerTag.findFirst({
      where: {
        customerId,
        tagId: tag.id,
      },
    });

    if (!existing) {
      await prisma.customerTag.create({
        data: {
          customerId,
          tagId: tag.id,
        },
      });
    }
  } else {
    // Remove opt-out tag
    await prisma.customerTag.deleteMany({
      where: {
        customerId,
        tagId: tag.id,
      },
    });
  }
}

/**
 * Send an order confirmation message via WhatsApp.
 *
 * Fetches order details, builds a WhatsApp template message,
 * and sends it to the customer's phone number.
 */
export async function sendOrderConfirmation(
  orderId: string,
  phoneNumber: string
): Promise<WhatsAppSendResult> {
  // Fetch order with related data
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
    return { success: false, message: `Order not found: ${orderId}` };
  }

  // Check if customer has opted out
  if (order.customer) {
    const optedOut = await isCustomerOptedOut(order.customer.id);
    if (optedOut) {
      // Log the skipped message
      const integration = await findIntegration(order.businessOwnerId);
      if (integration) {
        await logMessage(integration.id, 'send_order_confirmation', 'skipped', orderId, phoneNumber, 'Customer opted out of WhatsApp');
      }
      return { success: false, message: 'Customer has opted out of WhatsApp notifications' };
    }
  }

  // Find WhatsApp integration
  const integration = await findIntegration(order.businessOwnerId);
  if (!integration) {
    return { success: false, message: 'WhatsApp Business integration is not configured or inactive' };
  }

  const config = integration.config as unknown as WhatsAppConfig;
  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  // Calculate ETA (estimated 30-45 minutes if not set)
  const eta = order.notes?.includes('ETA:')
    ? order.notes.split('ETA:')[1]?.trim()
    : '30-45 minutes';

  // Build template message
  // Template: "Your order #{{orderId}} is confirmed. Total: {{amount}}. ETA: {{eta}}"
  const templateMessage: WhatsAppMessageRequest = {
    to: normalizedPhone,
    template: {
      name: 'order_confirmation',
      language: 'en',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: order.orderNumber },
            { type: 'text', text: `₹${parseFloat(order.total.toString()).toFixed(2)}` },
            { type: 'text', text: eta || '30-45 minutes' },
          ],
        },
      ],
    },
  };

  // Send message via configured provider
  const result = await sendWhatsAppMessage(config, templateMessage);

  // Update Integration lastSyncAt
  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  // Log the message attempt
  await logMessage(
    integration.id,
    'send_order_confirmation',
    result.success ? 'success' : 'failure',
    orderId,
    normalizedPhone,
    result.success ? null : result.message,
    result.messageId
  );

  return result;
}

/**
 * Send a delivery status update message via WhatsApp.
 *
 * Sends an update to the customer about their order delivery status.
 */
export async function sendDeliveryUpdate(
  orderId: string,
  status: string
): Promise<WhatsAppSendResult> {
  // Fetch order with customer
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      branch: {
        include: {
          businessOwner: true,
        },
      },
    },
  });

  if (!order) {
    return { success: false, message: `Order not found: ${orderId}` };
  }

  if (!order.customer) {
    return { success: false, message: 'Order has no customer assigned' };
  }

  // Check if customer has opted out
  const optedOut = await isCustomerOptedOut(order.customer.id);
  if (optedOut) {
    const integration = await findIntegration(order.businessOwnerId);
    if (integration) {
      await logMessage(integration.id, 'send_delivery_update', 'skipped', orderId, order.customer.phone, 'Customer opted out of WhatsApp');
    }
    return { success: false, message: 'Customer has opted out of WhatsApp notifications' };
  }

  // Find WhatsApp integration
  const integration = await findIntegration(order.businessOwnerId);
  if (!integration) {
    return { success: false, message: 'WhatsApp Business integration is not configured or inactive' };
  }

  const config = integration.config as unknown as WhatsAppConfig;
  const normalizedPhone = normalizePhoneNumber(order.customer.phone);

  // Map status to human-readable message
  const statusMessages: Record<string, string> = {
    Accepted: 'Your order has been accepted and is being prepared.',
    Preparing: 'Your order is being prepared by our kitchen.',
    Ready: 'Your order is ready for pickup/delivery!',
    OutForDelivery: 'Your order is out for delivery. It will reach you soon!',
    Delivered: 'Your order has been delivered. Thank you for ordering!',
    Cancelled: 'Your order has been cancelled. Please contact us for details.',
  };

  const statusMessage = statusMessages[status] || `Your order status has been updated to: ${status}`;

  // Build template message
  const templateMessage: WhatsAppMessageRequest = {
    to: normalizedPhone,
    template: {
      name: 'delivery_update',
      language: 'en',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: order.orderNumber },
            { type: 'text', text: statusMessage },
          ],
        },
      ],
    },
  };

  // Send message
  const result = await sendWhatsAppMessage(config, templateMessage);

  // Update Integration lastSyncAt
  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  // Log the delivery update message
  await logMessage(
    integration.id,
    'send_delivery_update',
    result.success ? 'success' : 'failure',
    orderId,
    normalizedPhone,
    result.success ? null : result.message,
    result.messageId
  );

  return result;
}

/**
 * Find the WhatsApp Business integration for a business owner.
 */
async function findIntegration(businessOwnerId: string) {
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'whatsapp_business',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    return null;
  }

  return integration;
}

/**
 * Send a WhatsApp message via the configured provider (Twilio or Meta).
 */
async function sendWhatsAppMessage(
  config: WhatsAppConfig,
  message: WhatsAppMessageRequest
): Promise<WhatsAppSendResult> {
  try {
    if (config.provider === 'twilio') {
      return await sendViaTwilio(config, message);
    } else if (config.provider === 'meta') {
      return await sendViaMeta(config, message);
    } else {
      return { success: false, message: `Unsupported WhatsApp provider: ${config.provider}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error sending WhatsApp message';
    return { success: false, message: errorMessage };
  }
}

/**
 * Send a WhatsApp message via Twilio API.
 */
async function sendViaTwilio(
  config: WhatsAppConfig,
  message: WhatsAppMessageRequest
): Promise<WhatsAppSendResult> {
  const accountSid = config.twilioAccountSid || '';
  const authToken = config.twilioAuthToken || '';
  const fromNumber = config.twilioFromNumber || '';

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, message: 'Twilio credentials not configured' };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  // Build message body from template parameters
  const bodyParams = message.template?.components
    .find(c => c.type === 'body')
    ?.parameters.map(p => p.text)
    .filter(Boolean) || [];

  const messageBody = bodyParams.length > 0
    ? `Your order #${bodyParams[0]} is confirmed. Total: ${bodyParams[1]}. ETA: ${bodyParams[2]}`
    : message.text || '';

  const params = new URLSearchParams();
  params.append('To', `whatsapp:${message.to}`);
  params.append('From', fromNumber);
  params.append('Body', messageBody);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, message: `Twilio API error (${response.status}): ${errorText}` };
  }

  const data = (await response.json()) as { sid: string; status: string };

  return {
    success: true,
    message: 'WhatsApp message sent successfully via Twilio',
    messageId: data.sid,
  };
}

/**
 * Send a WhatsApp message via Meta Cloud API.
 */
async function sendViaMeta(
  config: WhatsAppConfig,
  message: WhatsAppMessageRequest
): Promise<WhatsAppSendResult> {
  const accessToken = config.metaAccessToken || '';
  const phoneNumberId = config.metaPhoneNumberId || '';

  if (!accessToken || !phoneNumberId) {
    return { success: false, message: 'Meta WhatsApp credentials not configured' };
  }

  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;

  // Build Meta API request body
  const requestBody: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    to: message.to.replace('+', ''), // Meta expects number without +
    type: 'template',
    template: message.template
      ? {
          name: message.template.name,
          language: { code: message.template.language },
          components: message.template.components,
        }
      : undefined,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, message: `Meta WhatsApp API error (${response.status}): ${errorText}` };
  }

  const data = (await response.json()) as { messages: Array<{ id: string }> };

  return {
    success: true,
    message: 'WhatsApp message sent successfully via Meta',
    messageId: data.messages?.[0]?.id,
  };
}

/**
 * Log a WhatsApp message attempt to IntegrationLog.
 */
async function logMessage(
  integrationId: string,
  action: string,
  status: string,
  orderId: string,
  phoneNumber: string,
  errorMessage: string | null,
  messageId?: string
): Promise<void> {
  await prisma.integrationLog.create({
    data: {
      integrationId,
      action,
      status,
      requestPayload: JSON.parse(JSON.stringify({
        orderId,
        phoneNumber,
        timestamp: new Date().toISOString(),
      })),
      responsePayload: messageId
        ? JSON.parse(JSON.stringify({ messageId }))
        : Prisma.JsonNull,
      errorMessage,
    },
  });
}

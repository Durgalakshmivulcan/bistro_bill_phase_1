import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

/**
 * SMS Integration Service
 *
 * Supports sending SMS via Twilio or MSG91.
 * Config stored in Integration model determines which provider to use.
 */

interface SMSConfig {
  provider: 'twilio' | 'msg91';
  // Twilio config
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioFromNumber?: string;
  // MSG91 config
  msg91AuthKey?: string;
  msg91SenderId?: string;
  msg91RouteId?: string;
  // Common
  defaultCountryCode?: string; // e.g., "+91"
}

interface SMSTemplates {
  orderConfirmation: string;
  orderReady: string;
  deliveryUpdate: string;
}

export interface SMSSendResult {
  success: boolean;
  message: string;
  messageId?: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: Date;
}

// In-memory rate limit tracking (per customer per day)
const rateLimitMap = new Map<string, RateLimitEntry>();
const MAX_SMS_PER_CUSTOMER_PER_DAY = 5;

// Default SMS templates
const DEFAULT_TEMPLATES: SMSTemplates = {
  orderConfirmation: 'Your order #{orderNumber} is confirmed. Total: {amount}. ETA: {eta}. Thank you for ordering!',
  orderReady: 'Your order #{orderNumber} is ready for pickup! Please collect it at your earliest convenience.',
  deliveryUpdate: 'Order #{orderNumber} update: {statusMessage}',
};

/**
 * Normalize phone number to E.164 format.
 * Adds default country code (+91 India) if not present.
 */
function normalizePhoneNumber(phone: string, countryCode: string = '+91'): string {
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');

  // If starts with 0, remove leading 0
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If doesn't start with +, add country code
  if (!cleaned.startsWith('+')) {
    cleaned = `${countryCode}${cleaned}`;
  }

  return cleaned;
}

/**
 * Check rate limit for a customer.
 * Returns true if the customer has exceeded the daily SMS limit.
 */
function isRateLimited(customerId: string): boolean {
  const now = new Date();
  const entry = rateLimitMap.get(customerId);

  if (!entry) {
    return false;
  }

  // Reset if past the reset time
  if (now >= entry.resetAt) {
    rateLimitMap.delete(customerId);
    return false;
  }

  return entry.count >= MAX_SMS_PER_CUSTOMER_PER_DAY;
}

/**
 * Increment the rate limit counter for a customer.
 */
function incrementRateLimit(customerId: string): void {
  const now = new Date();
  const entry = rateLimitMap.get(customerId);

  if (!entry || now >= entry.resetAt) {
    // Create new entry with reset at end of day
    const resetAt = new Date(now);
    resetAt.setHours(23, 59, 59, 999);
    rateLimitMap.set(customerId, { count: 1, resetAt });
  } else {
    entry.count += 1;
  }
}

/**
 * Send an order confirmation SMS.
 */
export async function sendOrderConfirmation(
  orderId: string,
  phoneNumber: string
): Promise<SMSSendResult> {
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

  // Check rate limit
  if (order.customer && isRateLimited(order.customer.id)) {
    const integration = await findIntegration(order.businessOwnerId);
    if (integration) {
      await logMessage(integration.id, 'send_order_confirmation', 'skipped', orderId, phoneNumber, 'Rate limit exceeded (max 5 SMS per customer per day)');
    }
    return { success: false, message: 'Rate limit exceeded: max 5 SMS per customer per day' };
  }

  const integration = await findIntegration(order.businessOwnerId);
  if (!integration) {
    return { success: false, message: 'SMS integration is not configured or inactive' };
  }

  const config = integration.config as unknown as SMSConfig;
  const normalizedPhone = normalizePhoneNumber(phoneNumber, config.defaultCountryCode || '+91');

  // Calculate ETA
  const eta = order.notes?.includes('ETA:')
    ? order.notes.split('ETA:')[1]?.trim()
    : '30-45 minutes';

  // Build message from template
  const messageText = DEFAULT_TEMPLATES.orderConfirmation
    .replace('{orderNumber}', order.orderNumber)
    .replace('{amount}', `₹${parseFloat(order.total.toString()).toFixed(2)}`)
    .replace('{eta}', eta || '30-45 minutes');

  const result = await sendSMS(config, normalizedPhone, messageText);

  // Update Integration lastSyncAt
  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  // Track rate limit
  if (result.success && order.customer) {
    incrementRateLimit(order.customer.id);
  }

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
 * Send an order ready notification SMS.
 */
export async function sendOrderReady(
  orderId: string
): Promise<SMSSendResult> {
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

  // Check rate limit
  if (isRateLimited(order.customer.id)) {
    const integration = await findIntegration(order.businessOwnerId);
    if (integration) {
      await logMessage(integration.id, 'send_order_ready', 'skipped', orderId, order.customer.phone, 'Rate limit exceeded (max 5 SMS per customer per day)');
    }
    return { success: false, message: 'Rate limit exceeded: max 5 SMS per customer per day' };
  }

  const integration = await findIntegration(order.businessOwnerId);
  if (!integration) {
    return { success: false, message: 'SMS integration is not configured or inactive' };
  }

  const config = integration.config as unknown as SMSConfig;
  const normalizedPhone = normalizePhoneNumber(order.customer.phone, config.defaultCountryCode || '+91');

  const messageText = DEFAULT_TEMPLATES.orderReady
    .replace('{orderNumber}', order.orderNumber);

  const result = await sendSMS(config, normalizedPhone, messageText);

  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  if (result.success) {
    incrementRateLimit(order.customer.id);
  }

  await logMessage(
    integration.id,
    'send_order_ready',
    result.success ? 'success' : 'failure',
    orderId,
    normalizedPhone,
    result.success ? null : result.message,
    result.messageId
  );

  return result;
}

/**
 * Send a delivery update SMS.
 */
export async function sendDeliveryUpdate(
  orderId: string,
  status: string
): Promise<SMSSendResult> {
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

  // Check rate limit
  if (isRateLimited(order.customer.id)) {
    const integration = await findIntegration(order.businessOwnerId);
    if (integration) {
      await logMessage(integration.id, 'send_delivery_update', 'skipped', orderId, order.customer.phone, 'Rate limit exceeded (max 5 SMS per customer per day)');
    }
    return { success: false, message: 'Rate limit exceeded: max 5 SMS per customer per day' };
  }

  const integration = await findIntegration(order.businessOwnerId);
  if (!integration) {
    return { success: false, message: 'SMS integration is not configured or inactive' };
  }

  const config = integration.config as unknown as SMSConfig;
  const normalizedPhone = normalizePhoneNumber(order.customer.phone, config.defaultCountryCode || '+91');

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

  const messageText = DEFAULT_TEMPLATES.deliveryUpdate
    .replace('{orderNumber}', order.orderNumber)
    .replace('{statusMessage}', statusMessage);

  const result = await sendSMS(config, normalizedPhone, messageText);

  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  if (result.success) {
    incrementRateLimit(order.customer.id);
  }

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
 * Handle SMS delivery status webhook.
 *
 * Updates the IntegrationLog with the delivery status from the provider.
 */
export async function handleDeliveryStatusWebhook(
  payload: {
    messageId: string;
    status: string;
    errorCode?: string;
    errorMessage?: string;
  },
  businessOwnerId: string
): Promise<void> {
  const integration = await findIntegration(businessOwnerId);
  if (!integration) {
    return;
  }

  await prisma.integrationLog.create({
    data: {
      integrationId: integration.id,
      action: 'delivery_status_webhook',
      status: payload.status,
      requestPayload: JSON.parse(JSON.stringify(payload)),
      responsePayload: Prisma.JsonNull,
      errorMessage: payload.errorMessage || null,
    },
  });
}

/**
 * Find the SMS integration for a business owner.
 */
async function findIntegration(businessOwnerId: string) {
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'sms_gateway',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    return null;
  }

  return integration;
}

/**
 * Send an SMS via the configured provider (Twilio or MSG91).
 */
async function sendSMS(
  config: SMSConfig,
  to: string,
  message: string
): Promise<SMSSendResult> {
  try {
    if (config.provider === 'twilio') {
      return await sendViaTwilio(config, to, message);
    } else if (config.provider === 'msg91') {
      return await sendViaMSG91(config, to, message);
    } else {
      return { success: false, message: `Unsupported SMS provider: ${config.provider}` };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error sending SMS';
    return { success: false, message: errorMessage };
  }
}

/**
 * Send SMS via Twilio API.
 */
async function sendViaTwilio(
  config: SMSConfig,
  to: string,
  message: string
): Promise<SMSSendResult> {
  const accountSid = config.twilioAccountSid || '';
  const authToken = config.twilioAuthToken || '';
  const fromNumber = config.twilioFromNumber || '';

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, message: 'Twilio SMS credentials not configured' };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const params = new URLSearchParams();
  params.append('To', to);
  params.append('From', fromNumber);
  params.append('Body', message);

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
    return { success: false, message: `Twilio SMS API error (${response.status}): ${errorText}` };
  }

  const data = (await response.json()) as { sid: string; status: string };

  return {
    success: true,
    message: 'SMS sent successfully via Twilio',
    messageId: data.sid,
  };
}

/**
 * Send SMS via MSG91 API.
 */
async function sendViaMSG91(
  config: SMSConfig,
  to: string,
  message: string
): Promise<SMSSendResult> {
  const authKey = config.msg91AuthKey || '';
  const senderId = config.msg91SenderId || '';
  const routeId = config.msg91RouteId || '4'; // Default: transactional route

  if (!authKey || !senderId) {
    return { success: false, message: 'MSG91 credentials not configured' };
  }

  const url = 'https://api.msg91.com/api/v5/flow/';

  // MSG91 expects phone without + prefix
  const phoneNumber = to.startsWith('+') ? to.substring(1) : to;

  const requestBody = {
    sender: senderId,
    route: routeId,
    country: phoneNumber.substring(0, 2), // Country code (e.g., "91")
    sms: [
      {
        message,
        to: [phoneNumber],
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'authkey': authKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { success: false, message: `MSG91 API error (${response.status}): ${errorText}` };
  }

  const data = (await response.json()) as { type: string; message: string; request_id?: string };

  if (data.type !== 'success') {
    return { success: false, message: `MSG91 error: ${data.message}` };
  }

  return {
    success: true,
    message: 'SMS sent successfully via MSG91',
    messageId: data.request_id,
  };
}

/**
 * Log an SMS attempt to IntegrationLog.
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

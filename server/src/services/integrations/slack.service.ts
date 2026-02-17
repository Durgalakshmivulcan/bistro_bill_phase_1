import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

/**
 * Slack Integration Service
 *
 * Sends order notifications to a configured Slack channel via Incoming Webhooks.
 * Supports @mentions for urgent orders (high value or VIP customers).
 * Config stored in Integration model: webhookUrl, channel, mentionUserId, highValueThreshold, vipCustomerTypes.
 */

interface SlackConfig {
  webhookUrl: string; // Slack Incoming Webhook URL
  channel?: string; // Override channel (e.g., #orders)
  mentionUserId?: string; // Slack user ID to @mention for urgent orders
  highValueThreshold?: number; // Order total above which to @mention (default: 5000)
  vipCustomerTypes?: string[]; // Customer types considered VIP (default: ['VIP'])
  adminPanelBaseUrl?: string; // Base URL for "View Order" links (e.g., https://bistro.example.com)
}

export interface SlackNotificationResult {
  success: boolean;
  message: string;
}

/**
 * Find the Slack integration for a business owner.
 */
async function findIntegration(businessOwnerId: string) {
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'slack',
      },
    },
  });

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
    console.error('[Slack] Failed to write IntegrationLog');
  }
}

/**
 * Format currency amount in INR.
 */
function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Determine if an order is urgent (high value or VIP customer).
 */
function isUrgentOrder(
  config: SlackConfig,
  orderTotal: number,
  customerType: string | null
): boolean {
  const threshold = config.highValueThreshold || 5000;
  const vipTypes = config.vipCustomerTypes || ['VIP'];

  if (orderTotal >= threshold) {
    return true;
  }

  if (customerType && vipTypes.includes(customerType)) {
    return true;
  }

  return false;
}

/**
 * Build Slack message blocks for an order notification.
 */
function buildOrderMessage(
  order: {
    id: string;
    orderNumber: string;
    total: number;
    customerName: string;
    customerType: string | null;
    items: Array<{ name: string; quantity: number; totalPrice: number }>;
  },
  config: SlackConfig,
  urgent: boolean
): Record<string, unknown> {
  const itemsList = order.items
    .map((item) => `• ${item.name} x${item.quantity} — ${formatCurrency(item.totalPrice)}`)
    .join('\n');

  const urgentPrefix = urgent && config.mentionUserId
    ? `<@${config.mentionUserId}> 🚨 *Urgent Order* 🚨\n`
    : '';

  const viewOrderUrl = config.adminPanelBaseUrl
    ? `${config.adminPanelBaseUrl}/pos/orders/view/${order.id}`
    : null;

  const text = `${urgentPrefix}*New Order #${order.orderNumber}*\n*Customer:* ${order.customerName}${order.customerType ? ` (${order.customerType})` : ''}\n*Total:* ${formatCurrency(order.total)}\n\n*Items:*\n${itemsList}`;

  const payload: Record<string, unknown> = {
    text: `New Order #${order.orderNumber} - ${order.customerName} - ${formatCurrency(order.total)}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text,
        },
      },
    ],
  };

  if (config.channel) {
    payload.channel = config.channel;
  }

  if (viewOrderUrl) {
    (payload.blocks as Array<Record<string, unknown>>).push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View Order',
          },
          url: viewOrderUrl,
          action_id: `view_order_${order.id}`,
        },
      ],
    });
  }

  return payload;
}

/**
 * Send an order notification to the configured Slack channel.
 * Formats the message with order details, customer name, items, and total.
 * Supports @mentions for urgent orders (high value or VIP customers).
 * Adds a "View Order" button linking to the admin panel.
 */
export async function sendOrderNotification(
  orderId: string,
  businessOwnerId: string
): Promise<SlackNotificationResult> {
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
    return { success: false, message: 'Slack integration is not configured or inactive' };
  }

  const config = integration.config as unknown as SlackConfig;

  if (!config.webhookUrl) {
    return { success: false, message: 'Slack webhook URL is not configured' };
  }

  const orderTotal = Number(order.total);
  const customerName = order.customer?.name || 'Walk-in Customer';
  const customerType = order.customer?.type || null;

  const urgent = isUrgentOrder(config, orderTotal, customerType);

  const orderData = {
    id: order.id,
    orderNumber: order.orderNumber,
    total: orderTotal,
    customerName,
    customerType,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      totalPrice: Number(item.totalPrice),
    })),
  };

  const slackPayload = buildOrderMessage(orderData, config, urgent);

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = `Slack webhook returned ${response.status}: ${errorText}`;

      await logAction(
        integration.id,
        'send_order_notification',
        'failure',
        { orderId, orderNumber: order.orderNumber },
        null,
        errorMsg
      );

      return { success: false, message: errorMsg };
    }

    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    await logAction(
      integration.id,
      'send_order_notification',
      'success',
      { orderId, orderNumber: order.orderNumber, total: orderTotal, urgent },
      { status: response.status },
      null
    );

    return {
      success: true,
      message: `Order #${order.orderNumber} notification sent to Slack${urgent ? ' (urgent)' : ''}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error sending Slack notification';

    await logAction(
      integration.id,
      'send_order_notification',
      'failure',
      { orderId, orderNumber: order.orderNumber },
      null,
      msg
    );

    return { success: false, message: msg };
  }
}

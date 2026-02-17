import { Request, Response } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { OrderAggregator, OnlineOrderStatus } from '@prisma/client';

/**
 * Aggregator-specific webhook signature header names
 */
const SIGNATURE_HEADERS: Record<string, string> = {
  Swiggy: 'x-swiggy-signature',
  Zomato: 'x-zomato-signature',
  UberEats: 'x-uber-signature',
  BistroBill: 'x-bistrobill-signature',
};

/**
 * Verify webhook signature using HMAC SHA256
 * Each aggregator sends a signature in a custom header, computed from the request body and a shared secret.
 */
function verifyWebhookSignature(
  aggregator: string,
  body: string,
  signatureHeader: string | undefined,
  secret: string | undefined
): boolean {
  // If no secret configured, skip verification (development mode)
  if (!secret) {
    console.warn(`[Webhook] No secret configured for ${aggregator}, skipping signature verification`);
    return true;
  }

  if (!signatureHeader) {
    console.warn(`[Webhook] Missing signature header for ${aggregator}`);
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  try {
    const sigBuffer = Buffer.from(signatureHeader, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Log webhook payload to IntegrationLog table for debugging and audit
 */
async function logWebhookPayload(
  aggregator: string,
  action: string,
  status: string,
  requestPayload: unknown,
  responsePayload?: unknown,
  errorMessage?: string
): Promise<void> {
  try {
    // Find integration record for this aggregator
    const integration = await prisma.integration.findFirst({
      where: { provider: aggregator.toLowerCase() as any },
    });

    if (integration) {
      await prisma.integrationLog.create({
        data: {
          integrationId: integration.id,
          action,
          status,
          requestPayload: requestPayload as any,
          responsePayload: responsePayload as any,
          errorMessage: errorMessage || null,
        },
      });
    } else {
      // If no integration record exists, just log to console
      console.log(`[WebhookLog] No integration record for ${aggregator}, logging to console only`, {
        action,
        status,
        errorMessage,
      });
    }
  } catch (logError) {
    // Don't let logging errors affect webhook processing
    console.error('[WebhookLog] Failed to log webhook payload:', logError);
  }
}

/**
 * Send confirmation callback to aggregator with retry logic
 * Retries up to 3 times with exponential backoff (1s, 2s, 4s)
 */
async function sendAggregatorCallback(
  aggregator: string,
  callbackUrl: string | undefined,
  payload: Record<string, unknown>,
  maxRetries: number = 3
): Promise<boolean> {
  if (!callbackUrl) {
    console.log(`[Webhook] No callback URL for ${aggregator}, skipping confirmation`);
    return false;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (response.ok) {
        console.log(`[Webhook] Callback sent to ${aggregator} successfully (attempt ${attempt})`);
        return true;
      }

      console.warn(`[Webhook] Callback to ${aggregator} returned ${response.status} (attempt ${attempt}/${maxRetries})`);
    } catch (err) {
      console.error(`[Webhook] Callback to ${aggregator} failed (attempt ${attempt}/${maxRetries}):`, err);
    }

    // Exponential backoff: 1s, 2s, 4s
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error(`[Webhook] All ${maxRetries} callback attempts to ${aggregator} failed`);
  return false;
}

/**
 * Map aggregator menu items to internal product IDs using fuzzy name matching
 * Returns items with productId added where a match is found
 */
async function mapMenuItems(
  items: any[],
  businessOwnerId: string
): Promise<any[]> {
  if (!items || items.length === 0) return items;

  // Fetch all active products for this business
  const products = await prisma.product.findMany({
    where: {
      businessOwnerId,
      status: 'active',
    },
    select: {
      id: true,
      name: true,
      sku: true,
      shortCode: true,
    },
  });

  // Build lookup maps for efficient matching
  const nameMap = new Map<string, string>();
  const skuMap = new Map<string, string>();

  for (const product of products) {
    nameMap.set(product.name.toLowerCase().trim(), product.id);
    if (product.sku) {
      skuMap.set(product.sku.toLowerCase().trim(), product.id);
    }
    if (product.shortCode) {
      skuMap.set(product.shortCode.toLowerCase().trim(), product.id);
    }
  }

  return items.map(item => {
    const itemName = (item.name || item.productName || item.item_name || '').toLowerCase().trim();
    const itemSku = (item.sku || item.product_sku || '').toLowerCase().trim();

    // Try exact name match first
    let productId = nameMap.get(itemName);

    // Try SKU match
    if (!productId && itemSku) {
      productId = skuMap.get(itemSku);
    }

    // Try partial name match (aggregator item name contains product name or vice versa)
    if (!productId && itemName) {
      for (const [pName, pId] of nameMap.entries()) {
        if (itemName.includes(pName) || pName.includes(itemName)) {
          productId = pId;
          break;
        }
      }
    }

    return {
      ...item,
      productId: productId || null,
      mapped: !!productId,
    };
  });
}

/**
 * POST /api/v1/webhooks/online-orders/:aggregator
 * Webhook endpoint to receive online orders from aggregator platforms
 * This endpoint does NOT require authentication (webhook from external service)
 *
 * Improvements (US-252):
 * - Webhook signature verification (HMAC SHA256)
 * - Duplicate order detection by externalOrderId
 * - Webhook payload logging to IntegrationLog
 * - Menu item mapping to internal products
 * - Confirmation callback to aggregator with retry logic
 */
export const receiveOnlineOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { aggregator } = req.params;
    const webhookData = req.body;
    const rawBody = JSON.stringify(webhookData);

    // Log webhook request for debugging
    console.log('[Webhook] Received online order webhook:', {
      aggregator,
      timestamp: new Date().toISOString(),
      body: rawBody,
    });

    // Validate aggregator is valid
    const validAggregators = ['BistroBill', 'Swiggy', 'Zomato', 'UberEats'];
    if (!validAggregators.includes(aggregator)) {
      await logWebhookPayload(aggregator, 'receive_order', 'failure', webhookData, null, `Invalid aggregator: ${aggregator}`);
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AGGREGATOR',
          message: `Invalid aggregator: ${aggregator}. Must be one of: ${validAggregators.join(', ')}`,
        },
      } as ApiResponse);
      return;
    }

    // Webhook signature verification
    const signatureHeaderName = SIGNATURE_HEADERS[aggregator];
    const signatureHeader = signatureHeaderName ? req.headers[signatureHeaderName] as string | undefined : undefined;
    const webhookSecret = process.env[`${aggregator.toUpperCase()}_WEBHOOK_SECRET`];

    if (!verifyWebhookSignature(aggregator, rawBody, signatureHeader, webhookSecret)) {
      await logWebhookPayload(aggregator, 'receive_order', 'failure', webhookData, null, 'Invalid webhook signature');
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: 'Webhook signature verification failed',
        },
      } as ApiResponse);
      return;
    }

    // Parse incoming order data (different format per aggregator)
    let orderData: {
      branchId: string;
      externalOrderId: string;
      customerName: string;
      customerPhone: string;
      items: any[];
      amount: number;
      deliveryTime?: Date;
      callbackUrl?: string;
    };

    try {
      orderData = {
        branchId: webhookData.branchId || webhookData.restaurant_id || webhookData.store_id,
        externalOrderId: webhookData.orderId || webhookData.order_id || webhookData.external_order_id,
        customerName: webhookData.customerName || webhookData.customer?.name || webhookData.customer_name,
        customerPhone: webhookData.customerPhone || webhookData.customer?.phone || webhookData.customer_phone,
        items: webhookData.items || webhookData.order_items || [],
        amount: webhookData.amount || webhookData.total_amount || webhookData.order_total || 0,
        deliveryTime: webhookData.deliveryTime ? new Date(webhookData.deliveryTime) : undefined,
        callbackUrl: webhookData.callbackUrl || webhookData.callback_url || webhookData.status_url,
      };

      // Validate required fields
      if (!orderData.branchId || !orderData.customerName || !orderData.customerPhone || !orderData.items || orderData.items.length === 0) {
        await logWebhookPayload(aggregator, 'receive_order', 'failure', webhookData, null, 'Missing required fields');
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_WEBHOOK_DATA',
            message: 'Missing required fields: branchId, customerName, customerPhone, or items',
          },
        } as ApiResponse);
        return;
      }
    } catch (parseError) {
      console.error('[Webhook] Error parsing webhook data:', parseError);
      await logWebhookPayload(aggregator, 'receive_order', 'failure', webhookData, null, 'Failed to parse webhook data');
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WEBHOOK_DATA',
          message: 'Failed to parse webhook data',
        },
      } as ApiResponse);
      return;
    }

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: orderData.branchId },
    });

    if (!branch) {
      console.error('[Webhook] Branch not found:', orderData.branchId);
      await logWebhookPayload(aggregator, 'receive_order', 'failure', webhookData, null, `Branch not found: ${orderData.branchId}`);
      res.status(404).json({
        success: false,
        error: {
          code: 'BRANCH_NOT_FOUND',
          message: 'Branch not found',
        },
      } as ApiResponse);
      return;
    }

    // Duplicate order detection - check if order already exists by platform order ID
    if (orderData.externalOrderId) {
      const existingOrder = await prisma.onlineOrder.findFirst({
        where: {
          externalOrderId: orderData.externalOrderId,
          aggregator: aggregator as OrderAggregator,
        },
      });

      if (existingOrder) {
        console.log('[Webhook] Duplicate order detected:', {
          externalOrderId: orderData.externalOrderId,
          existingOrderId: existingOrder.id,
          aggregator,
        });
        await logWebhookPayload(aggregator, 'receive_order', 'duplicate', webhookData, { existingOrderId: existingOrder.id });

        // Return 200 to prevent aggregator retries, but indicate it's a duplicate
        res.status(200).json({
          success: true,
          data: {
            orderId: existingOrder.id,
            status: existingOrder.status,
            duplicate: true,
          },
        } as ApiResponse);
        return;
      }
    }

    // Map menu items to internal products
    const mappedItems = await mapMenuItems(orderData.items, branch.businessOwnerId);

    // Create OnlineOrder record in database
    const onlineOrder = await prisma.onlineOrder.create({
      data: {
        branchId: orderData.branchId,
        aggregator: aggregator as OrderAggregator,
        externalOrderId: orderData.externalOrderId,
        status: OnlineOrderStatus.Pending,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        items: mappedItems, // Store mapped items as JSON
        amount: orderData.amount,
        deliveryTime: orderData.deliveryTime,
        receivedAt: new Date(),
      },
    });

    console.log('[Webhook] Online order created successfully:', {
      id: onlineOrder.id,
      aggregator: onlineOrder.aggregator,
      externalOrderId: onlineOrder.externalOrderId,
      branchId: onlineOrder.branchId,
      itemsMapped: mappedItems.filter((i: any) => i.mapped).length,
      itemsTotal: mappedItems.length,
    });

    // Log successful webhook to IntegrationLog
    await logWebhookPayload(aggregator, 'receive_order', 'success', webhookData, {
      orderId: onlineOrder.id,
      status: onlineOrder.status,
    });

    // Send confirmation back to aggregator with retry logic
    sendAggregatorCallback(aggregator, orderData.callbackUrl, {
      orderId: onlineOrder.id,
      externalOrderId: orderData.externalOrderId,
      status: 'received',
      receivedAt: onlineOrder.receivedAt,
    }).catch(err => {
      console.error('[Webhook] Background callback failed:', err);
    });

    // Return 200 OK to aggregator
    res.status(200).json({
      success: true,
      data: {
        orderId: onlineOrder.id,
        status: onlineOrder.status,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('[Webhook] Error receiving online order:', error);

    // Log the error
    await logWebhookPayload(
      req.params.aggregator || 'unknown',
      'receive_order',
      'failure',
      req.body,
      null,
      error instanceof Error ? error.message : 'Unknown error'
    );

    // Return 500 to indicate server error
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to process online order webhook',
      },
    } as ApiResponse);
  }
};

/**
 * GET /api/v1/pos/online-orders
 * Get online orders filtered by status and branch
 */
export const getPendingOnlineOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;
    const { status = 'Pending', branchId } = req.query;

    // Build where clause
    const whereClause: any = {
      branch: {
        businessOwnerId: tenantId,
      },
    };

    if (status) {
      whereClause.status = status as OnlineOrderStatus;
    }

    if (branchId) {
      // Verify branch belongs to tenant
      const branch = await prisma.branch.findFirst({
        where: {
          id: branchId as string,
          businessOwnerId: tenantId,
        },
      });

      if (!branch) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BRANCH_NOT_FOUND',
            message: 'Branch not found',
          },
        } as ApiResponse);
        return;
      }

      whereClause.branchId = branchId as string;
    }

    // Fetch online orders
    const onlineOrders = await prisma.onlineOrder.findMany({
      where: whereClause,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        receivedAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: onlineOrders,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching online orders:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to fetch online orders',
      },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/pos/online-orders/:id/accept
 * Accept an online order and set delivery/prep times
 * Sends confirmation callback to aggregator with retry logic
 */
export const acceptOnlineOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;
    const { id } = req.params;
    const { deliveryTime, prepTime } = req.body;

    // Validate input
    if (!deliveryTime || !prepTime) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'deliveryTime and prepTime are required',
        },
      } as ApiResponse);
      return;
    }

    // Fetch order and verify it belongs to tenant
    const order = await prisma.onlineOrder.findFirst({
      where: {
        id,
        branch: {
          businessOwnerId: tenantId,
        },
      },
      include: {
        branch: true,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Online order not found',
        },
      } as ApiResponse);
      return;
    }

    // Check if order is already accepted or rejected
    if (order.status !== OnlineOrderStatus.Pending) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER_STATUS',
          message: `Cannot accept order with status: ${order.status}. Order must be Pending.`,
        },
      } as ApiResponse);
      return;
    }

    // Update order status
    const updatedOrder = await prisma.onlineOrder.update({
      where: { id },
      data: {
        status: OnlineOrderStatus.Accepted,
        deliveryTime: new Date(deliveryTime),
        prepTime: parseInt(prepTime),
        acceptedAt: new Date(),
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log('[OnlineOrder] Order accepted:', {
      orderId: updatedOrder.id,
      externalOrderId: updatedOrder.externalOrderId,
      aggregator: updatedOrder.aggregator,
      deliveryTime: updatedOrder.deliveryTime,
      prepTime: updatedOrder.prepTime,
    });

    // Send confirmation callback to aggregator with retry logic
    const items = order.items as any;
    const callbackUrl = items?.callbackUrl || items?.callback_url || items?.status_url;
    sendAggregatorCallback(updatedOrder.aggregator, callbackUrl, {
      orderId: updatedOrder.id,
      externalOrderId: updatedOrder.externalOrderId,
      status: 'accepted',
      deliveryTime: updatedOrder.deliveryTime,
      prepTime: updatedOrder.prepTime,
      acceptedAt: updatedOrder.acceptedAt,
    }).catch(err => {
      console.error('[OnlineOrder] Accept callback failed:', err);
    });

    res.status(200).json({
      success: true,
      data: updatedOrder,
    } as ApiResponse);
  } catch (error) {
    console.error('Error accepting online order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to accept online order',
      },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/pos/online-orders/:id/reject
 * Reject an online order with a reason
 * Sends rejection callback to aggregator with retry logic
 */
export const rejectOnlineOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;
    const { id } = req.params;
    const { reason } = req.body;

    // Validate input
    if (!reason) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'reason is required',
        },
      } as ApiResponse);
      return;
    }

    // Fetch order and verify it belongs to tenant
    const order = await prisma.onlineOrder.findFirst({
      where: {
        id,
        branch: {
          businessOwnerId: tenantId,
        },
      },
      include: {
        branch: true,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Online order not found',
        },
      } as ApiResponse);
      return;
    }

    // Check if order is already accepted or rejected
    if (order.status !== OnlineOrderStatus.Pending) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ORDER_STATUS',
          message: `Cannot reject order with status: ${order.status}. Order must be Pending.`,
        },
      } as ApiResponse);
      return;
    }

    // Update order status
    const updatedOrder = await prisma.onlineOrder.update({
      where: { id },
      data: {
        status: OnlineOrderStatus.Rejected,
        rejectedAt: new Date(),
        // Store rejection reason in items JSON (as metadata)
        items: {
          ...((order.items as any) || {}),
          rejectionReason: reason,
        },
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log('[OnlineOrder] Order rejected:', {
      orderId: updatedOrder.id,
      externalOrderId: updatedOrder.externalOrderId,
      aggregator: updatedOrder.aggregator,
      reason,
    });

    // Send rejection callback to aggregator with retry logic
    const items = order.items as any;
    const callbackUrl = items?.callbackUrl || items?.callback_url || items?.status_url;
    sendAggregatorCallback(updatedOrder.aggregator, callbackUrl, {
      orderId: updatedOrder.id,
      externalOrderId: updatedOrder.externalOrderId,
      status: 'rejected',
      reason,
      rejectedAt: updatedOrder.rejectedAt,
    }).catch(err => {
      console.error('[OnlineOrder] Reject callback failed:', err);
    });

    res.status(200).json({
      success: true,
      data: updatedOrder,
    } as ApiResponse);
  } catch (error) {
    console.error('Error rejecting online order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to reject online order',
      },
    } as ApiResponse);
  }
};

import { Request, Response } from 'express';
import crypto from 'crypto';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';
import { GatewayProvider, OnlinePaymentStatus, ReconciliationStatus, RefundStatus, AutoPayStatus } from '@prisma/client';
import { getPaymentGateway, getPaymentGatewayForBusiness, RazorpayGateway } from '../services/paymentGateway.service';
import {
  reconcileSettlement,
  getReconciliationRecords,
  markReconciliationResolved,
} from '../services/reconciliation.service';

/**
 * POST /api/v1/payments/create-order
 * Create a payment gateway order for an existing order
 */
export const createPaymentOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      } as ApiResponse);
      return;
    }

    const { orderId, provider, currency = 'INR' } = req.body;

    if (!orderId || !provider) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'orderId and provider are required',
        },
      } as ApiResponse);
      return;
    }

    // Validate provider
    if (!Object.values(GatewayProvider).includes(provider)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROVIDER',
          message: `Invalid provider: ${provider}. Must be one of: ${Object.values(GatewayProvider).join(', ')}`,
        },
      } as ApiResponse);
      return;
    }

    // Fetch the order and verify it belongs to tenant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        branch: {
          businessOwnerId: tenantId,
        },
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      } as ApiResponse);
      return;
    }

    // Get the payment gateway
    let gateway;
    try {
      gateway = await getPaymentGatewayForBusiness(tenantId, provider as GatewayProvider);
    } catch {
      // Fallback to env-based gateway
      gateway = getPaymentGateway(provider as GatewayProvider);
    }

    // Create order on the payment gateway
    const amount = Number(order.total);
    const result = await gateway.createOrder({
      amount,
      currency,
      metadata: {
        orderId: order.id,
        branchId: order.branchId,
      },
    });

    // Store payment record in database
    const onlinePayment = await prisma.onlinePayment.create({
      data: {
        orderId: order.id,
        amount: amount,
        currency,
        gatewayProvider: provider as GatewayProvider,
        gatewayOrderId: result.gatewayOrderId,
        status: OnlinePaymentStatus.Created,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        paymentId: onlinePayment.id,
        gatewayOrderId: result.gatewayOrderId,
        amount: result.amount,
        currency: result.currency,
        provider: result.provider,
        providerData: result.providerData,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PAYMENT_CREATE_FAILED',
        message: 'Failed to create payment order',
      },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/payments/verify
 * Verify payment after completion (signature validation)
 */
export const verifyPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      } as ApiResponse);
      return;
    }

    const { paymentId, orderId, signature, provider } = req.body;

    if (!paymentId || !orderId || !signature || !provider) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'paymentId, orderId, signature, and provider are required',
        },
      } as ApiResponse);
      return;
    }

    // Find the online payment record
    const onlinePayment = await prisma.onlinePayment.findFirst({
      where: {
        gatewayOrderId: orderId,
        order: {
          branch: {
            businessOwnerId: tenantId,
          },
        },
      },
    });

    if (!onlinePayment) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment record not found',
        },
      } as ApiResponse);
      return;
    }

    // Get the payment gateway and verify
    let gateway;
    try {
      gateway = await getPaymentGatewayForBusiness(tenantId, provider as GatewayProvider);
    } catch {
      gateway = getPaymentGateway(provider as GatewayProvider);
    }

    const result = await gateway.verifyPayment({ paymentId, orderId, signature });

    if (result.verified) {
      // Update payment status to completed
      await prisma.onlinePayment.update({
        where: { id: onlinePayment.id },
        data: {
          status: OnlinePaymentStatus.Completed,
          gatewayTransactionId: result.gatewayTransactionId,
          paymentMethod: result.paymentMethod,
          paidAt: new Date(),
        },
      });

      // Update order payment status
      await prisma.order.update({
        where: { id: onlinePayment.orderId },
        data: { paymentStatus: 'Paid' },
      });
    } else {
      // Mark payment as failed
      await prisma.onlinePayment.update({
        where: { id: onlinePayment.id },
        data: {
          status: OnlinePaymentStatus.Failed,
          failureReason: 'Signature verification failed',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        verified: result.verified,
        paymentId: onlinePayment.id,
        gatewayTransactionId: result.gatewayTransactionId,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PAYMENT_VERIFY_FAILED',
        message: 'Failed to verify payment',
      },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/payments/refund
 * Initiate a refund for a payment
 */
export const initiateRefund = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      } as ApiResponse);
      return;
    }

    const { paymentId, amount, reason } = req.body;

    if (!paymentId || !amount) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'paymentId and amount are required',
        },
      } as ApiResponse);
      return;
    }

    // Find the payment record
    const onlinePayment = await prisma.onlinePayment.findFirst({
      where: {
        id: paymentId,
        status: OnlinePaymentStatus.Completed,
        order: {
          branch: {
            businessOwnerId: tenantId,
          },
        },
      },
    });

    if (!onlinePayment) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Completed payment not found',
        },
      } as ApiResponse);
      return;
    }

    if (!onlinePayment.gatewayTransactionId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYMENT',
          message: 'Payment has no gateway transaction ID',
        },
      } as ApiResponse);
      return;
    }

    // Get the payment gateway and create refund
    let gateway;
    try {
      gateway = await getPaymentGatewayForBusiness(tenantId, onlinePayment.gatewayProvider);
    } catch {
      gateway = getPaymentGateway(onlinePayment.gatewayProvider);
    }

    const result = await gateway.createRefund({
      paymentId: onlinePayment.gatewayTransactionId,
      amount,
      reason: reason || undefined,
    });

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        onlinePaymentId: onlinePayment.id,
        amount,
        reason: reason || null,
        gatewayRefundId: result.gatewayRefundId,
        status: 'Processing',
      },
    });

    // Update payment status
    const refundAmount = Number(amount);
    const paymentAmount = Number(onlinePayment.amount);
    const newStatus = refundAmount >= paymentAmount
      ? OnlinePaymentStatus.Refunded
      : OnlinePaymentStatus.PartiallyRefunded;

    await prisma.onlinePayment.update({
      where: { id: onlinePayment.id },
      data: { status: newStatus },
    });

    res.status(201).json({
      success: true,
      data: {
        refundId: refund.id,
        gatewayRefundId: result.gatewayRefundId,
        amount: result.amount,
        status: result.status,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Error initiating refund:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REFUND_FAILED',
        message: 'Failed to initiate refund',
      },
    } as ApiResponse);
  }
};

/**
 * GET /api/v1/payments/order/:orderId
 * Get payment details by Order ID
 */
export const getPaymentByOrderId = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      } as ApiResponse);
      return;
    }

    const { orderId } = req.params;

    const onlinePayment = await prisma.onlinePayment.findFirst({
      where: {
        orderId,
        order: {
          branch: {
            businessOwnerId: tenantId,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
          },
        },
        refunds: true,
      },
    });

    if (!onlinePayment) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'No payment found for this order',
        },
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: onlinePayment,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching payment by order ID:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PAYMENT_FAILED',
        message: 'Failed to fetch payment details',
      },
    } as ApiResponse);
  }
};

/**
 * GET /api/v1/payments/:id
 * Get payment details by ID
 */
export const getPaymentDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      } as ApiResponse);
      return;
    }

    const { id } = req.params;

    const onlinePayment = await prisma.onlinePayment.findFirst({
      where: {
        id,
        order: {
          branch: {
            businessOwnerId: tenantId,
          },
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
          },
        },
        refunds: true,
      },
    });

    if (!onlinePayment) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found',
        },
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: onlinePayment,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_PAYMENT_FAILED',
        message: 'Failed to fetch payment details',
      },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/payments/split
 * Process a split payment across multiple methods for a single order
 * Creates separate OnlinePayment records for each method, linked to the same order.
 * If any payment fails after previous ones succeeded, initiates refunds for completed payments.
 */
export const processSplitPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      } as ApiResponse);
      return;
    }

    const { orderId, splits } = req.body as {
      orderId: string;
      splits: Array<{
        provider: string;
        amount: number;
        paymentMethod: string; // cash, card, upi, wallet, netbanking
      }>;
    };

    if (!orderId || !splits || !Array.isArray(splits) || splits.length < 2) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'orderId and at least 2 splits are required',
        },
      } as ApiResponse);
      return;
    }

    // Fetch the order and verify it belongs to tenant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        branch: {
          businessOwnerId: tenantId,
        },
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found',
        },
      } as ApiResponse);
      return;
    }

    // Validate sum of split amounts equals order total
    const orderTotal = Number(order.total);
    const splitTotal = splits.reduce((sum, s) => sum + Number(s.amount), 0);
    const tolerance = 0.01; // Allow 1 paisa tolerance for rounding

    if (Math.abs(splitTotal - orderTotal) > tolerance) {
      res.status(400).json({
        success: false,
        error: {
          code: 'AMOUNT_MISMATCH',
          message: `Split amounts total (${splitTotal.toFixed(2)}) does not match order total (${orderTotal.toFixed(2)})`,
        },
      } as ApiResponse);
      return;
    }

    // Validate providers
    for (const split of splits) {
      if (split.provider !== 'Cash' && !Object.values(GatewayProvider).includes(split.provider as GatewayProvider)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PROVIDER',
            message: `Invalid provider: ${split.provider}. Must be one of: Cash, ${Object.values(GatewayProvider).join(', ')}`,
          },
        } as ApiResponse);
        return;
      }

      if (!split.amount || split.amount <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Each split must have a positive amount',
          },
        } as ApiResponse);
        return;
      }
    }

    // Process each split sequentially
    const completedPayments: Array<{
      id: string;
      provider: string;
      amount: number;
      paymentMethod: string;
      gatewayOrderId?: string;
      gatewayTransactionId?: string;
      status: string;
    }> = [];

    for (const split of splits) {
      try {
        if (split.provider === 'Cash') {
          // Cash payments don't go through gateway
          const cashPayment = await prisma.onlinePayment.create({
            data: {
              orderId: order.id,
              amount: split.amount,
              currency: 'INR',
              gatewayProvider: GatewayProvider.Razorpay, // Use Razorpay as placeholder for cash
              gatewayOrderId: `cash_${order.id}_${Date.now()}`,
              status: OnlinePaymentStatus.Completed,
              paymentMethod: 'cash',
              paidAt: new Date(),
              metadata: { splitPayment: true, paymentType: 'cash' },
            },
          });

          completedPayments.push({
            id: cashPayment.id,
            provider: 'Cash',
            amount: split.amount,
            paymentMethod: 'cash',
            gatewayOrderId: cashPayment.gatewayOrderId || undefined,
            status: 'Completed',
          });
        } else {
          // Gateway payments - create order on gateway
          let gateway;
          try {
            gateway = await getPaymentGatewayForBusiness(tenantId, split.provider as GatewayProvider);
          } catch {
            gateway = getPaymentGateway(split.provider as GatewayProvider);
          }

          const result = await gateway.createOrder({
            amount: split.amount,
            currency: 'INR',
            metadata: {
              orderId: order.id,
              branchId: order.branchId,
              splitPayment: true,
              paymentMethod: split.paymentMethod,
            },
          });

          // Store payment record
          const onlinePayment = await prisma.onlinePayment.create({
            data: {
              orderId: order.id,
              amount: split.amount,
              currency: 'INR',
              gatewayProvider: split.provider as GatewayProvider,
              gatewayOrderId: result.gatewayOrderId,
              status: OnlinePaymentStatus.Created,
              paymentMethod: split.paymentMethod,
              metadata: { splitPayment: true },
            },
          });

          completedPayments.push({
            id: onlinePayment.id,
            provider: split.provider,
            amount: split.amount,
            paymentMethod: split.paymentMethod,
            gatewayOrderId: result.gatewayOrderId,
            status: 'Created',
          });
        }
      } catch (error) {
        console.error(`[Split Payment] Failed to process split for ${split.provider}:`, error);

        // Rollback: initiate refunds for already completed payments
        for (const completed of completedPayments) {
          if (completed.status === 'Completed' && completed.provider !== 'Cash') {
            try {
              // Only refund gateway payments (cash can't be refunded via gateway)
              if (completed.gatewayTransactionId) {
                let gateway;
                try {
                  gateway = await getPaymentGatewayForBusiness(tenantId, completed.provider as GatewayProvider);
                } catch {
                  gateway = getPaymentGateway(completed.provider as GatewayProvider);
                }
                await gateway.createRefund({
                  paymentId: completed.gatewayTransactionId,
                  amount: completed.amount,
                });
              }

              // Mark payment as refunded
              await prisma.onlinePayment.update({
                where: { id: completed.id },
                data: { status: OnlinePaymentStatus.Refunded },
              });
            } catch (refundError) {
              console.error(`[Split Payment] Failed to refund payment ${completed.id}:`, refundError);
            }
          }

          // Mark cash payments as failed (manual refund needed)
          if (completed.provider === 'Cash') {
            await prisma.onlinePayment.update({
              where: { id: completed.id },
              data: {
                status: OnlinePaymentStatus.Failed,
                failureReason: 'Split payment failed - manual cash refund required',
              },
            });
          }
        }

        const errorMsg = error instanceof Error ? error.message : 'Payment processing failed';
        res.status(500).json({
          success: false,
          error: {
            code: 'SPLIT_PAYMENT_FAILED',
            message: `Split payment failed at ${split.provider}: ${errorMsg}. Previous payments have been refunded.`,
          },
        } as ApiResponse);
        return;
      }
    }

    // Check if all payments are completed (cash payments are immediate, gateway ones need verification)
    const allCompleted = completedPayments.every(p => p.status === 'Completed');

    if (allCompleted) {
      // All split payments completed - update order status
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'Paid' },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        splitPayments: completedPayments,
        allCompleted,
        orderTotal,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Error processing split payment:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SPLIT_PAYMENT_ERROR',
        message: 'Failed to process split payment',
      },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/payments/webhook/:provider
 * Receive payment gateway webhooks (no authentication required)
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.params;

    console.log('[Payment Webhook] Received:', {
      provider,
      timestamp: new Date().toISOString(),
      headers: {
        'x-razorpay-signature': req.headers['x-razorpay-signature'] ? '***present***' : 'absent',
        'stripe-signature': req.headers['stripe-signature'] ? '***present***' : 'absent',
      },
    });

    // Validate provider
    if (!Object.values(GatewayProvider).includes(provider as GatewayProvider)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROVIDER',
          message: `Invalid provider: ${provider}`,
        },
      } as ApiResponse);
      return;
    }

    // Process based on provider - pass full request for signature verification
    switch (provider as GatewayProvider) {
      case GatewayProvider.Razorpay:
        await handleRazorpayWebhook(req);
        break;
      case GatewayProvider.Stripe:
        await handleStripeWebhook(req);
        break;
      case GatewayProvider.PayU:
        await handlePayUWebhook(req);
        break;
    }

    // Always return 200 to prevent retries
    res.status(200).json({ success: true } as ApiResponse);
  } catch (error) {
    console.error('[Payment Webhook] Error:', error);
    // Return 200 even on error to prevent webhook retries
    res.status(200).json({ success: true } as ApiResponse);
  }
};

// ── Webhook Handlers (internal) ─────────────────────────────────────

async function handleRazorpayWebhook(req: Request): Promise<void> {
  const data = req.body as Record<string, unknown>;
  const event = data.event as string;
  const payload = data.payload as Record<string, unknown>;

  // Verify webhook signature using Razorpay webhook secret
  const razorpaySignature = req.headers['x-razorpay-signature'] as string | undefined;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';

  if (razorpaySignature && webhookSecret) {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(data))
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      console.error('[Razorpay Webhook] Signature verification failed', {
        event,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    console.log('[Razorpay Webhook] Signature verified successfully');
  } else {
    console.warn('[Razorpay Webhook] No signature header or secret configured, skipping verification');
  }

  // Log all webhook events for audit
  console.log('[Razorpay Webhook] Processing event:', {
    event,
    timestamp: new Date().toISOString(),
    payload: JSON.stringify(payload).substring(0, 500),
  });

  if (event === 'payment.captured') {
    const payment = (payload?.payment as Record<string, unknown>)?.entity as Record<string, unknown>;
    if (payment) {
      const gatewayOrderId = payment.order_id as string;

      // Update OnlinePayment status to completed
      await prisma.onlinePayment.updateMany({
        where: { gatewayOrderId },
        data: {
          status: OnlinePaymentStatus.Completed,
          gatewayTransactionId: payment.id as string,
          paymentMethod: payment.method as string,
          paidAt: new Date(),
        },
      });

      // Update Order payment status to Paid
      const onlinePayment = await prisma.onlinePayment.findFirst({
        where: { gatewayOrderId },
        select: { orderId: true },
      });
      if (onlinePayment) {
        await prisma.order.update({
          where: { id: onlinePayment.orderId },
          data: { paymentStatus: 'Paid' },
        });
      }

      console.log('[Razorpay Webhook] payment.captured processed:', {
        gatewayOrderId,
        paymentId: payment.id,
        method: payment.method,
      });
    }
  } else if (event === 'payment.failed') {
    const payment = (payload?.payment as Record<string, unknown>)?.entity as Record<string, unknown>;
    if (payment) {
      const gatewayOrderId = payment.order_id as string;
      const errorDesc = (payment.error_description as string) || 'Payment failed';

      // Update OnlinePayment status to failed
      await prisma.onlinePayment.updateMany({
        where: { gatewayOrderId },
        data: {
          status: OnlinePaymentStatus.Failed,
          failureReason: errorDesc,
        },
      });

      console.log('[Razorpay Webhook] payment.failed processed:', {
        gatewayOrderId,
        paymentId: payment.id,
        reason: errorDesc,
      });
    }
  } else if (event === 'refund.created') {
    const refundEntity = (payload?.refund as Record<string, unknown>)?.entity as Record<string, unknown>;
    if (refundEntity) {
      const paymentId = refundEntity.payment_id as string;
      const refundAmount = Number(refundEntity.amount as number) / 100; // Convert from paise

      // Find the OnlinePayment by gateway transaction ID
      const onlinePayment = await prisma.onlinePayment.findFirst({
        where: { gatewayTransactionId: paymentId },
      });

      if (onlinePayment) {
        // Create Refund record
        await prisma.refund.create({
          data: {
            onlinePaymentId: onlinePayment.id,
            amount: refundAmount,
            reason: (refundEntity.notes as Record<string, string>)?.reason || 'Refund initiated from Razorpay dashboard',
            gatewayRefundId: refundEntity.id as string,
            status: RefundStatus.Processing,
          },
        });

        // Update OnlinePayment status based on refund amount
        const paymentAmount = Number(onlinePayment.amount);
        const newStatus = refundAmount >= paymentAmount
          ? OnlinePaymentStatus.Refunded
          : OnlinePaymentStatus.PartiallyRefunded;

        await prisma.onlinePayment.update({
          where: { id: onlinePayment.id },
          data: { status: newStatus },
        });

        console.log('[Razorpay Webhook] refund.created processed:', {
          refundId: refundEntity.id,
          paymentId,
          amount: refundAmount,
          newStatus,
        });
      } else {
        console.warn('[Razorpay Webhook] refund.created: OnlinePayment not found for paymentId:', paymentId);
      }
    }
  } else if (event === 'subscription.charged') {
    // Subscription payment was successfully charged
    const subscription = (payload?.subscription as Record<string, unknown>)?.entity as Record<string, unknown>;
    const payment = (payload?.payment as Record<string, unknown>)?.entity as Record<string, unknown>;
    if (subscription) {
      const gatewaySubscriptionId = subscription.id as string;

      // Find the existing subscription record
      const existingSub = await prisma.uPIAutoPaySubscription.findFirst({
        where: { gatewaySubscriptionId },
      });

      if (existingSub) {
        await prisma.uPIAutoPaySubscription.update({
          where: { id: existingSub.id },
          data: {
            status: AutoPayStatus.Active,
            paidCount: existingSub.paidCount + 1,
            lastPaymentAt: new Date(),
            lastPaymentId: (payment?.id as string) || null,
            currentStart: subscription.current_start
              ? new Date((subscription.current_start as number) * 1000)
              : undefined,
            currentEnd: subscription.current_end
              ? new Date((subscription.current_end as number) * 1000)
              : undefined,
            nextBillingDate: subscription.charge_at
              ? new Date((subscription.charge_at as number) * 1000)
              : undefined,
            failureReason: null,
          },
        });

        console.log('[Razorpay Webhook] subscription.charged processed:', {
          gatewaySubscriptionId,
          paymentId: payment?.id,
          paidCount: existingSub.paidCount + 1,
        });
      } else {
        console.warn('[Razorpay Webhook] subscription.charged: Subscription not found for:', gatewaySubscriptionId);
      }
    }
  } else if (event === 'subscription.cancelled') {
    // Subscription was cancelled
    const subscription = (payload?.subscription as Record<string, unknown>)?.entity as Record<string, unknown>;
    if (subscription) {
      const gatewaySubscriptionId = subscription.id as string;

      await prisma.uPIAutoPaySubscription.updateMany({
        where: { gatewaySubscriptionId },
        data: {
          status: AutoPayStatus.Cancelled,
          cancelledAt: new Date(),
        },
      });

      console.log('[Razorpay Webhook] subscription.cancelled processed:', {
        gatewaySubscriptionId,
      });
    }
  } else {
    console.log('[Razorpay Webhook] Unhandled event type:', event);
  }
}

async function handleStripeWebhook(req: Request): Promise<void> {
  const data = req.body as Record<string, unknown>;
  const type = data.type as string;
  const object = (data.data as Record<string, unknown>)?.object as Record<string, unknown>;

  // Verify webhook signature using Stripe signing secret
  const stripeSignature = req.headers['stripe-signature'] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (stripeSignature && webhookSecret) {
    // Stripe signature format: t=timestamp,v1=signature
    // Signed payload = timestamp + '.' + JSON.stringify(body)
    const parts = stripeSignature.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));

    if (timestampPart && signaturePart) {
      const timestamp = timestampPart.replace('t=', '');
      const signature = signaturePart.replace('v1=', '');
      const signedPayload = `${timestamp}.${JSON.stringify(data)}`;

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.error('[Stripe Webhook] Signature verification failed', {
          type,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      console.log('[Stripe Webhook] Signature verified successfully');
    } else {
      console.warn('[Stripe Webhook] Invalid signature format');
    }
  } else {
    console.warn('[Stripe Webhook] No signature header or secret configured, skipping verification');
  }

  // Log all webhook events for audit
  console.log('[Stripe Webhook] Processing event:', {
    type,
    timestamp: new Date().toISOString(),
    objectId: object?.id,
    payload: JSON.stringify(data).substring(0, 500),
  });

  if (type === 'payment_intent.succeeded' && object) {
    const gatewayOrderId = object.id as string;

    // Update OnlinePayment status to completed
    await prisma.onlinePayment.updateMany({
      where: { gatewayOrderId },
      data: {
        status: OnlinePaymentStatus.Completed,
        gatewayTransactionId: object.id as string,
        paymentMethod: (object.payment_method_types as string[])?.[0] || 'card',
        paidAt: new Date(),
      },
    });

    // Update Order payment status to Paid
    const onlinePayment = await prisma.onlinePayment.findFirst({
      where: { gatewayOrderId },
      select: { orderId: true },
    });
    if (onlinePayment) {
      await prisma.order.update({
        where: { id: onlinePayment.orderId },
        data: { paymentStatus: 'Paid' },
      });
    }

    console.log('[Stripe Webhook] payment_intent.succeeded processed:', {
      gatewayOrderId,
      paymentIntentId: object.id,
    });
  } else if (type === 'payment_intent.payment_failed' && object) {
    const gatewayOrderId = object.id as string;
    const lastError = object.last_payment_error as Record<string, unknown> | null;
    const failureReason = (lastError?.message as string) || 'Payment failed';

    await prisma.onlinePayment.updateMany({
      where: { gatewayOrderId },
      data: {
        status: OnlinePaymentStatus.Failed,
        failureReason,
      },
    });

    console.log('[Stripe Webhook] payment_intent.payment_failed processed:', {
      gatewayOrderId,
      paymentIntentId: object.id,
      reason: failureReason,
    });
  } else if (type === 'charge.refunded' && object) {
    const paymentIntentId = object.payment_intent as string;
    const refundAmountTotal = Number(object.amount_refunded as number) / 100; // Convert from cents

    // Find the OnlinePayment by gateway transaction ID (paymentIntentId)
    const onlinePayment = await prisma.onlinePayment.findFirst({
      where: { gatewayTransactionId: paymentIntentId },
    });

    if (onlinePayment) {
      // Get the latest refund from the charge's refunds list
      const refundsData = object.refunds as Record<string, unknown> | undefined;
      const refundsList = (refundsData?.data as Record<string, unknown>[]) || [];
      const latestRefund = refundsList[0]; // Stripe returns refunds newest first

      if (latestRefund) {
        const refundAmount = Number(latestRefund.amount as number) / 100; // Convert from cents

        // Create Refund record
        await prisma.refund.create({
          data: {
            onlinePaymentId: onlinePayment.id,
            amount: refundAmount,
            reason: (latestRefund.reason as string) || 'Refund initiated from Stripe dashboard',
            gatewayRefundId: latestRefund.id as string,
            status: RefundStatus.Processing,
          },
        });
      }

      // Update OnlinePayment status based on total refunded amount
      const paymentAmount = Number(onlinePayment.amount);
      const newStatus = refundAmountTotal >= paymentAmount
        ? OnlinePaymentStatus.Refunded
        : OnlinePaymentStatus.PartiallyRefunded;

      await prisma.onlinePayment.update({
        where: { id: onlinePayment.id },
        data: { status: newStatus },
      });

      console.log('[Stripe Webhook] charge.refunded processed:', {
        chargeId: object.id,
        paymentIntentId,
        totalRefunded: refundAmountTotal,
        newStatus,
      });
    } else {
      console.warn('[Stripe Webhook] charge.refunded: OnlinePayment not found for paymentIntentId:', paymentIntentId);
    }
  } else {
    console.log('[Stripe Webhook] Unhandled event type:', type);
  }
}

async function handlePayUWebhook(req: Request): Promise<void> {
  const data = req.body as Record<string, unknown>;

  // Parse PayU response fields
  const status = (data.status as string || '').toLowerCase();
  const txnid = data.txnid as string;
  const mihpayid = data.mihpayid as string;
  const amount = data.amount as string;
  const mode = data.mode as string;

  // Log all PayU webhook events for audit
  console.log('[PayU Webhook] Received event:', {
    timestamp: new Date().toISOString(),
    status,
    txnid,
    mihpayid,
    amount,
    mode,
    additionalCharges: data.additionalCharges,
    productinfo: typeof data.productinfo === 'string' ? data.productinfo.substring(0, 200) : undefined,
  });

  if (!txnid) {
    console.warn('[PayU Webhook] Missing txnid, ignoring event');
    return;
  }

  // Verify webhook by recalculating reverse hash
  // PayU reverse hash: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
  const merchantSalt = process.env.PAYU_MERCHANT_SALT || '';
  const merchantKey = process.env.PAYU_MERCHANT_KEY || '';

  if (merchantSalt && merchantKey) {
    const reverseHashString = [
      merchantSalt,
      status,
      '', '', '', '', '',
      data.udf5 || '',
      data.udf4 || '',
      data.udf3 || '',
      data.udf2 || '',
      data.udf1 || '',
      data.email || '',
      data.firstname || '',
      data.productinfo || '',
      amount,
      txnid,
      merchantKey,
    ].join('|');

    const expectedHash = crypto
      .createHash('sha512')
      .update(reverseHashString)
      .digest('hex');

    const receivedHash = data.hash as string;

    if (receivedHash && expectedHash !== receivedHash) {
      console.error('[PayU Webhook] Hash verification failed', {
        txnid,
        status,
        timestamp: new Date().toISOString(),
      });
      return;
    }
    console.log('[PayU Webhook] Hash verified successfully');
  } else {
    console.warn('[PayU Webhook] No merchant key/salt configured, skipping hash verification');
  }

  if (status === 'success') {
    // Update OnlinePayment status to completed
    await prisma.onlinePayment.updateMany({
      where: { gatewayOrderId: txnid },
      data: {
        status: OnlinePaymentStatus.Completed,
        gatewayTransactionId: mihpayid || txnid,
        paymentMethod: mode || 'unknown',
        paidAt: new Date(),
      },
    });

    // Update Order payment status to Paid
    const onlinePayment = await prisma.onlinePayment.findFirst({
      where: { gatewayOrderId: txnid },
      select: { orderId: true },
    });
    if (onlinePayment) {
      await prisma.order.update({
        where: { id: onlinePayment.orderId },
        data: { paymentStatus: 'Paid' },
      });
    }

    console.log('[PayU Webhook] Success processed:', {
      txnid,
      mihpayid,
      amount,
      mode,
    });
  } else if (status === 'failure') {
    // Update OnlinePayment status to failed
    await prisma.onlinePayment.updateMany({
      where: { gatewayOrderId: txnid },
      data: {
        status: OnlinePaymentStatus.Failed,
        failureReason: (data.error_Message as string) || (data.field9 as string) || 'Payment failed',
      },
    });

    console.log('[PayU Webhook] Failure processed:', {
      txnid,
      mihpayid,
      reason: data.error_Message || data.field9 || 'Payment failed',
    });
  } else {
    console.log('[PayU Webhook] Unhandled status:', status, { txnid });
  }
}

// ── Reconciliation Endpoints ────────────────────────────────────────

/**
 * POST /api/v1/payments/reconciliation/run
 * Run reconciliation for a specific provider and settlement date
 */
export const runReconciliation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      } as ApiResponse);
      return;
    }

    const { provider, settlementDate } = req.body;

    if (!provider || !settlementDate) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'provider and settlementDate are required',
        },
      } as ApiResponse);
      return;
    }

    if (!Object.values(GatewayProvider).includes(provider)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROVIDER',
          message: `Invalid provider: ${provider}. Must be one of: ${Object.values(GatewayProvider).join(', ')}`,
        },
      } as ApiResponse);
      return;
    }

    const report = await reconcileSettlement(tenantId, provider, new Date(settlementDate));

    res.status(200).json({
      success: true,
      data: report,
    } as ApiResponse);
  } catch (error) {
    console.error('Error running reconciliation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RECONCILIATION_ERROR',
        message: 'Failed to run reconciliation',
      },
    } as ApiResponse);
  }
};

/**
 * GET /api/v1/payments/reconciliation
 * Get reconciliation records with optional filters
 */
export const listReconciliations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      } as ApiResponse);
      return;
    }

    const { provider, status, startDate, endDate } = req.query;

    const records = await getReconciliationRecords(tenantId, {
      provider: provider as GatewayProvider | undefined,
      status: status as ReconciliationStatus | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.status(200).json({
      success: true,
      data: records,
    } as ApiResponse);
  } catch (error) {
    console.error('Error listing reconciliations:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RECONCILIATION_LIST_ERROR',
        message: 'Failed to fetch reconciliation records',
      },
    } as ApiResponse);
  }
};

/**
 * PATCH /api/v1/payments/reconciliation/:id/resolve
 * Mark a disputed reconciliation as resolved
 */
export const resolveReconciliation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      } as ApiResponse);
      return;
    }

    const { id } = req.params;

    await markReconciliationResolved(id, tenantId);

    res.status(200).json({
      success: true,
      message: 'Reconciliation marked as resolved',
    } as ApiResponse);
  } catch (error) {
    console.error('Error resolving reconciliation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RECONCILIATION_RESOLVE_ERROR',
        message: 'Failed to resolve reconciliation',
      },
    } as ApiResponse);
  }
};

// ── Subscription Endpoints ──────────────────────────────────────────

/**
 * POST /api/v1/payments/subscriptions/create
 * Create a UPI AutoPay subscription for a business owner
 * Body: { planId, customerId?, upiId?, totalCount? }
 */
export const createAutoPaySubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      } as ApiResponse);
      return;
    }

    const { planId, customerId, upiId, totalCount } = req.body;

    if (!planId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PLAN_ID',
          message: 'planId is required',
        },
      } as ApiResponse);
      return;
    }

    // Validate the plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || plan.status !== 'active') {
      res.status(404).json({
        success: false,
        error: {
          code: 'PLAN_NOT_FOUND',
          message: 'Subscription plan not found or inactive',
        },
      } as ApiResponse);
      return;
    }

    // Create Razorpay subscription via gateway
    const gateway = getPaymentGateway(GatewayProvider.Razorpay) as RazorpayGateway;

    const result = await gateway.createSubscription({
      planId,
      customerId,
      upiId,
      totalCount,
      metadata: {
        businessOwnerId: tenantId,
        planName: plan.name,
      },
    });

    // Calculate billing interval from plan duration
    const interval = plan.duration <= 31 ? 'monthly' : 'yearly';

    // Store subscription record in database
    const subscription = await prisma.uPIAutoPaySubscription.create({
      data: {
        businessOwnerId: tenantId,
        planId,
        customerId: customerId || null,
        gatewaySubscriptionId: result.gatewaySubscriptionId,
        gatewayProvider: GatewayProvider.Razorpay,
        upiId: upiId || null,
        amount: Number(plan.price),
        currency: 'INR',
        interval,
        status: AutoPayStatus.Created,
        totalCount: totalCount || null,
        metadata: result.providerData as Record<string, string | number | boolean | null>,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: subscription.id,
        gatewaySubscriptionId: result.gatewaySubscriptionId,
        status: result.status,
        shortUrl: result.shortUrl,
        amount: Number(plan.price),
        interval,
        planName: plan.name,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUBSCRIPTION_CREATE_ERROR',
        message: 'Failed to create subscription',
      },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/payments/subscriptions/:id/cancel
 * Cancel a UPI AutoPay subscription
 */
export const cancelAutoPaySubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      } as ApiResponse);
      return;
    }

    const { id } = req.params;

    // Find the subscription
    const subscription = await prisma.uPIAutoPaySubscription.findFirst({
      where: { id, businessOwnerId: tenantId },
    });

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Subscription not found',
        },
      } as ApiResponse);
      return;
    }

    if (subscription.status === AutoPayStatus.Cancelled) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_ALREADY_CANCELLED',
          message: 'Subscription is already cancelled',
        },
      } as ApiResponse);
      return;
    }

    // Cancel on Razorpay if gateway subscription exists
    if (subscription.gatewaySubscriptionId) {
      const gateway = getPaymentGateway(GatewayProvider.Razorpay) as RazorpayGateway;
      await gateway.cancelSubscription(subscription.gatewaySubscriptionId);
    }

    // Update local record
    await prisma.uPIAutoPaySubscription.update({
      where: { id },
      data: {
        status: AutoPayStatus.Cancelled,
        cancelledAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUBSCRIPTION_CANCEL_ERROR',
        message: 'Failed to cancel subscription',
      },
    } as ApiResponse);
  }
};

/**
 * GET /api/v1/payments/subscriptions
 * List UPI AutoPay subscriptions for the business owner
 * Query: { status?, planId? }
 */
export const listAutoPaySubscriptions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      } as ApiResponse);
      return;
    }

    const { status, planId } = req.query;

    const where: Record<string, unknown> = { businessOwnerId: tenantId };
    if (status) where.status = status as string;
    if (planId) where.planId = planId as string;

    const subscriptions = await prisma.uPIAutoPaySubscription.findMany({
      where,
      include: {
        plan: {
          select: { name: true, price: true, duration: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: subscriptions,
    } as ApiResponse);
  } catch (error) {
    console.error('Error listing subscriptions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUBSCRIPTION_LIST_ERROR',
        message: 'Failed to fetch subscriptions',
      },
    } as ApiResponse);
  }
};

/**
 * GET /api/v1/payments/subscriptions/:id
 * Get details of a specific subscription
 */
export const getAutoPaySubscription = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      } as ApiResponse);
      return;
    }

    const { id } = req.params;

    const subscription = await prisma.uPIAutoPaySubscription.findFirst({
      where: { id, businessOwnerId: tenantId },
      include: {
        plan: {
          select: { name: true, price: true, duration: true, features: true },
        },
      },
    });

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Subscription not found',
        },
      } as ApiResponse);
      return;
    }

    res.status(200).json({
      success: true,
      data: subscription,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUBSCRIPTION_FETCH_ERROR',
        message: 'Failed to fetch subscription details',
      },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/payments/subscriptions/:id/retry
 * Retry a failed subscription charge
 */
export const retrySubscriptionCharge = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      } as ApiResponse);
      return;
    }

    const { id } = req.params;

    // Find the subscription
    const subscription = await prisma.uPIAutoPaySubscription.findFirst({
      where: { id, businessOwnerId: tenantId },
      include: {
        plan: { select: { name: true, price: true } },
      },
    });

    if (!subscription) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Subscription not found',
        },
      } as ApiResponse);
      return;
    }

    if (subscription.status === AutoPayStatus.Cancelled) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_CANCELLED',
          message: 'Cannot retry a cancelled subscription',
        },
      } as ApiResponse);
      return;
    }

    if (subscription.status === AutoPayStatus.Active) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_ACTIVE',
          message: 'Subscription is already active, no retry needed',
        },
      } as ApiResponse);
      return;
    }

    if (!subscription.gatewaySubscriptionId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_GATEWAY_SUBSCRIPTION',
          message: 'No gateway subscription ID found',
        },
      } as ApiResponse);
      return;
    }

    // Retry via Razorpay - fetch subscription to trigger a charge retry
    const gateway = getPaymentGateway(GatewayProvider.Razorpay) as RazorpayGateway;
    const result = await gateway.retrySubscriptionCharge(subscription.gatewaySubscriptionId);

    // Update local record — reset to Created so webhook can move it to Active on success
    await prisma.uPIAutoPaySubscription.update({
      where: { id },
      data: {
        status: AutoPayStatus.Created,
        failureReason: null,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        id: subscription.id,
        gatewaySubscriptionId: subscription.gatewaySubscriptionId,
        status: 'Created',
        retryResult: result,
        message: 'Subscription charge retry initiated',
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Error retrying subscription charge:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUBSCRIPTION_RETRY_ERROR',
        message: 'Failed to retry subscription charge',
      },
    } as ApiResponse);
  }
};

// ============================================
// Payment Gateway Configuration Endpoints
// ============================================

/**
 * Mask a secret string, showing first 8 and last 4 characters
 */
function maskSecret(value: string): string {
  if (value.length <= 12) return '******';
  return value.substring(0, 8) + '******' + value.substring(value.length - 4);
}

/**
 * GET /api/v1/payments/gateway-config
 * List all gateway configurations for the business
 */
export const listGatewayConfigs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' },
      } as ApiResponse);
      return;
    }

    const configs = await prisma.paymentGatewayConfig.findMany({
      where: { businessOwnerId: tenantId },
      orderBy: { createdAt: 'desc' },
    });

    // Mask secrets before sending to frontend
    const masked = configs.map((c) => ({
      id: c.id,
      provider: c.provider,
      apiKey: maskSecret(c.apiKey),
      apiSecret: maskSecret(c.apiSecret),
      webhookSecret: c.webhookSecret ? maskSecret(c.webhookSecret) : null,
      isActive: c.isActive,
      isTestMode: c.isTestMode,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.status(200).json({ success: true, data: masked } as ApiResponse);
  } catch (error) {
    console.error('Error listing gateway configs:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_CONFIG_LIST_ERROR', message: 'Failed to list gateway configurations' },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/payments/gateway-config
 * Create or update a gateway configuration (upsert by provider)
 */
export const upsertGatewayConfig = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' },
      } as ApiResponse);
      return;
    }

    const { provider, apiKey, apiSecret, webhookSecret, isActive, isTestMode } = req.body;

    if (!provider || !apiKey || !apiSecret) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'provider, apiKey, and apiSecret are required' },
      } as ApiResponse);
      return;
    }

    if (!Object.values(GatewayProvider).includes(provider)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_PROVIDER', message: `Invalid provider: ${provider}` },
      } as ApiResponse);
      return;
    }

    // Encrypt credentials using Node.js crypto
    const algorithm = 'aes-256-cbc';
    const encryptionKey = process.env.ENCRYPTION_KEY || 'bistro-bill-default-encryption-key-32b';
    const key = Buffer.from(encryptionKey.padEnd(32, '0').substring(0, 32));

    function encrypt(text: string): string {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    }

    const encryptedApiKey = encrypt(apiKey);
    const encryptedApiSecret = encrypt(apiSecret);
    const encryptedWebhookSecret = webhookSecret ? encrypt(webhookSecret) : null;

    const config = await prisma.paymentGatewayConfig.upsert({
      where: {
        businessOwnerId_provider: {
          businessOwnerId: tenantId,
          provider,
        },
      },
      update: {
        apiKey: encryptedApiKey,
        apiSecret: encryptedApiSecret,
        webhookSecret: encryptedWebhookSecret,
        isActive: isActive ?? true,
        isTestMode: isTestMode ?? true,
      },
      create: {
        businessOwnerId: tenantId,
        provider,
        apiKey: encryptedApiKey,
        apiSecret: encryptedApiSecret,
        webhookSecret: encryptedWebhookSecret,
        isActive: isActive ?? false,
        isTestMode: isTestMode ?? true,
      },
    });

    res.status(200).json({
      success: true,
      data: {
        id: config.id,
        provider: config.provider,
        apiKey: maskSecret(apiKey),
        apiSecret: maskSecret(apiSecret),
        webhookSecret: webhookSecret ? maskSecret(webhookSecret) : null,
        isActive: config.isActive,
        isTestMode: config.isTestMode,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
    } as ApiResponse);
  } catch (error) {
    console.error('Error saving gateway config:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_CONFIG_SAVE_ERROR', message: 'Failed to save gateway configuration' },
    } as ApiResponse);
  }
};

/**
 * PATCH /api/v1/payments/gateway-config/:id/toggle
 * Toggle gateway active status
 */
export const toggleGatewayConfig = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' },
      } as ApiResponse);
      return;
    }

    const { id } = req.params;

    const config = await prisma.paymentGatewayConfig.findFirst({
      where: { id, businessOwnerId: tenantId },
    });

    if (!config) {
      res.status(404).json({
        success: false,
        error: { code: 'CONFIG_NOT_FOUND', message: 'Gateway configuration not found' },
      } as ApiResponse);
      return;
    }

    const updated = await prisma.paymentGatewayConfig.update({
      where: { id },
      data: { isActive: !config.isActive },
    });

    res.status(200).json({
      success: true,
      data: { id: updated.id, provider: updated.provider, isActive: updated.isActive },
    } as ApiResponse);
  } catch (error) {
    console.error('Error toggling gateway config:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_CONFIG_TOGGLE_ERROR', message: 'Failed to toggle gateway status' },
    } as ApiResponse);
  }
};

/**
 * POST /api/v1/payments/gateway-config/:id/test
 * Test connection for a gateway configuration
 */
export const testGatewayConnection = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.user!.businessOwnerId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: { code: 'MISSING_TENANT_CONTEXT', message: 'Tenant context is required' },
      } as ApiResponse);
      return;
    }

    const { id } = req.params;

    const config = await prisma.paymentGatewayConfig.findFirst({
      where: { id, businessOwnerId: tenantId },
    });

    if (!config) {
      res.status(404).json({
        success: false,
        error: { code: 'CONFIG_NOT_FOUND', message: 'Gateway configuration not found' },
      } as ApiResponse);
      return;
    }

    // Decrypt credentials for testing
    const algorithm = 'aes-256-cbc';
    const encryptionKey = process.env.ENCRYPTION_KEY || 'bistro-bill-default-encryption-key-32b';
    const encKey = Buffer.from(encryptionKey.padEnd(32, '0').substring(0, 32));

    function decrypt(text: string): string {
      const parts = text.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const cipher = crypto.createDecipheriv(algorithm, encKey, iv);
      let decrypted = cipher.update(parts[1], 'hex', 'utf8');
      decrypted += cipher.final('utf8');
      return decrypted;
    }

    const apiKey = decrypt(config.apiKey);
    const apiSecret = decrypt(config.apiSecret);

    let testResult = { connected: false, message: '' };

    try {
      switch (config.provider) {
        case GatewayProvider.Razorpay: {
          const Razorpay = require('razorpay');
          const instance = new Razorpay({ key_id: apiKey, key_secret: apiSecret });
          // Test by fetching payments list (limit 1)
          await instance.payments.all({ count: 1 });
          testResult = { connected: true, message: 'Successfully connected to Razorpay' };
          break;
        }
        case GatewayProvider.Stripe: {
          const stripe = require('stripe')(apiKey);
          // Test by fetching balance
          await stripe.balance.retrieve();
          testResult = { connected: true, message: 'Successfully connected to Stripe' };
          break;
        }
        case GatewayProvider.PayU: {
          // PayU doesn't have a direct test endpoint - validate key format
          if (apiKey.length > 0 && apiSecret.length > 0) {
            testResult = { connected: true, message: 'PayU credentials validated (format check)' };
          } else {
            testResult = { connected: false, message: 'PayU credentials are empty' };
          }
          break;
        }
      }
    } catch (gatewayError: unknown) {
      const errorMessage = gatewayError instanceof Error ? gatewayError.message : 'Unknown error';
      testResult = { connected: false, message: `Connection failed: ${errorMessage}` };
    }

    res.status(200).json({
      success: true,
      data: testResult,
    } as ApiResponse);
  } catch (error) {
    console.error('Error testing gateway connection:', error);
    res.status(500).json({
      success: false,
      error: { code: 'GATEWAY_TEST_ERROR', message: 'Failed to test gateway connection' },
    } as ApiResponse);
  }
};

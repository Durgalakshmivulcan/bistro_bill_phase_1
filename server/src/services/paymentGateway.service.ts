// Lazy-load optional payment SDKs to avoid crash if not installed
let Razorpay: any;
let Stripe: any;
try { Razorpay = require('razorpay'); } catch { /* optional dependency */ }
try { Stripe = require('stripe'); } catch { /* optional dependency */ }
import crypto from 'crypto';
import axios from 'axios';
import { GatewayProvider } from '@prisma/client';
import { prisma } from './db.service';

// ── Interfaces ──────────────────────────────────────────────────────

export interface CreateOrderParams {
  amount: number; // Amount in base currency unit (e.g., rupees)
  currency: string;
  metadata: {
    orderId: string;
    customerId?: string;
    branchId?: string;
    [key: string]: unknown;
  };
}

export interface CreateOrderResult {
  gatewayOrderId: string;
  amount: number;
  currency: string;
  provider: GatewayProvider;
  /** Razorpay: order_id, Stripe: client_secret, PayU: payment URL + hash */
  providerData: Record<string, unknown>;
}

export interface VerifyPaymentParams {
  paymentId: string;
  orderId: string;
  signature: string;
}

export interface VerifyPaymentResult {
  verified: boolean;
  gatewayTransactionId: string;
  paymentMethod?: string;
}

export interface CreateRefundParams {
  paymentId: string;
  amount: number;
  reason?: string;
}

export interface CreateRefundResult {
  gatewayRefundId: string;
  amount: number;
  status: string;
}

export interface PaymentDetails {
  gatewayTransactionId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  metadata?: Record<string, unknown>;
}

// ── Subscription Interfaces ─────────────────────────────────────────

export interface CreateSubscriptionParams {
  planId: string;
  customerId?: string;
  upiId?: string;
  totalCount?: number; // Number of billing cycles (null = infinite)
  metadata?: Record<string, string>;
}

export interface CreateSubscriptionResult {
  gatewaySubscriptionId: string;
  status: string;
  shortUrl?: string; // URL to authorize the subscription
  providerData: Record<string, unknown>;
}

export interface CancelSubscriptionResult {
  gatewaySubscriptionId: string;
  status: string;
}

export interface SubscriptionDetails {
  gatewaySubscriptionId: string;
  status: string;
  currentStart?: number;
  currentEnd?: number;
  paidCount: number;
  totalCount?: number;
  chargeAt?: number;
}

/**
 * Unified interface for all payment gateway providers.
 * Each provider (Razorpay, Stripe, PayU) implements this interface.
 */
export interface IPaymentGateway {
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;
  createRefund(params: CreateRefundParams): Promise<CreateRefundResult>;
  getPaymentDetails(paymentId: string): Promise<PaymentDetails>;
}

/**
 * Extended interface for gateways that support subscriptions (e.g., Razorpay).
 */
export interface ISubscriptionGateway extends IPaymentGateway {
  createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResult>;
  cancelSubscription(subscriptionId: string): Promise<CancelSubscriptionResult>;
  getSubscriptionDetails(subscriptionId: string): Promise<SubscriptionDetails>;
}

// ── Razorpay Gateway ────────────────────────────────────────────────

export class RazorpayGateway implements ISubscriptionGateway {
  private razorpay: any;
  private keySecret: string;

  constructor(keyId: string, keySecret: string) {
    this.keySecret = keySecret;
    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const order = await this.razorpay.orders.create({
      amount: Math.round(params.amount * 100), // Convert to paise
      currency: params.currency,
      notes: params.metadata as Record<string, string>,
    });

    return {
      gatewayOrderId: order.id,
      amount: params.amount,
      currency: params.currency,
      provider: GatewayProvider.Razorpay,
      providerData: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${params.orderId}|${params.paymentId}`)
      .digest('hex');

    const verified = expectedSignature === params.signature;

    return {
      verified,
      gatewayTransactionId: params.paymentId,
    };
  }

  async createRefund(params: CreateRefundParams): Promise<CreateRefundResult> {
    const refundOptions: Record<string, unknown> = {
      amount: Math.round(params.amount * 100), // Convert to paise
    };
    if (params.reason) {
      refundOptions.notes = { reason: params.reason };
    }

    const refund = await this.razorpay.payments.refund(params.paymentId, refundOptions);

    return {
      gatewayRefundId: refund.id,
      amount: Number(refund.amount) / 100,
      status: refund.status ?? 'processed',
    };
  }

  async getPaymentDetails(paymentId: string): Promise<PaymentDetails> {
    const payment = await this.razorpay.payments.fetch(paymentId);

    return {
      gatewayTransactionId: payment.id,
      amount: Number(payment.amount) / 100,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.method,
    };
  }

  // ── Subscription Methods ───────────────────────────────────────

  async createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResult> {
    const subscriptionOptions: Record<string, unknown> = {
      plan_id: params.planId,
      customer_notify: 1,
    };

    if (params.totalCount) {
      subscriptionOptions.total_count = params.totalCount;
    }

    if (params.metadata) {
      subscriptionOptions.notes = params.metadata;
    }

    // For UPI AutoPay, set payment method to emandate/upi
    if (params.upiId) {
      subscriptionOptions.notes = {
        ...(subscriptionOptions.notes as Record<string, string> || {}),
        upi_id: params.upiId,
      };
    }

    const subscription = await (this.razorpay as unknown as {
      subscriptions: {
        create: (opts: Record<string, unknown>) => Promise<Record<string, unknown>>;
      };
    }).subscriptions.create(subscriptionOptions);

    return {
      gatewaySubscriptionId: subscription.id as string,
      status: subscription.status as string,
      shortUrl: subscription.short_url as string | undefined,
      providerData: {
        subscription_id: subscription.id,
        plan_id: subscription.plan_id,
        status: subscription.status,
        short_url: subscription.short_url,
        charge_at: subscription.charge_at,
        current_start: subscription.current_start,
        current_end: subscription.current_end,
      },
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<CancelSubscriptionResult> {
    const subscription = await (this.razorpay as unknown as {
      subscriptions: {
        cancel: (id: string, cancelAtCycleEnd?: boolean) => Promise<Record<string, unknown>>;
      };
    }).subscriptions.cancel(subscriptionId, false);

    return {
      gatewaySubscriptionId: subscription.id as string,
      status: subscription.status as string,
    };
  }

  async retrySubscriptionCharge(subscriptionId: string): Promise<{ status: string; chargeAt?: number }> {
    // Fetch current subscription state from Razorpay
    const subscription = await (this.razorpay as unknown as {
      subscriptions: {
        fetch: (id: string) => Promise<Record<string, unknown>>;
      };
    }).subscriptions.fetch(subscriptionId);

    // If subscription is halted or pending, Razorpay auto-retries on next charge cycle.
    // We return the current state so the caller can update local records.
    return {
      status: subscription.status as string,
      chargeAt: subscription.charge_at as number | undefined,
    };
  }

  async getSubscriptionDetails(subscriptionId: string): Promise<SubscriptionDetails> {
    const subscription = await (this.razorpay as unknown as {
      subscriptions: {
        fetch: (id: string) => Promise<Record<string, unknown>>;
      };
    }).subscriptions.fetch(subscriptionId);

    return {
      gatewaySubscriptionId: subscription.id as string,
      status: subscription.status as string,
      currentStart: subscription.current_start as number | undefined,
      currentEnd: subscription.current_end as number | undefined,
      paidCount: (subscription.paid_count as number) || 0,
      totalCount: subscription.total_count as number | undefined,
      chargeAt: subscription.charge_at as number | undefined,
    };
  }
}

// ── Stripe Gateway ──────────────────────────────────────────────────

export class StripeGateway implements IPaymentGateway {
  private stripe: any;
  public webhookSecret: string;

  constructor(secretKey: string, webhookSecret?: string) {
    this.stripe = new Stripe(secretKey);
    this.webhookSecret = webhookSecret || '';
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100), // Smallest currency unit
      currency: params.currency.toLowerCase(),
      metadata: {
        orderId: params.metadata.orderId,
        customerId: params.metadata.customerId || '',
        branchId: params.metadata.branchId || '',
      },
    });

    return {
      gatewayOrderId: paymentIntent.id,
      amount: params.amount,
      currency: params.currency,
      provider: GatewayProvider.Stripe,
      providerData: {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      },
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    // For Stripe, verification is done via webhook or retrieving payment intent
    const paymentIntent = await this.stripe.paymentIntents.retrieve(params.paymentId);

    return {
      verified: paymentIntent.status === 'succeeded',
      gatewayTransactionId: paymentIntent.id,
      paymentMethod: typeof paymentIntent.payment_method === 'string'
        ? paymentIntent.payment_method
        : paymentIntent.payment_method?.id,
    };
  }

  async createRefund(params: CreateRefundParams): Promise<CreateRefundResult> {
    const refundOptions: any = {
      payment_intent: params.paymentId,
      amount: Math.round(params.amount * 100),
    };
    if (params.reason) {
      refundOptions.metadata = { reason: params.reason };
    }

    const refund = await this.stripe.refunds.create(refundOptions);

    return {
      gatewayRefundId: refund.id,
      amount: Number(refund.amount) / 100,
      status: refund.status ?? 'pending',
    };
  }

  async getPaymentDetails(paymentId: string): Promise<PaymentDetails> {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);

    return {
      gatewayTransactionId: paymentIntent.id,
      amount: Number(paymentIntent.amount) / 100,
      currency: paymentIntent.currency.toUpperCase(),
      status: paymentIntent.status,
      paymentMethod: typeof paymentIntent.payment_method === 'string'
        ? paymentIntent.payment_method
        : paymentIntent.payment_method?.id,
      metadata: paymentIntent.metadata as Record<string, unknown>,
    };
  }
}

// ── PayU Gateway ────────────────────────────────────────────────────

const PAYU_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://info.payu.in'
  : 'https://test.payu.in';

export class PayUGateway implements IPaymentGateway {
  private merchantKey: string;
  private merchantSalt: string;

  constructor(merchantKey: string, merchantSalt: string) {
    this.merchantKey = merchantKey;
    this.merchantSalt = merchantSalt;
  }

  private generateHash(input: string): string {
    return crypto.createHash('sha512').update(input).digest('hex');
  }

  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    const txnId = `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const productInfo = JSON.stringify(params.metadata);
    const firstName = (params.metadata.customerName as string) || 'Customer';
    const email = (params.metadata.customerEmail as string) || 'customer@example.com';

    // PayU hash format: key|txnid|amount|productinfo|firstname|email|||||||||||salt
    const hashString = `${this.merchantKey}|${txnId}|${params.amount}|${productInfo}|${firstName}|${email}|||||||||||${this.merchantSalt}`;
    const hash = this.generateHash(hashString);

    return {
      gatewayOrderId: txnId,
      amount: params.amount,
      currency: params.currency,
      provider: GatewayProvider.PayU,
      providerData: {
        key: this.merchantKey,
        txnid: txnId,
        amount: params.amount.toString(),
        productinfo: productInfo,
        firstname: firstName,
        email,
        hash,
        payment_url: `${PAYU_BASE_URL}/_payment`,
      },
    };
  }

  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    // PayU verification: reverse hash check
    // status||||||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    // For simplicity, verify via PayU API
    const command = 'verify_payment';
    const hashInput = `${this.merchantKey}|${command}|${params.orderId}|${this.merchantSalt}`;
    const hash = this.generateHash(hashInput);

    const response = await axios.post(`${PAYU_BASE_URL}/merchant/postservice?form=2`, null, {
      params: {
        key: this.merchantKey,
        command,
        var1: params.orderId,
        hash,
      },
    });

    const txnStatus = response.data?.transaction_details?.[params.orderId]?.status;
    const verified = txnStatus === 'success';

    return {
      verified,
      gatewayTransactionId: params.paymentId,
      paymentMethod: response.data?.transaction_details?.[params.orderId]?.mode,
    };
  }

  async createRefund(params: CreateRefundParams): Promise<CreateRefundResult> {
    const command = 'cancel_refund_transaction';
    const uniqueRequestId = `REF_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const hashInput = `${this.merchantKey}|${command}|${params.paymentId}|${this.merchantSalt}`;
    const hash = this.generateHash(hashInput);

    const response = await axios.post(`${PAYU_BASE_URL}/merchant/postservice?form=2`, null, {
      params: {
        key: this.merchantKey,
        command,
        var1: params.paymentId,
        var2: uniqueRequestId,
        var3: params.amount,
        hash,
      },
    });

    return {
      gatewayRefundId: uniqueRequestId,
      amount: params.amount,
      status: response.data?.status === 1 ? 'processing' : 'failed',
    };
  }

  async getPaymentDetails(paymentId: string): Promise<PaymentDetails> {
    const command = 'verify_payment';
    const hashInput = `${this.merchantKey}|${command}|${paymentId}|${this.merchantSalt}`;
    const hash = this.generateHash(hashInput);

    const response = await axios.post(`${PAYU_BASE_URL}/merchant/postservice?form=2`, null, {
      params: {
        key: this.merchantKey,
        command,
        var1: paymentId,
        hash,
      },
    });

    const txnDetails = response.data?.transaction_details?.[paymentId] || {};

    return {
      gatewayTransactionId: paymentId,
      amount: Number(txnDetails.amt || 0),
      currency: 'INR',
      status: txnDetails.status || 'unknown',
      paymentMethod: txnDetails.mode,
    };
  }
}

// ── Factory Function ────────────────────────────────────────────────

/**
 * Get the appropriate payment gateway instance for a provider.
 * Reads credentials from environment variables.
 */
export function getPaymentGateway(provider: GatewayProvider): IPaymentGateway {
  switch (provider) {
    case GatewayProvider.Razorpay:
      return new RazorpayGateway(
        process.env.RAZORPAY_KEY_ID || '',
        process.env.RAZORPAY_KEY_SECRET || '',
      );

    case GatewayProvider.Stripe:
      return new StripeGateway(
        process.env.STRIPE_SECRET_KEY || '',
        process.env.STRIPE_WEBHOOK_SECRET,
      );

    case GatewayProvider.PayU:
      return new PayUGateway(
        process.env.PAYU_MERCHANT_KEY || '',
        process.env.PAYU_MERCHANT_SALT || '',
      );

    default:
      throw new Error(`Unsupported payment gateway provider: ${provider}`);
  }
}

/**
 * Get a payment gateway using credentials stored in the database for a business owner.
 */
export async function getPaymentGatewayForBusiness(
  businessOwnerId: string,
  provider: GatewayProvider,
): Promise<IPaymentGateway> {
  const config = await prisma.paymentGatewayConfig.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider,
      },
    },
  });

  if (!config || !config.isActive) {
    throw new Error(`Payment gateway ${provider} is not configured or active for this business`);
  }

  switch (provider) {
    case GatewayProvider.Razorpay:
      return new RazorpayGateway(config.apiKey, config.apiSecret);

    case GatewayProvider.Stripe:
      return new StripeGateway(config.apiKey, config.webhookSecret || undefined);

    case GatewayProvider.PayU:
      return new PayUGateway(config.apiKey, config.apiSecret);

    default:
      throw new Error(`Unsupported payment gateway provider: ${provider}`);
  }
}

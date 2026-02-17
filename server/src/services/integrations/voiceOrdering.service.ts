import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

/**
 * Voice Ordering Integration Service (Alexa / Google Assistant)
 *
 * Provides fulfillment webhook handling for voice assistant platforms.
 * Supports intents: OrderProduct, AddToCart, Checkout, OrderStatus.
 * Parses natural language commands and creates orders via account linking.
 *
 * Config stored in Integration model:
 *   platform, skillId, projectId, webhookSecret, defaultBranchId, accountLinkingEnabled
 */

// ---------- Types ----------

export type VoicePlatform = 'alexa' | 'google_assistant';

interface VoiceOrderingConfig {
  platform: VoicePlatform;
  skillId?: string; // Alexa Skill ID
  projectId?: string; // Google Actions project ID
  webhookSecret: string; // Secret for verifying webhook requests
  defaultBranchId: string; // Branch to assign voice orders to
  accountLinkingEnabled: boolean; // Whether account linking is configured
}

export interface VoiceIntent {
  name: string;
  slots: Record<string, string | undefined>;
}

export interface VoiceOrderItem {
  productName: string;
  quantity: number;
}

export interface VoiceFulfillmentRequest {
  platform: VoicePlatform;
  requestId: string;
  intent: VoiceIntent;
  userId?: string; // Linked user account ID (customerId)
  sessionId: string;
  locale: string;
}

export interface VoiceFulfillmentResponse {
  speechText: string;
  shouldEndSession: boolean;
  card?: {
    title: string;
    content: string;
  };
  orderCreated?: boolean;
  orderId?: string;
}

interface VoiceCartSession {
  items: VoiceOrderItem[];
  customerId: string | null;
}

// In-memory session store for voice cart sessions (production should use Redis)
const cartSessions = new Map<string, VoiceCartSession>();

// ---------- Helpers ----------

/**
 * Find the voice ordering integration for a business owner.
 */
async function findIntegration(businessOwnerId: string) {
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'voice_ordering',
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
    console.error('[VoiceOrdering] Failed to write IntegrationLog');
  }
}

/**
 * Parse a natural language order string into structured items.
 * Supports patterns like:
 *   "two large pizzas and a Coke"
 *   "3 burgers"
 *   "one chicken biryani and two mango lassi"
 */
const WORD_TO_NUMBER: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

export function parseNaturalLanguageOrder(text: string): VoiceOrderItem[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Split by "and", commas
  const segments = text
    .toLowerCase()
    .split(/\s+and\s+|,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  const items: VoiceOrderItem[] = [];

  for (const segment of segments) {
    const tokens = segment.split(/\s+/);
    let quantity = 1;
    let nameStart = 0;

    // Check first token for a number (word or digit)
    const firstToken = tokens[0];
    if (WORD_TO_NUMBER[firstToken] !== undefined) {
      quantity = WORD_TO_NUMBER[firstToken];
      nameStart = 1;
    } else {
      const parsed = parseInt(firstToken, 10);
      if (!isNaN(parsed) && parsed > 0) {
        quantity = parsed;
        nameStart = 1;
      }
    }

    const productName = tokens.slice(nameStart).join(' ').trim();
    if (productName.length > 0) {
      items.push({ productName, quantity });
    }
  }

  return items;
}

/**
 * Find a product by name (case-insensitive fuzzy match).
 */
async function findProductByName(name: string, businessOwnerId: string) {
  const products = await prisma.product.findMany({
    where: {
      businessOwnerId,
      name: {
        contains: name,
        mode: 'insensitive',
      },
      status: 'active',
    },
    include: {
      prices: {
        where: { variantId: null },
        take: 1,
      },
    },
    take: 1,
  });

  return products[0] || null;
}

/**
 * Find customer by linked voice assistant userId.
 */
async function findCustomerByVoiceUserId(userId: string, businessOwnerId: string) {
  // Look for customer with voiceAssistantUserId stored in metadata
  const customers = await prisma.customer.findMany({
    where: {
      businessOwnerId,
      notes: {
        contains: `voice_uid:${userId}`,
      },
    },
    take: 1,
  });

  return customers[0] || null;
}

// ---------- Intent Handlers ----------

/**
 * Handle "Order [product]" intent — parse and add items to cart, then checkout.
 */
async function handleOrderIntent(
  request: VoiceFulfillmentRequest,
  businessOwnerId: string,
  config: VoiceOrderingConfig
): Promise<VoiceFulfillmentResponse> {
  const productSlot = request.intent.slots['product'] || request.intent.slots['query'];
  if (!productSlot) {
    return {
      speechText: 'I didn\'t catch what you\'d like to order. Could you please repeat your order?',
      shouldEndSession: false,
    };
  }

  const parsedItems = parseNaturalLanguageOrder(productSlot);
  if (parsedItems.length === 0) {
    return {
      speechText: 'I couldn\'t understand the items. Please say something like "two large pizzas and a Coke".',
      shouldEndSession: false,
    };
  }

  // Resolve products from the menu
  const resolvedItems: Array<{ productId: string; name: string; quantity: number; unitPrice: number }> = [];
  const notFound: string[] = [];

  for (const item of parsedItems) {
    const product = await findProductByName(item.productName, businessOwnerId);
    if (product) {
      resolvedItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice: Number(product.prices[0]?.basePrice ?? 0),
      });
    } else {
      notFound.push(item.productName);
    }
  }

  if (resolvedItems.length === 0) {
    return {
      speechText: `Sorry, I couldn't find ${notFound.join(' or ')} on the menu. Would you like to try something else?`,
      shouldEndSession: false,
    };
  }

  // Find linked customer
  let customerId: string | null = null;
  if (request.userId && config.accountLinkingEnabled) {
    const customer = await findCustomerByVoiceUserId(request.userId, businessOwnerId);
    customerId = customer?.id || null;
  }

  // Create the order
  const subtotal = resolvedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      businessOwnerId,
      branchId: config.defaultBranchId,
      orderNumber: `VO-${Date.now().toString(36).toUpperCase()}`,
      type: 'Delivery',
      source: 'VoiceAssistant',
      customerId,
      staffId: 'system', // Voice orders are system-initiated
      subtotal: new Prisma.Decimal(subtotal),
      taxAmount: new Prisma.Decimal(0),
      total: new Prisma.Decimal(subtotal),
      orderStatus: 'Pending',
      paymentStatus: 'Unpaid',
      notes: `Voice order via ${request.platform}`,
      items: {
        create: resolvedItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          totalPrice: new Prisma.Decimal(item.unitPrice * item.quantity),
        })),
      },
    },
  });

  const itemsSummary = resolvedItems
    .map((i) => `${i.quantity} ${i.name}`)
    .join(', ');

  const notFoundMsg = notFound.length > 0
    ? ` I couldn't find ${notFound.join(' or ')} on the menu.`
    : '';

  return {
    speechText: `Your order has been placed! Order number ${order.orderNumber}. ${itemsSummary}. Total: ${subtotal} rupees.${notFoundMsg} Your order is being prepared.`,
    shouldEndSession: true,
    card: {
      title: `Order #${order.orderNumber}`,
      content: `Items: ${itemsSummary}\nTotal: ₹${subtotal.toFixed(2)}`,
    },
    orderCreated: true,
    orderId: order.id,
  };
}

/**
 * Handle "Add to cart" intent — add items to session cart.
 */
async function handleAddToCartIntent(
  request: VoiceFulfillmentRequest,
  businessOwnerId: string,
  config: VoiceOrderingConfig
): Promise<VoiceFulfillmentResponse> {
  const productSlot = request.intent.slots['product'] || request.intent.slots['query'];
  if (!productSlot) {
    return {
      speechText: 'What would you like to add to your cart?',
      shouldEndSession: false,
    };
  }

  const parsedItems = parseNaturalLanguageOrder(productSlot);
  if (parsedItems.length === 0) {
    return {
      speechText: 'I couldn\'t understand the item. Please try again.',
      shouldEndSession: false,
    };
  }

  // Initialize session cart if needed
  let cart = cartSessions.get(request.sessionId);
  if (!cart) {
    let customerId: string | null = null;
    if (request.userId && config.accountLinkingEnabled) {
      const customer = await findCustomerByVoiceUserId(request.userId, businessOwnerId);
      customerId = customer?.id || null;
    }
    cart = { items: [], customerId };
    cartSessions.set(request.sessionId, cart);
  }

  // Validate products exist
  const addedNames: string[] = [];
  const notFound: string[] = [];

  for (const item of parsedItems) {
    const product = await findProductByName(item.productName, businessOwnerId);
    if (product) {
      // Check if already in cart, update quantity
      const existing = cart.items.find(
        (ci) => ci.productName.toLowerCase() === product.name.toLowerCase()
      );
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        cart.items.push({ productName: product.name, quantity: item.quantity });
      }
      addedNames.push(`${item.quantity} ${product.name}`);
    } else {
      notFound.push(item.productName);
    }
  }

  if (addedNames.length === 0) {
    return {
      speechText: `Sorry, I couldn't find ${notFound.join(' or ')} on the menu. Would you like to try something else?`,
      shouldEndSession: false,
    };
  }

  const cartSummary = cart.items.map((i) => `${i.quantity} ${i.productName}`).join(', ');
  const notFoundMsg = notFound.length > 0
    ? ` I couldn't find ${notFound.join(' or ')}.`
    : '';

  return {
    speechText: `Added ${addedNames.join(' and ')} to your cart.${notFoundMsg} Your cart has: ${cartSummary}. Say "checkout" when you're ready, or add more items.`,
    shouldEndSession: false,
  };
}

/**
 * Handle "Checkout" intent — create order from session cart.
 */
async function handleCheckoutIntent(
  request: VoiceFulfillmentRequest,
  businessOwnerId: string,
  config: VoiceOrderingConfig
): Promise<VoiceFulfillmentResponse> {
  const cart = cartSessions.get(request.sessionId);
  if (!cart || cart.items.length === 0) {
    return {
      speechText: 'Your cart is empty. Please add items before checking out. Say something like "add two pizzas".',
      shouldEndSession: false,
    };
  }

  // Resolve products and prices
  const resolvedItems: Array<{ productId: string; name: string; quantity: number; unitPrice: number }> = [];

  for (const item of cart.items) {
    const product = await findProductByName(item.productName, businessOwnerId);
    if (product) {
      resolvedItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        unitPrice: Number(product.prices[0]?.basePrice ?? 0),
      });
    }
  }

  if (resolvedItems.length === 0) {
    return {
      speechText: 'Something went wrong resolving your cart items. Please try ordering again.',
      shouldEndSession: true,
    };
  }

  const subtotal = resolvedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      businessOwnerId,
      branchId: config.defaultBranchId,
      orderNumber: `VO-${Date.now().toString(36).toUpperCase()}`,
      type: 'Delivery',
      source: 'VoiceAssistant',
      customerId: cart.customerId,
      staffId: 'system',
      subtotal: new Prisma.Decimal(subtotal),
      taxAmount: new Prisma.Decimal(0),
      total: new Prisma.Decimal(subtotal),
      orderStatus: 'Pending',
      paymentStatus: 'Unpaid',
      notes: `Voice order via ${request.platform} (cart checkout)`,
      items: {
        create: resolvedItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          totalPrice: new Prisma.Decimal(item.unitPrice * item.quantity),
        })),
      },
    },
  });

  // Clear session cart
  cartSessions.delete(request.sessionId);

  const itemsSummary = resolvedItems.map((i) => `${i.quantity} ${i.name}`).join(', ');

  return {
    speechText: `Order placed! Order number ${order.orderNumber}. ${itemsSummary}. Total: ${subtotal} rupees. Your order is being prepared.`,
    shouldEndSession: true,
    card: {
      title: `Order #${order.orderNumber}`,
      content: `Items: ${itemsSummary}\nTotal: ₹${subtotal.toFixed(2)}`,
    },
    orderCreated: true,
    orderId: order.id,
  };
}

/**
 * Handle "Order Status" intent — check status of last order.
 */
async function handleOrderStatusIntent(
  request: VoiceFulfillmentRequest,
  businessOwnerId: string,
  config: VoiceOrderingConfig
): Promise<VoiceFulfillmentResponse> {
  let customerId: string | null = null;
  if (request.userId && config.accountLinkingEnabled) {
    const customer = await findCustomerByVoiceUserId(request.userId, businessOwnerId);
    customerId = customer?.id || null;
  }

  if (!customerId) {
    return {
      speechText: 'I need your account to be linked to check order status. Please link your account in the app settings.',
      shouldEndSession: true,
    };
  }

  const lastOrder = await prisma.order.findFirst({
    where: {
      businessOwnerId,
      customerId,
      source: 'VoiceAssistant',
    },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });

  if (!lastOrder) {
    return {
      speechText: 'I couldn\'t find any recent voice orders. Would you like to place a new order?',
      shouldEndSession: false,
    };
  }

  const statusMap: Record<string, string> = {
    Pending: 'being prepared',
    Confirmed: 'confirmed and being prepared',
    Preparing: 'being prepared in the kitchen',
    Ready: 'ready for pickup or delivery',
    Completed: 'completed',
    Cancelled: 'cancelled',
  };

  const statusText = statusMap[lastOrder.orderStatus] || lastOrder.orderStatus;

  return {
    speechText: `Your order number ${lastOrder.orderNumber} is ${statusText}. Total was ${Number(lastOrder.total)} rupees.`,
    shouldEndSession: true,
    card: {
      title: `Order #${lastOrder.orderNumber}`,
      content: `Status: ${lastOrder.orderStatus}\nTotal: ₹${Number(lastOrder.total).toFixed(2)}`,
    },
  };
}

// ---------- Main Fulfillment Handler ----------

/**
 * Handle a fulfillment webhook request from Alexa or Google Assistant.
 * Routes the request to the appropriate intent handler.
 */
export async function handleFulfillmentWebhook(
  request: VoiceFulfillmentRequest,
  businessOwnerId: string
): Promise<VoiceFulfillmentResponse> {
  const integration = await findIntegration(businessOwnerId);
  if (!integration) {
    return {
      speechText: 'Voice ordering is not configured for this restaurant. Please contact the restaurant to set it up.',
      shouldEndSession: true,
    };
  }

  const config = integration.config as unknown as VoiceOrderingConfig;

  let response: VoiceFulfillmentResponse;

  try {
    switch (request.intent.name) {
      case 'OrderProduct':
      case 'OrderIntent':
        response = await handleOrderIntent(request, businessOwnerId, config);
        break;

      case 'AddToCart':
      case 'AddToCartIntent':
        response = await handleAddToCartIntent(request, businessOwnerId, config);
        break;

      case 'Checkout':
      case 'CheckoutIntent':
        response = await handleCheckoutIntent(request, businessOwnerId, config);
        break;

      case 'OrderStatus':
      case 'OrderStatusIntent':
        response = await handleOrderStatusIntent(request, businessOwnerId, config);
        break;

      case 'AMAZON.HelpIntent':
      case 'actions.intent.MAIN':
        response = {
          speechText: 'You can say things like "Order two large pizzas and a Coke", "Add a burger to my cart", "Checkout", or "What\'s my order status?".',
          shouldEndSession: false,
        };
        break;

      case 'AMAZON.CancelIntent':
      case 'AMAZON.StopIntent':
        // Clear cart on cancel
        cartSessions.delete(request.sessionId);
        response = {
          speechText: 'Goodbye! Your cart has been cleared.',
          shouldEndSession: true,
        };
        break;

      default:
        response = {
          speechText: 'I\'m not sure how to help with that. Try saying "Order" followed by what you\'d like, or say "Help" for options.',
          shouldEndSession: false,
        };
    }

    await logAction(
      integration.id,
      `voice_${request.intent.name}`,
      response.orderCreated ? 'success' : 'handled',
      {
        requestId: request.requestId,
        platform: request.platform,
        intent: request.intent.name,
        slots: request.intent.slots,
        sessionId: request.sessionId,
      },
      {
        speechText: response.speechText,
        orderCreated: response.orderCreated || false,
        orderId: response.orderId || null,
      },
      null
    );

    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return response;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown voice ordering error';

    await logAction(
      integration.id,
      `voice_${request.intent.name}`,
      'failure',
      {
        requestId: request.requestId,
        platform: request.platform,
        intent: request.intent.name,
      },
      null,
      msg
    );

    return {
      speechText: 'Sorry, something went wrong processing your request. Please try again later.',
      shouldEndSession: true,
    };
  }
}

/**
 * Verify webhook request signature for security.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  // In production: verify Alexa Skill signature chain or Google Actions JWT
  // For now, use a simple HMAC comparison
  const crypto = require('crypto');
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  );
}

/**
 * Link a customer account with a voice assistant user ID.
 */
export async function linkCustomerAccount(
  customerId: string,
  voiceUserId: string,
  businessOwnerId: string
): Promise<{ success: boolean; message: string }> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer || customer.businessOwnerId !== businessOwnerId) {
    return { success: false, message: 'Customer not found' };
  }

  const existingNotes = customer.notes || '';
  const voiceTag = `voice_uid:${voiceUserId}`;

  if (existingNotes.includes(voiceTag)) {
    return { success: true, message: 'Account already linked' };
  }

  const updatedNotes = existingNotes
    ? `${existingNotes}\n${voiceTag}`
    : voiceTag;

  await prisma.customer.update({
    where: { id: customerId },
    data: { notes: updatedNotes },
  });

  return { success: true, message: 'Account linked successfully' };
}

import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

/**
 * Porter API types
 */
interface PorterAddress {
  lat: number;
  lng: number;
  address: string;
  contact_name: string;
  contact_phone: string;
  instructions?: string;
}

export type PorterVehicleType = 'bike' | 'mini' | 'tempo';

interface PorterDeliveryRequest {
  pickup_details: PorterAddress;
  drop_details: PorterAddress;
  vehicle_type: PorterVehicleType;
  package_description: string;
  package_value: number;
  reference_id: string;
}

interface PorterDeliveryResponse {
  order_id: string;
  status: string;
  estimated_delivery_time: number; // minutes
  tracking_url: string;
  fare_estimate: {
    amount: number;
    currency: string;
  };
  driver?: {
    name: string;
    phone: string;
    vehicle_number: string;
  };
}

export type PorterDeliveryStatus =
  | 'created'
  | 'assigned'
  | 'in_transit'
  | 'picked_up'
  | 'completed'
  | 'cancelled';

export interface PorterWebhookPayload {
  order_id: string;
  status: PorterDeliveryStatus;
  driver?: {
    name: string;
    phone: string;
    vehicle_number: string;
  };
  eta?: number;
}

export interface PorterDeliveryResult {
  success: boolean;
  message: string;
  orderId?: string;
  trackingUrl?: string;
  estimatedTime?: number;
  fareEstimate?: number;
}

/**
 * Determine vehicle type based on item count and total order value.
 *
 * - bike: small orders (≤5 items)
 * - mini: medium orders (6–15 items)
 * - tempo: large orders (>15 items)
 */
function determineVehicleType(itemCount: number): PorterVehicleType {
  if (itemCount <= 5) return 'bike';
  if (itemCount <= 15) return 'mini';
  return 'tempo';
}

/**
 * Create a delivery order on Porter for a given order.
 *
 * Fetches the order, customer, and branch details, builds a Porter API
 * request with pickup (restaurant) and drop (customer) locations,
 * creates the delivery via Porter's API, and logs the result.
 */
export async function createDelivery(orderId: string): Promise<PorterDeliveryResult> {
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
    throw new Error(`Order not found: ${orderId}`);
  }

  if (!order.customer) {
    throw new Error('Cannot create delivery: order has no customer assigned');
  }

  // Find the Porter integration for this business owner
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId: order.businessOwnerId,
        provider: 'porter',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    throw new Error('Porter integration is not configured or inactive');
  }

  // Extract Porter config
  const config = integration.config as {
    apiKey?: string;
    baseUrl?: string;
    pickupLat?: number;
    pickupLng?: number;
  };

  const baseUrl = config.baseUrl || 'https://api.porter.in/v1';
  const apiKey = config.apiKey || '';

  // Build pickup details from branch
  const pickupAddress = [
    order.branch.address,
    order.branch.city,
    order.branch.state,
    order.branch.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

  const pickup: PorterAddress = {
    lat: config.pickupLat || 0,
    lng: config.pickupLng || 0,
    address: pickupAddress || order.branch.name,
    contact_name: order.branch.name,
    contact_phone: order.branch.phone || '',
    instructions: 'Restaurant order pickup',
  };

  // Build drop details from customer and order notes
  const customerAddress = order.notes || 'Address not provided';

  const drop: PorterAddress = {
    lat: 0, // Would be geocoded from customer address in production
    lng: 0,
    address: customerAddress,
    contact_name: order.customer.name,
    contact_phone: order.customer.phone,
  };

  // Determine vehicle type based on item count
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const vehicleType = determineVehicleType(itemCount);

  // Build delivery request
  const deliveryRequest: PorterDeliveryRequest = {
    pickup_details: pickup,
    drop_details: drop,
    vehicle_type: vehicleType,
    package_description: `Food order - ${itemCount} items`,
    package_value: parseFloat(order.total.toString()),
    reference_id: order.orderNumber,
  };

  // Send request to Porter API
  const result = await sendPorterRequest(baseUrl, apiKey, deliveryRequest);

  // Update Integration lastSyncAt
  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  // Log the delivery creation in IntegrationLog
  await prisma.integrationLog.create({
    data: {
      integrationId: integration.id,
      action: 'create_delivery',
      status: result.success ? 'success' : 'failure',
      requestPayload: JSON.parse(JSON.stringify({
        orderId,
        orderNumber: order.orderNumber,
        pickup: deliveryRequest.pickup_details,
        drop: deliveryRequest.drop_details,
        vehicleType: deliveryRequest.vehicle_type,
      })),
      responsePayload: result.success
        ? JSON.parse(JSON.stringify({ orderId: result.orderId, trackingUrl: result.trackingUrl, estimatedTime: result.estimatedTime, fareEstimate: result.fareEstimate }))
        : JSON.parse(JSON.stringify({ error: result.message })),
      errorMessage: result.success ? null : result.message,
    },
  });

  return result;
}

/**
 * Send a delivery creation request to Porter API
 */
async function sendPorterRequest(
  baseUrl: string,
  apiKey: string,
  delivery: PorterDeliveryRequest
): Promise<PorterDeliveryResult> {
  try {
    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(delivery),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `Porter API error (${response.status}): ${errorText}`,
      };
    }

    const data = (await response.json()) as PorterDeliveryResponse;

    return {
      success: true,
      message: `Delivery created successfully. Order ID: ${data.order_id}`,
      orderId: data.order_id,
      trackingUrl: data.tracking_url,
      estimatedTime: data.estimated_delivery_time,
      fareEstimate: data.fare_estimate?.amount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error connecting to Porter';
    return {
      success: false,
      message,
    };
  }
}

/**
 * Handle Porter webhook for delivery status updates.
 *
 * Updates the order status based on the Porter delivery status:
 * - assigned: delivery driver has been assigned
 * - picked_up: order has been picked up from restaurant
 * - in_transit: order is on the way
 * - completed: order has been delivered to customer
 * - cancelled: delivery was cancelled
 */
export async function handlePorterWebhook(
  payload: PorterWebhookPayload,
  businessOwnerId: string
): Promise<void> {
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'porter',
      },
    },
  });

  if (!integration) {
    throw new Error('Porter integration not found for this business');
  }

  // Map Porter status to order status
  const statusMap: Record<PorterDeliveryStatus, string> = {
    created: 'Preparing',
    assigned: 'Preparing',
    in_transit: 'OutForDelivery',
    picked_up: 'OutForDelivery',
    completed: 'Delivered',
    cancelled: 'Cancelled',
  };

  const orderStatus = statusMap[payload.status];

  // Find orders linked to this Porter delivery by checking integration logs
  const log = await prisma.integrationLog.findFirst({
    where: {
      integrationId: integration.id,
      action: 'create_delivery',
      status: 'success',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!log) {
    // Log the webhook even if we can't find the order
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        action: 'webhook_status_update',
        status: 'failure',
        requestPayload: JSON.parse(JSON.stringify(payload)),
        responsePayload: Prisma.JsonNull,
        errorMessage: `No matching delivery found for order_id: ${payload.order_id}`,
      },
    });
    return;
  }

  const responsePayload = log.responsePayload as Record<string, unknown> | null;
  const loggedOrderId = responsePayload?.orderId as string | undefined;

  // Verify the order_id matches
  if (loggedOrderId !== payload.order_id) {
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        action: 'webhook_status_update',
        status: 'failure',
        requestPayload: JSON.parse(JSON.stringify(payload)),
        responsePayload: Prisma.JsonNull,
        errorMessage: `Order ID mismatch: expected ${loggedOrderId}, got ${payload.order_id}`,
      },
    });
    return;
  }

  const requestPayload = log.requestPayload as Record<string, unknown> | null;
  const orderId = requestPayload?.orderId as string | undefined;

  if (orderId && orderStatus) {
    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { orderStatus: orderStatus as never },
    });
  }

  // Log the webhook status update
  await prisma.integrationLog.create({
    data: {
      integrationId: integration.id,
      action: 'webhook_status_update',
      status: 'success',
      requestPayload: JSON.parse(JSON.stringify(payload)),
      responsePayload: JSON.parse(JSON.stringify({
        orderId,
        newStatus: orderStatus,
        driver: payload.driver,
      })),
      errorMessage: null,
    },
  });
}

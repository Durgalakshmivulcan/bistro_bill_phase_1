import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

/**
 * Dunzo API types
 */
interface DunzoPickupDetails {
  lat: number;
  lng: number;
  address: string;
  name: string;
  phone: string;
  instructions?: string;
}

interface DunzoDropDetails {
  lat: number;
  lng: number;
  address: string;
  name: string;
  phone: string;
  instructions?: string;
}

interface DunzoPackageContent {
  size: 'small' | 'medium' | 'large';
  description: string;
  estimated_value: number;
}

interface DunzoTaskRequest {
  pickup_details: DunzoPickupDetails;
  drop_details: DunzoDropDetails;
  package_content: DunzoPackageContent;
  reference_id: string;
}

interface DunzoTaskResponse {
  task_id: string;
  status: string;
  estimated_time: number; // minutes
  tracking_url: string;
  runner?: {
    name: string;
    phone: string;
  };
}

export type DunzoDeliveryStatus =
  | 'created'
  | 'assigned'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export interface DunzoWebhookPayload {
  task_id: string;
  status: DunzoDeliveryStatus;
  runner?: {
    name: string;
    phone: string;
  };
  eta?: number;
}

export interface DunzoDeliveryResult {
  success: boolean;
  message: string;
  taskId?: string;
  trackingUrl?: string;
  estimatedTime?: number;
}

/**
 * Create a delivery task on Dunzo for a given order.
 *
 * Fetches the order, customer, and branch details, builds a Dunzo API
 * request with pickup (restaurant) and drop (customer) locations,
 * creates the task via Dunzo's API, and logs the result.
 */
export async function createDeliveryTask(orderId: string): Promise<DunzoDeliveryResult> {
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
    throw new Error('Cannot create delivery task: order has no customer assigned');
  }

  // Find the Dunzo integration for this business owner
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId: order.businessOwnerId,
        provider: 'dunzo',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    throw new Error('Dunzo integration is not configured or inactive');
  }

  // Extract Dunzo config
  const config = integration.config as {
    apiKey?: string;
    clientId?: string;
    baseUrl?: string;
    pickupLat?: number;
    pickupLng?: number;
  };

  const baseUrl = config.baseUrl || 'https://apis.dunzo.in/api/v1';
  const apiKey = config.apiKey || '';
  const clientId = config.clientId || '';

  // Build pickup details from branch
  const pickupAddress = [
    order.branch.address,
    order.branch.city,
    order.branch.state,
    order.branch.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

  const pickup: DunzoPickupDetails = {
    lat: config.pickupLat || 0,
    lng: config.pickupLng || 0,
    address: pickupAddress || order.branch.name,
    name: order.branch.name,
    phone: order.branch.phone || '',
    instructions: 'Restaurant order pickup',
  };

  // Build drop details from customer and order notes
  const customerAddress = order.notes || 'Address not provided';

  const drop: DunzoDropDetails = {
    lat: 0, // Would be geocoded from customer address in production
    lng: 0,
    address: customerAddress,
    name: order.customer.name,
    phone: order.customer.phone,
  };

  // Build package content
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const packageContent: DunzoPackageContent = {
    size: itemCount <= 3 ? 'small' : itemCount <= 8 ? 'medium' : 'large',
    description: `Food order - ${itemCount} items`,
    estimated_value: parseFloat(order.total.toString()),
  };

  // Build task request
  const taskRequest: DunzoTaskRequest = {
    pickup_details: pickup,
    drop_details: drop,
    package_content: packageContent,
    reference_id: order.orderNumber,
  };

  // Send request to Dunzo API
  const result = await sendDunzoRequest(baseUrl, apiKey, clientId, taskRequest);

  // Update Integration lastSyncAt
  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  // Log the delivery task creation in IntegrationLog
  await prisma.integrationLog.create({
    data: {
      integrationId: integration.id,
      action: 'create_delivery_task',
      status: result.success ? 'success' : 'failure',
      requestPayload: JSON.parse(JSON.stringify({
        orderId,
        orderNumber: order.orderNumber,
        pickup: taskRequest.pickup_details,
        drop: taskRequest.drop_details,
      })),
      responsePayload: result.success
        ? JSON.parse(JSON.stringify({ taskId: result.taskId, trackingUrl: result.trackingUrl, estimatedTime: result.estimatedTime }))
        : JSON.parse(JSON.stringify({ error: result.message })),
      errorMessage: result.success ? null : result.message,
    },
  });

  return result;
}

/**
 * Send a delivery task creation request to Dunzo API
 */
async function sendDunzoRequest(
  baseUrl: string,
  apiKey: string,
  clientId: string,
  task: DunzoTaskRequest
): Promise<DunzoDeliveryResult> {
  try {
    const response = await fetch(`${baseUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'client-id': clientId,
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        message: `Dunzo API error (${response.status}): ${errorText}`,
      };
    }

    const data = (await response.json()) as DunzoTaskResponse;

    return {
      success: true,
      message: `Delivery task created successfully. Task ID: ${data.task_id}`,
      taskId: data.task_id,
      trackingUrl: data.tracking_url,
      estimatedTime: data.estimated_time,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error connecting to Dunzo';
    return {
      success: false,
      message,
    };
  }
}

/**
 * Handle Dunzo webhook for delivery status updates.
 *
 * Updates the order status based on the Dunzo delivery status:
 * - assigned: delivery runner has been assigned
 * - picked_up: order has been picked up from restaurant
 * - delivered: order has been delivered to customer
 * - cancelled: delivery was cancelled
 */
export async function handleDunzoWebhook(
  payload: DunzoWebhookPayload,
  businessOwnerId: string
): Promise<void> {
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'dunzo',
      },
    },
  });

  if (!integration) {
    throw new Error('Dunzo integration not found for this business');
  }

  // Map Dunzo status to order status
  const statusMap: Record<DunzoDeliveryStatus, string> = {
    created: 'Preparing',
    assigned: 'Preparing',
    picked_up: 'OutForDelivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  const orderStatus = statusMap[payload.status];

  // Find orders linked to this Dunzo task by checking integration logs
  const log = await prisma.integrationLog.findFirst({
    where: {
      integrationId: integration.id,
      action: 'create_delivery_task',
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
        errorMessage: `No matching delivery task found for task_id: ${payload.task_id}`,
      },
    });
    return;
  }

  const responsePayload = log.responsePayload as Record<string, unknown> | null;
  const loggedTaskId = responsePayload?.taskId as string | undefined;

  // Verify the task_id matches
  if (loggedTaskId !== payload.task_id) {
    await prisma.integrationLog.create({
      data: {
        integrationId: integration.id,
        action: 'webhook_status_update',
        status: 'failure',
        requestPayload: JSON.parse(JSON.stringify(payload)),
        responsePayload: Prisma.JsonNull,
        errorMessage: `Task ID mismatch: expected ${loggedTaskId}, got ${payload.task_id}`,
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
        previousStatus: log.status,
        newStatus: orderStatus,
        runner: payload.runner,
      })),
      errorMessage: null,
    },
  });
}

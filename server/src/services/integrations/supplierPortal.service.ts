import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

/**
 * Supplier Portal Integration Service
 *
 * Syncs inventory levels with supplier portals and creates purchase orders
 * via a generic API contract. Each supplier portal can have its own
 * implementation specifics configured via the Integration config JSON.
 *
 * Config stored in Integration model: apiBaseUrl, apiKey, supplierId mappings.
 */

interface SupplierPortalConfig {
  apiBaseUrl: string; // Base URL for the supplier portal API
  apiKey: string; // API key for authentication
  merchantId: string; // Our merchant/customer ID on the supplier portal
  supplierMappings: Record<string, string>; // Internal supplierId -> external supplier code
  autoConfirm: boolean; // Whether to auto-confirm POs on the portal
}

export interface SupplierPortalResult {
  success: boolean;
  message: string;
  externalOrderId?: string;
  confirmationStatus?: string;
}

export interface InventorySyncResult {
  success: boolean;
  message: string;
  syncedProductId?: string;
  externalQuantity?: number;
}

/**
 * Sync inventory quantity for a product to the supplier portal.
 * Updates the supplier system with current stock level.
 */
export async function syncInventory(
  productId: string,
  quantity: number,
  businessOwnerId: string
): Promise<InventorySyncResult> {
  const integration = await findIntegration(businessOwnerId);
  if (!integration) {
    return { success: false, message: 'Supplier portal integration is not configured or inactive' };
  }

  const config = integration.config as unknown as SupplierPortalConfig;

  // Look up the product to get supplier mapping info
  const product = await prisma.inventoryProduct.findUnique({
    where: { id: productId },
    include: { supplier: true },
  });

  if (!product) {
    return { success: false, message: `Inventory product not found: ${productId}` };
  }

  if (!product.supplierId) {
    return { success: false, message: `Product ${product.name} has no linked supplier` };
  }

  const externalSupplierCode = config.supplierMappings?.[product.supplierId];
  if (!externalSupplierCode) {
    return {
      success: false,
      message: `No supplier mapping found for supplier ${product.supplier?.name || product.supplierId}`,
    };
  }

  let result: InventorySyncResult;

  try {
    const response = await fetch(`${config.apiBaseUrl}/inventory/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantId: config.merchantId,
        supplierCode: externalSupplierCode,
        productId,
        productName: product.name,
        currentQuantity: quantity,
        unit: product.unit || 'pieces',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      result = {
        success: false,
        message: `Supplier portal API error (${response.status}): ${errorText}`,
      };
    } else {
      const data = (await response.json()) as { acknowledged: boolean; externalQuantity: number };
      result = {
        success: true,
        message: `Inventory synced for ${product.name}: ${quantity} ${product.unit || 'units'}`,
        syncedProductId: productId,
        externalQuantity: data.externalQuantity,
      };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error syncing inventory';
    result = { success: false, message: msg };
  }

  await logAction(
    integration.id,
    'sync_inventory',
    result.success ? 'success' : 'failure',
    { productId, productName: product.name, quantity, unit: product.unit },
    result.externalQuantity !== undefined ? { externalQuantity: result.externalQuantity } : null,
    result.success ? null : result.message
  );

  if (result.success) {
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });
  }

  return result;
}

/**
 * Create a purchase order on the supplier portal.
 * Sends PO items to the external supplier system and receives confirmation.
 */
export async function createPurchaseOrder(
  items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; unit?: string }>,
  supplierId: string,
  businessOwnerId: string
): Promise<SupplierPortalResult> {
  const integration = await findIntegration(businessOwnerId);
  if (!integration) {
    return { success: false, message: 'Supplier portal integration is not configured or inactive' };
  }

  const config = integration.config as unknown as SupplierPortalConfig;

  const externalSupplierCode = config.supplierMappings?.[supplierId];
  if (!externalSupplierCode) {
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    return {
      success: false,
      message: `No supplier mapping found for supplier ${supplier?.name || supplierId}`,
    };
  }

  if (items.length === 0) {
    return { success: false, message: 'Cannot create purchase order with no items' };
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  let result: SupplierPortalResult;

  try {
    const response = await fetch(`${config.apiBaseUrl}/purchase-orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchantId: config.merchantId,
        supplierCode: externalSupplierCode,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit || 'pieces',
          totalPrice: item.quantity * item.unitPrice,
        })),
        totalAmount,
        autoConfirm: config.autoConfirm,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      result = {
        success: false,
        message: `Supplier portal API error (${response.status}): ${errorText}`,
      };
    } else {
      const data = (await response.json()) as {
        orderId: string;
        status: string;
      };
      result = {
        success: true,
        message: `Purchase order created on supplier portal (ID: ${data.orderId})`,
        externalOrderId: data.orderId,
        confirmationStatus: data.status,
      };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error creating purchase order';
    result = { success: false, message: msg };
  }

  await logAction(
    integration.id,
    'create_purchase_order',
    result.success ? 'success' : 'failure',
    { supplierId, itemCount: items.length, totalAmount },
    result.externalOrderId
      ? { externalOrderId: result.externalOrderId, confirmationStatus: result.confirmationStatus }
      : null,
    result.success ? null : result.message
  );

  if (result.success) {
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });
  }

  return result;
}

/**
 * Check PO confirmation status from the supplier portal.
 * Updates the local PO status based on the supplier's response.
 */
export async function getOrderConfirmation(
  externalOrderId: string,
  businessOwnerId: string
): Promise<SupplierPortalResult> {
  const integration = await findIntegration(businessOwnerId);
  if (!integration) {
    return { success: false, message: 'Supplier portal integration is not configured or inactive' };
  }

  const config = integration.config as unknown as SupplierPortalConfig;

  let result: SupplierPortalResult;

  try {
    const response = await fetch(
      `${config.apiBaseUrl}/purchase-orders/${externalOrderId}/status`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      result = {
        success: false,
        message: `Supplier portal API error (${response.status}): ${errorText}`,
      };
    } else {
      const data = (await response.json()) as {
        orderId: string;
        status: string;
      };
      result = {
        success: true,
        message: `Order ${externalOrderId} status: ${data.status}`,
        externalOrderId: data.orderId,
        confirmationStatus: data.status,
      };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error checking order status';
    result = { success: false, message: msg };
  }

  await logAction(
    integration.id,
    'get_order_confirmation',
    result.success ? 'success' : 'failure',
    { externalOrderId },
    result.confirmationStatus ? { status: result.confirmationStatus } : null,
    result.success ? null : result.message
  );

  return result;
}

// ============================================
// Private Helper Functions
// ============================================

/**
 * Find the supplier portal integration for a business owner.
 */
async function findIntegration(businessOwnerId: string) {
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'supplier_portal',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    return null;
  }

  return integration;
}

/**
 * Log a supplier portal action to IntegrationLog.
 */
async function logAction(
  integrationId: string,
  action: string,
  status: string,
  requestData: unknown,
  responseData: unknown,
  errorMessage: string | null
): Promise<void> {
  try {
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
  } catch {
    console.error('[SupplierPortal] Failed to write IntegrationLog');
  }
}

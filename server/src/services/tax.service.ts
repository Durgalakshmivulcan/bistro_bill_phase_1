import { prisma } from './db.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Tax breakdown for a single tax in the order
 */
export interface TaxBreakdown {
  taxId: string;
  taxName: string;
  rate: number;
  amount: number;
}

/**
 * Result of tax calculation
 */
export interface TaxCalculationResult {
  taxAmount: number;
  breakdown: TaxBreakdown[];
}

/**
 * Calculate order tax based on order items and their tax groups
 *
 * @param orderId - The order ID
 * @param _branchId - The branch ID (for future location-based tax logic)
 * @returns Tax calculation result with breakdown
 */
export async function calculateOrderTax(
  orderId: string,
  _branchId: string
): Promise<TaxCalculationResult> {
  // Fetch order with items
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            include: {
              prices: {
                include: {
                  taxGroup: {
                    include: {
                      taxGroupItems: {
                        include: {
                          tax: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          variant: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Map to store aggregated tax amounts by taxId
  const taxMap = new Map<string, TaxBreakdown>();

  // Calculate tax for each order item
  for (const item of order.items) {
    // Find the price entry for this product/variant and order type (channel)
    const priceEntry = item.product.prices.find(
      (p: any) =>
        p.channelType === order.type &&
        (item.variantId ? p.variantId === item.variantId : !p.variantId)
    );

    // If no price entry or no tax group, skip tax calculation for this item
    if (!priceEntry || !priceEntry.taxGroup) {
      continue;
    }

    // Get all taxes in the tax group
    const taxGroup = priceEntry.taxGroup;

    // Calculate tax for each tax in the group
    for (const taxGroupItem of taxGroup.taxGroupItems) {
      const tax = taxGroupItem.tax;

      // Skip inactive taxes
      if (tax.status !== 'active') {
        continue;
      }

      // Calculate tax amount for this item
      // Tax is calculated on the item's totalPrice (which includes quantity, variant, addons)
      const itemTotal = parseFloat(item.totalPrice.toString());
      const taxRate = parseFloat(tax.percentage.toString()) / 100;
      const taxAmount = itemTotal * taxRate;

      // Aggregate tax by taxId
      const existingTax = taxMap.get(tax.id);
      if (existingTax) {
        existingTax.amount += taxAmount;
      } else {
        taxMap.set(tax.id, {
          taxId: tax.id,
          taxName: tax.name,
          rate: parseFloat(tax.percentage.toString()),
          amount: taxAmount,
        });
      }
    }
  }

  // Convert map to array and calculate total
  const breakdown = Array.from(taxMap.values());
  const taxAmount = breakdown.reduce((sum, tax) => sum + tax.amount, 0);

  return {
    taxAmount: Math.round(taxAmount * 100) / 100, // Round to 2 decimal places
    breakdown,
  };
}

/**
 * Calculate and update order tax
 *
 * @param orderId - The order ID
 * @param branchId - The branch ID
 * @returns Updated order tax amount
 */
export async function updateOrderTax(
  orderId: string,
  branchId: string
): Promise<number> {
  const result = await calculateOrderTax(orderId, branchId);

  // Update order with new tax amount
  await prisma.order.update({
    where: { id: orderId },
    data: {
      taxAmount: new Decimal(result.taxAmount),
    },
  });

  return result.taxAmount;
}

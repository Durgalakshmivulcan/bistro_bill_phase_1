import { prisma } from './db.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Charge breakdown for a single charge in the order
 */
export interface ChargeBreakdown {
  chargeId: string;
  chargeName: string;
  type: 'Percentage' | 'Fixed';
  value: number;
  amount: number;
}

/**
 * Result of charges calculation
 */
export interface ChargesCalculationResult {
  chargesAmount: number;
  breakdown: ChargeBreakdown[];
}

/**
 * Calculate order charges based on order type and subtotal
 *
 * @param orderId - The order ID
 * @param branchId - The branch ID
 * @returns Charges calculation result with breakdown
 */
export async function calculateOrderCharges(
  orderId: string,
  branchId: string
): Promise<ChargesCalculationResult> {
  // Fetch order with businessOwnerId
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      type: true,
      subtotal: true,
      businessOwnerId: true,
      branchId: true,
    },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Verify branchId matches
  if (order.branchId !== branchId) {
    throw new Error('Branch ID mismatch');
  }

  // Get active charges for the business owner
  // Build where clause based on order type
  // ChargeApplyTo only supports: All, DineIn, TakeAway, Delivery
  // If order type is Catering or Subscription, only apply 'All' charges
  const whereClause: any = {
    businessOwnerId: order.businessOwnerId,
    status: 'active',
    OR: [{ applyTo: 'All' }],
  };

  // Add order type to OR if it matches ChargeApplyTo enum
  if (
    order.type === 'DineIn' ||
    order.type === 'TakeAway' ||
    order.type === 'Delivery'
  ) {
    whereClause.OR.push({ applyTo: order.type });
  }

  const charges = await prisma.charge.findMany({
    where: whereClause,
  });

  const breakdown: ChargeBreakdown[] = [];
  let totalCharges = 0;

  // Calculate each charge
  for (const charge of charges) {
    let chargeAmount = 0;

    const subtotal = parseFloat(order.subtotal.toString());
    const value = parseFloat(charge.value.toString());

    if (charge.type === 'Percentage') {
      // Calculate percentage of subtotal
      chargeAmount = (subtotal * value) / 100;
    } else if (charge.type === 'Fixed') {
      // Fixed charge amount
      chargeAmount = value;
    }

    // Round to 2 decimal places
    chargeAmount = Math.round(chargeAmount * 100) / 100;

    breakdown.push({
      chargeId: charge.id,
      chargeName: charge.name,
      type: charge.type,
      value: value,
      amount: chargeAmount,
    });

    totalCharges += chargeAmount;
  }

  // Round total to 2 decimal places
  totalCharges = Math.round(totalCharges * 100) / 100;

  return {
    chargesAmount: totalCharges,
    breakdown,
  };
}

/**
 * Calculate and update order charges
 *
 * @param orderId - The order ID
 * @param branchId - The branch ID
 * @returns Updated order charges amount
 */
export async function updateOrderCharges(
  orderId: string,
  branchId: string
): Promise<number> {
  const result = await calculateOrderCharges(orderId, branchId);

  // Update order with new charges amount
  await prisma.order.update({
    where: { id: orderId },
    data: {
      chargesAmount: new Decimal(result.chargesAmount),
    },
  });

  return result.chargesAmount;
}

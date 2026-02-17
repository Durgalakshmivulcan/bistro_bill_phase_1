import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../services/db.service';

// Rule condition interface
interface RuleCondition {
  field: 'totalSpent' | 'orderCount' | 'type' | 'gender';
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  value: string | number;
}

// Rules configuration
interface GroupRules {
  logic: 'AND' | 'OR';
  conditions: RuleCondition[];
}

// Evaluate a single condition against a customer
function evaluateCondition(
  customer: { totalSpent: any; orderCount: number; type: string; gender: string | null },
  condition: RuleCondition
): boolean {
  let fieldValue: any;

  switch (condition.field) {
    case 'totalSpent':
      fieldValue = typeof customer.totalSpent === 'object' && customer.totalSpent !== null
        ? customer.totalSpent.toNumber()
        : Number(customer.totalSpent);
      break;
    case 'orderCount':
      fieldValue = customer.orderCount;
      break;
    case 'type':
      fieldValue = customer.type;
      break;
    case 'gender':
      fieldValue = customer.gender;
      break;
    default:
      return false;
  }

  const condValue = condition.field === 'totalSpent' || condition.field === 'orderCount'
    ? Number(condition.value)
    : condition.value;

  switch (condition.operator) {
    case 'gt': return fieldValue > condValue;
    case 'gte': return fieldValue >= condValue;
    case 'lt': return fieldValue < condValue;
    case 'lte': return fieldValue <= condValue;
    case 'eq': return String(fieldValue) === String(condValue);
    case 'neq': return String(fieldValue) !== String(condValue);
    default: return false;
  }
}

// Evaluate all rules against a customer
function evaluateRules(
  customer: { totalSpent: any; orderCount: number; type: string; gender: string | null },
  rules: GroupRules
): boolean {
  if (!rules.conditions || rules.conditions.length === 0) return false;

  if (rules.logic === 'AND') {
    return rules.conditions.every(c => evaluateCondition(customer, c));
  } else {
    return rules.conditions.some(c => evaluateCondition(customer, c));
  }
}

export const listCustomerGroups = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessOwnerId = req.user!.businessOwnerId!;

    const groups = await prisma.customerGroup.findMany({
      where: { businessOwnerId },
      include: {
        _count: {
          select: { customers: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const groupsWithCount = groups.map(group => ({
      id: group.id,
      name: group.name,
      status: group.status,
      color: group.color,
      rules: group.rules,
      customerCount: group._count.customers,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    }));

    res.json({
      success: true,
      data: groupsWithCount
    });
  } catch (error) {
    console.error('List customer groups error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch customer groups'
      }
    });
  }
};

export const createCustomerGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessOwnerId = req.user!.businessOwnerId!;
    const { name, status, color, rules } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name is required'
        }
      });
      return;
    }

    const group = await prisma.customerGroup.create({
      data: {
        businessOwnerId,
        name,
        status: status || 'active',
        color: color || '#3B82F6',
        rules: rules || null
      }
    });

    res.status(201).json({
      success: true,
      data: group,
      message: 'Customer group created successfully'
    });
  } catch (error) {
    console.error('Create customer group error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create customer group'
      }
    });
  }
};

export const updateCustomerGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessOwnerId = req.user!.businessOwnerId!;
    const { id } = req.params;
    const { name, status, color, rules } = req.body;

    // Verify group belongs to tenant
    const existingGroup = await prisma.customerGroup.findFirst({
      where: {
        id,
        businessOwnerId
      }
    });

    if (!existingGroup) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Customer group not found'
        }
      });
      return;
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status;
    if (color) updateData.color = color;
    if (rules !== undefined) updateData.rules = rules;

    const group = await prisma.customerGroup.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: group,
      message: 'Customer group updated successfully'
    });
  } catch (error) {
    console.error('Update customer group error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update customer group'
      }
    });
  }
};

export const deleteCustomerGroup = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessOwnerId = req.user!.businessOwnerId!;
    const { id } = req.params;

    // Verify group belongs to tenant
    const existingGroup = await prisma.customerGroup.findFirst({
      where: {
        id,
        businessOwnerId
      }
    });

    if (!existingGroup) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Customer group not found'
        }
      });
      return;
    }

    // Nullify customer references before deleting
    await prisma.customer.updateMany({
      where: {
        customerGroupId: id,
        businessOwnerId
      },
      data: {
        customerGroupId: null
      }
    });

    // Delete the group
    await prisma.customerGroup.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Customer group deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer group error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete customer group'
      }
    });
  }
};

/**
 * POST /api/v1/customers/groups/preview-rules
 * Preview which customers match a set of rules (without saving)
 */
export const previewRules = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessOwnerId = req.user!.businessOwnerId!;
    const { rules } = req.body as { rules: GroupRules };

    if (!rules || !rules.conditions || rules.conditions.length === 0) {
      res.json({
        success: true,
        data: { matchCount: 0, customers: [] }
      });
      return;
    }

    // Fetch all customers with order counts
    const customers = await prisma.customer.findMany({
      where: { businessOwnerId },
      include: {
        _count: { select: { orders: true } }
      }
    });

    const matching = customers
      .filter(c => evaluateRules(
        {
          totalSpent: c.totalSpent,
          orderCount: c._count.orders,
          type: c.type,
          gender: c.gender
        },
        rules
      ))
      .map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        type: c.type,
        totalSpent: typeof c.totalSpent === 'object' && c.totalSpent !== null
          ? (c.totalSpent as any).toNumber()
          : Number(c.totalSpent),
        orderCount: c._count.orders
      }));

    res.json({
      success: true,
      data: {
        matchCount: matching.length,
        customers: matching.slice(0, 20) // Return first 20 for preview
      }
    });
  } catch (error) {
    console.error('Preview rules error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to preview rules'
      }
    });
  }
};

/**
 * POST /api/v1/customers/groups/recalculate
 * Re-run all auto-assignment rules for all customers
 */
export const recalculateGroups = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessOwnerId = req.user!.businessOwnerId!;

    // Fetch all groups with rules
    const groups = await prisma.customerGroup.findMany({
      where: {
        businessOwnerId,
        rules: { not: null as any }
      }
    });

    const groupsWithRules = groups.filter(g => {
      const rules = g.rules as unknown as GroupRules | null;
      return rules && rules.conditions && rules.conditions.length > 0;
    });

    if (groupsWithRules.length === 0) {
      res.json({
        success: true,
        data: { assigned: 0, groups: 0 },
        message: 'No groups have auto-assignment rules configured'
      });
      return;
    }

    // Fetch all customers with order counts
    const customers = await prisma.customer.findMany({
      where: { businessOwnerId },
      include: {
        _count: { select: { orders: true } }
      }
    });

    let totalAssigned = 0;

    // For each customer, find the first matching group (priority = order of groups)
    for (const customer of customers) {
      const customerData = {
        totalSpent: customer.totalSpent,
        orderCount: customer._count.orders,
        type: customer.type,
        gender: customer.gender
      };

      let matchedGroupId: string | null = null;

      for (const group of groupsWithRules) {
        const rules = group.rules as unknown as GroupRules;
        if (evaluateRules(customerData, rules)) {
          matchedGroupId = group.id;
          break; // First match wins
        }
      }

      // Only update if the group assignment changed
      if (matchedGroupId && matchedGroupId !== customer.customerGroupId) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { customerGroupId: matchedGroupId }
        });
        totalAssigned++;
      }
    }

    res.json({
      success: true,
      data: {
        assigned: totalAssigned,
        groups: groupsWithRules.length,
        totalCustomers: customers.length
      },
      message: `Recalculation complete: ${totalAssigned} customer(s) reassigned across ${groupsWithRules.length} group(s)`
    });
  } catch (error) {
    console.error('Recalculate groups error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to recalculate groups'
      }
    });
  }
};

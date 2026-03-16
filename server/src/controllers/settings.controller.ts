import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { prisma } from '../services/db.service';

// GET /api/v1/settings/taxes - List all taxes for tenant
export const getTaxes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const isSuperAdmin = req.user?.userType === 'SuperAdmin';

    if (!tenantId && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Optional status filter
    const { status } = req.query;

    const where: any = tenantId ? { businessOwnerId: tenantId } : {};

    if (status) {
      where.status = status as string;
    }

    const taxes = await prisma.tax.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: taxes,
    });
  } catch (error) {
    console.error('Error fetching taxes:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch taxes',
      },
    });
  }
};

// POST /api/v1/settings/taxes - Create new tax
export const createTax = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { name, symbol, percentage, country, state, city, status } = req.body;

    // Validate required fields
    if (!name || percentage === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Name and percentage are required',
        },
      });
    }

    // Validate percentage is a number
    if (isNaN(Number(percentage))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PERCENTAGE',
          message: 'Percentage must be a valid number',
        },
      });
    }

    const tax = await prisma.tax.create({
      data: {
        businessOwnerId: tenantId,
        name,
        symbol,
        percentage: Number(percentage),
        country,
        state,
        city,
        status: status || 'active',
      },
    });

    return res.status(201).json({
      success: true,
      data: tax,
      message: 'Tax created successfully',
    });
  } catch (error) {
    console.error('Error creating tax:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create tax',
      },
    });
  }
};

// PUT /api/v1/settings/taxes/:id - Update tax
export const updateTax = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Check if tax exists and belongs to tenant
    const existingTax = await prisma.tax.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingTax) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TAX_NOT_FOUND',
          message: 'Tax not found',
        },
      });
    }

    const { name, symbol, percentage, country, state, city, status } = req.body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (symbol !== undefined) updateData.symbol = symbol;
    if (percentage !== undefined) {
      if (isNaN(Number(percentage))) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PERCENTAGE',
            message: 'Percentage must be a valid number',
          },
        });
      }
      updateData.percentage = Number(percentage);
    }
    if (country !== undefined) updateData.country = country;
    if (state !== undefined) updateData.state = state;
    if (city !== undefined) updateData.city = city;
    if (status !== undefined) updateData.status = status;

    const tax = await prisma.tax.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: tax,
      message: 'Tax updated successfully',
    });
  } catch (error) {
    console.error('Error updating tax:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update tax',
      },
    });
  }
};

// DELETE /api/v1/settings/taxes/:id - Delete tax
export const deleteTax = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Check if tax exists and belongs to tenant
    const existingTax = await prisma.tax.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        taxGroupItems: true,
      },
    });

    if (!existingTax) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TAX_NOT_FOUND',
          message: 'Tax not found',
        },
      });
    }

    // Check if tax is used in any tax groups
    if (existingTax.taxGroupItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TAX_IN_USE',
          message: `Cannot delete tax. It is used in ${existingTax.taxGroupItems.length} tax group(s)`,
        },
      });
    }

    await prisma.tax.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Tax deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tax:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete tax',
      },
    });
  }
};

// GET /api/v1/settings/tax-groups - List all tax groups for tenant
export const getTaxGroups = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const isSuperAdmin = req.user?.userType === 'SuperAdmin';

    if (!tenantId && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const taxGroups = await prisma.taxGroup.findMany({
      where: tenantId ? { businessOwnerId: tenantId } : {},
      include: {
        taxGroupItems: {
          include: {
            tax: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const taxGroupsWithRate = taxGroups.map((group) => {
      const combinedRate = group.taxGroupItems.reduce((sum, item) => {
        return sum + Number(item.tax.percentage);
      }, 0);

      return {
        ...group,
        combinedRate,
        taxCount: group.taxGroupItems.length,
        percentage: group.percentage ?? combinedRate,
        symbol: group.symbol ?? group.taxGroupItems.map(i => i.tax.symbol || i.tax.name).join(' + '),
        country: group.country ?? group.taxGroupItems[0]?.tax.country ?? null,
        state: group.state ?? group.taxGroupItems[0]?.tax.state ?? null,
        city: group.city ?? group.taxGroupItems[0]?.tax.city ?? null,
      };
    });

    return res.status(200).json({
      success: true,
      data: taxGroupsWithRate,
    });
  } catch (error) {
    console.error('Error fetching tax groups:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch tax groups',
      },
    });
  }
};

// POST /api/v1/settings/tax-groups - Create tax group
export const createTaxGroup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { name, taxIds, status, symbol, percentage, country, state, city } = req.body;

    // Validate required fields
    if (!name || !taxIds || !Array.isArray(taxIds)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Name and taxIds array are required',
        },
      });
    }

    // Verify all taxes exist and belong to tenant
    const taxes = await prisma.tax.findMany({
      where: {
        id: { in: taxIds },
        businessOwnerId: tenantId,
      },
    });

    if (taxes.length !== taxIds.length) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TAX_IDS',
          message: 'One or more tax IDs are invalid or do not belong to your business',
        },
      });
    }

    // Create tax group with tax items
    const taxGroup = await prisma.taxGroup.create({
      data: {
        businessOwnerId: tenantId,
        name,
        symbol: symbol || null,
        percentage: percentage !== undefined ? Number(percentage) : null,
        country: country || null,
        state: state || null,
        city: city || null,
        status: status || 'active',
        taxGroupItems: {
          create: taxIds.map((taxId: string) => ({
            taxId,
          })),
        },
      },
      include: {
        taxGroupItems: {
          include: {
            tax: true,
          },
        },
      },
    });

    // Calculate combined rate
    const combinedRate = taxGroup.taxGroupItems.reduce((sum, item) => {
      return sum + Number(item.tax.percentage);
    }, 0);

    return res.status(201).json({
      success: true,
      data: {
        ...taxGroup,
        combinedRate,
      },
      message: 'Tax group created successfully',
    });
  } catch (error) {
    console.error('Error creating tax group:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create tax group',
      },
    });
  }
};

// PUT /api/v1/settings/tax-groups/:id - Update tax group
export const updateTaxGroup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Check if tax group exists and belongs to tenant
    const existingTaxGroup = await prisma.taxGroup.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingTaxGroup) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TAX_GROUP_NOT_FOUND',
          message: 'Tax group not found',
        },
      });
    }

    const { name, taxIds, status, symbol, percentage, country, state, city } = req.body;

    // Update basic fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (symbol !== undefined) updateData.symbol = symbol;
    if (percentage !== undefined) updateData.percentage = Number(percentage);
    if (country !== undefined) updateData.country = country;
    if (state !== undefined) updateData.state = state;
    if (city !== undefined) updateData.city = city;

    // Update tax group
    await prisma.taxGroup.update({
      where: { id },
      data: updateData,
    });

    // If taxIds provided, update tax group items
    if (taxIds && Array.isArray(taxIds)) {
      // Verify all taxes exist and belong to tenant
      const taxes = await prisma.tax.findMany({
        where: {
          id: { in: taxIds },
          businessOwnerId: tenantId,
        },
      });

      if (taxes.length !== taxIds.length) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TAX_IDS',
            message: 'One or more tax IDs are invalid or do not belong to your business',
          },
        });
      }

      // Delete existing tax group items
      await prisma.taxGroupItem.deleteMany({
        where: { taxGroupId: id },
      });

      // Create new tax group items
      await prisma.taxGroupItem.createMany({
        data: taxIds.map((taxId: string) => ({
          taxGroupId: id,
          taxId,
        })),
      });
    }

    // Fetch updated tax group with all relations
    const taxGroup = await prisma.taxGroup.findUnique({
      where: { id },
      include: {
        taxGroupItems: {
          include: {
            tax: true,
          },
        },
      },
    });

    // Calculate combined rate
    const combinedRate = taxGroup!.taxGroupItems.reduce((sum, item) => {
      return sum + Number(item.tax.percentage);
    }, 0);

    return res.status(200).json({
      success: true,
      data: {
        ...taxGroup,
        combinedRate,
        percentage: taxGroup?.percentage ?? combinedRate,
        symbol: taxGroup?.symbol ?? taxGroup?.taxGroupItems.map(i => i.tax.symbol || i.tax.name).join(' + '),
        country: taxGroup?.country ?? taxGroup?.taxGroupItems[0]?.tax.country ?? null,
        state: taxGroup?.state ?? taxGroup?.taxGroupItems[0]?.tax.state ?? null,
        city: taxGroup?.city ?? taxGroup?.taxGroupItems[0]?.tax.city ?? null,
      },
      message: 'Tax group updated successfully',
    });
  } catch (error) {
    console.error('Error updating tax group:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update tax group',
      },
    });
  }
};

// DELETE /api/v1/settings/tax-groups/:id - Delete tax group
export const deleteTaxGroup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Check if tax group exists and belongs to tenant
    const existingTaxGroup = await prisma.taxGroup.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        productPrices: true,
      },
    });

    if (!existingTaxGroup) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TAX_GROUP_NOT_FOUND',
          message: 'Tax group not found',
        },
      });
    }

    // Check if tax group is used in any product prices
    if (existingTaxGroup.productPrices.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TAX_GROUP_IN_USE',
          message: `Cannot delete tax group. It is used in ${existingTaxGroup.productPrices.length} product price(s)`,
        },
      });
    }

    // Delete tax group (tax group items will be cascade deleted)
    await prisma.taxGroup.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Tax group deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tax group:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete tax group',
      },
    });
  }
};

// GET /api/v1/settings/payment-options - List all payment options for tenant
export const getPaymentOptions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const paymentOptions = await prisma.paymentOption.findMany({
      where: {
        businessOwnerId: tenantId,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return res.status(200).json({
      success: true,
      data: paymentOptions,
    });
  } catch (error) {
    console.error('Error fetching payment options:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch payment options',
      },
    });
  }
};

// POST /api/v1/settings/payment-options - Create payment option
export const createPaymentOption = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { name, type, isDefault, status } = req.body;

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Name and type are required',
        },
      });
    }

    // If isDefault is true, set all other payment options to non-default
    if (isDefault) {
      await prisma.paymentOption.updateMany({
        where: {
          businessOwnerId: tenantId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const paymentOption = await prisma.paymentOption.create({
      data: {
        businessOwnerId: tenantId,
        name,
        type,
        isDefault: isDefault || false,
        status: status || 'active',
      },
    });

    return res.status(201).json({
      success: true,
      data: paymentOption,
      message: 'Payment option created successfully',
    });
  } catch (error) {
    console.error('Error creating payment option:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create payment option',
      },
    });
  }
};

// PUT /api/v1/settings/payment-options/:id - Update payment option
export const updatePaymentOption = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Check if payment option exists and belongs to tenant
    const existingPaymentOption = await prisma.paymentOption.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingPaymentOption) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_OPTION_NOT_FOUND',
          message: 'Payment option not found',
        },
      });
    }

    const { name, type, isDefault, status } = req.body;

    // If isDefault is being set to true, unset other defaults
    if (isDefault === true) {
      await prisma.paymentOption.updateMany({
        where: {
          businessOwnerId: tenantId,
          isDefault: true,
          id: { not: id }, // Don't update the current one
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (status !== undefined) updateData.status = status;

    const paymentOption = await prisma.paymentOption.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: paymentOption,
      message: 'Payment option updated successfully',
    });
  } catch (error) {
    console.error('Error updating payment option:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update payment option',
      },
    });
  }
};

// DELETE /api/v1/settings/payment-options/:id - Delete payment option
export const deletePaymentOption = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Check if payment option exists and belongs to tenant
    const existingPaymentOption = await prisma.paymentOption.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        orderPayments: true,
      },
    });

    if (!existingPaymentOption) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_OPTION_NOT_FOUND',
          message: 'Payment option not found',
        },
      });
    }

    // Check if payment option is used in any order payments
    if (existingPaymentOption.orderPayments.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_OPTION_IN_USE',
          message: `Cannot delete payment option. It is used in ${existingPaymentOption.orderPayments.length} order payment(s)`,
        },
      });
    }

    await prisma.paymentOption.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Payment option deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting payment option:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete payment option',
      },
    });
  }
};

// GET /api/v1/settings/charges - List all charges for tenant
export const getCharges = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const charges = await prisma.charge.findMany({
      where: {
        businessOwnerId: tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: charges,
    });
  } catch (error) {
    console.error('Error fetching charges:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch charges',
      },
    });
  }
};

// POST /api/v1/settings/charges - Create charge
export const createCharge = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { name, type, value, applyTo, status } = req.body;

    // Validate required fields
    if (!name || !type || value === undefined || !applyTo) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Name, type, value, and applyTo are required',
        },
      });
    }

    // Validate value is a number
    if (isNaN(Number(value))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_VALUE',
          message: 'Value must be a valid number',
        },
      });
    }

    // Validate type enum
    if (!['Percentage', 'Fixed'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Type must be either Percentage or Fixed',
        },
      });
    }

    // Validate applyTo enum
    if (!['All', 'DineIn', 'TakeAway', 'Delivery'].includes(applyTo)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_APPLY_TO',
          message: 'ApplyTo must be one of: All, DineIn, TakeAway, Delivery',
        },
      });
    }

    const charge = await prisma.charge.create({
      data: {
        businessOwnerId: tenantId,
        name,
        type,
        value: Number(value),
        applyTo,
        status: status || 'active',
      },
    });

    return res.status(201).json({
      success: true,
      data: charge,
      message: 'Charge created successfully',
    });
  } catch (error) {
    console.error('Error creating charge:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create charge',
      },
    });
  }
};

// PUT /api/v1/settings/charges/:id - Update charge
export const updateCharge = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Check if charge exists and belongs to tenant
    const existingCharge = await prisma.charge.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingCharge) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHARGE_NOT_FOUND',
          message: 'Charge not found',
        },
      });
    }

    const { name, type, value, applyTo, status } = req.body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;

    if (type !== undefined) {
      if (!['Percentage', 'Fixed'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TYPE',
            message: 'Type must be either Percentage or Fixed',
          },
        });
      }
      updateData.type = type;
    }

    if (value !== undefined) {
      if (isNaN(Number(value))) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_VALUE',
            message: 'Value must be a valid number',
          },
        });
      }
      updateData.value = Number(value);
    }

    if (applyTo !== undefined) {
      if (!['All', 'DineIn', 'TakeAway', 'Delivery'].includes(applyTo)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_APPLY_TO',
            message: 'ApplyTo must be one of: All, DineIn, TakeAway, Delivery',
          },
        });
      }
      updateData.applyTo = applyTo;
    }

    const charge = await prisma.charge.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: charge,
      message: 'Charge updated successfully',
    });
  } catch (error) {
    console.error('Error updating charge:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update charge',
      },
    });
  }
};

// DELETE /api/v1/settings/charges/:id - Delete charge
export const deleteCharge = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Check if charge exists and belongs to tenant
    const existingCharge = await prisma.charge.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingCharge) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHARGE_NOT_FOUND',
          message: 'Charge not found',
        },
      });
    }

    await prisma.charge.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Charge deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting charge:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete charge',
      },
    });
  }
};

// GET /api/v1/settings/reasons - List all reasons for tenant, optionally filtered by type
export const getReasons = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Optional type filter
    const { type } = req.query;

    const where: any = {
      businessOwnerId: tenantId,
    };

    if (type) {
      where.type = type as string;
    }

    const reasons = await prisma.reason.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: reasons,
    });
  } catch (error) {
    console.error('Error fetching reasons:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch reasons',
      },
    });
  }
};

// POST /api/v1/settings/reasons - Create reason
export const createReason = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const { type, text, status } = req.body;

    // Validate required fields
    if (!type || !text) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Type and text are required',
        },
      });
    }

    // Validate type enum
    const validTypes = [
      'Discount',
      'BranchClose',
      'OrderCancel',
      'Refund',
      'NonChargeable',
      'InventoryAdjustment',
      'Reservation',
      'SalesReturn',
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: `Type must be one of: ${validTypes.join(', ')}`,
        },
      });
    }

    const reason = await prisma.reason.create({
      data: {
        businessOwnerId: tenantId,
        type,
        text,
        status: status || 'active',
      },
    });

    return res.status(201).json({
      success: true,
      data: reason,
      message: 'Reason created successfully',
    });
  } catch (error) {
    console.error('Error creating reason:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create reason',
      },
    });
  }
};

// PUT /api/v1/settings/reasons/:id - Update reason
export const updateReason = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Check if reason exists and belongs to tenant
    const existingReason = await prisma.reason.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingReason) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REASON_NOT_FOUND',
          message: 'Reason not found',
        },
      });
    }

    const { type, text, status } = req.body;

    const updateData: any = {};

    if (type !== undefined) {
      // Validate type enum
      const validTypes = [
        'Discount',
        'BranchClose',
        'OrderCancel',
        'Refund',
        'NonChargeable',
        'InventoryAdjustment',
        'Reservation',
        'SalesReturn',
      ];

      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TYPE',
            message: `Type must be one of: ${validTypes.join(', ')}`,
          },
        });
      }
      updateData.type = type;
    }

    if (text !== undefined) updateData.text = text;
    if (status !== undefined) updateData.status = status;

    const reason = await prisma.reason.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: reason,
      message: 'Reason updated successfully',
    });
  } catch (error) {
    console.error('Error updating reason:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update reason',
      },
    });
  }
};

// DELETE /api/v1/settings/reasons/:id - Delete reason
export const deleteReason = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Check if reason exists and belongs to tenant
    const existingReason = await prisma.reason.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingReason) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'REASON_NOT_FOUND',
          message: 'Reason not found',
        },
      });
    }

    await prisma.reason.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Reason deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting reason:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete reason',
      },
    });
  }
};

// GET /api/v1/settings/preferences - Get business preferences
export const getPreferences = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Find or create preferences
    let preferences = await prisma.businessPreference.findUnique({
      where: {
        businessOwnerId: tenantId,
      },
    });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await prisma.businessPreference.create({
        data: {
          businessOwnerId: tenantId,
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          dateFormat: 'DD/MM/YYYY',
          invoicePrefix: 'INV',
          kotPrefix: 'KOT',
          autoAcceptOrders: true,
          enableReservations: true,
          settings: {},
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch preferences',
      },
    });
  }
};

// PUT /api/v1/settings/preferences - Update business preferences
export const updatePreferences = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const {
      currency,
      timezone,
      dateFormat,
      invoicePrefix,
      kotPrefix,
      autoAcceptOrders,
      enableReservations,
      settings,
    } = req.body;

    // Find existing preferences
    const existingPreferences = await prisma.businessPreference.findUnique({
      where: {
        businessOwnerId: tenantId,
      },
    });

    // Build update data with only provided fields
    const updateData: any = {};
    if (currency !== undefined) updateData.currency = currency;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (dateFormat !== undefined) updateData.dateFormat = dateFormat;
    if (invoicePrefix !== undefined) updateData.invoicePrefix = invoicePrefix;
    if (kotPrefix !== undefined) updateData.kotPrefix = kotPrefix;
    if (autoAcceptOrders !== undefined)
      updateData.autoAcceptOrders = autoAcceptOrders;
    if (enableReservations !== undefined)
      updateData.enableReservations = enableReservations;
    if (settings !== undefined) updateData.settings = settings;

    let preferences;

    if (existingPreferences) {
      // Update existing preferences
      preferences = await prisma.businessPreference.update({
        where: {
          businessOwnerId: tenantId,
        },
        data: updateData,
      });
    } else {
      // Create new preferences with defaults for missing fields
      preferences = await prisma.businessPreference.create({
        data: {
          businessOwnerId: tenantId,
          currency: currency || 'INR',
          timezone: timezone || 'Asia/Kolkata',
          dateFormat: dateFormat || 'DD/MM/YYYY',
          invoicePrefix: invoicePrefix || 'INV',
          kotPrefix: kotPrefix || 'KOT',
          autoAcceptOrders:
            autoAcceptOrders !== undefined ? autoAcceptOrders : true,
          enableReservations:
            enableReservations !== undefined ? enableReservations : true,
          settings: settings || {},
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: preferences,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update preferences',
      },
    });
  }
};

// GET /api/v1/settings/profile - Get business owner profile
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Fetch business owner profile
    const businessOwner = await prisma.businessOwner.findUnique({
      where: {
        id: tenantId,
      },
      include: {
        plan: true,
        businessPreference: true,
        branches: {
          where: {
            status: 'active',
          },
        },
      },
    });

    if (!businessOwner) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUSINESS_OWNER_NOT_FOUND',
          message: 'Business owner not found',
        },
      });
    }

    const profileSettings =
      businessOwner.businessPreference &&
      businessOwner.businessPreference.settings &&
      typeof businessOwner.businessPreference.settings === 'object' &&
      !Array.isArray(businessOwner.businessPreference.settings)
        ? (businessOwner.businessPreference.settings as Record<string, any>)
        : {};

    // Remove password from response
    const { password, ...profileWithoutPassword } = businessOwner;

    return res.status(200).json({
      success: true,
      data: {
        ...profileWithoutPassword,
        businessName: profileWithoutPassword.restaurantName,
        brandName: profileWithoutPassword.ownerName,
        postalCode: profileWithoutPassword.zipCode,
        logo: profileWithoutPassword.avatar,
        website: typeof profileSettings.website === 'string' ? profileSettings.website : null,
        description:
          typeof profileSettings.description === 'string' ? profileSettings.description : null,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch profile',
      },
    });
  }
};

// PUT /api/v1/settings/profile - Update business owner profile
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Check if business owner exists
    const existingBusinessOwner = await prisma.businessOwner.findUnique({
      where: {
        id: tenantId,
      },
    });

    if (!existingBusinessOwner) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUSINESS_OWNER_NOT_FOUND',
          message: 'Business owner not found',
        },
      });
    }

    const {
      ownerName,
      brandName,
      restaurantName,
      businessName,
      phone,
      businessType,
      tinGstNumber,
      country,
      state,
      city,
      zipCode,
      postalCode,
      address,
      website,
      description,
    } = req.body;

    // Build update data with only provided fields
    const updateData: any = {};
    if (ownerName !== undefined || brandName !== undefined) {
      updateData.ownerName = ownerName ?? brandName;
    }
    if (restaurantName !== undefined || businessName !== undefined) {
      updateData.restaurantName = restaurantName ?? businessName;
    }
    if (phone !== undefined) updateData.phone = phone;
    if (businessType !== undefined) updateData.businessType = businessType;
    if (tinGstNumber !== undefined) updateData.tinGstNumber = tinGstNumber;
    if (country !== undefined) updateData.country = country;
    if (state !== undefined) updateData.state = state;
    if (city !== undefined) updateData.city = city;
    if (zipCode !== undefined || postalCode !== undefined) {
      updateData.zipCode = zipCode ?? postalCode;
    }
    if (address !== undefined) updateData.address = address;

    // Handle avatar upload if file is present
    const uploadedFile = (req as any).uploadedFile;
    if (uploadedFile) {
      // Delete old avatar from S3 if exists
      if (existingBusinessOwner.avatar) {
        const s3Service = await import('../services/s3.service');
        const oldKey = existingBusinessOwner.avatar.split('.com/')[1];
        if (oldKey) {
          await s3Service.deleteFromS3(oldKey);
        }
      }
      updateData.avatar = uploadedFile;
    }

    // Update business owner profile
    const businessOwner = await prisma.businessOwner.update({
      where: {
        id: tenantId,
      },
      data: updateData,
      include: {
        plan: true,
        businessPreference: true,
        branches: {
          where: {
            status: 'active',
          },
        },
      },
    });

    if (website !== undefined || description !== undefined) {
      const existingProfileSettings =
        businessOwner.businessPreference &&
        businessOwner.businessPreference.settings &&
        typeof businessOwner.businessPreference.settings === 'object' &&
        !Array.isArray(businessOwner.businessPreference.settings)
          ? (businessOwner.businessPreference.settings as Record<string, any>)
          : {};

      const nextProfileSettings: Record<string, any> = {
        ...existingProfileSettings,
      };

      if (website !== undefined) {
        nextProfileSettings.website = typeof website === 'string' ? website.trim() || null : website;
      }

      if (description !== undefined) {
        nextProfileSettings.description =
          typeof description === 'string' ? description.trim() || null : description;
      }

      await prisma.businessPreference.upsert({
        where: {
          businessOwnerId: tenantId,
        },
        update: {
          settings: nextProfileSettings,
        },
        create: {
          businessOwnerId: tenantId,
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          dateFormat: 'DD/MM/YYYY',
          invoicePrefix: 'INV',
          kotPrefix: 'KOT',
          autoAcceptOrders: true,
          enableReservations: true,
          settings: nextProfileSettings,
        },
      });
    }

    const refreshedBusinessOwner = await prisma.businessOwner.findUnique({
      where: {
        id: tenantId,
      },
      include: {
        plan: true,
        businessPreference: true,
        branches: {
          where: {
            status: 'active',
          },
        },
      },
    });

    const refreshedProfileSettings =
      refreshedBusinessOwner?.businessPreference &&
      refreshedBusinessOwner.businessPreference.settings &&
      typeof refreshedBusinessOwner.businessPreference.settings === 'object' &&
      !Array.isArray(refreshedBusinessOwner.businessPreference.settings)
        ? (refreshedBusinessOwner.businessPreference.settings as Record<string, any>)
        : {};

    // Remove password from response
    const { password, ...profileWithoutPassword } = refreshedBusinessOwner || businessOwner;

    return res.status(200).json({
      success: true,
      data: {
        ...profileWithoutPassword,
        businessName: profileWithoutPassword.restaurantName,
        brandName: profileWithoutPassword.ownerName,
        postalCode: profileWithoutPassword.zipCode,
        logo: profileWithoutPassword.avatar,
        website:
          typeof refreshedProfileSettings.website === 'string'
            ? refreshedProfileSettings.website
            : null,
        description:
          typeof refreshedProfileSettings.description === 'string'
            ? refreshedProfileSettings.description
            : null,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile',
      },
    });
  }
};

// ============================================
// Sales Channel Controllers (US-133)
// ============================================

// GET /api/v1/settings/sales-channels - List all sales channels for tenant
export const getSalesChannels = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const defaultChannelNames = [
      'DineIn',
      'TakeAway',
      'Delivery',
      'Subscription',
      'Catering',
      'Bistro',
    ];

    // Ensure each tenant has baseline channels available across the app.
    await prisma.salesChannel.createMany({
      data: defaultChannelNames.map((name) => ({
        businessOwnerId: tenantId,
        name,
        enabled: true,
      })),
      skipDuplicates: true,
    });

    const channels = await prisma.salesChannel.findMany({
      where: {
        businessOwnerId: tenantId,
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: channels,
    });
  } catch (error) {
    console.error('Error fetching sales channels:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch sales channels',
      },
    });
  }
};

// PUT /api/v1/settings/sales-channels/:id - Update sales channel enabled status
export const updateSalesChannel = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { enabled } = req.body;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Validate enabled field
    if (enabled === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'enabled field is required',
        },
      });
    }

    // Check if channel exists and belongs to tenant
    const existingChannel = await prisma.salesChannel.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingChannel) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHANNEL_NOT_FOUND',
          message: 'Sales channel not found',
        },
      });
    }

    const channel = await prisma.salesChannel.update({
      where: { id },
      data: { enabled },
    });

    return res.status(200).json({
      success: true,
      data: channel,
      message: 'Sales channel updated successfully',
    });
  } catch (error) {
    console.error('Error updating sales channel:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update sales channel',
      },
    });
  }
};

// ============================================
// Aggregator Controllers (US-133)
// ============================================

// GET /api/v1/settings/aggregators - List all aggregators for tenant
export const getAggregators = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    const defaultAggregatorNames = ['Swiggy', 'Zomato', 'UberEats', 'Bistro'];

    // Ensure aggregator options exist so channel selector can render useful defaults.
    await prisma.aggregator.createMany({
      data: defaultAggregatorNames.map((name) => ({
        businessOwnerId: tenantId,
        name,
        isConnected: false,
      })),
      skipDuplicates: true,
    });

    const aggregators = await prisma.aggregator.findMany({
      where: {
        businessOwnerId: tenantId,
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: aggregators,
    });
  } catch (error) {
    console.error('Error fetching aggregators:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch aggregators',
      },
    });
  }
};

// PUT /api/v1/settings/aggregators/:id - Update aggregator connection
export const updateAggregator = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const { id } = req.params;
    const { merchantId, apiKey, apiEndpoint, callbackUrl, isConnected } = req.body;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MISSING_TENANT_CONTEXT',
          message: 'Tenant context is required',
        },
      });
    }

    // Check if aggregator exists and belongs to tenant
    const existingAggregator = await prisma.aggregator.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingAggregator) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AGGREGATOR_NOT_FOUND',
          message: 'Aggregator not found',
        },
      });
    }

    // Build update data object
    const updateData: any = {};
    if (merchantId !== undefined) updateData.merchantId = merchantId;
    if (apiKey !== undefined) updateData.apiKey = apiKey;
    if (apiEndpoint !== undefined) updateData.apiEndpoint = apiEndpoint;
    if (callbackUrl !== undefined) updateData.callbackUrl = callbackUrl;
    if (isConnected !== undefined) updateData.isConnected = isConnected;

    const aggregator = await prisma.aggregator.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: aggregator,
      message: 'Aggregator updated successfully',
    });
  } catch (error) {
    console.error('Error updating aggregator:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update aggregator',
      },
    });
  }
};

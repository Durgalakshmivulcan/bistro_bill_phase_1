import { Response } from 'express';
import { prisma } from '../services/db.service';
import { AuthenticatedRequest } from '../types';

/**
 * US-103: Discount List Endpoint
 * GET /api/v1/marketing/discounts
 */
export const getDiscounts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, type } = req.query;
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    // Build filter
    const where: any = {
      businessOwnerId: tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Fetch discounts with usage stats
    const discounts = await prisma.discount.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            discountProducts: true,
            discountCategories: true,
          },
        },
      },
    });

    // Add usage stats (usedCount / usageLimit)
    const discountsWithStats = discounts.map((discount) => ({
      ...discount,
      usageStats: {
        usedCount: discount.usedCount,
        usageLimit: discount.usageLimit || null,
        remainingUses: discount.usageLimit ? discount.usageLimit - discount.usedCount : null,
      },
      productCount: discount._count.discountProducts,
      categoryCount: discount._count.discountCategories,
    }));

    res.json({
      success: true,
      data: discountsWithStats,
      message: 'Discounts fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching discounts:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch discounts',
      },
    });
  }
};

/**
 * US-104: Discount Create Endpoint
 * POST /api/v1/marketing/discounts
 */
export const createDiscount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    const {
      code,
      name,
      description,
      type,
      valueType,
      value,
      minOrderAmount,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      status,
      productIds,
      categoryIds,
    } = req.body;

    // Validate required fields
    if (!name || !type || !valueType || value === undefined) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Required fields: name, type, valueType, value',
        },
      });
      return;
    }

    // Generate unique code if not provided
    let discountCode = code;
    if (!discountCode) {
      // Generate code format: DISC-XXXXX
      const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
      discountCode = `DISC-${randomPart}`;
    }

    // Check if code is unique
    const existingDiscount = await prisma.discount.findFirst({
      where: {
        businessOwnerId: tenantId,
        code: discountCode,
      },
    });

    if (existingDiscount) {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_CODE',
          message: 'Discount code already exists',
        },
      });
      return;
    }

    // Create discount with associations
    const discount = await prisma.discount.create({
      data: {
        businessOwnerId: tenantId,
        code: discountCode,
        name,
        description: description || null,
        type,
        valueType,
        value,
        minOrderAmount: minOrderAmount || null,
        maxDiscount: maxDiscount || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        usageLimit: usageLimit || null,
        status: status || 'active',
        // Create product associations if provided
        discountProducts: productIds?.length
          ? {
              create: productIds.map((productId: string) => ({
                productId,
              })),
            }
          : undefined,
        // Create category associations if provided
        discountCategories: categoryIds?.length
          ? {
              create: categoryIds.map((categoryId: string) => ({
                categoryId,
              })),
            }
          : undefined,
      },
      include: {
        _count: {
          select: {
            discountProducts: true,
            discountCategories: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: discount,
      message: 'Discount created successfully',
    });
  } catch (error) {
    console.error('Error creating discount:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create discount',
      },
    });
  }
};

/**
 * US-105: Discount Update Endpoint
 * PUT /api/v1/marketing/discounts/:id
 */
export const updateDiscount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    // Check if discount exists and belongs to tenant
    const existingDiscount = await prisma.discount.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingDiscount) {
      res.status(404).json({
        success: false,
        error: {
          code: 'DISCOUNT_NOT_FOUND',
          message: 'Discount not found',
        },
      });
      return;
    }

    const {
      code,
      name,
      description,
      type,
      valueType,
      value,
      minOrderAmount,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      status,
      productIds,
      categoryIds,
    } = req.body;

    // If code is being changed, check for uniqueness
    if (code && code !== existingDiscount.code) {
      const duplicateCode = await prisma.discount.findFirst({
        where: {
          businessOwnerId: tenantId,
          code,
          id: { not: id },
        },
      });

      if (duplicateCode) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_CODE',
            message: 'Discount code already exists',
          },
        });
        return;
      }
    }

    // Update discount with product/category associations
    // First delete existing associations if new ones provided
    if (productIds !== undefined) {
      await prisma.discountProduct.deleteMany({
        where: { discountId: id },
      });
    }

    if (categoryIds !== undefined) {
      await prisma.discountCategory.deleteMany({
        where: { discountId: id },
      });
    }

    // Build update data
    const updateData: any = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (type !== undefined) updateData.type = type;
    if (valueType !== undefined) updateData.valueType = valueType;
    if (value !== undefined) updateData.value = value;
    if (minOrderAmount !== undefined) updateData.minOrderAmount = minOrderAmount;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
    if (status !== undefined) updateData.status = status;

    // Add new product associations
    if (productIds?.length) {
      updateData.discountProducts = {
        create: productIds.map((productId: string) => ({
          productId,
        })),
      };
    }

    // Add new category associations
    if (categoryIds?.length) {
      updateData.discountCategories = {
        create: categoryIds.map((categoryId: string) => ({
          categoryId,
        })),
      };
    }

    // Update discount
    const updatedDiscount = await prisma.discount.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            discountProducts: true,
            discountCategories: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedDiscount,
      message: 'Discount updated successfully',
    });
  } catch (error) {
    console.error('Error updating discount:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update discount',
      },
    });
  }
};

/**
 * US-105: Discount Delete Endpoint
 * DELETE /api/v1/marketing/discounts/:id
 */
export const deleteDiscount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    // Check if discount exists and belongs to tenant
    const existingDiscount = await prisma.discount.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingDiscount) {
      res.status(404).json({
        success: false,
        error: {
          code: 'DISCOUNT_NOT_FOUND',
          message: 'Discount not found',
        },
      });
      return;
    }

    // Check if discount was used in orders
    const orderCount = await prisma.order.count({
      where: {
        discountId: id,
      },
    });

    if (orderCount > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DISCOUNT_IN_USE',
          message: `Cannot delete discount. It has been used in ${orderCount} order(s)`,
        },
      });
      return;
    }

    // Delete discount (cascade will remove associations)
    await prisma.discount.delete({
      where: { id },
    });

    res.json({
      success: true,
      data: null,
      message: 'Discount deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting discount:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete discount',
      },
    });
  }
};

/**
 * US-106: Discount Validate Endpoint
 * POST /api/v1/marketing/discounts/validate
 */
export const validateDiscount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'TENANT_REQUIRED',
          message: 'Tenant context is required',
        },
      });
      return;
    }

    const { code, orderTotal, orderItems } = req.body;

    // Validate required fields
    if (!code || orderTotal === undefined) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'Required fields: code, orderTotal',
        },
      });
      return;
    }

    // Find discount by code and tenant
    const discount = await prisma.discount.findFirst({
      where: {
        businessOwnerId: tenantId,
        code,
      },
      include: {
        discountProducts: {
          select: {
            productId: true,
          },
        },
        discountCategories: {
          select: {
            categoryId: true,
          },
        },
      },
    });

    // Check if code exists
    if (!discount) {
      res.json({
        success: true,
        data: {
          isValid: false,
          reason: 'INVALID_CODE',
          message: 'Discount code not found',
        },
      });
      return;
    }

    // Check if status is active
    if (discount.status !== 'active') {
      res.json({
        success: true,
        data: {
          isValid: false,
          reason: 'INACTIVE_DISCOUNT',
          message: 'This discount is not active',
        },
      });
      return;
    }

    // Check date range
    const now = new Date();
    if (discount.startDate && now < discount.startDate) {
      res.json({
        success: true,
        data: {
          isValid: false,
          reason: 'NOT_STARTED',
          message: 'This discount is not yet active',
        },
      });
      return;
    }

    if (discount.endDate && now > discount.endDate) {
      res.json({
        success: true,
        data: {
          isValid: false,
          reason: 'EXPIRED',
          message: 'This discount has expired',
        },
      });
      return;
    }

    // Check usage limit
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      res.json({
        success: true,
        data: {
          isValid: false,
          reason: 'USAGE_LIMIT_REACHED',
          message: 'This discount has reached its usage limit',
        },
      });
      return;
    }

    // Check minimum order amount
    if (discount.minOrderAmount && orderTotal < discount.minOrderAmount.toNumber()) {
      res.json({
        success: true,
        data: {
          isValid: false,
          reason: 'MIN_ORDER_NOT_MET',
          message: `Minimum order amount of ${discount.minOrderAmount} required`,
        },
      });
      return;
    }

    // Check product/category restrictions if type is ProductCategory
    if (discount.type === 'ProductCategory' && orderItems && orderItems.length > 0) {
      const productIds = discount.discountProducts.map((dp) => dp.productId);
      const categoryIds = discount.discountCategories.map((dc) => dc.categoryId);

      // Check if any order item matches product or category restrictions
      let hasMatchingItem = false;
      for (const item of orderItems) {
        // Check if product ID matches
        if (productIds.includes(item.productId)) {
          hasMatchingItem = true;
          break;
        }
        // Check if category ID matches (assuming orderItems include categoryId)
        if (item.categoryId && categoryIds.includes(item.categoryId)) {
          hasMatchingItem = true;
          break;
        }
      }

      if (!hasMatchingItem) {
        res.json({
          success: true,
          data: {
            isValid: false,
            reason: 'NO_MATCHING_ITEMS',
            message: 'This discount does not apply to any items in your order',
          },
        });
        return;
      }
    }

    // Calculate discount amount based on type
    let discountAmount = 0;
    if (discount.valueType === 'Percentage') {
      discountAmount = (orderTotal * discount.value.toNumber()) / 100;
      // Apply max discount if specified
      if (discount.maxDiscount && discountAmount > discount.maxDiscount.toNumber()) {
        discountAmount = discount.maxDiscount.toNumber();
      }
    } else if (discount.valueType === 'Fixed') {
      discountAmount = discount.value.toNumber();
    } else if (discount.valueType === 'BOGO') {
      // For BOGO, discount amount calculation would depend on specific items
      // For now, return 0 and let the POS calculate based on items
      discountAmount = 0;
    }

    // Discount is valid
    res.json({
      success: true,
      data: {
        isValid: true,
        discount: {
          id: discount.id,
          code: discount.code,
          name: discount.name,
          type: discount.type,
          valueType: discount.valueType,
          value: discount.value,
          minOrderAmount: discount.minOrderAmount?.toNumber() || null,
          maxDiscount: discount.maxDiscount?.toNumber() || null,
        },
        calculatedDiscountAmount: discountAmount,
      },
      message: 'Discount is valid',
    });
  } catch (error) {
    console.error('Error validating discount:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to validate discount',
      },
    });
  }
};

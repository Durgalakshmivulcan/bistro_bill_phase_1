import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse, PaginationMeta } from '../types';
import { prisma } from '../services/db.service';
import { ProductType, Prisma, OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import crypto from 'crypto';
import { deleteFromS3, extractKeyFromUrl } from '../services/s3.service';

/**
 * Product Response Interface (list view)
 */
interface ProductListItem {
  id: string;
  name: string;
  sku: string | null;
  type: ProductType;
  shortCode: string | null;
  measuringUnit: string | null;
  includesTax: boolean;
  taxId: string | null;
  eligibleForDiscount: boolean;
  discountType: string | null;
  tagId: string | null;
  status: string;
  isVeg: boolean;
  primaryImage: string | null;
  category: {
    id: string;
    name: string;
  } | null;
  subCategory: {
    id: string;
    name: string;
  } | null;
  brand: {
    id: string;
    name: string;
  } | null;
  menu: {
    id: string;
    name: string;
  } | null;
  variantCount: number;
  prices: Array<{
    channelType: string;
    basePrice: number;
    variantId: string | null;
  }>;
  basePrice: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product List Response
 */
interface ProductListResponse {
  products: ProductListItem[];
}

/**
 * Valid product types for validation
 */
const VALID_PRODUCT_TYPES: ProductType[] = ['Regular', 'Combo', 'Retail'];

/**
 * Valid sort fields for product listing
 */
const VALID_SORT_FIELDS = ['name', 'createdAt', 'price'] as const;
type SortField = typeof VALID_SORT_FIELDS[number];

/**
 * GET /api/v1/catalog/products
 * List all products for the authenticated tenant with pagination and filtering
 * Requires tenant middleware
 */
export async function listProducts(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to list products',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Parse query parameters
    const {
      page: pageStr,
      limit: limitStr,
      categoryId,
      subCategoryId,
      brandId,
      menuId,
      type,
      status,
      search,
      sortBy,
      sortOrder,
    } = req.query;

    // Parse pagination
    const page = Math.max(1, parseInt(pageStr as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr as string, 10) || 10));
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Prisma.ProductWhereInput = {
      businessOwnerId: tenantId,
    };

    // Filter by categoryId if provided
    if (categoryId && typeof categoryId === 'string') {
      whereClause.categoryId = categoryId;
    }

    // Filter by subCategoryId if provided
    if (subCategoryId && typeof subCategoryId === 'string') {
      whereClause.subCategoryId = subCategoryId;
    }

    // Filter by brandId if provided
    if (brandId && typeof brandId === 'string') {
      whereClause.brandId = brandId;
    }

    // Filter by menuId if provided
    if (menuId && typeof menuId === 'string') {
      whereClause.menuId = menuId;
    }

    // Filter by type if provided
    if (type && typeof type === 'string') {
      if (!VALID_PRODUCT_TYPES.includes(type as ProductType)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Type must be one of: ${VALID_PRODUCT_TYPES.join(', ')}`,
          },
        };
        res.status(400).json(response);
        return;
      }
      whereClause.type = type as ProductType;
    }

    // Filter by status if provided
    if (status && typeof status === 'string') {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Status must be one of: active, inactive',
          },
        };
        res.status(400).json(response);
        return;
      }
      whereClause.status = status;
    }

    // Filter by kitchenId if provided (products assigned to a specific kitchen)
    const kitchenId = req.query.kitchenId;
    if (kitchenId && typeof kitchenId === 'string') {
      whereClause.productKitchens = {
        some: {
          kitchenId,
        },
      };
    }

    // Filter by price range (base product price only, excludes variant prices)
    const minPriceRaw = req.query.minPrice;
    const maxPriceRaw = req.query.maxPrice;

    let minPrice: number | undefined;
    let maxPrice: number | undefined;

    if (minPriceRaw !== undefined) {
      const parsed = parseFloat(String(minPriceRaw));
      if (Number.isNaN(parsed) || parsed < 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'minPrice must be a non-negative number',
          },
        };
        res.status(400).json(response);
        return;
      }
      minPrice = parsed;
    }

    if (maxPriceRaw !== undefined) {
      const parsed = parseFloat(String(maxPriceRaw));
      if (Number.isNaN(parsed) || parsed < 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'maxPrice must be a non-negative number',
          },
        };
        res.status(400).json(response);
        return;
      }
      maxPrice = parsed;
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'minPrice cannot be greater than maxPrice',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const basePriceFilter: Prisma.DecimalFilter = {};
      if (minPrice !== undefined) {
        basePriceFilter.gte = new Decimal(minPrice);
      }
      if (maxPrice !== undefined) {
        basePriceFilter.lte = new Decimal(maxPrice);
      }

      whereClause.prices = {
        some: {
          variantId: null,
          basePrice: basePriceFilter,
        },
      };
    }

    // Search across name, sku, shortCode, description
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = search.trim();
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { shortCode: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Build order by clause
    let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = { createdAt: 'desc' };

    if (sortBy && typeof sortBy === 'string') {
      const order: Prisma.SortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

      if (!VALID_SORT_FIELDS.includes(sortBy as SortField)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `sortBy must be one of: ${VALID_SORT_FIELDS.join(', ')}`,
          },
        };
        res.status(400).json(response);
        return;
      }

      if (sortBy === 'name') {
        orderBy = { name: order };
      } else if (sortBy === 'createdAt') {
        orderBy = { createdAt: order };
      } else if (sortBy === 'price') {
        // Sort by base price requires a different approach - we'll sort by name as fallback
        // and handle price sorting in application logic if needed
        // For now, sort by name when price is requested (price is in a related table)
        orderBy = { name: order };
      }
    }

    // Fetch products with relations
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          subCategory: {
            select: {
              id: true,
              name: true,
            },
          },
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
          menu: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            where: {
              isPrimary: true,
            },
            select: {
              url: true,
            },
            take: 1,
          },
          _count: {
            select: {
              variants: true,
            },
          },
          productTags: {
            select: {
              tagId: true,
            },
            take: 1,
          },
          prices: {
            select: {
              channelType: true,
              basePrice: true,
              variantId: true,
            },
            orderBy: {
              basePrice: 'asc',
            },
          },
          productKitchens: {
            include: {
              kitchen: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    // Transform to response format
    const productResponses: ProductListItem[] = products.map((product) => {
      // Get primary image URL
      const primaryImage = product.images.length > 0 ? product.images[0].url : null;

      // Prefer base-product price; fallback to cheapest available variant price.
      const baseProductPrice = product.prices.find((price) => price.variantId === null);
      const fallbackPrice = product.prices.length > 0 ? product.prices[0] : null;
      const effectivePrice = baseProductPrice || fallbackPrice;
      const basePrice = effectivePrice ? effectivePrice.basePrice.toNumber() : null;

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        type: product.type,
        shortCode: product.shortCode,
        measuringUnit: (product as any).measuringUnit ?? null,
        includesTax: (product as any).includesTax ?? true,
        taxId: (product as any).taxId ?? null,
        eligibleForDiscount: (product as any).eligibleForDiscount ?? true,
        discountType: (product as any).discountType ?? null,
        tagId: (product as any).productTags?.[0]?.tagId ?? null,
        status: product.status,
        isVeg: product.isVeg,
        primaryImage,
        category: product.category,
        subCategory: product.subCategory,
        brand: product.brand,
        menu: product.menu,
        variantCount: product._count.variants,
        prices: product.prices.map((price) => ({
          channelType: price.channelType,
          basePrice: price.basePrice.toNumber(),
          variantId: price.variantId,
        })),
        basePrice,
        kitchens: (product as any).productKitchens?.map((pk: any) => ({
          id: pk.kitchen.id,
          name: pk.kitchen.name,
        })) || [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit);
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
    };

    const response: ApiResponse<ProductListResponse> = {
      success: true,
      data: {
        products: productResponses,
      },
      pagination,
      message: 'Products retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing products:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve products',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Product Variant Response Interface
 */
interface ProductVariantResponse {
  id: string;
  name: string;
  sku: string | null;
  additionalPrice: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Addon Response Interface
 */
interface ProductAddonResponse {
  id: string;
  name: string;
  price: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Price Response Interface
 */
interface ProductPriceResponse {
  id: string;
  variantId: string | null;
  channelType: string;
  basePrice: number;
  discountPrice: number | null;
  taxGroupId: string | null;
  taxGroup: {
    id: string;
    name: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Image Response Interface
 */
interface ProductImageResponse {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
}

/**
 * Product Tag Response Interface
 */
interface ProductTagResponse {
  id: string;
  name: string;
  color: string | null;
  status: string;
}

/**
 * Product Nutrition Response Interface
 */
interface ProductNutritionResponse {
  id: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  vitamins: unknown | null;
  minerals: unknown | null;
}

/**
 * Product Allergen Response Interface
 */
interface ProductAllergenResponse {
  id: string;
  name: string;
  icon: string | null;
  createdAt: Date;
}

/**
 * Full Product Detail Response Interface
 */
interface ProductDetailResponse {
  id: string;
  name: string;
  sku: string | null;
  type: ProductType;
  description: string | null;
  shortCode: string | null;
  hsnCode: string | null;
  preparationTime: number | null;
  servesCount: number | null;
  measuringUnit: string | null;
  includesTax: boolean;
  taxId: string | null;
  eligibleForDiscount: boolean;
  discountType: string | null;
  tagId: string | null;
  isVeg: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
  } | null;
  subCategory: {
    id: string;
    name: string;
  } | null;
  brand: {
    id: string;
    name: string;
  } | null;
  menu: {
    id: string;
    name: string;
  } | null;
  variants: ProductVariantResponse[];
  addons: ProductAddonResponse[];
  prices: ProductPriceResponse[];
  images: ProductImageResponse[];
  tags: ProductTagResponse[];
  nutrition: ProductNutritionResponse | null;
  allergens: ProductAllergenResponse[];
  kitchens: { id: string; name: string; branchId: string; status: string }[];
}

/**
 * Helper function to convert Decimal to number or null
 */
function decimalToNumber(value: Decimal | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value.toNumber();
}

/**
 * GET /api/v1/catalog/products/:id
 * Get full product details including variants, addons, prices, images, tags, nutrition, allergens
 * Requires tenant middleware
 */
export async function getProductDetail(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to view product details',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Fetch product with all related data
    const product = await prisma.product.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        menu: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        addons: {
          orderBy: {
            name: 'asc',
          },
        },
        prices: {
          include: {
            taxGroup: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        images: {
          orderBy: [
            { isPrimary: 'desc' },
            { sortOrder: 'asc' },
            { createdAt: 'asc' },
          ],
        },
        productTags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
                status: true,
              },
            },
          },
        },
        nutrition: true,
        productAllergens: {
          include: {
            allergen: {
              select: {
                id: true,
                name: true,
                icon: true,
                createdAt: true,
              },
            },
          },
        },
        productKitchens: {
          include: {
            kitchen: {
              select: {
                id: true,
                name: true,
                branchId: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // Check if product exists
    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Transform to response format
    const productResponse: ProductDetailResponse = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      type: product.type,
      description: product.description,
      shortCode: product.shortCode,
      hsnCode: product.hsnCode,
      preparationTime: product.preparationTime,
      servesCount: product.servesCount,
      measuringUnit: (product as any).measuringUnit ?? null,
      includesTax: (product as any).includesTax ?? true,
      taxId: (product as any).taxId ?? null,
      eligibleForDiscount: (product as any).eligibleForDiscount ?? true,
      discountType: (product as any).discountType ?? null,
      tagId: product.productTags?.[0]?.tagId ?? null,
      isVeg: product.isVeg,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      category: product.category,
      subCategory: product.subCategory,
      brand: product.brand,
      menu: product.menu,
      variants: product.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        additionalPrice: variant.additionalPrice.toNumber(),
        status: variant.status,
        createdAt: variant.createdAt,
        updatedAt: variant.updatedAt,
      })),
      addons: product.addons.map((addon) => ({
        id: addon.id,
        name: addon.name,
        price: addon.price.toNumber(),
        status: addon.status,
        createdAt: addon.createdAt,
        updatedAt: addon.updatedAt,
      })),
      prices: product.prices.map((price) => ({
        id: price.id,
        variantId: price.variantId,
        channelType: price.channelType,
        basePrice: price.basePrice.toNumber(),
        discountPrice: decimalToNumber(price.discountPrice),
        taxGroupId: price.taxGroupId,
        taxGroup: price.taxGroup,
        createdAt: price.createdAt,
        updatedAt: price.updatedAt,
      })),
      images: product.images.map((image) => ({
        id: image.id,
        url: image.url,
        isPrimary: image.isPrimary,
        sortOrder: image.sortOrder,
        createdAt: image.createdAt,
      })),
      tags: product.productTags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        color: pt.tag.color,
        status: pt.tag.status,
      })),
      nutrition: product.nutrition
        ? {
            id: product.nutrition.id,
            calories: product.nutrition.calories,
            protein: decimalToNumber(product.nutrition.protein),
            carbs: decimalToNumber(product.nutrition.carbs),
            fat: decimalToNumber(product.nutrition.fat),
            fiber: decimalToNumber(product.nutrition.fiber),
            sugar: decimalToNumber(product.nutrition.sugar),
            sodium: decimalToNumber(product.nutrition.sodium),
            vitamins: product.nutrition.vitamins,
            minerals: product.nutrition.minerals,
          }
        : null,
      allergens: product.productAllergens.map((pa) => ({
        id: pa.allergen.id,
        name: pa.allergen.name,
        icon: pa.allergen.icon,
        createdAt: pa.allergen.createdAt,
      })),
      kitchens: (product as any).productKitchens?.map((pk: any) => ({
        id: pk.kitchen.id,
        name: pk.kitchen.name,
        branchId: pk.kitchen.branchId,
        status: pk.kitchen.status,
      })) || [],
    };

    const response: ApiResponse<{ product: ProductDetailResponse }> = {
      success: true,
      data: {
        product: productResponse,
      },
      message: 'Product retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting product details:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve product details',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Create Product Response Interface
 */
interface CreateProductResponse {
  id: string;
  name: string;
  sku: string;
  type: ProductType;
  categoryId: string | null;
  subCategoryId: string | null;
  brandId: string | null;
  menuId: string | null;
  description: string | null;
  shortCode: string | null;
  hsnCode: string | null;
  preparationTime: number | null;
  servesCount: number | null;
  measuringUnit: string | null;
  includesTax: boolean;
  taxId: string | null;
  eligibleForDiscount: boolean;
  discountType: string | null;
  tagId: string | null;
  isVeg: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate a unique SKU for a product
 * Format: CAT-XXXXX where CAT is first 3 chars of category name (or PRD if no category)
 * and XXXXX is a 5-character alphanumeric random string
 */
async function generateSku(categoryName: string | null, businessOwnerId: string): Promise<string> {
  // Get prefix from category name or default to 'PRD'
  const prefix = categoryName
    ? categoryName.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
    : 'PRD';

  // Ensure prefix is exactly 3 characters
  const normalizedPrefix = (prefix + 'XXX').slice(0, 3);

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    // Generate 5-character random alphanumeric string
    const randomPart = crypto.randomBytes(4).toString('hex').slice(0, 5).toUpperCase();
    const sku = `${normalizedPrefix}-${randomPart}`;

    // Check if SKU already exists for this business
    const existing = await prisma.product.findFirst({
      where: {
        businessOwnerId,
        sku,
      },
    });

    if (!existing) {
      return sku;
    }

    attempts++;
  }

  // Fallback: use timestamp-based SKU if random generation keeps colliding
  const timestamp = Date.now().toString(36).toUpperCase().slice(-5);
  return `${normalizedPrefix}-${timestamp}`;
}

/**
 * POST /api/v1/catalog/products
 * Create a new product for the authenticated tenant
 * Requires tenant middleware
 */
export async function createProduct(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to create a product',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Extract fields from body
    const {
      name,
      type,
      categoryId,
      subCategoryId,
      brandId,
      menuId,
      sku: providedSku,
      description,
      shortCode,
      hsnCode,
      preparationTime,
      servesCount,
      measuringUnit,
      includesTax,
      taxId,
      eligibleForDiscount,
      discountType,
      tagId,
      isVeg,
      status,
      kitchenIds,
    } = req.body;

    const normalizedKitchenIds = Array.isArray(kitchenIds)
      ? Array.from(
          new Set(
            kitchenIds
              .map((kid: unknown) => (typeof kid === 'string' ? kid.trim() : ''))
              .filter((kid: string) => kid.length > 0)
          )
        )
      : undefined;

    // Validate required fields
    const missingFields: string[] = [];

    if (!name || typeof name !== 'string' || name.trim() === '') {
      missingFields.push('name');
    }

    if (!type || typeof type !== 'string') {
      missingFields.push('type');
    }

    if (!categoryId || typeof categoryId !== 'string') {
      missingFields.push('categoryId');
    }

    if (missingFields.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Missing required fields: ${missingFields.join(', ')}`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate product type
    if (!VALID_PRODUCT_TYPES.includes(type as ProductType)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Type must be one of: ${VALID_PRODUCT_TYPES.join(', ')}`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate category exists and belongs to tenant
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        businessOwnerId: tenantId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!category) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category not found or does not belong to your business',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate subCategoryId if provided
    if (subCategoryId) {
      const subCategory = await prisma.subCategory.findFirst({
        where: {
          id: subCategoryId,
          businessOwnerId: tenantId,
          categoryId: categoryId, // Must be under the same category
        },
      });

      if (!subCategory) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'SubCategory not found, does not belong to your business, or does not belong to the specified category',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Validate brandId if provided
    if (brandId) {
      const brand = await prisma.brand.findFirst({
        where: {
          id: brandId,
          businessOwnerId: tenantId,
        },
      });

      if (!brand) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Brand not found or does not belong to your business',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Validate menuId if provided
    if (menuId) {
      const menu = await prisma.menu.findFirst({
        where: {
          id: menuId,
          businessOwnerId: tenantId,
        },
      });

      if (!menu) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Menu not found or does not belong to your business',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Status must be one of: active, inactive',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    if (Array.isArray(normalizedKitchenIds) && normalizedKitchenIds.length > 0) {
      const matchingKitchens = await prisma.kitchen.findMany({
        where: {
          id: { in: normalizedKitchenIds },
          branch: {
            businessOwnerId: tenantId,
          },
        },
        select: { id: true },
      });

      if (matchingKitchens.length !== normalizedKitchenIds.length) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'One or more kitchen IDs are invalid for this business',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Validate taxId if provided
    if (taxId) {
      const tax = await prisma.tax.findFirst({
        where: {
          id: taxId,
          businessOwnerId: tenantId,
        },
      });

      if (!tax) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Tax not found or does not belong to your business',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Validate tagId if provided
    if (tagId) {
      const tag = await prisma.tag.findFirst({
        where: {
          id: tagId,
          businessOwnerId: tenantId,
        },
      });

      if (!tag) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Tag not found or does not belong to your business',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Generate SKU if not provided
    let sku: string;
    if (providedSku && typeof providedSku === 'string' && providedSku.trim() !== '') {
      // Use provided SKU, check for uniqueness
      const existingSku = await prisma.product.findFirst({
        where: {
          businessOwnerId: tenantId,
          sku: providedSku.trim(),
        },
      });

      if (existingSku) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `SKU '${providedSku.trim()}' already exists. Please provide a unique SKU.`,
          },
        };
        res.status(400).json(response);
        return;
      }

      sku = providedSku.trim();
    } else {
      // Generate SKU using category name prefix
      sku = await generateSku(category.name, tenantId);
    }

    // Parse numeric fields
    const parsedPreparationTime = preparationTime !== undefined && preparationTime !== null
      ? parseInt(String(preparationTime), 10)
      : null;

    const parsedServesCount = servesCount !== undefined && servesCount !== null
      ? parseInt(String(servesCount), 10)
      : null;

    // Create product with kitchen assignments
    const product = await prisma.product.create({
      data: {
        businessOwnerId: tenantId,
        name: name.trim(),
        sku,
        type: type as ProductType,
        categoryId,
        subCategoryId: subCategoryId || null,
        brandId: brandId || null,
        menuId: menuId || null,
        description: description?.trim() || null,
        shortCode: shortCode?.trim() || null,
        hsnCode: hsnCode?.trim() || null,
        preparationTime: !isNaN(parsedPreparationTime as number) ? parsedPreparationTime : null,
        servesCount: !isNaN(parsedServesCount as number) ? parsedServesCount : null,
        measuringUnit: measuringUnit?.trim() || null,
        includesTax: typeof includesTax === 'boolean' ? includesTax : true,
        taxId: taxId || null,
        eligibleForDiscount: typeof eligibleForDiscount === 'boolean' ? eligibleForDiscount : true,
        discountType: discountType?.trim() || null,
        isVeg: typeof isVeg === 'boolean' ? isVeg : true,
        status: status || 'active',
        productTags: tagId
          ? {
              create: [{ tagId }],
            }
          : undefined,
        productKitchens: Array.isArray(normalizedKitchenIds) && normalizedKitchenIds.length > 0
          ? { create: normalizedKitchenIds.map((kid: string) => ({ kitchenId: kid })) }
          : undefined,
      },
    });

    // Build response
    const productResponse: CreateProductResponse = {
      id: product.id,
      name: product.name,
      sku: product.sku || sku, // Ensure SKU is returned even if somehow null
      type: product.type,
      categoryId: product.categoryId,
      subCategoryId: product.subCategoryId,
      brandId: product.brandId,
      menuId: product.menuId,
      description: product.description,
      shortCode: product.shortCode,
      hsnCode: product.hsnCode,
      preparationTime: product.preparationTime,
      servesCount: product.servesCount,
      measuringUnit: (product as any).measuringUnit ?? null,
      includesTax: (product as any).includesTax ?? true,
      taxId: (product as any).taxId ?? null,
      eligibleForDiscount: (product as any).eligibleForDiscount ?? true,
      discountType: (product as any).discountType ?? null,
      tagId: tagId || null,
      isVeg: product.isVeg,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    const response: ApiResponse<{ product: CreateProductResponse }> = {
      success: true,
      data: {
        product: productResponse,
      },
      message: 'Product created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating product:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create product',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Update Product Response Interface
 */
interface UpdateProductResponse {
  id: string;
  name: string;
  sku: string | null;
  type: ProductType;
  categoryId: string | null;
  subCategoryId: string | null;
  brandId: string | null;
  menuId: string | null;
  description: string | null;
  shortCode: string | null;
  hsnCode: string | null;
  preparationTime: number | null;
  servesCount: number | null;
  measuringUnit: string | null;
  includesTax: boolean;
  taxId: string | null;
  eligibleForDiscount: boolean;
  discountType: string | null;
  tagId: string | null;
  isVeg: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * PUT /api/v1/catalog/products/:id
 * Update an existing product for the authenticated tenant
 * Requires tenant middleware
 */
export async function updateProduct(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to update a product',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check if product exists and belongs to tenant
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        productTags: {
          select: {
            tagId: true,
          },
          take: 1,
        },
      },
    });

    if (!existingProduct) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Extract fields from body
    const {
      name,
      type,
      categoryId,
      subCategoryId,
      brandId,
      menuId,
      sku: providedSku,
      description,
      shortCode,
      hsnCode,
      preparationTime,
      servesCount,
      measuringUnit,
      includesTax,
      taxId,
      eligibleForDiscount,
      discountType,
      tagId,
      isVeg,
      status,
      kitchenIds,
    } = req.body;

    const normalizedKitchenIds = Array.isArray(kitchenIds)
      ? Array.from(
          new Set(
            kitchenIds
              .map((k: unknown) => (typeof k === 'string' ? k.trim() : ''))
              .filter((k: string) => k.length > 0)
          )
        )
      : null;

    // Build update object dynamically
    const updateData: Prisma.ProductUpdateInput = {};

    // Validate and add name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name must be a non-empty string',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.name = name.trim();
    }

    // Validate and add type if provided
    if (type !== undefined) {
      if (!VALID_PRODUCT_TYPES.includes(type as ProductType)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Type must be one of: ${VALID_PRODUCT_TYPES.join(', ')}`,
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.type = type as ProductType;
    }

    // Validate and add categoryId if provided
    if (categoryId !== undefined) {
      if (categoryId === null) {
        // Allow clearing categoryId
        updateData.category = { disconnect: true };
      } else {
        // Validate category exists and belongs to tenant
        const category = await prisma.category.findFirst({
          where: {
            id: categoryId,
            businessOwnerId: tenantId,
          },
        });

        if (!category) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Category not found or does not belong to your business',
            },
          };
          res.status(400).json(response);
          return;
        }
        updateData.category = { connect: { id: categoryId } };
      }
    }

    // Validate and add subCategoryId if provided
    if (subCategoryId !== undefined) {
      if (subCategoryId === null) {
        // Allow clearing subCategoryId
        updateData.subCategory = { disconnect: true };
      } else {
        // Determine the categoryId to validate against
        const effectiveCategoryId = categoryId !== undefined ? categoryId : existingProduct.categoryId;

        // Validate subCategory exists and belongs to tenant and the correct category
        const subCategory = await prisma.subCategory.findFirst({
          where: {
            id: subCategoryId,
            businessOwnerId: tenantId,
            categoryId: effectiveCategoryId || undefined, // Must be under the same category
          },
        });

        if (!subCategory) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'SubCategory not found, does not belong to your business, or does not belong to the specified category',
            },
          };
          res.status(400).json(response);
          return;
        }
        updateData.subCategory = { connect: { id: subCategoryId } };
      }
    }

    // Validate and add brandId if provided
    if (brandId !== undefined) {
      if (brandId === null) {
        // Allow clearing brandId
        updateData.brand = { disconnect: true };
      } else {
        // Validate brand exists and belongs to tenant
        const brand = await prisma.brand.findFirst({
          where: {
            id: brandId,
            businessOwnerId: tenantId,
          },
        });

        if (!brand) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Brand not found or does not belong to your business',
            },
          };
          res.status(400).json(response);
          return;
        }
        updateData.brand = { connect: { id: brandId } };
      }
    }

    // Validate and add menuId if provided
    if (menuId !== undefined) {
      if (menuId === null) {
        // Allow clearing menuId
        updateData.menu = { disconnect: true };
      } else {
        // Validate menu exists and belongs to tenant
        const menu = await prisma.menu.findFirst({
          where: {
            id: menuId,
            businessOwnerId: tenantId,
          },
        });

        if (!menu) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Menu not found or does not belong to your business',
            },
          };
          res.status(400).json(response);
          return;
        }
        updateData.menu = { connect: { id: menuId } };
      }
    }

    // Validate and add SKU if provided
    if (providedSku !== undefined) {
      if (providedSku === null || (typeof providedSku === 'string' && providedSku.trim() === '')) {
        updateData.sku = null;
      } else if (typeof providedSku === 'string') {
        const trimmedSku = providedSku.trim();
        // Check for uniqueness (excluding current product)
        const existingSku = await prisma.product.findFirst({
          where: {
            businessOwnerId: tenantId,
            sku: trimmedSku,
            id: { not: id },
          },
        });

        if (existingSku) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `SKU '${trimmedSku}' already exists. Please provide a unique SKU.`,
            },
          };
          res.status(400).json(response);
          return;
        }

        updateData.sku = trimmedSku;
      }
    }

    // Add simple text fields if provided
    if (description !== undefined) {
      updateData.description = description === null ? null : description?.trim() || null;
    }

    if (shortCode !== undefined) {
      updateData.shortCode = shortCode === null ? null : shortCode?.trim() || null;
    }

    if (hsnCode !== undefined) {
      updateData.hsnCode = hsnCode === null ? null : hsnCode?.trim() || null;
    }

    if (measuringUnit !== undefined) {
      updateData.measuringUnit = measuringUnit === null ? null : measuringUnit?.trim() || null;
    }

    if (includesTax !== undefined) {
      updateData.includesTax = Boolean(includesTax);
    }

    if (taxId !== undefined) {
      if (taxId === null || taxId === '') {
        updateData.taxId = null;
      } else {
        const tax = await prisma.tax.findFirst({
          where: {
            id: taxId,
            businessOwnerId: tenantId,
          },
        });

        if (!tax) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Tax not found or does not belong to your business',
            },
          };
          res.status(400).json(response);
          return;
        }
        updateData.taxId = taxId;
      }
    }

    if (eligibleForDiscount !== undefined) {
      updateData.eligibleForDiscount = Boolean(eligibleForDiscount);
    }

    if (discountType !== undefined) {
      updateData.discountType = discountType === null ? null : discountType?.trim() || null;
    }

    // Parse and add numeric fields if provided
    if (preparationTime !== undefined) {
      if (preparationTime === null) {
        updateData.preparationTime = null;
      } else {
        const parsedValue = parseInt(String(preparationTime), 10);
        updateData.preparationTime = !isNaN(parsedValue) ? parsedValue : null;
      }
    }

    if (servesCount !== undefined) {
      if (servesCount === null) {
        updateData.servesCount = null;
      } else {
        const parsedValue = parseInt(String(servesCount), 10);
        updateData.servesCount = !isNaN(parsedValue) ? parsedValue : null;
      }
    }

    // Add boolean field if provided
    if (isVeg !== undefined) {
      updateData.isVeg = typeof isVeg === 'boolean' ? isVeg : existingProduct.isVeg;
    }

    // Validate and add status if provided
    if (status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Status must be one of: active, inactive',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.status = status;
    }

    // Handle kitchenIds if provided
    const hasKitchenUpdate = kitchenIds !== undefined && Array.isArray(normalizedKitchenIds);
    if (hasKitchenUpdate) {
      if ((normalizedKitchenIds as string[]).length > 0) {
        const matchingKitchens = await prisma.kitchen.findMany({
          where: {
            id: { in: normalizedKitchenIds as string[] },
            branch: {
              businessOwnerId: tenantId,
            },
          },
          select: { id: true },
        });

        if (matchingKitchens.length !== (normalizedKitchenIds as string[]).length) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'One or more kitchen IDs are invalid for this business',
            },
          };
          res.status(400).json(response);
          return;
        }
      }

      updateData.productKitchens = {
        deleteMany: {},
        create: (normalizedKitchenIds as string[]).map((kid: string) => ({ kitchenId: kid })),
      };
    }

    // Handle tag update (single-select dropdown semantics)
    const hasTagUpdate = tagId !== undefined;
    let tagIdToReturn = existingProduct.productTags?.[0]?.tagId || null;
    if (hasTagUpdate && tagId !== null && tagId !== '') {
      const tag = await prisma.tag.findFirst({
        where: {
          id: tagId,
          businessOwnerId: tenantId,
        },
      });

      if (!tag) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Tag not found or does not belong to your business',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Check if there are any fields to update
    if (Object.keys(updateData).length === 0 && !hasTagUpdate) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No fields provided to update',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Update product and tag mapping in a transaction
    const updatedProduct = await prisma.$transaction(async (tx) => {
      const nextProduct = await tx.product.update({
        where: { id },
        data: updateData,
      });

      if (hasTagUpdate) {
        await tx.productTag.deleteMany({
          where: { productId: id },
        });

        if (tagId !== null && tagId !== '') {
          await tx.productTag.create({
            data: {
              productId: id,
              tagId,
            },
          });
          tagIdToReturn = tagId;
        } else {
          tagIdToReturn = null;
        }
      }

      return nextProduct;
    });

    // Build response
    const productResponse: UpdateProductResponse = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      sku: updatedProduct.sku,
      type: updatedProduct.type,
      categoryId: updatedProduct.categoryId,
      subCategoryId: updatedProduct.subCategoryId,
      brandId: updatedProduct.brandId,
      menuId: updatedProduct.menuId,
      description: updatedProduct.description,
      shortCode: updatedProduct.shortCode,
      hsnCode: updatedProduct.hsnCode,
      preparationTime: updatedProduct.preparationTime,
      servesCount: updatedProduct.servesCount,
      measuringUnit: (updatedProduct as any).measuringUnit ?? null,
      includesTax: (updatedProduct as any).includesTax ?? true,
      taxId: (updatedProduct as any).taxId ?? null,
      eligibleForDiscount: (updatedProduct as any).eligibleForDiscount ?? true,
      discountType: (updatedProduct as any).discountType ?? null,
      tagId: tagIdToReturn,
      isVeg: updatedProduct.isVeg,
      status: updatedProduct.status,
      createdAt: updatedProduct.createdAt,
      updatedAt: updatedProduct.updatedAt,
    };

    const response: ApiResponse<{ product: UpdateProductResponse }> = {
      success: true,
      data: {
        product: productResponse,
      },
      message: 'Product updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating product:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Failed to update product'
            : error instanceof Error
              ? `Failed to update product: ${error.message}`
              : 'Failed to update product',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Product Status Toggle Response Interface
 */
interface ProductStatusResponse {
  id: string;
  name: string;
  sku: string | null;
  status: string;
  updatedAt: Date;
}

/**
 * PATCH /api/v1/catalog/products/:id/status
 * Toggle product status (active/inactive)
 * Requires tenant middleware
 */
export async function toggleProductStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to update product status',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate status
    const { status } = req.body;

    if (!status) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    const validStatuses = ['active', 'inactive'] as const;
    if (!validStatuses.includes(status)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status must be one of: active, inactive',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check if product exists and belongs to tenant
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
    });

    if (!existingProduct) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Skip update if status is unchanged
    if (existingProduct.status === status) {
      const productResponse: ProductStatusResponse = {
        id: existingProduct.id,
        name: existingProduct.name,
        sku: existingProduct.sku,
        status: existingProduct.status,
        updatedAt: existingProduct.updatedAt,
      };

      const response: ApiResponse<{ product: ProductStatusResponse }> = {
        success: true,
        data: {
          product: productResponse,
        },
        message: 'Product status is already set to the specified value',
      };

      res.json(response);
      return;
    }

    // Update product status
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { status },
    });

    // Build response
    const productResponse: ProductStatusResponse = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      sku: updatedProduct.sku,
      status: updatedProduct.status,
      updatedAt: updatedProduct.updatedAt,
    };

    const response: ApiResponse<{ product: ProductStatusResponse }> = {
      success: true,
      data: {
        product: productResponse,
      },
      message: `Product status updated to '${status}' successfully`,
    };

    res.json(response);
  } catch (error) {
    console.error('Error toggling product status:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update product status',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/catalog/products/:id
 * Delete a product for the authenticated tenant
 * Requires tenant middleware
 * Deletes all related: variants, addons, prices, images (from S3), tags, nutrition
 * Prevents deletion if product has pending orders
 */
export async function deleteProduct(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to delete a product',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { id } = req.params;

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Check if product exists and belongs to tenant
    const existingProduct = await prisma.product.findFirst({
      where: {
        id,
        businessOwnerId: tenantId,
      },
      include: {
        images: {
          select: {
            id: true,
            url: true,
          },
        },
      },
    });

    if (!existingProduct) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check if product has pending orders (orders with status not Completed or Cancelled)
    // Pending orders are those with orderStatus in: Pending, Confirmed, Preparing, Ready, Served
    const pendingOrdersCount = await prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          orderStatus: {
            notIn: [OrderStatus.Completed, OrderStatus.Cancelled],
          },
        },
      },
    });

    if (pendingOrdersCount > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'HAS_PENDING_ORDERS',
          message: `Cannot delete product because it has ${pendingOrdersCount} pending order${pendingOrdersCount === 1 ? '' : 's'}. Complete or cancel these orders first.`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Collect image URLs for S3 cleanup
    const imageUrls = existingProduct.images
      .map((img) => img.url)
      .filter((url): url is string => url !== null);

    // Delete product and all related records
    // Prisma cascade delete will handle:
    // - ProductVariant (cascade)
    // - ProductAddon (cascade)
    // - ProductPrice (cascade)
    // - ProductImage (cascade)
    // - ProductTag (cascade - junction table)
    // - ProductNutrition (cascade - one-to-one)
    // - ProductAllergen (cascade - junction table)
    await prisma.product.delete({
      where: { id },
    });

    // Clean up images from S3 (continue even if some fail)
    for (const url of imageUrls) {
      try {
        const key = extractKeyFromUrl(url);
        if (key) {
          await deleteFromS3(key);
        }
      } catch (s3Error) {
        // Log S3 deletion error but don't fail the request
        console.error(`Failed to delete S3 image: ${url}`, s3Error);
      }
    }

    const response: ApiResponse = {
      success: true,
      message: 'Product deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting product:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete product',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * ===========================================
 * Product Variant CRUD Endpoints
 * ===========================================
 */

/**
 * Variant List Response
 */
interface VariantListResponse {
  variants: ProductVariantResponse[];
  total: number;
}

/**
 * GET /api/v1/catalog/products/:productId/variants
 * List all variants for a specific product
 * Requires tenant middleware
 */
export async function listProductVariants(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to list product variants',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Fetch variants for the product
    const variants = await prisma.productVariant.findMany({
      where: {
        productId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Transform to response format
    const variantResponses: ProductVariantResponse[] = variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      additionalPrice: variant.additionalPrice.toNumber(),
      status: variant.status,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    }));

    const response: ApiResponse<VariantListResponse> = {
      success: true,
      data: {
        variants: variantResponses,
        total: variantResponses.length,
      },
      message: 'Product variants retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing product variants:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve product variants',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/catalog/products/:productId/variants
 * Create a new variant for a product
 * Requires tenant middleware
 */
export async function createProductVariant(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to create a product variant',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    const { name, additionalPrice, sku, status } = req.body;

    // Validate required fields
    const missingFields: string[] = [];

    if (!name || typeof name !== 'string' || name.trim() === '') {
      missingFields.push('name');
    }

    if (additionalPrice === undefined || additionalPrice === null) {
      missingFields.push('additionalPrice');
    }

    if (missingFields.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Missing required fields: ${missingFields.join(', ')}`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate additionalPrice is a valid number
    const parsedPrice = parseFloat(String(additionalPrice));
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'additionalPrice must be a non-negative number',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Status must be one of: active, inactive',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Create the variant
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        name: name.trim(),
        sku: sku?.trim() || null,
        additionalPrice: new Prisma.Decimal(parsedPrice),
        status: status || 'active',
      },
    });

    // Build response
    const variantResponse: ProductVariantResponse = {
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      additionalPrice: variant.additionalPrice.toNumber(),
      status: variant.status,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    };

    const response: ApiResponse<{ variant: ProductVariantResponse }> = {
      success: true,
      data: {
        variant: variantResponse,
      },
      message: 'Product variant created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating product variant:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create product variant',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/catalog/products/:productId/variants/:id
 * Update an existing variant for a product
 * Requires tenant middleware
 */
export async function updateProductVariant(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to update a product variant',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId, id } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Variant ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Verify variant exists and belongs to the product
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        id,
        productId,
      },
    });

    if (!existingVariant) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product variant not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    const { name, additionalPrice, sku, status } = req.body;

    // Build update data
    const updateData: Prisma.ProductVariantUpdateInput = {};

    // Validate and add name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name must be a non-empty string',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.name = name.trim();
    }

    // Validate and add additionalPrice if provided
    if (additionalPrice !== undefined) {
      const parsedPrice = parseFloat(String(additionalPrice));
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'additionalPrice must be a non-negative number',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.additionalPrice = new Prisma.Decimal(parsedPrice);
    }

    // Add sku if provided
    if (sku !== undefined) {
      updateData.sku = sku === null ? null : sku?.trim() || null;
    }

    // Validate and add status if provided
    if (status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Status must be one of: active, inactive',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.status = status;
    }

    // Check if there are any fields to update
    if (Object.keys(updateData).length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No fields provided to update',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Update the variant
    const updatedVariant = await prisma.productVariant.update({
      where: { id },
      data: updateData,
    });

    // Build response
    const variantResponse: ProductVariantResponse = {
      id: updatedVariant.id,
      name: updatedVariant.name,
      sku: updatedVariant.sku,
      additionalPrice: updatedVariant.additionalPrice.toNumber(),
      status: updatedVariant.status,
      createdAt: updatedVariant.createdAt,
      updatedAt: updatedVariant.updatedAt,
    };

    const response: ApiResponse<{ variant: ProductVariantResponse }> = {
      success: true,
      data: {
        variant: variantResponse,
      },
      message: 'Product variant updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating product variant:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update product variant',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/catalog/products/:productId/variants/:id
 * Delete a variant for a product
 * Requires tenant middleware
 */
export async function deleteProductVariant(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to delete a product variant',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId, id } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Variant ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Verify variant exists and belongs to the product
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        id,
        productId,
      },
    });

    if (!existingVariant) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product variant not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Delete the variant
    // Note: Related ProductPrice records with this variantId will be cascade deleted
    // (per schema definition: onDelete: Cascade)
    await prisma.productVariant.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Product variant deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting product variant:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete product variant',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * ===========================================
 * Product Addon CRUD Endpoints
 * ===========================================
 */

/**
 * Addon List Response
 */
interface AddonListResponse {
  addons: ProductAddonResponse[];
  total: number;
}

/**
 * GET /api/v1/catalog/products/:productId/addons
 * List all addons for a specific product
 * Requires tenant middleware
 */
export async function listProductAddons(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to list product addons',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Fetch addons for the product
    const addons = await prisma.productAddon.findMany({
      where: {
        productId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform to response format
    const addonResponses: ProductAddonResponse[] = addons.map((addon) => ({
      id: addon.id,
      name: addon.name,
      price: addon.price.toNumber(),
      status: addon.status,
      createdAt: addon.createdAt,
      updatedAt: addon.updatedAt,
    }));

    const response: ApiResponse<AddonListResponse> = {
      success: true,
      data: {
        addons: addonResponses,
        total: addonResponses.length,
      },
      message: 'Product addons retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing product addons:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve product addons',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/catalog/products/:productId/addons
 * Create a new addon for a product
 * Requires tenant middleware
 */
export async function createProductAddon(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to create a product addon',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    const { name, price, status } = req.body;

    // Validate required fields
    const missingFields: string[] = [];

    if (!name || typeof name !== 'string' || name.trim() === '') {
      missingFields.push('name');
    }

    if (price === undefined || price === null) {
      missingFields.push('price');
    }

    if (missingFields.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Missing required fields: ${missingFields.join(', ')}`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate price is a valid number
    const parsedPrice = parseFloat(String(price));
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'price must be a non-negative number',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate status if provided
    if (status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Status must be one of: active, inactive',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Create the addon
    const addon = await prisma.productAddon.create({
      data: {
        productId,
        name: name.trim(),
        price: new Prisma.Decimal(parsedPrice),
        status: status || 'active',
      },
    });

    // Build response
    const addonResponse: ProductAddonResponse = {
      id: addon.id,
      name: addon.name,
      price: addon.price.toNumber(),
      status: addon.status,
      createdAt: addon.createdAt,
      updatedAt: addon.updatedAt,
    };

    const response: ApiResponse<{ addon: ProductAddonResponse }> = {
      success: true,
      data: {
        addon: addonResponse,
      },
      message: 'Product addon created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating product addon:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create product addon',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/catalog/products/:productId/addons/:id
 * Update an existing addon for a product
 * Requires tenant middleware
 */
export async function updateProductAddon(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to update a product addon',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId, id } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Addon ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Verify addon exists and belongs to the product
    const existingAddon = await prisma.productAddon.findFirst({
      where: {
        id,
        productId,
      },
    });

    if (!existingAddon) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product addon not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    const { name, price, status } = req.body;

    // Build update data
    const updateData: Prisma.ProductAddonUpdateInput = {};

    // Validate and add name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name must be a non-empty string',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.name = name.trim();
    }

    // Validate and add price if provided
    if (price !== undefined) {
      const parsedPrice = parseFloat(String(price));
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'price must be a non-negative number',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.price = new Prisma.Decimal(parsedPrice);
    }

    // Validate and add status if provided
    if (status !== undefined) {
      const validStatuses = ['active', 'inactive'];
      if (!validStatuses.includes(status)) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Status must be one of: active, inactive',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.status = status;
    }

    // Check if there are any fields to update
    if (Object.keys(updateData).length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No fields provided to update',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Update the addon
    const updatedAddon = await prisma.productAddon.update({
      where: { id },
      data: updateData,
    });

    // Build response
    const addonResponse: ProductAddonResponse = {
      id: updatedAddon.id,
      name: updatedAddon.name,
      price: updatedAddon.price.toNumber(),
      status: updatedAddon.status,
      createdAt: updatedAddon.createdAt,
      updatedAt: updatedAddon.updatedAt,
    };

    const response: ApiResponse<{ addon: ProductAddonResponse }> = {
      success: true,
      data: {
        addon: addonResponse,
      },
      message: 'Product addon updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating product addon:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update product addon',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/catalog/products/:productId/addons/:id
 * Delete an addon for a product
 * Requires tenant middleware
 */
export async function deleteProductAddon(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to delete a product addon',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId, id } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Addon ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Verify addon exists and belongs to the product
    const existingAddon = await prisma.productAddon.findFirst({
      where: {
        id,
        productId,
      },
    });

    if (!existingAddon) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product addon not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Delete the addon
    // Note: Related OrderItemAddon records reference this addon but have onDelete: Cascade
    await prisma.productAddon.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Product addon deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting product addon:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete product addon',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * ===========================================
 * Product Price CRUD Endpoints
 * ===========================================
 */

/**
 * Price List Response
 */
interface PriceListResponse {
  prices: ProductPriceResponse[];
  total: number;
}

/**
 * GET /api/v1/catalog/products/:productId/prices
 * List all prices for a specific product
 * Requires tenant middleware
 */
export async function listProductPrices(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to list product prices',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Fetch prices for the product with taxGroup relation
    const prices = await prisma.productPrice.findMany({
      where: {
        productId,
      },
      include: {
        taxGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { variantId: 'asc' }, // Null (base prices) first
        { channelType: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Transform to response format
    const priceResponses: ProductPriceResponse[] = prices.map((price) => ({
      id: price.id,
      variantId: price.variantId,
      channelType: price.channelType,
      basePrice: price.basePrice.toNumber(),
      discountPrice: decimalToNumber(price.discountPrice),
      taxGroupId: price.taxGroupId,
      taxGroup: price.taxGroup,
      createdAt: price.createdAt,
      updatedAt: price.updatedAt,
    }));

    const response: ApiResponse<PriceListResponse> = {
      success: true,
      data: {
        prices: priceResponses,
        total: priceResponses.length,
      },
      message: 'Product prices retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing product prices:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve product prices',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/catalog/products/:productId/prices
 * Create a new price entry for a product
 * Requires tenant middleware
 */
export async function createProductPrice(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to create a product price',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    const { channelType, basePrice, variantId, discountPrice, taxGroupId } = req.body;

    // Validate required fields
    const missingFields: string[] = [];

    if (!channelType || typeof channelType !== 'string' || channelType.trim() === '') {
      missingFields.push('channelType');
    }

    if (basePrice === undefined || basePrice === null) {
      missingFields.push('basePrice');
    }

    if (missingFields.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Missing required fields: ${missingFields.join(', ')}`,
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate basePrice is a valid non-negative number
    const parsedBasePrice = parseFloat(String(basePrice));
    if (isNaN(parsedBasePrice) || parsedBasePrice < 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'basePrice must be a non-negative number',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate discountPrice if provided
    let parsedDiscountPrice: number | null = null;
    if (discountPrice !== undefined && discountPrice !== null) {
      parsedDiscountPrice = parseFloat(String(discountPrice));
      if (isNaN(parsedDiscountPrice) || parsedDiscountPrice < 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'discountPrice must be a non-negative number',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Validate variantId if provided (must belong to the product)
    if (variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: {
          id: variantId,
          productId,
        },
      });

      if (!variant) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Variant not found or does not belong to this product',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Validate taxGroupId if provided (must belong to the tenant)
    if (taxGroupId) {
      const taxGroup = await prisma.taxGroup.findFirst({
        where: {
          id: taxGroupId,
          businessOwnerId: tenantId,
        },
      });

      if (!taxGroup) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Tax group not found or does not belong to your business',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Create the price entry
    const price = await prisma.productPrice.create({
      data: {
        productId,
        channelType: channelType.trim(),
        basePrice: new Prisma.Decimal(parsedBasePrice),
        variantId: variantId || null,
        discountPrice: parsedDiscountPrice !== null ? new Prisma.Decimal(parsedDiscountPrice) : null,
        taxGroupId: taxGroupId || null,
      },
      include: {
        taxGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Build response
    const priceResponse: ProductPriceResponse = {
      id: price.id,
      variantId: price.variantId,
      channelType: price.channelType,
      basePrice: price.basePrice.toNumber(),
      discountPrice: decimalToNumber(price.discountPrice),
      taxGroupId: price.taxGroupId,
      taxGroup: price.taxGroup,
      createdAt: price.createdAt,
      updatedAt: price.updatedAt,
    };

    const response: ApiResponse<{ price: ProductPriceResponse }> = {
      success: true,
      data: {
        price: priceResponse,
      },
      message: 'Product price created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating product price:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create product price',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/catalog/products/:productId/prices/:id
 * Update an existing price entry for a product
 * Requires tenant middleware
 */
export async function updateProductPrice(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to update a product price',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId, id } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Price ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Verify price exists and belongs to the product
    const existingPrice = await prisma.productPrice.findFirst({
      where: {
        id,
        productId,
      },
    });

    if (!existingPrice) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product price not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    const { channelType, basePrice, variantId, discountPrice, taxGroupId } = req.body;

    // Build update data
    const updateData: Prisma.ProductPriceUpdateInput = {};

    // Validate and add channelType if provided
    if (channelType !== undefined) {
      if (typeof channelType !== 'string' || channelType.trim() === '') {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'channelType must be a non-empty string',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.channelType = channelType.trim();
    }

    // Validate and add basePrice if provided
    if (basePrice !== undefined) {
      const parsedBasePrice = parseFloat(String(basePrice));
      if (isNaN(parsedBasePrice) || parsedBasePrice < 0) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'basePrice must be a non-negative number',
          },
        };
        res.status(400).json(response);
        return;
      }
      updateData.basePrice = new Prisma.Decimal(parsedBasePrice);
    }

    // Validate and add discountPrice if provided
    if (discountPrice !== undefined) {
      if (discountPrice === null) {
        updateData.discountPrice = null;
      } else {
        const parsedDiscountPrice = parseFloat(String(discountPrice));
        if (isNaN(parsedDiscountPrice) || parsedDiscountPrice < 0) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'discountPrice must be a non-negative number',
            },
          };
          res.status(400).json(response);
          return;
        }
        updateData.discountPrice = new Prisma.Decimal(parsedDiscountPrice);
      }
    }

    // Validate and add variantId if provided
    if (variantId !== undefined) {
      if (variantId === null) {
        updateData.variant = { disconnect: true };
      } else {
        const variant = await prisma.productVariant.findFirst({
          where: {
            id: variantId,
            productId,
          },
        });

        if (!variant) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Variant not found or does not belong to this product',
            },
          };
          res.status(400).json(response);
          return;
        }
        updateData.variant = { connect: { id: variantId } };
      }
    }

    // Validate and add taxGroupId if provided
    if (taxGroupId !== undefined) {
      if (taxGroupId === null) {
        updateData.taxGroup = { disconnect: true };
      } else {
        const taxGroup = await prisma.taxGroup.findFirst({
          where: {
            id: taxGroupId,
            businessOwnerId: tenantId,
          },
        });

        if (!taxGroup) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Tax group not found or does not belong to your business',
            },
          };
          res.status(400).json(response);
          return;
        }
        updateData.taxGroup = { connect: { id: taxGroupId } };
      }
    }

    // Check if there are any fields to update
    if (Object.keys(updateData).length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'No fields provided to update',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Update the price
    const updatedPrice = await prisma.productPrice.update({
      where: { id },
      data: updateData,
      include: {
        taxGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Build response
    const priceResponse: ProductPriceResponse = {
      id: updatedPrice.id,
      variantId: updatedPrice.variantId,
      channelType: updatedPrice.channelType,
      basePrice: updatedPrice.basePrice.toNumber(),
      discountPrice: decimalToNumber(updatedPrice.discountPrice),
      taxGroupId: updatedPrice.taxGroupId,
      taxGroup: updatedPrice.taxGroup,
      createdAt: updatedPrice.createdAt,
      updatedAt: updatedPrice.updatedAt,
    };

    const response: ApiResponse<{ price: ProductPriceResponse }> = {
      success: true,
      data: {
        price: priceResponse,
      },
      message: 'Product price updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating product price:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update product price',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/catalog/products/:productId/prices/:id
 * Delete a price entry for a product
 * Requires tenant middleware
 */
export async function deleteProductPrice(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to delete a product price',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId, id } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Price ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Verify price exists and belongs to the product
    const existingPrice = await prisma.productPrice.findFirst({
      where: {
        id,
        productId,
      },
    });

    if (!existingPrice) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product price not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Delete the price
    await prisma.productPrice.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Product price deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting product price:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete product price',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * ===========================================
 * Product Image CRUD Endpoints
 * ===========================================
 */

/**
 * Product Image Response Interface
 */
interface ProductImageListResponse {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: Date;
}

/**
 * Image List Response
 */
interface ImageListResponse {
  images: ProductImageListResponse[];
  total: number;
}

/**
 * GET /api/v1/catalog/products/:productId/images
 * List all images for a specific product
 * Requires tenant middleware
 */
export async function listProductImages(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to list product images',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Fetch images for the product
    const images = await prisma.productImage.findMany({
      where: {
        productId,
      },
      orderBy: [
        { isPrimary: 'desc' }, // Primary first
        { sortOrder: 'asc' },   // Then by sort order
        { createdAt: 'asc' },   // Then by creation date
      ],
    });

    // Transform to response format
    const imageResponses: ProductImageListResponse[] = images.map((image) => ({
      id: image.id,
      url: image.url,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
      createdAt: image.createdAt,
    }));

    const response: ApiResponse<ImageListResponse> = {
      success: true,
      data: {
        images: imageResponses,
        total: imageResponses.length,
      },
      message: 'Product images retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing product images:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve product images',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/catalog/products/:productId/images
 * Upload a new image for a product
 * Requires tenant middleware and image upload middleware
 */
export async function createProductImage(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to upload a product image',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check if an image was uploaded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uploadedFile = (req as any).uploadedFile;

    if (!uploadedFile || !uploadedFile.url) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Image file is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Get optional fields from body
    const { isPrimary, sortOrder } = req.body;

    // Parse sortOrder if provided
    const parsedSortOrder = sortOrder !== undefined && sortOrder !== null
      ? parseInt(String(sortOrder), 10)
      : 0;

    // If this image should be primary, remove primary flag from existing images
    let shouldBePrimary = isPrimary === true || isPrimary === 'true';

    // If this is the first image, make it primary by default
    const existingImageCount = await prisma.productImage.count({
      where: { productId },
    });

    if (existingImageCount === 0) {
      shouldBePrimary = true;
    }

    // Use a transaction to handle primary flag update
    const image = await prisma.$transaction(async (tx) => {
      // If this image should be primary, unset primary on all other images
      if (shouldBePrimary) {
        await tx.productImage.updateMany({
          where: {
            productId,
            isPrimary: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      // Create the image
      return tx.productImage.create({
        data: {
          productId,
          url: uploadedFile.url,
          isPrimary: shouldBePrimary,
          sortOrder: !isNaN(parsedSortOrder) ? parsedSortOrder : 0,
        },
      });
    });

    // Build response
    const imageResponse: ProductImageListResponse = {
      id: image.id,
      url: image.url,
      isPrimary: image.isPrimary,
      sortOrder: image.sortOrder,
      createdAt: image.createdAt,
    };

    const response: ApiResponse<{ image: ProductImageListResponse }> = {
      success: true,
      data: {
        image: imageResponse,
      },
      message: 'Product image uploaded successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error uploading product image:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to upload product image',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PATCH /api/v1/catalog/products/:productId/images/:id/primary
 * Set an image as the primary image for a product
 * Requires tenant middleware
 */
export async function setProductImagePrimary(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to set primary image',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId, id } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Image ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Verify image exists and belongs to the product
    const existingImage = await prisma.productImage.findFirst({
      where: {
        id,
        productId,
      },
    });

    if (!existingImage) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product image not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Skip if already primary
    if (existingImage.isPrimary) {
      const imageResponse: ProductImageListResponse = {
        id: existingImage.id,
        url: existingImage.url,
        isPrimary: existingImage.isPrimary,
        sortOrder: existingImage.sortOrder,
        createdAt: existingImage.createdAt,
      };

      const response: ApiResponse<{ image: ProductImageListResponse }> = {
        success: true,
        data: {
          image: imageResponse,
        },
        message: 'Image is already the primary image',
      };

      res.json(response);
      return;
    }

    // Use a transaction to update primary flags
    const updatedImage = await prisma.$transaction(async (tx) => {
      // Remove primary flag from all other images
      await tx.productImage.updateMany({
        where: {
          productId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });

      // Set this image as primary
      return tx.productImage.update({
        where: { id },
        data: {
          isPrimary: true,
        },
      });
    });

    // Build response
    const imageResponse: ProductImageListResponse = {
      id: updatedImage.id,
      url: updatedImage.url,
      isPrimary: updatedImage.isPrimary,
      sortOrder: updatedImage.sortOrder,
      createdAt: updatedImage.createdAt,
    };

    const response: ApiResponse<{ image: ProductImageListResponse }> = {
      success: true,
      data: {
        image: imageResponse,
      },
      message: 'Product image set as primary successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error setting primary product image:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to set primary product image',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PATCH /api/v1/catalog/products/:productId/images/:id/sortOrder
 * Update the sort order of a product image
 * Requires tenant middleware
 */
export async function updateProductImageSortOrder(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to update image sort order',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId, id } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Image ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Verify image exists and belongs to the product
    const existingImage = await prisma.productImage.findFirst({
      where: {
        id,
        productId,
      },
    });

    if (!existingImage) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product image not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    const { sortOrder } = req.body;

    if (sortOrder === undefined || sortOrder === null) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'sortOrder is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    const parsedSortOrder = parseInt(String(sortOrder), 10);
    if (isNaN(parsedSortOrder)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'sortOrder must be a number',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Update the sort order
    const updatedImage = await prisma.productImage.update({
      where: { id },
      data: {
        sortOrder: parsedSortOrder,
      },
    });

    // Build response
    const imageResponse: ProductImageListResponse = {
      id: updatedImage.id,
      url: updatedImage.url,
      isPrimary: updatedImage.isPrimary,
      sortOrder: updatedImage.sortOrder,
      createdAt: updatedImage.createdAt,
    };

    const response: ApiResponse<{ image: ProductImageListResponse }> = {
      success: true,
      data: {
        image: imageResponse,
      },
      message: 'Product image sort order updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating product image sort order:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update product image sort order',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/catalog/products/:productId/images/:id
 * Delete a product image
 * Requires tenant middleware
 */
export async function deleteProductImage(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to delete a product image',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId, id } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (!id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Image ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Verify image exists and belongs to the product
    const existingImage = await prisma.productImage.findFirst({
      where: {
        id,
        productId,
      },
    });

    if (!existingImage) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product image not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    const wasPrimary = existingImage.isPrimary;
    const imageUrl = existingImage.url;

    // Delete the image from the database
    await prisma.productImage.delete({
      where: { id },
    });

    // If the deleted image was primary, set another image as primary
    if (wasPrimary) {
      const nextImage = await prisma.productImage.findFirst({
        where: { productId },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'asc' },
        ],
      });

      if (nextImage) {
        await prisma.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    // Clean up S3 image
    if (imageUrl) {
      try {
        const key = extractKeyFromUrl(imageUrl);
        if (key) {
          await deleteFromS3(key);
        }
      } catch (s3Error) {
        // Log S3 deletion error but don't fail the request
        console.error(`Failed to delete S3 image: ${imageUrl}`, s3Error);
      }
    }

    const response: ApiResponse = {
      success: true,
      message: 'Product image deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting product image:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete product image',
      },
    };
    res.status(500).json(response);
  }
}

// =====================================
// Product Nutrition Endpoints
// =====================================

/**
 * Full Product Nutrition Response Interface (includes productId)
 * Different from ProductNutritionResponse used in product detail which doesn't include productId
 */
interface ProductNutritionFullResponse {
  id: string;
  productId: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  vitamins: unknown;
  minerals: unknown;
}

/**
 * GET /api/v1/catalog/products/:productId/nutrition
 * Get nutrition data for a specific product
 * Requires tenant middleware
 */
export async function getProductNutrition(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to get product nutrition',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Get nutrition data for the product
    const nutrition = await prisma.productNutrition.findUnique({
      where: {
        productId,
      },
    });

    if (!nutrition) {
      // Return empty nutrition data if not set
      const response: ApiResponse<{ nutrition: null }> = {
        success: true,
        data: {
          nutrition: null,
        },
        message: 'No nutrition data found for this product',
      };
      res.json(response);
      return;
    }

    // Build response
    const nutritionResponse: ProductNutritionFullResponse = {
      id: nutrition.id,
      productId: nutrition.productId,
      calories: nutrition.calories,
      protein: nutrition.protein ? nutrition.protein.toNumber() : null,
      carbs: nutrition.carbs ? nutrition.carbs.toNumber() : null,
      fat: nutrition.fat ? nutrition.fat.toNumber() : null,
      fiber: nutrition.fiber ? nutrition.fiber.toNumber() : null,
      sugar: nutrition.sugar ? nutrition.sugar.toNumber() : null,
      sodium: nutrition.sodium ? nutrition.sodium.toNumber() : null,
      vitamins: nutrition.vitamins,
      minerals: nutrition.minerals,
    };

    const response: ApiResponse<{ nutrition: ProductNutritionFullResponse }> = {
      success: true,
      data: {
        nutrition: nutritionResponse,
      },
      message: 'Product nutrition retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting product nutrition:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get product nutrition',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/catalog/products/:productId/nutrition
 * Create or update nutrition data for a product (upsert)
 * Requires tenant middleware
 */
export async function upsertProductNutrition(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to update product nutrition',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    const {
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium,
      vitamins,
      minerals,
    } = req.body;

    // Build nutrition data with validation
    // Using Record to allow dynamic property assignment
    const nutritionData: Record<string, unknown> = {};

    // Validate and add calories if provided
    if (calories !== undefined) {
      if (calories === null) {
        nutritionData.calories = null;
      } else {
        const parsedValue = parseInt(String(calories), 10);
        if (isNaN(parsedValue) || parsedValue < 0) {
          const response: ApiResponse = {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'calories must be a non-negative integer',
            },
          };
          res.status(400).json(response);
          return;
        }
        nutritionData.calories = parsedValue;
      }
    }

    // Helper function to validate and parse decimal nutrition fields
    const parseDecimalField = (
      value: unknown,
      fieldName: string
    ): { valid: boolean; result?: Prisma.Decimal | null; error?: string } => {
      if (value === undefined) {
        return { valid: true };
      }
      if (value === null) {
        return { valid: true, result: null };
      }
      const parsedValue = parseFloat(String(value));
      if (isNaN(parsedValue) || parsedValue < 0) {
        return {
          valid: false,
          error: `${fieldName} must be a non-negative number`,
        };
      }
      return { valid: true, result: new Prisma.Decimal(parsedValue) };
    };

    // Validate and add protein if provided
    const proteinResult = parseDecimalField(protein, 'protein');
    if (!proteinResult.valid) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: proteinResult.error!,
        },
      };
      res.status(400).json(response);
      return;
    }
    if (protein !== undefined) {
      nutritionData.protein = proteinResult.result ?? null;
    }

    // Validate and add carbs if provided
    const carbsResult = parseDecimalField(carbs, 'carbs');
    if (!carbsResult.valid) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: carbsResult.error!,
        },
      };
      res.status(400).json(response);
      return;
    }
    if (carbs !== undefined) {
      nutritionData.carbs = carbsResult.result ?? null;
    }

    // Validate and add fat if provided
    const fatResult = parseDecimalField(fat, 'fat');
    if (!fatResult.valid) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: fatResult.error!,
        },
      };
      res.status(400).json(response);
      return;
    }
    if (fat !== undefined) {
      nutritionData.fat = fatResult.result ?? null;
    }

    // Validate and add fiber if provided
    const fiberResult = parseDecimalField(fiber, 'fiber');
    if (!fiberResult.valid) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: fiberResult.error!,
        },
      };
      res.status(400).json(response);
      return;
    }
    if (fiber !== undefined) {
      nutritionData.fiber = fiberResult.result ?? null;
    }

    // Validate and add sugar if provided
    const sugarResult = parseDecimalField(sugar, 'sugar');
    if (!sugarResult.valid) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: sugarResult.error!,
        },
      };
      res.status(400).json(response);
      return;
    }
    if (sugar !== undefined) {
      nutritionData.sugar = sugarResult.result ?? null;
    }

    // Validate and add sodium if provided
    const sodiumResult = parseDecimalField(sodium, 'sodium');
    if (!sodiumResult.valid) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: sodiumResult.error!,
        },
      };
      res.status(400).json(response);
      return;
    }
    if (sodium !== undefined) {
      nutritionData.sodium = sodiumResult.result ?? null;
    }

    // Validate and add vitamins if provided (JSON object)
    if (vitamins !== undefined) {
      if (vitamins === null) {
        // Use Prisma.DbNull to set JSON field to database null
        nutritionData.vitamins = Prisma.DbNull;
      } else if (typeof vitamins === 'object' && !Array.isArray(vitamins)) {
        nutritionData.vitamins = vitamins;
      } else {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'vitamins must be a JSON object or null',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Validate and add minerals if provided (JSON object)
    if (minerals !== undefined) {
      if (minerals === null) {
        // Use Prisma.DbNull to set JSON field to database null
        nutritionData.minerals = Prisma.DbNull;
      } else if (typeof minerals === 'object' && !Array.isArray(minerals)) {
        nutritionData.minerals = minerals;
      } else {
        const response: ApiResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'minerals must be a JSON object or null',
          },
        };
        res.status(400).json(response);
        return;
      }
    }

    // Check if there are any fields to set/update
    if (Object.keys(nutritionData).length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one nutrition field must be provided',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Upsert nutrition data (create if not exists, update if exists)
    const nutrition = await prisma.productNutrition.upsert({
      where: {
        productId,
      },
      create: {
        productId,
        ...nutritionData,
      },
      update: nutritionData,
    });

    // Build response
    const nutritionResponse: ProductNutritionFullResponse = {
      id: nutrition.id,
      productId: nutrition.productId,
      calories: nutrition.calories,
      protein: nutrition.protein ? nutrition.protein.toNumber() : null,
      carbs: nutrition.carbs ? nutrition.carbs.toNumber() : null,
      fat: nutrition.fat ? nutrition.fat.toNumber() : null,
      fiber: nutrition.fiber ? nutrition.fiber.toNumber() : null,
      sugar: nutrition.sugar ? nutrition.sugar.toNumber() : null,
      sodium: nutrition.sodium ? nutrition.sodium.toNumber() : null,
      vitamins: nutrition.vitamins,
      minerals: nutrition.minerals,
    };

    const response: ApiResponse<{ nutrition: ProductNutritionFullResponse }> = {
      success: true,
      data: {
        nutrition: nutritionResponse,
      },
      message: 'Product nutrition updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating product nutrition:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update product nutrition',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * ===========================================
 * Product Allergen CRUD Endpoints
 * ===========================================
 */

/**
 * Product Allergen List Response
 */
interface ProductAllergenListResponse {
  allergens: ProductAllergenResponse[];
  total: number;
}

/**
 * GET /api/v1/catalog/products/:productId/allergens
 * List all allergens for a specific product
 * Requires tenant middleware
 */
export async function listProductAllergens(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to list product allergens',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Get all allergens for the product via junction table
    const productAllergens = await prisma.productAllergen.findMany({
      where: {
        productId,
      },
      include: {
        allergen: true,
      },
      orderBy: {
        allergen: {
          name: 'asc',
        },
      },
    });

    // Build response
    const allergenResponses: ProductAllergenResponse[] = productAllergens.map((pa) => ({
      id: pa.allergen.id,
      name: pa.allergen.name,
      icon: pa.allergen.icon,
      createdAt: pa.allergen.createdAt,
    }));

    const responseData: ProductAllergenListResponse = {
      allergens: allergenResponses,
      total: allergenResponses.length,
    };

    const response: ApiResponse<ProductAllergenListResponse> = {
      success: true,
      data: responseData,
      message: 'Product allergens retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing product allergens:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to list product allergens',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/catalog/products/:productId/allergens
 * Add an allergen to a product
 * Requires tenant middleware
 */
export async function addProductAllergen(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to add a product allergen',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate required fields
    const { allergenId } = req.body;

    if (!allergenId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'allergenId is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Verify allergen exists (allergens are global, not tenant-specific)
    const allergen = await prisma.allergen.findUnique({
      where: {
        id: allergenId,
      },
    });

    if (!allergen) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Allergen not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check if allergen is already associated with the product
    const existingAssociation = await prisma.productAllergen.findUnique({
      where: {
        productId_allergenId: {
          productId,
          allergenId,
        },
      },
    });

    if (existingAssociation) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ALREADY_EXISTS',
          message: 'This allergen is already associated with the product',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Create the association
    await prisma.productAllergen.create({
      data: {
        productId,
        allergenId,
      },
    });

    // Build response with allergen details
    const allergenResponse: ProductAllergenResponse = {
      id: allergen.id,
      name: allergen.name,
      icon: allergen.icon,
      createdAt: allergen.createdAt,
    };

    const response: ApiResponse<{ allergen: ProductAllergenResponse }> = {
      success: true,
      data: {
        allergen: allergenResponse,
      },
      message: 'Allergen added to product successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error adding product allergen:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add product allergen',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/catalog/products/:productId/allergens/:allergenId
 * Remove an allergen from a product
 * Requires tenant middleware
 */
export async function removeProductAllergen(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to remove a product allergen',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId, allergenId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (!allergenId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Allergen ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check if the allergen association exists
    const existingAssociation = await prisma.productAllergen.findUnique({
      where: {
        productId_allergenId: {
          productId,
          allergenId,
        },
      },
    });

    if (!existingAssociation) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Allergen is not associated with this product',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Delete the association
    await prisma.productAllergen.delete({
      where: {
        productId_allergenId: {
          productId,
          allergenId,
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Allergen removed from product successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error removing product allergen:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to remove product allergen',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * ===========================================
 * Product Tag CRUD Endpoints
 * ===========================================
 */

/**
 * Product Tag Full Response Interface (for tag management endpoints)
 */
interface ProductTagFullResponse {
  id: string;
  name: string;
  color: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Tag List Response
 */
interface ProductTagManagementListResponse {
  tags: ProductTagFullResponse[];
  total: number;
}

/**
 * GET /api/v1/catalog/products/:productId/tags
 * List all tags for a specific product
 * Requires tenant middleware
 */
export async function listProductTags(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to list product tags',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Get all tags for the product via junction table
    const productTags = await prisma.productTag.findMany({
      where: {
        productId,
      },
      include: {
        tag: true,
      },
      orderBy: {
        tag: {
          name: 'asc',
        },
      },
    });

    // Build response
    const tagResponses: ProductTagFullResponse[] = productTags.map((pt) => ({
      id: pt.tag.id,
      name: pt.tag.name,
      color: pt.tag.color,
      status: pt.tag.status,
      createdAt: pt.tag.createdAt,
      updatedAt: pt.tag.updatedAt,
    }));

    const responseData: ProductTagManagementListResponse = {
      tags: tagResponses,
      total: tagResponses.length,
    };

    const response: ApiResponse<ProductTagManagementListResponse> = {
      success: true,
      data: responseData,
      message: 'Product tags retrieved successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error listing product tags:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to list product tags',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/catalog/products/:productId/tags
 * Add a tag to a product
 * Requires tenant middleware
 */
export async function addProductTag(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to add a product tag',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate required fields
    const { tagId } = req.body;

    if (!tagId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'tagId is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Verify tag exists and belongs to the same tenant
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        businessOwnerId: tenantId,
      },
    });

    if (!tag) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Tag not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check if tag is already associated with the product
    const existingAssociation = await prisma.productTag.findUnique({
      where: {
        productId_tagId: {
          productId,
          tagId,
        },
      },
    });

    if (existingAssociation) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'ALREADY_EXISTS',
          message: 'This tag is already associated with the product',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Create the association
    await prisma.productTag.create({
      data: {
        productId,
        tagId,
      },
    });

    // Build response with tag details
    const tagResponse: ProductTagFullResponse = {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      status: tag.status,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };

    const response: ApiResponse<{ tag: ProductTagFullResponse }> = {
      success: true,
      data: {
        tag: tagResponse,
      },
      message: 'Tag added to product successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error adding product tag:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to add product tag',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/catalog/products/:productId/tags/:tagId
 * Remove a tag from a product
 * Requires tenant middleware
 */
export async function removeProductTag(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to remove a product tag',
        },
      };
      res.status(403).json(response);
      return;
    }

    const { productId, tagId } = req.params;

    if (!productId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Product ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    if (!tagId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Tag ID is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Verify product exists and belongs to tenant
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessOwnerId: tenantId,
      },
    });

    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Product not found',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Check if the tag association exists
    const existingAssociation = await prisma.productTag.findUnique({
      where: {
        productId_tagId: {
          productId,
          tagId,
        },
      },
    });

    if (!existingAssociation) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Tag is not associated with this product',
        },
      };
      res.status(404).json(response);
      return;
    }

    // Delete the association
    await prisma.productTag.delete({
      where: {
        productId_tagId: {
          productId,
          tagId,
        },
      },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Tag removed from product successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error removing product tag:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to remove product tag',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * ===========================================
 * Product Bulk Status Update Endpoint
 * ===========================================
 */

/**
 * Bulk Status Update Response
 */
interface BulkStatusUpdateResponse {
  updatedCount: number;
}

/**
 * PATCH /api/v1/catalog/products/bulk/status
 * Update status for multiple products at once
 * Requires tenant middleware
 */
export async function bulkUpdateProductStatus(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    // Tenant ID is required (set by tenant middleware)
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to update product status',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Validate required fields
    const { productIds, status } = req.body;

    // Validate productIds is an array
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'productIds must be a non-empty array',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate status
    if (!status) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    const validStatuses = ['active', 'inactive'] as const;
    if (!validStatuses.includes(status)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status must be one of: active, inactive',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Validate all productIds are strings
    const invalidIds = productIds.filter((id: unknown) => typeof id !== 'string');
    if (invalidIds.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All productIds must be strings',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Update all products that belong to the tenant
    const updateResult = await prisma.product.updateMany({
      where: {
        id: { in: productIds },
        businessOwnerId: tenantId,
      },
      data: {
        status,
      },
    });

    const responseData: BulkStatusUpdateResponse = {
      updatedCount: updateResult.count,
    };

    const response: ApiResponse<BulkStatusUpdateResponse> = {
      success: true,
      data: responseData,
      message: `${updateResult.count} product${updateResult.count !== 1 ? 's' : ''} updated successfully`,
    };

    res.json(response);
  } catch (error) {
    console.error('Error bulk updating product status:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to bulk update product status',
      },
    };
    res.status(500).json(response);
  }
}

/**
 * Import Products Response
 */
interface ImportProductsResponse {
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

/**
 * Export all products to CSV (streaming response)
 * GET /api/v1/catalog/products/export-all
 * @access Private (requires authentication)
 */
export async function exportAllProducts(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'TENANT_CONTEXT_REQUIRED',
          message: 'Tenant context is required to export products',
        },
      };
      res.status(403).json(response);
      return;
    }

    // Set streaming CSV headers
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="products-export-all-${new Date().toISOString().split('T')[0]}.csv"`);
    res.setHeader('Transfer-Encoding', 'chunked');

    // Write CSV header row
    const headers = [
      'ID', 'Name', 'SKU', 'Type', 'Description', 'Short Code', 'HSN Code',
      'Preparation Time (min)', 'Serves Count', 'Is Veg', 'Status',
      'Category', 'Sub Category', 'Brand', 'Menu',
      'Base Price', 'Discount Price', 'Channel Type',
      'Created At', 'Updated At'
    ];
    res.write(headers.join(',') + '\n');

    // Stream products in batches to handle large datasets
    const batchSize = 100;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const products = await prisma.product.findMany({
        where: { businessOwnerId: tenantId },
        skip,
        take: batchSize,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { name: true } },
          subCategory: { select: { name: true } },
          brand: { select: { name: true } },
          menu: { select: { name: true } },
          prices: {
            where: { variantId: null },
            select: { basePrice: true, discountPrice: true, channelType: true },
            take: 1,
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (products.length === 0) {
        hasMore = false;
        break;
      }

      // Write each product as a CSV row
      for (const product of products) {
        const priceData = product.prices[0];
        const basePrice = priceData ? priceData.basePrice.toNumber() : '';
        const discountPrice = priceData?.discountPrice ? priceData.discountPrice.toNumber() : '';
        const channelType = priceData?.channelType || '';

        const escapeCsv = (val: string | null | undefined): string => {
          if (val == null) return '';
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        const row = [
          product.id,
          escapeCsv(product.name),
          escapeCsv(product.sku),
          product.type,
          escapeCsv(product.description),
          escapeCsv(product.shortCode),
          escapeCsv(product.hsnCode),
          product.preparationTime ?? '',
          product.servesCount ?? '',
          product.isVeg ? 'Yes' : 'No',
          product.status,
          escapeCsv(product.category?.name),
          escapeCsv(product.subCategory?.name),
          escapeCsv(product.brand?.name),
          escapeCsv(product.menu?.name),
          basePrice,
          discountPrice,
          channelType,
          new Date(product.createdAt).toISOString(),
          new Date(product.updatedAt).toISOString(),
        ];
        res.write(row.join(',') + '\n');
      }

      skip += batchSize;
      if (products.length < batchSize) {
        hasMore = false;
      }
    }

    res.end();
  } catch (error) {
    console.error('Error exporting products:', error);
    // If headers haven't been sent yet, send JSON error
    if (!res.headersSent) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'EXPORT_FAILED',
          message: 'Failed to export products',
        },
      };
      res.status(500).json(response);
    } else {
      // Headers already sent (streaming), just end the response
      res.end();
    }
  }
}

/**
 * Import products from CSV file
 * POST /api/v1/catalog/products/import
 * @access Private (requires authentication)
 */
export async function importProducts(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<ImportProductsResponse>>
): Promise<void> {
  try {
    const tenantId = req.user?.businessOwnerId;

    if (!tenantId) {
      const response: ApiResponse<ImportProductsResponse> = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User is not authenticated',
        },
      };
      res.status(401).json(response);
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      const response: ApiResponse<ImportProductsResponse> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'CSV file is required',
        },
      };
      res.status(400).json(response);
      return;
    }

    // Parse CSV
    const { parseCSV, sanitizeCSVValue, parseCSVBoolean, parseCSVNumber } = await import('../services/import.service');
    const rows = await parseCSV(req.file.buffer);

    if (rows.length === 0) {
      const response: ApiResponse<ImportProductsResponse> = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'CSV file is empty',
        },
      };
      res.status(400).json(response);
      return;
    }

    let imported = 0;
    let failed = 0;
    const errors: Array<{ row: number; error: string }> = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because row 1 is headers and arrays are 0-indexed

      try {
        // Required fields
        const name = sanitizeCSVValue(row.Name || row.name);
        const type = sanitizeCSVValue(row.Type || row.type) as ProductType;
        const categoryName = sanitizeCSVValue(row.Category || row.category);

        if (!name) {
          errors.push({ row: rowNumber, error: 'Product name is required' });
          failed++;
          continue;
        }

        if (!type || !['Regular', 'Combo', 'Retail'].includes(type)) {
          errors.push({ row: rowNumber, error: 'Valid product type is required (Regular, Combo, or Retail)' });
          failed++;
          continue;
        }

        // Find or create category
        let categoryId: string | undefined;
        if (categoryName) {
          const category = await prisma.category.findFirst({
            where: {
              name: categoryName,
              businessOwnerId: tenantId,
            },
          });

          if (category) {
            categoryId = category.id;
          } else {
            // Create new category
            const newCategory = await prisma.category.create({
              data: {
                name: categoryName,
                businessOwnerId: tenantId,
                status: 'active',
              },
            });
            categoryId = newCategory.id;
          }
        }

        // Find brand if provided
        let brandId: string | undefined;
        const brandName = sanitizeCSVValue(row.Brand || row.brand);
        if (brandName) {
          const brand = await prisma.brand.findFirst({
            where: {
              name: brandName,
              businessOwnerId: tenantId,
            },
          });

          if (brand) {
            brandId = brand.id;
          } else {
            // Create new brand
            const newBrand = await prisma.brand.create({
              data: {
                name: brandName,
                businessOwnerId: tenantId,
                status: 'active',
              },
            });
            brandId = newBrand.id;
          }
        }

        // Parse other fields
        const sku = sanitizeCSVValue(row.SKU || row.sku);
        const description = sanitizeCSVValue(row.Description || row.description);
        const shortCode = sanitizeCSVValue(row['Short Code'] || row.shortCode || row.short_code);
        const hsnCode = sanitizeCSVValue(row['HSN Code'] || row.hsnCode || row.hsn_code);
        const preparationTime = parseCSVNumber(row['Preparation Time'] || row.preparationTime || row.preparation_time);
        const servesCount = parseCSVNumber(row['Serves Count'] || row.servesCount || row.serves_count);
        const isVeg = parseCSVBoolean(row['Is Veg'] || row.isVeg || row.is_veg);
        const status = (sanitizeCSVValue(row.Status || row.status) || 'active').toLowerCase();
        const basePrice = parseCSVNumber(row['Base Price'] || row.basePrice || row.base_price);

        // Create product
        const product = await prisma.product.create({
          data: {
            name,
            sku,
            type,
            description,
            shortCode,
            hsnCode,
            preparationTime: preparationTime || undefined,
            servesCount: servesCount || undefined,
            isVeg,
            status: status === 'active' ? 'active' : 'inactive',
            categoryId,
            brandId,
            businessOwnerId: tenantId,
          },
        });

        // Create price if provided
        if (basePrice > 0) {
          await prisma.productPrice.create({
            data: {
              productId: product.id,
              channelType: 'All', // Default channel type for imported products
              basePrice: new Decimal(basePrice),
            },
          });
        }

        imported++;
      } catch (error) {
        console.error(`Error importing row ${rowNumber}:`, error);
        failed++;
        errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const responseData: ImportProductsResponse = {
      imported,
      failed,
      errors,
    };

    const response: ApiResponse<ImportProductsResponse> = {
      success: true,
      data: responseData,
      message: `Import completed: ${imported} products imported, ${failed} failed`,
    };

    res.json(response);
  } catch (error) {
    console.error('Error importing products:', error);
    const response: ApiResponse<ImportProductsResponse> = {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to import products',
      },
    };
    res.status(500).json(response);
  }
}

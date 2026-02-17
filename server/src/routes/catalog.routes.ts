import { Router } from 'express';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/category.controller';
import { listSubCategories, createSubCategory, updateSubCategory, deleteSubCategory } from '../controllers/subCategory.controller';
import { listBrands, createBrand, updateBrand, deleteBrand } from '../controllers/brand.controller';
import { listMenus, createMenu, updateMenu, deleteMenu } from '../controllers/menu.controller';
import { listTags, createTag, updateTag, deleteTag } from '../controllers/tag.controller';
import { listAllergens } from '../controllers/allergen.controller';
import { listMeasuringUnits } from '../controllers/measuringUnit.controller';
import {
  listProducts,
  getProductDetail,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  bulkUpdateProductStatus,
  exportAllProducts,
  importProducts,
  listProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  listProductAddons,
  createProductAddon,
  updateProductAddon,
  deleteProductAddon,
  listProductPrices,
  createProductPrice,
  updateProductPrice,
  deleteProductPrice,
  listProductImages,
  createProductImage,
  setProductImagePrimary,
  updateProductImageSortOrder,
  deleteProductImage,
  getProductNutrition,
  upsertProductNutrition,
  listProductAllergens,
  addProductAllergen,
  removeProductAllergen,
  listProductTags,
  addProductTag,
  removeProductTag
} from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { branchScopeMiddleware } from '../middleware/branchScope.middleware';
import { imageUpload, csvUpload, uploadToS3Middleware, handleUploadError } from '../middleware/upload.middleware';

const router = Router();

/**
 * All routes in this file require authentication and tenant context
 * Tenant context is set by tenantMiddleware (for BusinessOwner/Staff)
 * SuperAdmin can access with tenantId query parameter
 * Branch scope middleware injects req.branchScope for data filtering
 */

/**
 * ===========================================
 * Category Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/catalog/categories
 * @description List all categories for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @query { status?: 'active' | 'inactive' }
 * @returns { categories: Category[], total: number }
 */
router.get(
  '/categories',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'read'),
  listCategories
);

/**
 * @route POST /api/v1/catalog/categories
 * @description Create a new category for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @body { name: string, description?: string, status?: 'active' | 'inactive', sortOrder?: number }
 * @body image (multipart/form-data optional image file)
 * @returns { category: Category }
 */
router.post(
  '/categories',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'create'),
  imageUpload.single('image'),
  handleUploadError,
  uploadToS3Middleware('categories'),
  createCategory
);

/**
 * @route PUT /api/v1/catalog/categories/:id
 * @description Update an existing category for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param id - Category ID
 * @body { name?: string, description?: string, status?: 'active' | 'inactive', sortOrder?: number }
 * @body image (multipart/form-data optional image file to replace existing)
 * @returns { category: Category }
 */
router.put(
  '/categories/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'update'),
  imageUpload.single('image'),
  handleUploadError,
  uploadToS3Middleware('categories'),
  updateCategory
);

/**
 * @route DELETE /api/v1/catalog/categories/:id
 * @description Delete a category for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param id - Category ID
 * @returns { success: boolean, message: string }
 * @note Prevents deletion if category has products
 * @note Also deletes subcategories under this category
 * @note Deletes associated images from S3
 */
router.delete(
  '/categories/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'delete'),
  deleteCategory
);

/**
 * ===========================================
 * SubCategory Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/catalog/categories/:categoryId/subcategories
 * @description List all subcategories for a specific category
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param categoryId - Parent category ID
 * @query { status?: 'active' | 'inactive' }
 * @returns { subCategories: SubCategory[], total: number }
 */
router.get(
  '/categories/:categoryId/subcategories',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'read'),
  listSubCategories
);

/**
 * @route POST /api/v1/catalog/subcategories
 * @description Create a new subcategory for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @body { categoryId: string, name: string, description?: string, status?: 'active' | 'inactive', sortOrder?: number }
 * @body image (multipart/form-data optional image file)
 * @returns { subCategory: SubCategory }
 */
router.post(
  '/subcategories',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'create'),
  imageUpload.single('image'),
  handleUploadError,
  uploadToS3Middleware('subcategories'),
  createSubCategory
);

/**
 * @route PUT /api/v1/catalog/subcategories/:id
 * @description Update an existing subcategory for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param id - SubCategory ID
 * @body { categoryId?: string, name?: string, description?: string, status?: 'active' | 'inactive', sortOrder?: number }
 * @body image (multipart/form-data optional image file to replace existing)
 * @returns { subCategory: SubCategory }
 */
router.put(
  '/subcategories/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'update'),
  imageUpload.single('image'),
  handleUploadError,
  uploadToS3Middleware('subcategories'),
  updateSubCategory
);

/**
 * @route DELETE /api/v1/catalog/subcategories/:id
 * @description Delete a subcategory for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param id - SubCategory ID
 * @returns { success: boolean, message: string }
 * @note Prevents deletion if subcategory has products
 * @note Deletes associated image from S3
 */
router.delete(
  '/subcategories/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'delete'),
  deleteSubCategory
);

/**
 * ===========================================
 * Brand Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/catalog/brands
 * @description List all brands for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @query { status?: 'active' | 'inactive' }
 * @returns { brands: Brand[], total: number }
 */
router.get(
  '/brands',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'read'),
  listBrands
);

/**
 * @route POST /api/v1/catalog/brands
 * @description Create a new brand for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @body { name: string, description?: string, status?: 'active' | 'inactive' }
 * @body image (multipart/form-data optional image file)
 * @returns { brand: Brand }
 */
router.post(
  '/brands',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'create'),
  imageUpload.single('image'),
  handleUploadError,
  uploadToS3Middleware('brands'),
  createBrand
);

/**
 * @route PUT /api/v1/catalog/brands/:id
 * @description Update an existing brand for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param id - Brand ID
 * @body { name?: string, description?: string, status?: 'active' | 'inactive' }
 * @body image (multipart/form-data optional image file to replace existing)
 * @returns { brand: Brand }
 */
router.put(
  '/brands/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'update'),
  imageUpload.single('image'),
  handleUploadError,
  uploadToS3Middleware('brands'),
  updateBrand
);

/**
 * @route DELETE /api/v1/catalog/brands/:id
 * @description Delete a brand for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param id - Brand ID
 * @returns { success: boolean, message: string }
 * @note Prevents deletion if brand has products
 * @note Deletes associated image from S3
 */
router.delete(
  '/brands/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'delete'),
  deleteBrand
);

/**
 * ===========================================
 * Menu Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/catalog/menus
 * @description List all menus for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @query { status?: 'active' | 'inactive' }
 * @returns { menus: Menu[], total: number }
 */
router.get(
  '/menus',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'read'),
  listMenus
);

/**
 * @route POST /api/v1/catalog/menus
 * @description Create a new menu for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @body { name: string, description?: string, status?: 'active' | 'inactive' }
 * @returns { menu: Menu }
 */
router.post(
  '/menus',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'create'),
  createMenu
);

/**
 * @route PUT /api/v1/catalog/menus/:id
 * @description Update an existing menu for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param id - Menu ID
 * @body { name?: string, description?: string, status?: 'active' | 'inactive' }
 * @returns { menu: Menu }
 */
router.put(
  '/menus/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'update'),
  updateMenu
);

/**
 * @route DELETE /api/v1/catalog/menus/:id
 * @description Delete a menu for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param id - Menu ID
 * @returns { success: boolean, message: string }
 * @note Products with this menu will have their menuId set to NULL
 */
router.delete(
  '/menus/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'delete'),
  deleteMenu
);

/**
 * ===========================================
 * Tag Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/catalog/tags
 * @description List all tags for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @query { status?: 'active' | 'inactive' }
 * @returns { tags: Tag[], total: number }
 */
router.get(
  '/tags',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'read'),
  listTags
);

/**
 * @route POST /api/v1/catalog/tags
 * @description Create a new tag for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @body { name: string, color: string, status?: 'active' | 'inactive' }
 * @returns { tag: Tag }
 */
router.post(
  '/tags',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'create'),
  createTag
);

/**
 * @route PUT /api/v1/catalog/tags/:id
 * @description Update an existing tag for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param id - Tag ID
 * @body { name?: string, color?: string, status?: 'active' | 'inactive' }
 * @returns { tag: Tag }
 */
router.put(
  '/tags/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'update'),
  updateTag
);

/**
 * @route DELETE /api/v1/catalog/tags/:id
 * @description Delete a tag for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param id - Tag ID
 * @returns { success: boolean, message: string }
 * @note Deleting a tag removes it from all products (cascade delete on ProductTag)
 */
router.delete(
  '/tags/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'delete'),
  deleteTag
);

/**
 * ===========================================
 * Allergen Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/catalog/allergens
 * @description List all allergens (global, not tenant-specific)
 * @access Private (any authenticated user)
 * @returns { allergens: Allergen[], total: number }
 * @note Allergens are global definitions, not tenant-specific
 * @note SuperAdmin manages allergens via /api/v1/super-admin/allergens
 */
router.get(
  '/allergens',
  authenticate,
  listAllergens
);

/**
 * @route GET /api/v1/catalog/measuring-units
 * @description List all measuring units (global, not tenant-specific)
 * @access Private (any authenticated user)
 * @returns { measuringUnits: MeasuringUnit[], total: number }
 */
router.get(
  '/measuring-units',
  authenticate,
  listMeasuringUnits
);

/**
 * ===========================================
 * Product Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/catalog/products
 * @description List all products for the tenant with pagination and filtering
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @query {
 *   page?: number,
 *   limit?: number,
 *   categoryId?: string,
 *   subCategoryId?: string,
 *   brandId?: string,
 *   menuId?: string,
 *   type?: 'Regular' | 'Combo' | 'Retail',
 *   status?: 'active' | 'inactive',
 *   search?: string,
 *   sortBy?: 'name' | 'createdAt' | 'price',
 *   sortOrder?: 'asc' | 'desc'
 * }
 * @returns { products: Product[], pagination: { page, limit, total, totalPages } }
 */
router.get(
  '/products',
  authenticate,
  tenantMiddleware,
  branchScopeMiddleware,
  requirePermission('catalog', 'read'),
  listProducts
);

/**
 * @route PATCH /api/v1/catalog/products/bulk/status
 * @description Update status for multiple products at once
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @body { productIds: string[], status: 'active' | 'inactive' }
 * @returns { updatedCount: number }
 */
router.patch(
  '/products/bulk/status',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'update'),
  bulkUpdateProductStatus
);

/**
 * @route GET /api/v1/catalog/products/export-all
 * @description Export all products to CSV with streaming response for large datasets
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @returns CSV file stream with all product fields including category name, brand name
 */
router.get(
  '/products/export-all',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'export'),
  exportAllProducts
);

/**
 * @route POST /api/v1/catalog/products/import
 * @description Import products from CSV file
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @body CSV file (multipart/form-data with 'file' field)
 * @returns { imported: number, failed: number, errors: Array<{ row: number, error: string }> }
 * @note Expected CSV columns: Name, Type, Category, Brand (optional), SKU (optional), Description (optional),
 *       Short Code (optional), HSN Code (optional), Preparation Time (optional), Serves Count (optional),
 *       Is Veg (optional), Status (optional), Base Price (optional)
 * @note Categories and Brands will be created if they don't exist
 */
router.post(
  '/products/import',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'create'),
  csvUpload.single('file'),
  handleUploadError,
  importProducts
);

/**
 * @route GET /api/v1/catalog/products/:id
 * @description Get full product details including variants, addons, prices, images, tags, nutrition, allergens
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param id - Product ID
 * @returns {
 *   product: {
 *     id, name, sku, type, description, shortCode, hsnCode, preparationTime, servesCount, isVeg, status,
 *     category, subCategory, brand, menu,
 *     variants: [], addons: [], prices: [], images: [], tags: [], nutrition: {}, allergens: []
 *   }
 * }
 */
router.get(
  '/products/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'read'),
  getProductDetail
);

/**
 * @route POST /api/v1/catalog/products
 * @description Create a new product for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @body {
 *   name: string (required),
 *   type: 'Regular' | 'Combo' | 'Retail' (required),
 *   categoryId: string (required),
 *   subCategoryId?: string,
 *   brandId?: string,
 *   menuId?: string,
 *   sku?: string (auto-generated if not provided, format: CAT-XXXXX),
 *   description?: string,
 *   shortCode?: string,
 *   hsnCode?: string,
 *   preparationTime?: number (in minutes),
 *   servesCount?: number,
 *   isVeg?: boolean (default: true),
 *   status?: 'active' | 'inactive' (default: 'active')
 * }
 * @returns { product: { id, name, sku, type, ... } }
 */
router.post(
  '/products',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'create'),
  createProduct
);

/**
 * @route PUT /api/v1/catalog/products/:id
 * @description Update an existing product for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param id - Product ID
 * @body {
 *   name?: string,
 *   type?: 'Regular' | 'Combo' | 'Retail',
 *   categoryId?: string | null,
 *   subCategoryId?: string | null,
 *   brandId?: string | null,
 *   menuId?: string | null,
 *   sku?: string | null,
 *   description?: string | null,
 *   shortCode?: string | null,
 *   hsnCode?: string | null,
 *   preparationTime?: number | null (in minutes),
 *   servesCount?: number | null,
 *   isVeg?: boolean,
 *   status?: 'active' | 'inactive'
 * }
 * @returns { product: { id, name, sku, type, ... } }
 */
router.put(
  '/products/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'update'),
  updateProduct
);

/**
 * @route PATCH /api/v1/catalog/products/:id/status
 * @description Toggle product status (active/inactive)
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param id - Product ID
 * @body { status: 'active' | 'inactive' }
 * @returns { product: { id, name, sku, status, updatedAt } }
 */
router.patch(
  '/products/:id/status',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'update'),
  toggleProductStatus
);

/**
 * @route DELETE /api/v1/catalog/products/:id
 * @description Delete a product for the tenant
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param id - Product ID
 * @returns { success: boolean, message: string }
 * @note Prevents deletion if product has pending orders
 * @note Deletes all related records: variants, addons, prices, images (from S3), tags, nutrition, allergens
 */
router.delete(
  '/products/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'delete'),
  deleteProduct
);

/**
 * ===========================================
 * Product Variant Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/catalog/products/:productId/variants
 * @description List all variants for a specific product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @returns { variants: ProductVariant[], total: number }
 */
router.get(
  '/products/:productId/variants',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'read'),
  listProductVariants
);

/**
 * @route POST /api/v1/catalog/products/:productId/variants
 * @description Create a new variant for a product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @body {
 *   name: string (required),
 *   additionalPrice: number (required, non-negative),
 *   sku?: string,
 *   status?: 'active' | 'inactive' (default: 'active')
 * }
 * @returns { variant: ProductVariant }
 */
router.post(
  '/products/:productId/variants',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'create'),
  createProductVariant
);

/**
 * @route PUT /api/v1/catalog/products/:productId/variants/:id
 * @description Update an existing variant for a product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @param id - Variant ID
 * @body {
 *   name?: string,
 *   additionalPrice?: number (non-negative),
 *   sku?: string | null,
 *   status?: 'active' | 'inactive'
 * }
 * @returns { variant: ProductVariant }
 */
router.put(
  '/products/:productId/variants/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'update'),
  updateProductVariant
);

/**
 * @route DELETE /api/v1/catalog/products/:productId/variants/:id
 * @description Delete a variant for a product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @param id - Variant ID
 * @returns { success: boolean, message: string }
 * @note Also deletes associated ProductPrice records for this variant
 */
router.delete(
  '/products/:productId/variants/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'delete'),
  deleteProductVariant
);

/**
 * ===========================================
 * Product Addon Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/catalog/products/:productId/addons
 * @description List all addons for a specific product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @returns { addons: ProductAddon[], total: number }
 */
router.get(
  '/products/:productId/addons',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'read'),
  listProductAddons
);

/**
 * @route POST /api/v1/catalog/products/:productId/addons
 * @description Create a new addon for a product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @body {
 *   name: string (required),
 *   price: number (required, non-negative),
 *   status?: 'active' | 'inactive' (default: 'active')
 * }
 * @returns { addon: ProductAddon }
 */
router.post(
  '/products/:productId/addons',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'create'),
  createProductAddon
);

/**
 * @route PUT /api/v1/catalog/products/:productId/addons/:id
 * @description Update an existing addon for a product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @param id - Addon ID
 * @body {
 *   name?: string,
 *   price?: number (non-negative),
 *   status?: 'active' | 'inactive'
 * }
 * @returns { addon: ProductAddon }
 */
router.put(
  '/products/:productId/addons/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'update'),
  updateProductAddon
);

/**
 * @route DELETE /api/v1/catalog/products/:productId/addons/:id
 * @description Delete an addon for a product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @param id - Addon ID
 * @returns { success: boolean, message: string }
 * @note Also deletes associated OrderItemAddon records for this addon
 */
router.delete(
  '/products/:productId/addons/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'delete'),
  deleteProductAddon
);

/**
 * ===========================================
 * Product Price Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/catalog/products/:productId/prices
 * @description List all prices for a specific product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @returns { prices: ProductPrice[], total: number }
 */
router.get(
  '/products/:productId/prices',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'read'),
  listProductPrices
);

/**
 * @route POST /api/v1/catalog/products/:productId/prices
 * @description Create a new price entry for a product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @body {
 *   channelType: string (required, e.g., "DineIn", "Delivery", "TakeAway"),
 *   basePrice: number (required, non-negative),
 *   variantId?: string (optional, must belong to this product),
 *   discountPrice?: number (optional, non-negative),
 *   taxGroupId?: string (optional, must belong to your business)
 * }
 * @returns { price: ProductPrice }
 */
router.post(
  '/products/:productId/prices',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'create'),
  createProductPrice
);

/**
 * @route PUT /api/v1/catalog/products/:productId/prices/:id
 * @description Update an existing price entry for a product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @param id - Price ID
 * @body {
 *   channelType?: string,
 *   basePrice?: number (non-negative),
 *   variantId?: string | null (null to clear variant association),
 *   discountPrice?: number | null (null to clear discount price),
 *   taxGroupId?: string | null (null to clear tax group association)
 * }
 * @returns { price: ProductPrice }
 */
router.put(
  '/products/:productId/prices/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'update'),
  updateProductPrice
);

/**
 * @route DELETE /api/v1/catalog/products/:productId/prices/:id
 * @description Delete a price entry for a product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @param id - Price ID
 * @returns { success: boolean, message: string }
 */
router.delete(
  '/products/:productId/prices/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'delete'),
  deleteProductPrice
);

/**
 * ===========================================
 * Product Image Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/catalog/products/:productId/images
 * @description List all images for a specific product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @returns { images: ProductImage[], total: number }
 */
router.get(
  '/products/:productId/images',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'read'),
  listProductImages
);

/**
 * @route POST /api/v1/catalog/products/:productId/images
 * @description Upload a new image for a product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @body image (multipart/form-data required image file)
 * @body {
 *   isPrimary?: boolean (default: false, or true if first image),
 *   sortOrder?: number (default: 0)
 * }
 * @returns { image: ProductImage }
 */
router.post(
  '/products/:productId/images',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'create'),
  imageUpload.single('image'),
  handleUploadError,
  uploadToS3Middleware('products'),
  createProductImage
);

/**
 * @route PATCH /api/v1/catalog/products/:productId/images/:id/primary
 * @description Set an image as the primary image for a product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @param id - Image ID
 * @returns { image: ProductImage }
 * @note This will unset the primary flag from all other images for this product
 */
router.patch(
  '/products/:productId/images/:id/primary',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'update'),
  setProductImagePrimary
);

/**
 * @route PATCH /api/v1/catalog/products/:productId/images/:id/sortOrder
 * @description Update the sort order of a product image
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @param id - Image ID
 * @body { sortOrder: number }
 * @returns { image: ProductImage }
 */
router.patch(
  '/products/:productId/images/:id/sortOrder',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'update'),
  updateProductImageSortOrder
);

/**
 * @route DELETE /api/v1/catalog/products/:productId/images/:id
 * @description Delete a product image
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @param id - Image ID
 * @returns { success: boolean, message: string }
 * @note Deletes image from S3 storage
 * @note If deleted image was primary, the next image (by sort order) becomes primary
 */
router.delete(
  '/products/:productId/images/:id',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'delete'),
  deleteProductImage
);

/**
 * ===========================================
 * Product Nutrition Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/catalog/products/:productId/nutrition
 * @description Get nutrition data for a specific product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @returns { nutrition: ProductNutrition | null }
 */
router.get(
  '/products/:productId/nutrition',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'read'),
  getProductNutrition
);

/**
 * @route PUT /api/v1/catalog/products/:productId/nutrition
 * @description Create or update nutrition data for a product (upsert)
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @body {
 *   calories?: number | null,
 *   protein?: number | null (in grams),
 *   carbs?: number | null (in grams),
 *   fat?: number | null (in grams),
 *   fiber?: number | null (in grams),
 *   sugar?: number | null (in grams),
 *   sodium?: number | null (in milligrams),
 *   vitamins?: object | null (JSON object),
 *   minerals?: object | null (JSON object)
 * }
 * @returns { nutrition: ProductNutrition }
 */
router.put(
  '/products/:productId/nutrition',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'update'),
  upsertProductNutrition
);

/**
 * ===========================================
 * Product Allergen Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/catalog/products/:productId/allergens
 * @description List all allergens for a specific product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @returns { allergens: ProductAllergen[], total: number }
 */
router.get(
  '/products/:productId/allergens',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'read'),
  listProductAllergens
);

/**
 * @route POST /api/v1/catalog/products/:productId/allergens
 * @description Add an allergen to a product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @body { allergenId: string }
 * @returns { allergen: ProductAllergen }
 */
router.post(
  '/products/:productId/allergens',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'create'),
  addProductAllergen
);

/**
 * @route DELETE /api/v1/catalog/products/:productId/allergens/:allergenId
 * @description Remove an allergen from a product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @param allergenId - Allergen ID
 * @returns { success: boolean, message: string }
 */
router.delete(
  '/products/:productId/allergens/:allergenId',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'delete'),
  removeProductAllergen
);

/**
 * ===========================================
 * Product Tag Routes
 * ===========================================
 */

/**
 * @route GET /api/v1/catalog/products/:productId/tags
 * @description List all tags for a specific product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @returns { tags: ProductTag[], total: number }
 */
router.get(
  '/products/:productId/tags',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'read'),
  listProductTags
);

/**
 * @route POST /api/v1/catalog/products/:productId/tags
 * @description Add a tag to a product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @body { tagId: string }
 * @returns { tag: ProductTag }
 */
router.post(
  '/products/:productId/tags',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'create'),
  addProductTag
);

/**
 * @route DELETE /api/v1/catalog/products/:productId/tags/:tagId
 * @description Remove a tag from a product
 * @access Private (BusinessOwner, Staff, SuperAdmin with tenantId)
 * @param productId - Product ID
 * @param tagId - Tag ID
 * @returns { success: boolean, message: string }
 */
router.delete(
  '/products/:productId/tags/:tagId',
  authenticate,
  tenantMiddleware,
  requirePermission('catalog', 'delete'),
  removeProductTag
);

export default router;

import { api } from './api';
import apiClient from './api';
import { ApiResponse, PaginationParams, PaginationMeta } from '../types/api';

/**
 * Catalog Service
 *
 * Provides API functions for catalog management including:
 * - Products (CRUD)
 * - Categories (CRUD)
 * - Brands (CRUD)
 * - Tags (CRUD)
 * - Menus (CRUD)
 *
 * All endpoints are under /catalog base path
 */

// ============================================
// Type Definitions
// ============================================

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface ProductAvailabilitySchedule {
  dayOfWeek: DayOfWeek;
  isAvailable: boolean;
  startTime?: string; // HH:mm format (24h)
  endTime?: string;   // HH:mm format (24h)
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  type: 'Regular' | 'Combo' | 'Retail';
  description?: string;
  shortCode?: string;
  hsnCode?: string;
  preparationTime?: number;
  servesCount?: number;
  isVeg: boolean;
  status: 'active' | 'inactive';
  categoryId?: string;
  subCategoryId?: string;
  brandId?: string;
  menuId?: string;
  category?: Category;
  subCategory?: SubCategory;
  brand?: Brand;
  menu?: Menu;
  variants?: ProductVariant[];
  addons?: ProductAddon[];
  prices?: ProductPrice[];
  images?: ProductImage[];
  tags?: Tag[];
  nutrition?: ProductNutrition;
  allergens?: Allergen[];
  availabilitySchedule?: ProductAvailabilitySchedule[];
  kitchens?: ProductKitchenAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductKitchenAssignment {
  id: string;
  name: string;
  branchId: string;
  status: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  status: 'active' | 'inactive';
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  image?: string;
  status: 'active' | 'inactive';
  sortOrder?: number;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  image?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Menu {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  additionalPrice: number;
  sku?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ProductAddon {
  id: string;
  productId: string;
  name: string;
  price: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface ProductPrice {
  id: string;
  productId: string;
  channelType: string;
  basePrice: number;
  discountPrice?: number;
  variantId?: string;
  taxGroupId?: string;
  variant?: ProductVariant;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductNutrition {
  id: string;
  productId: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  vitamins?: object;
  minerals?: object;
  createdAt: string;
  updatedAt: string;
}

export interface Allergen {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Request/Response Types
export interface ProductListParams extends PaginationParams {
  categoryId?: string;
  subCategoryId?: string;
  brandId?: string;
  menuId?: string;
  type?: 'Regular' | 'Combo' | 'Retail';
  status?: 'active' | 'inactive';
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'createdAt' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductData {
  name: string;
  type: 'Regular' | 'Combo' | 'Retail';
  categoryId: string;
  subCategoryId?: string;
  brandId?: string;
  menuId?: string;
  sku?: string;
  description?: string;
  shortCode?: string;
  hsnCode?: string;
  preparationTime?: number;
  servesCount?: number;
  isVeg?: boolean;
  status?: 'active' | 'inactive';
  availabilitySchedule?: ProductAvailabilitySchedule[];
  kitchenIds?: string[];
}

export interface UpdateProductData {
  name?: string;
  type?: 'Regular' | 'Combo' | 'Retail';
  categoryId?: string | null;
  subCategoryId?: string | null;
  brandId?: string | null;
  menuId?: string | null;
  sku?: string | null;
  description?: string | null;
  shortCode?: string | null;
  hsnCode?: string | null;
  preparationTime?: number | null;
  servesCount?: number | null;
  isVeg?: boolean;
  status?: 'active' | 'inactive';
  availabilitySchedule?: ProductAvailabilitySchedule[];
  kitchenIds?: string[];
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
  sortOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
  sortOrder?: number;
}

export interface CreateSubCategoryData {
  name: string;
  categoryId: string;
  description?: string;
  status?: 'active' | 'inactive';
  sortOrder?: number;
}

export interface UpdateSubCategoryData {
  name?: string;
  categoryId?: string;
  description?: string;
  status?: 'active' | 'inactive';
  sortOrder?: number;
}

export interface CreateBrandData {
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateBrandData {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}

export interface CreateTagData {
  name: string;
  color: string;
  status?: 'active' | 'inactive';
}

export interface UpdateTagData {
  name?: string;
  color?: string;
  status?: 'active' | 'inactive';
}

// ============================================
// Product API Functions
// ============================================

/**
 * Get paginated list of products
 */
export const getProducts = async (params?: ProductListParams): Promise<ApiResponse<{ products: Product[] }> & { pagination?: PaginationMeta }> => {
  return api.get<ApiResponse<{ products: Product[] }> & { pagination?: PaginationMeta }>('/catalog/products', { params });
};

/**
 * Get single product by ID with full details
 */
export const getProduct = async (id: string): Promise<ApiResponse<Product>> => {
  return api.get<ApiResponse<Product>>(`/catalog/products/${id}`);
};

/**
 * Create a new product
 */
export const createProduct = async (data: CreateProductData): Promise<ApiResponse<Product>> => {
  return api.post<ApiResponse<Product>>('/catalog/products', data);
};

/**
 * Update an existing product
 */
export const updateProduct = async (id: string, data: UpdateProductData): Promise<ApiResponse<Product>> => {
  return api.put<ApiResponse<Product>>(`/catalog/products/${id}`, data);
};

/**
 * Delete a product
 */
export const deleteProduct = async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  return api.delete<ApiResponse<{ success: boolean; message: string }>>(`/catalog/products/${id}`);
};

/**
 * Toggle product status (active/inactive)
 */
export const toggleProductStatus = async (
  id: string,
  status: 'active' | 'inactive'
): Promise<ApiResponse<Product>> => {
  return api.patch<ApiResponse<Product>>(`/catalog/products/${id}/status`, { status });
};

/**
 * Bulk update product status
 */
export const bulkUpdateProductStatus = async (
  productIds: string[],
  status: 'active' | 'inactive'
): Promise<ApiResponse<{ updatedCount: number }>> => {
  return api.patch<ApiResponse<{ updatedCount: number }>>('/catalog/products/bulk/status', {
    productIds,
    status,
  });

};

/**
 * Bulk delete products
 */
export const bulkDeleteProducts = async (
  productIds: string[]
): Promise<ApiResponse<{ deletedCount: number; failedCount: number; errors?: string[] }>> => {
  return api.delete<ApiResponse<{ deletedCount: number; failedCount: number; errors?: string[] }>>('/catalog/products/bulk', {
    data: { productIds },
  });
};

/**
 * Import products from CSV file
 */
export interface ImportProductsResponse {
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export const importProducts = async (file: File): Promise<ApiResponse<ImportProductsResponse>> => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post<ApiResponse<ImportProductsResponse>>('/catalog/products/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Export all products to CSV file (streaming download)
 * Uses blob response type for large file downloads
 * @param onProgress - Optional callback for download progress (0-100)
 */
export const exportAllProducts = async (
  onProgress?: (progress: number) => void
): Promise<void> => {
  const response = await apiClient.get('/catalog/products/export-all', {
    responseType: 'blob',
    onDownloadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  // Create blob and trigger download
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `products-export-all-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================
// Product Image API Functions
// ============================================

/**
 * Upload images for a product (supports multiple files)
 */
export const uploadProductImages = async (
  productId: string,
  files: File[]
): Promise<ApiResponse<ProductImage[]>> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  return api.post<ApiResponse<ProductImage[]>>(
    `/catalog/products/${productId}/images`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
};

/**
 * Delete a product image
 */
export const deleteProductImage = async (
  productId: string,
  imageId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  return api.delete<ApiResponse<{ success: boolean }>>(
    `/catalog/products/${productId}/images/${imageId}`
  );
};

/**
 * Set primary image for a product
 */
export const setPrimaryProductImage = async (
  productId: string,
  imageId: string
): Promise<ApiResponse<ProductImage>> => {
  return api.patch<ApiResponse<ProductImage>>(
    `/catalog/products/${productId}/images/${imageId}/primary`
  );
};

/**
 * Reorder product images
 */
export const reorderProductImages = async (
  productId: string,
  imageIds: string[]
): Promise<ApiResponse<ProductImage[]>> => {
  return api.patch<ApiResponse<ProductImage[]>>(
    `/catalog/products/${productId}/images/reorder`,
    { imageIds }
  );
};

// ============================================
// Category API Functions
// ============================================

/**
 * Get list of categories
 */
export const getCategories = async (params?: { status?: 'active' | 'inactive' }): Promise<ApiResponse<{ categories: Category[]; total: number }>> => {
  return api.get<ApiResponse<{ categories: Category[]; total: number }>>('/catalog/categories', { params });
};

/**
 * Create a new category
 */
export const createCategory = async (data: CreateCategoryData, imageFile?: File): Promise<ApiResponse<Category>> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  });
  if (imageFile) {
    formData.append('image', imageFile);
  }

  return api.post<ApiResponse<Category>>('/catalog/categories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
};

/**
 * Update an existing category
 */
export const updateCategory = async (
  id: string,
  data: UpdateCategoryData,
  imageFile?: File
): Promise<ApiResponse<Category>> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  });
  if (imageFile) {
    formData.append('image', imageFile);
  }

  return api.put<ApiResponse<Category>>(`/catalog/categories/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
};

/**
 * Delete a category
 */
export const deleteCategory = async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  return api.delete<ApiResponse<{ success: boolean; message: string }>>(`/catalog/categories/${id}`);
};

// ============================================
// SubCategory API Functions
// ============================================

/**
 * Get subcategories for a specific category
 */
export const getSubCategoriesByCategory = async (
  categoryId: string,
  params?: { status?: 'active' | 'inactive' }
): Promise<ApiResponse<{ subCategories: SubCategory[]; total: number }>> => {
  return api.get<ApiResponse<{ subCategories: SubCategory[]; total: number }>>(
    `/catalog/categories/${categoryId}/subcategories`,
    { params }
  );
};

/**
 * Get all subcategories across all categories
 * Fetches categories first, then aggregates subcategories from each
 */
export const getAllSubCategories = async (
  params?: { status?: 'active' | 'inactive' }
): Promise<ApiResponse<{ subCategories: SubCategory[]; total: number }>> => {
  const catResponse = await getCategories();
  if (!catResponse.success || !catResponse.data) {
    return { success: false, error: catResponse.error };
  }

  const categories = catResponse.data.categories;
  const results = await Promise.all(
    categories.map((cat) => getSubCategoriesByCategory(cat.id, params))
  );

  const allSubCategories: SubCategory[] = [];
  for (const res of results) {
    if (res.success && res.data) {
      allSubCategories.push(...res.data.subCategories);
    }
  }

  return {
    success: true,
    data: { subCategories: allSubCategories, total: allSubCategories.length },
  };
};

/**
 * Create a new subcategory
 */
export const createSubCategory = async (
  data: CreateSubCategoryData,
  imageFile?: File
): Promise<ApiResponse<{ subCategory: SubCategory }>> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  });
  if (imageFile) {
    formData.append('image', imageFile);
  }

  return api.post<ApiResponse<{ subCategory: SubCategory }>>('/catalog/subcategories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/**
 * Update an existing subcategory
 */
export const updateSubCategory = async (
  id: string,
  data: UpdateSubCategoryData,
  imageFile?: File
): Promise<ApiResponse<{ subCategory: SubCategory }>> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  });
  if (imageFile) {
    formData.append('image', imageFile);
  }

  return api.put<ApiResponse<{ subCategory: SubCategory }>>(`/catalog/subcategories/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/**
 * Delete a subcategory
 */
export const deleteSubCategory = async (
  id: string
): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  return api.delete<ApiResponse<{ success: boolean; message: string }>>(`/catalog/subcategories/${id}`);
};

// ============================================
// Brand API Functions
// ============================================

/**
 * Get list of brands
 */
export const getBrands = async (params?: { status?: 'active' | 'inactive' }): Promise<ApiResponse<{ brands: Brand[]; total: number }>> => {
  return api.get<ApiResponse<{ brands: Brand[]; total: number }>>('/catalog/brands', { params });
};

/**
 * Create a new brand
 */
export const createBrand = async (data: CreateBrandData, imageFile?: File): Promise<ApiResponse<Brand>> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  });
  if (imageFile) {
    formData.append('image', imageFile);
  }

  return api.post<ApiResponse<Brand>>('/catalog/brands', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
};

/**
 * Update an existing brand
 */
export const updateBrand = async (
  id: string,
  data: UpdateBrandData,
  imageFile?: File
): Promise<ApiResponse<Brand>> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  });
  if (imageFile) {
    formData.append('image', imageFile);
  }

  return api.put<ApiResponse<Brand>>(`/catalog/brands/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
};

/**
 * Delete a brand
 */
export const deleteBrand = async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  return api.delete<ApiResponse<{ success: boolean; message: string }>>(`/catalog/brands/${id}`);
};

// ============================================
// Tag API Functions
// ============================================

/**
 * Get list of tags
 */
export const getTags = async (params?: { status?: 'active' | 'inactive' }): Promise<ApiResponse<{ tags: Tag[]; total: number }>> => {
  return api.get<ApiResponse<{ tags: Tag[]; total: number }>>('/catalog/tags', { params });
};

/**
 * Create a new tag
 */
export const createTag = async (data: CreateTagData): Promise<ApiResponse<Tag>> => {
  return api.post<ApiResponse<Tag>>('/catalog/tags', data);
};

/**
 * Update an existing tag
 */
export const updateTag = async (id: string, data: UpdateTagData): Promise<ApiResponse<Tag>> => {
  return api.put<ApiResponse<Tag>>(`/catalog/tags/${id}`, data);
};

/**
 * Delete a tag
 */
export const deleteTag = async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  return api.delete<ApiResponse<{ success: boolean; message: string }>>(`/catalog/tags/${id}`);
};

// ============================================
// Menu API Functions (bonus - for completeness)
// ============================================

/**
 * Get list of menus
 */
export const getMenus = async (params?: { status?: 'active' | 'inactive' }): Promise<ApiResponse<{ menus: Menu[]; total: number }>> => {
  return api.get<ApiResponse<{ menus: Menu[]; total: number }>>('/catalog/menus', { params });
};

/**
 * Create a new menu
 */
export const createMenu = async (data: { name: string; description?: string; status?: 'active' | 'inactive' }): Promise<ApiResponse<Menu>> => {
  return api.post<ApiResponse<Menu>>('/catalog/menus', data);
};

/**
 * Update an existing menu
 */
export const updateMenu = async (
  id: string,
  data: { name?: string; description?: string; status?: 'active' | 'inactive' }
): Promise<ApiResponse<Menu>> => {
  return api.put<ApiResponse<Menu>>(`/catalog/menus/${id}`, data);
};

/**
 * Delete a menu
 */
export const deleteMenu = async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
  return api.delete<ApiResponse<{ success: boolean; message: string }>>(`/catalog/menus/${id}`);
};

// ============================================
// Allergen API Functions (Read-only for tenants)
// ============================================

/**
 * Get list of allergens (global, not tenant-specific)
 */
export const getAllergens = async (): Promise<ApiResponse<{ allergens: Allergen[]; total: number }>> => {
  return api.get<ApiResponse<{ allergens: Allergen[]; total: number }>>('/catalog/allergens');
};

/**
 * Create a new allergen (SuperAdmin only)
 */
export const createAllergenApi = async (data: { name: string; icon?: string }): Promise<ApiResponse<{ allergen: Allergen }>> => {
  return api.post<ApiResponse<{ allergen: Allergen }>>('/super-admin/allergens', data);
};

/**
 * Update an existing allergen (SuperAdmin only)
 */
export const updateAllergenApi = async (id: string, data: { name?: string; icon?: string }): Promise<ApiResponse<{ allergen: Allergen }>> => {
  return api.put<ApiResponse<{ allergen: Allergen }>>(`/super-admin/allergens/${id}`, data);
};

/**
 * Delete an allergen (SuperAdmin only)
 */
export const deleteAllergenApi = async (id: string): Promise<ApiResponse> => {
  return api.delete<ApiResponse>(`/super-admin/allergens/${id}`);
};

// ============================================
// Measuring Unit API Functions
// ============================================

export interface MeasuringUnit {
  id: string;
  quantity: string;
  unit: string;
  symbol: string;
  createdAt: string;
}

/**
 * Get list of measuring units (global, not tenant-specific)
 */
export const getMeasuringUnits = async (): Promise<ApiResponse<{ measuringUnits: MeasuringUnit[]; total: number }>> => {
  return api.get<ApiResponse<{ measuringUnits: MeasuringUnit[]; total: number }>>('/catalog/measuring-units');
};

/**
 * Create a new measuring unit (SuperAdmin only)
 */
export const createMeasuringUnitApi = async (data: { quantity: string; unit: string; symbol: string }): Promise<ApiResponse<{ measuringUnit: MeasuringUnit }>> => {
  return api.post<ApiResponse<{ measuringUnit: MeasuringUnit }>>('/super-admin/measuring-units', data);
};

/**
 * Update an existing measuring unit (SuperAdmin only)
 */
export const updateMeasuringUnitApi = async (id: string, data: { quantity?: string; unit?: string; symbol?: string }): Promise<ApiResponse<{ measuringUnit: MeasuringUnit }>> => {
  return api.put<ApiResponse<{ measuringUnit: MeasuringUnit }>>(`/super-admin/measuring-units/${id}`, data);
};

/**
 * Delete a measuring unit (SuperAdmin only)
 */
export const deleteMeasuringUnitApi = async (id: string): Promise<ApiResponse> => {
  return api.delete<ApiResponse>(`/super-admin/measuring-units/${id}`);
};

// ============================================
// Product Price API
// ============================================

export interface CreateProductPriceData {
  channelType: string;
  basePrice: number;
  discountPrice?: number;
  variantId?: string;
  taxGroupId?: string;
}

/**
 * List all prices for a product
 */
export const listProductPrices = async (productId: string): Promise<ApiResponse<{ prices: ProductPrice[]; total: number }>> => {
  return api.get<ApiResponse<{ prices: ProductPrice[]; total: number }>>(`/catalog/products/${productId}/prices`);
};

/**
 * Create a new price entry for a product
 */
export const createProductPrice = async (productId: string, data: CreateProductPriceData): Promise<ApiResponse<{ price: ProductPrice }>> => {
  return api.post<ApiResponse<{ price: ProductPrice }>>(`/catalog/products/${productId}/prices`, data);
};

/**
 * Update a price entry for a product
 */
export const updateProductPrice = async (productId: string, priceId: string, data: Partial<CreateProductPriceData>): Promise<ApiResponse<{ price: ProductPrice }>> => {
  return api.put<ApiResponse<{ price: ProductPrice }>>(`/catalog/products/${productId}/prices/${priceId}`, data);
};

/**
 * Delete a price entry for a product
 */
export const deleteProductPrice = async (productId: string, priceId: string): Promise<ApiResponse> => {
  return api.delete<ApiResponse>(`/catalog/products/${productId}/prices/${priceId}`);
};

// ============================================
// Product Nutrition API
// ============================================

export interface UpsertProductNutritionData {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  vitamins?: object;
  minerals?: object;
}

/**
 * Get nutrition data for a product
 */
export const getProductNutrition = async (productId: string): Promise<ApiResponse<{ nutrition: ProductNutrition | null }>> => {
  return api.get<ApiResponse<{ nutrition: ProductNutrition | null }>>(`/catalog/products/${productId}/nutrition`);
};

/**
 * Create or update nutrition data for a product (upsert)
 */
export const upsertProductNutrition = async (productId: string, data: UpsertProductNutritionData): Promise<ApiResponse<{ nutrition: ProductNutrition }>> => {
  return api.put<ApiResponse<{ nutrition: ProductNutrition }>>(`/catalog/products/${productId}/nutrition`, data);
};

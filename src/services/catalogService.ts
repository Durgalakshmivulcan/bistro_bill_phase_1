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
  displayOrder?: number;
  type: 'Regular' | 'Combo' | 'Retail';
  description?: string;
  shortCode?: string;
  hsnCode?: string;
  preparationTime?: number;
  servesCount?: number;
  measuringUnit?: string;
  includesTax?: boolean;
  taxId?: string;
  eligibleForDiscount?: boolean;
  discountType?: string;
  tagId?: string;
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
  basePrice?: number | null;
  images?: ProductImage[];
  primaryImage?: string | null;
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
  image?: string;
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
  kitchenId?: string;
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
  barcode?: string;
  description?: string;
  shortCode?: string;
  hsnCode?: string;
  preparationTime?: number;
  servesCount?: number;
  displayOrder?: number;
  measuringUnit?: string;
  includesTax?: boolean;
  taxId?: string;
  eligibleForDiscount?: boolean;
  discountType?: string;
  tagId?: string;
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
  barcode?: string | null;
  description?: string | null;
  shortCode?: string | null;
  hsnCode?: string | null;
  preparationTime?: number | null;
  servesCount?: number | null;
  displayOrder?: number | null;
  measuringUnit?: string | null;
  includesTax?: boolean;
  taxId?: string | null;
  eligibleForDiscount?: boolean;
  discountType?: string | null;
  tagId?: string | null;
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

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/v1';
const API_ORIGIN = API_BASE.replace(/\/api\/v1\/?$/, '');

function normalizeImageUrl(image?: string | null): string | undefined {
  if (!image) return undefined;
  if (/^https?:\/\//i.test(image)) return image;

  const normalized = image.replace(/\\/g, '/').trim();

  // Handle absolute local filesystem paths from frontend public folder.
  const publicIndex = normalized.toLowerCase().lastIndexOf('/public/');
  if (publicIndex !== -1) {
    const publicRelative = normalized.slice(publicIndex + '/public'.length);
    return publicRelative.startsWith('/') ? publicRelative : `/${publicRelative}`;
  }

  // Already frontend-public relative path.
  if (normalized.startsWith('/images/') || normalized.startsWith('images/')) {
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }

  // Handle backend static assets paths.
  if (normalized.startsWith('/assets/') || normalized.startsWith('assets/')) {
    const assetPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return `${API_ORIGIN}${assetPath}`;
  }

  // Handle stored relative catalog path, e.g. "catalog/products/file.jpg".
  if (normalized.startsWith('catalog/')) {
    return `${API_ORIGIN}/assets/${normalized}`;
  }

  // Handle accidental storage of src/assets path.
  const srcAssetsIndex = normalized.toLowerCase().lastIndexOf('/src/assets/');
  if (srcAssetsIndex !== -1) {
    const assetRelative = normalized.slice(srcAssetsIndex + '/src/assets/'.length);
    return `${API_ORIGIN}/assets/${assetRelative}`;
  }

  // Handle plain filename fallback to frontend public products folder.
  if (!normalized.includes('/')) {
    return `/images/products/${normalized}`;
  }

  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function normalizeProductImages(product: Product): Product {
  const normalizedImages = product.images?.map((img) => ({
    ...img,
    url: normalizeImageUrl(img.url) || img.url,
  }));

  return {
    ...product,
    images: normalizedImages,
    primaryImage: normalizeImageUrl(product.primaryImage) || product.primaryImage || null,
  };
}

// ============================================
// Product API Functions
// ============================================

/**
 * Get paginated list of products
 */
export const getProducts = async (params?: ProductListParams): Promise<ApiResponse<{ products: Product[] }> & { pagination?: PaginationMeta }> => {
  const response = await api.get<ApiResponse<{ products: Product[] }> & { pagination?: PaginationMeta }>('/catalog/products', { params });
  if (response.success && response.data?.products) {
    response.data.products = response.data.products.map((product) => normalizeProductImages(product));
  }
  return response;
};

/**
 * Get single product by ID with full details
 */
export const getProduct = async (id: string): Promise<ApiResponse<Product>> => {
  const response = await api.get<ApiResponse<Product | { product: Product }>>(`/catalog/products/${id}`);
  const rawData = response.data as Product | { product: Product } | undefined;
  const product = rawData && 'product' in rawData ? rawData.product : rawData;

  return {
    ...response,
    data: product ? normalizeProductImages(product) : undefined,
  };
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
  files: File[],
  productName?: string
): Promise<ApiResponse<ProductImage[]>> => {
  try {
    const uploaded: ProductImage[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const formData = new FormData();
      formData.append('image', file);
      if (productName) {
        formData.append('productName', productName);
      }
      if (index === 0) {
        formData.append('isPrimary', 'true');
      }
      formData.append('sortOrder', String(index));

      const response = await api.post<ApiResponse<{ image: ProductImage }>>(
        `/catalog/products/${productId}/images`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.success && response.data?.image) {
        uploaded.push(response.data.image);
      } else {
        return {
          success: false,
          error: response.error,
          message: response.message || 'Failed to upload product image',
        };
      }
    }

    return {
      success: true,
      data: uploaded,
      message: 'Product images uploaded successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: error?.message || 'Failed to upload product images',
      },
    };
  }
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
  const response = await api.get<ApiResponse<{ categories: Category[]; total: number }>>('/catalog/categories', { params });
  if (response.success && response.data?.categories) {
    response.data.categories = response.data.categories.map((category) => ({
      ...category,
      image: normalizeImageUrl(category.image),
    }));
  }
  return response;
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
  const response = await api.get<ApiResponse<{ subCategories: SubCategory[]; total: number }>>(
    `/catalog/categories/${categoryId}/subcategories`,
    { params }
  );
  if (response.success && response.data?.subCategories) {
    response.data.subCategories = response.data.subCategories.map((subCategory) => ({
      ...subCategory,
      image: normalizeImageUrl(subCategory.image),
    }));
  }
  return response;
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
  const response = await api.get<ApiResponse<{ brands: Brand[]; total: number }>>('/catalog/brands', { params });
  if (response.success && response.data?.brands) {
    response.data.brands = response.data.brands.map((brand) => ({
      ...brand,
      image: normalizeImageUrl(brand.image),
    }));
  }
  return response;
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
  const response = await api.get<ApiResponse<{ menus: Menu[]; total: number }>>('/catalog/menus', { params });
  if (response.success && response.data?.menus) {
    response.data.menus = response.data.menus.map((menu) => ({
      ...menu,
      image: normalizeImageUrl(menu.image),
    }));
  }
  return response;
};

/**
 * Create a new menu
 */
export const createMenu = async (
  data: { name: string; description?: string; status?: 'active' | 'inactive' },
  imageFile?: File
): Promise<ApiResponse<Menu>> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  });
  if (imageFile) {
    formData.append('image', imageFile);
  }

  return api.post<ApiResponse<Menu>>('/catalog/menus', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/**
 * Update an existing menu
 */
export const updateMenu = async (
  id: string,
  data: { name?: string; description?: string; status?: 'active' | 'inactive' },
  imageFile?: File
): Promise<ApiResponse<Menu>> => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, String(value));
    }
  });
  if (imageFile) {
    formData.append('image', imageFile);
  }

  return api.put<ApiResponse<Menu>>(`/catalog/menus/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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

export interface CreateProductVariantData {
  name: string;
  additionalPrice: number;
  sku?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateProductVariantData {
  name?: string;
  additionalPrice?: number;
  sku?: string | null;
  status?: 'active' | 'inactive';
}

export interface CreateProductAddonData {
  name: string;
  price: number;
  status?: 'active' | 'inactive';
}

export interface UpdateProductAddonData {
  name?: string;
  price?: number;
  status?: 'active' | 'inactive';
}

/**
 * List all variants for a product
 */
export const listProductVariants = async (productId: string): Promise<ApiResponse<{ variants: ProductVariant[]; total: number }>> => {
  return api.get<ApiResponse<{ variants: ProductVariant[]; total: number }>>(`/catalog/products/${productId}/variants`);
};

export const createProductVariant = async (
  productId: string,
  data: CreateProductVariantData
): Promise<ApiResponse<{ variant: ProductVariant }>> => {
  return api.post<ApiResponse<{ variant: ProductVariant }>>(`/catalog/products/${productId}/variants`, data);
};

export const updateProductVariant = async (
  productId: string,
  variantId: string,
  data: UpdateProductVariantData
): Promise<ApiResponse<{ variant: ProductVariant }>> => {
  return api.put<ApiResponse<{ variant: ProductVariant }>>(`/catalog/products/${productId}/variants/${variantId}`, data);
};

export const listProductAddons = async (productId: string): Promise<ApiResponse<{ addons: ProductAddon[]; total: number }>> => {
  return api.get<ApiResponse<{ addons: ProductAddon[]; total: number }>>(`/catalog/products/${productId}/addons`);
};

export const createProductAddon = async (
  productId: string,
  data: CreateProductAddonData
): Promise<ApiResponse<{ addon: ProductAddon }>> => {
  return api.post<ApiResponse<{ addon: ProductAddon }>>(`/catalog/products/${productId}/addons`, data);
};

export const updateProductAddon = async (
  productId: string,
  addonId: string,
  data: UpdateProductAddonData
): Promise<ApiResponse<{ addon: ProductAddon }>> => {
  return api.put<ApiResponse<{ addon: ProductAddon }>>(`/catalog/products/${productId}/addons/${addonId}`, data);
};

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

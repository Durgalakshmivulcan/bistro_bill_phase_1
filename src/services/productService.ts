import { api } from './api';

/**
 * Product Service
 * Handles all product-related API calls
 */

// ============================================
// Type Definitions
// ============================================

export interface ProductAvailabilitySchedule {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  type: 'Regular' | 'Combo' | 'Variant';
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  menuId: string;
  menu?: {
    id: string;
    name: string;
  };
  description?: string;
  shortCode?: string;
  preparationTime?: number;
  servesCount?: number;
  isVeg: boolean;
  status: string;
  images?: {
    id: string;
    url: string;
    isPrimary: boolean;
    sortOrder: number;
  }[];
  prices?: {
    id: string;
    channelType: string;
    basePrice: number;
  }[];
  variants?: {
    id: string;
    name: string;
    additionalPrice: number;
    status: string;
  }[];
  addons?: {
    id: string;
    name: string;
    price: number;
    status: string;
  }[];
  availabilitySchedule?: ProductAvailabilitySchedule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  barcode?: string;
  categoryId?: string;
  menuId?: string;
  status?: string;
  isVeg?: boolean;
  branchId?: string;
  productIds?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

// ============================================
// Product Functions
// ============================================

/**
 * Get Products List
 * GET /api/v1/catalog/products
 */
export async function getProducts(
  params?: GetProductsParams
): Promise<ApiResponse<ProductsResponse>> {
  try {
    // Build query string
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.barcode) queryParams.append('barcode', params.barcode);
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.menuId) queryParams.append('menuId', params.menuId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.isVeg !== undefined) queryParams.append('isVeg', params.isVeg.toString());
    if (params?.branchId) queryParams.append('branchId', params.branchId);
    if (params?.productIds && params.productIds.length > 0) {
      params.productIds.forEach(id => queryParams.append('productIds', id));
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/catalog/products?${queryString}` : '/catalog/products';

    const response = await api.get<ApiResponse<ProductsResponse>>(url);
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'FETCH_PRODUCTS_FAILED',
        message: error.message || 'Failed to fetch products',
      },
    };
  }
}

/**
 * Get Product by ID
 * GET /api/v1/catalog/products/:id
 */
export async function getProductById(
  id: string
): Promise<ApiResponse<Product>> {
  try {
    const response = await api.get<ApiResponse<Product>>(`/catalog/products/${id}`);
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'FETCH_PRODUCT_FAILED',
        message: error.message || 'Failed to fetch product',
      },
    };
  }
}

/**
 * Create Product
 * POST /api/v1/catalog/products
 */
export async function createProduct(
  productData: Partial<Product>
): Promise<ApiResponse<Product>> {
  try {
    const response = await api.post<ApiResponse<Product>>('/catalog/products', productData);
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'CREATE_PRODUCT_FAILED',
        message: error.message || 'Failed to create product',
      },
    };
  }
}

/**
 * Update Product
 * PUT /api/v1/catalog/products/:id
 */
export async function updateProduct(
  id: string,
  productData: Partial<Product>
): Promise<ApiResponse<Product>> {
  try {
    const response = await api.put<ApiResponse<Product>>(`/catalog/products/${id}`, productData);
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'UPDATE_PRODUCT_FAILED',
        message: error.message || 'Failed to update product',
      },
    };
  }
}

/**
 * Delete Product
 * DELETE /api/v1/catalog/products/:id
 */
export async function deleteProduct(
  id: string
): Promise<ApiResponse<void>> {
  try {
    const response = await api.delete<ApiResponse<void>>(`/catalog/products/${id}`);
    return response;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'DELETE_PRODUCT_FAILED',
        message: error.message || 'Failed to delete product',
      },
    };
  }
}

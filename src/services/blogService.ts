import { api } from './api';
import { ApiResponse } from '../types/api';

// ============================================
// Type Definitions
// ============================================

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  author: string | null;
  authorId: string | null;
  authorStaff: { id: string; firstName: string; lastName: string } | null;
  status: string;
  publishDate: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  };
  tags: { id: string; name: string; slug: string }[];
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  status: string;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  blogsCount: number;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  blogsCount: number;
}

export interface BlogTagListResponse {
  tags: BlogTag[];
  total: number;
}

export interface BlogListResponse {
  blogs: Blog[];
  total: number;
}

export interface BlogCategoryListResponse {
  categories: BlogCategory[];
  total: number;
}

export interface CreateBlogData {
  title: string;
  categoryId: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  featuredImageFile?: File;
  author?: string;
  authorId?: string;
  tagIds?: string[];
  status?: string;
  publishDate?: string;
}

export interface UpdateBlogData {
  title?: string;
  categoryId?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  featuredImageFile?: File;
  author?: string;
  authorId?: string;
  tagIds?: string[];
  status?: string;
  publishDate?: string | null;
}

export interface CreateBlogTagData {
  name: string;
  status?: string;
}

export interface UpdateBlogTagData {
  name?: string;
  status?: string;
}

export interface CreateBlogCategoryData {
  name: string;
  status?: string;
}

export interface UpdateBlogCategoryData {
  name?: string;
  status?: string;
}

export interface BlogRevision {
  id: string;
  blogId: string;
  content: string;
  title: string;
  excerpt: string | null;
  authorId: string | null;
  authorName: string;
  createdAt: string;
}

export interface BlogRevisionListResponse {
  revisions: BlogRevision[];
}

// ============================================
// Blog Post API Functions
// ============================================

export async function getBlogs(params?: {
  status?: string;
  search?: string;
  sort?: string;
  authorId?: string;
  tagId?: string;
}): Promise<ApiResponse<BlogListResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.authorId) queryParams.append('authorId', params.authorId);
  if (params?.tagId) queryParams.append('tagId', params.tagId);

  const queryString = queryParams.toString();
  const url = `/blog/posts${queryString ? `?${queryString}` : ''}`;

  return api.get<ApiResponse<BlogListResponse>>(url);
}

export async function getBlog(id: string): Promise<ApiResponse<{ blog: Blog }>> {
  return api.get<ApiResponse<{ blog: Blog }>>(`/blog/posts/${id}`);
}

function buildBlogFormData(data: CreateBlogData | UpdateBlogData): { body: FormData | Record<string, unknown>; config: Record<string, unknown> } {
  const { featuredImageFile, ...rest } = data;
  if (featuredImageFile) {
    const formData = new FormData();
    formData.append('featuredImage', featuredImageFile);
    Object.entries(rest).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => formData.append(key, v));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    return { body: formData, config: { headers: { 'Content-Type': 'multipart/form-data' } } };
  }
  return { body: rest as Record<string, unknown>, config: {} };
}

export async function createBlogApi(data: CreateBlogData): Promise<ApiResponse<{ blog: Blog }>> {
  const { body, config } = buildBlogFormData(data);
  return api.post<ApiResponse<{ blog: Blog }>>('/blog/posts', body, config);
}

export async function updateBlogApi(id: string, data: UpdateBlogData): Promise<ApiResponse<{ blog: Blog }>> {
  const { body, config } = buildBlogFormData(data);
  return api.put<ApiResponse<{ blog: Blog }>>(`/blog/posts/${id}`, body, config);
}

export async function deleteBlogApi(id: string): Promise<ApiResponse<void>> {
  return api.delete<ApiResponse<void>>(`/blog/posts/${id}`);
}

// ============================================
// Blog Revision API Functions (US-163)
// ============================================

export async function getBlogRevisions(blogId: string): Promise<ApiResponse<BlogRevisionListResponse>> {
  return api.get<ApiResponse<BlogRevisionListResponse>>(`/blog/posts/${blogId}/revisions`);
}

export async function restoreBlogRevision(blogId: string, revisionId: string): Promise<ApiResponse<{ blog: Blog }>> {
  return api.post<ApiResponse<{ blog: Blog }>>(`/blog/posts/${blogId}/revisions/${revisionId}/restore`, {});
}

// ============================================
// Blog Category API Functions
// ============================================

export async function getBlogCategories(params?: {
  status?: string;
  search?: string;
}): Promise<ApiResponse<BlogCategoryListResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const url = `/blog/categories${queryString ? `?${queryString}` : ''}`;

  return api.get<ApiResponse<BlogCategoryListResponse>>(url);
}

export async function createBlogCategoryApi(data: CreateBlogCategoryData): Promise<ApiResponse<{ category: BlogCategory }>> {
  return api.post<ApiResponse<{ category: BlogCategory }>>('/blog/categories', data);
}

export async function updateBlogCategoryApi(id: string, data: UpdateBlogCategoryData): Promise<ApiResponse<{ category: BlogCategory }>> {
  return api.put<ApiResponse<{ category: BlogCategory }>>(`/blog/categories/${id}`, data);
}

export async function deleteBlogCategoryApi(id: string): Promise<ApiResponse<void>> {
  return api.delete<ApiResponse<void>>(`/blog/categories/${id}`);
}

// ============================================
// Blog Tag API Functions
// ============================================

export async function getBlogTags(params?: {
  status?: string;
  search?: string;
}): Promise<ApiResponse<BlogTagListResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.status) queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const url = `/blog/tags${queryString ? `?${queryString}` : ''}`;

  return api.get<ApiResponse<BlogTagListResponse>>(url);
}

export async function createBlogTagApi(data: CreateBlogTagData): Promise<ApiResponse<{ tag: BlogTag }>> {
  return api.post<ApiResponse<{ tag: BlogTag }>>('/blog/tags', data);
}

export async function updateBlogTagApi(id: string, data: UpdateBlogTagData): Promise<ApiResponse<{ tag: BlogTag }>> {
  return api.put<ApiResponse<{ tag: BlogTag }>>(`/blog/tags/${id}`, data);
}

export async function deleteBlogTagApi(id: string): Promise<ApiResponse<void>> {
  return api.delete<ApiResponse<void>>(`/blog/tags/${id}`);
}

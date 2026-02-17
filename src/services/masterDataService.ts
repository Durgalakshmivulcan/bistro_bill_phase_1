import { api } from './api';
import { ApiResponse } from '../types/api';

/**
 * Master Data Service
 *
 * Provides unified CRUD functions for all master data entities:
 * - Allergies/Allergens
 * - Measuring Units
 *
 * Backend routes:
 * - GET (read-only): `/catalog/allergens`, `/catalog/measuring-units`
 * - POST/PUT/DELETE (admin): `/super-admin/allergens`, `/super-admin/measuring-units`
 *
 * Returns `{ success, data, error }` response format.
 */

// ============================================
// Type Definitions
// ============================================

export interface Allergen {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAllergenData {
  name: string;
  icon?: string;
}

export interface UpdateAllergenData {
  name?: string;
  icon?: string;
}

export interface MeasuringUnit {
  id: string;
  quantity: string;
  unit: string;
  symbol: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMeasuringUnitData {
  quantity: string;
  unit: string;
  symbol: string;
}

export interface UpdateMeasuringUnitData {
  quantity?: string;
  unit?: string;
  symbol?: string;
}

// ============================================
// Allergen CRUD Functions
// ============================================

export const getAllergies = async (): Promise<ApiResponse<{ allergens: Allergen[]; total: number }>> => {
  return api.get<ApiResponse<{ allergens: Allergen[]; total: number }>>('/catalog/allergens');
};

export const createAllergy = async (data: CreateAllergenData): Promise<ApiResponse<{ allergen: Allergen }>> => {
  return api.post<ApiResponse<{ allergen: Allergen }>>('/super-admin/allergens', data);
};

export const updateAllergy = async (id: string, data: UpdateAllergenData): Promise<ApiResponse<{ allergen: Allergen }>> => {
  return api.put<ApiResponse<{ allergen: Allergen }>>(`/super-admin/allergens/${id}`, data);
};

export const deleteAllergy = async (id: string): Promise<ApiResponse> => {
  return api.delete<ApiResponse>(`/super-admin/allergens/${id}`);
};

// ============================================
// Measuring Unit CRUD Functions
// ============================================

export const getMeasuringUnits = async (): Promise<ApiResponse<{ measuringUnits: MeasuringUnit[]; total: number }>> => {
  return api.get<ApiResponse<{ measuringUnits: MeasuringUnit[]; total: number }>>('/catalog/measuring-units');
};

export const createMeasuringUnit = async (data: CreateMeasuringUnitData): Promise<ApiResponse<{ measuringUnit: MeasuringUnit }>> => {
  return api.post<ApiResponse<{ measuringUnit: MeasuringUnit }>>('/super-admin/measuring-units', data);
};

export const updateMeasuringUnit = async (id: string, data: UpdateMeasuringUnitData): Promise<ApiResponse<{ measuringUnit: MeasuringUnit }>> => {
  return api.put<ApiResponse<{ measuringUnit: MeasuringUnit }>>(`/super-admin/measuring-units/${id}`, data);
};

export const deleteMeasuringUnit = async (id: string): Promise<ApiResponse> => {
  return api.delete<ApiResponse>(`/super-admin/measuring-units/${id}`);
};

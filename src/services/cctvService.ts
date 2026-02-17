import { api } from './api';
import { ApiResponse } from '../types/api';

/**
 * CCTV Service - Frontend service for CCTV/Security System Integration
 */

export interface SecurityCamera {
  id: string;
  name: string;
  location: string;
  cameraId: string;
  status: string;
}

export interface FootageLink {
  success: boolean;
  message: string;
  playbackUrl?: string;
  cameraName?: string;
  cameraLocation?: string;
  startTime?: string;
  endTime?: string;
}

export interface OrderFootageResponse {
  success: boolean;
  message: string;
  footage: FootageLink[];
}

/**
 * Get all active security cameras for a branch.
 */
export async function getCameras(branchId: string): Promise<ApiResponse<{ cameras: SecurityCamera[] }>> {
  try {
    const response = await api.get<ApiResponse<{ cameras: SecurityCamera[] }>>(
      `/integrations/cctv/cameras?branchId=${encodeURIComponent(branchId)}`
    );
    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch cameras',
    };
  }
}

/**
 * Get footage link for a specific camera, timestamp, and duration.
 */
export async function getFootageLink(
  cameraId: string,
  timestamp: string,
  durationMinutes: number = 30
): Promise<ApiResponse<FootageLink>> {
  try {
    const response = await api.get<ApiResponse<FootageLink>>(
      `/integrations/cctv/footage?cameraId=${encodeURIComponent(cameraId)}&timestamp=${encodeURIComponent(timestamp)}&duration=${durationMinutes}`
    );
    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get footage link',
    };
  }
}

/**
 * Get all footage links for a specific order.
 */
export async function getOrderFootage(
  orderId: string,
  durationMinutes: number = 30
): Promise<ApiResponse<OrderFootageResponse>> {
  try {
    const response = await api.get<ApiResponse<OrderFootageResponse>>(
      `/integrations/cctv/order-footage/${encodeURIComponent(orderId)}?duration=${durationMinutes}`
    );
    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get order footage',
    };
  }
}

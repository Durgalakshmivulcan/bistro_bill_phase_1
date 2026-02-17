import { api } from './api';
import { ApiResponse } from '../types/api';

/**
 * Voice Ordering Service - Frontend service for Alexa/Google Assistant integration
 */

export type VoicePlatform = 'alexa' | 'google_assistant';

export interface VoiceOrderingConfig {
  platform: VoicePlatform;
  skillId?: string;
  projectId?: string;
  webhookSecret: string;
  defaultBranchId: string;
  accountLinkingEnabled: boolean;
}

export interface VoiceOrderingStatusResponse {
  success: boolean;
  configured: boolean;
  platform?: VoicePlatform;
  accountLinkingEnabled?: boolean;
  lastOrderAt?: string;
  totalVoiceOrders?: number;
}

export interface VoiceFulfillmentRequest {
  platform: VoicePlatform;
  requestId: string;
  intent: {
    name: string;
    slots: Record<string, string | undefined>;
  };
  userId?: string;
  sessionId: string;
  locale: string;
}

export interface VoiceFulfillmentResponse {
  speechText: string;
  shouldEndSession: boolean;
  card?: {
    title: string;
    content: string;
  };
  orderCreated?: boolean;
  orderId?: string;
}

export interface AccountLinkResponse {
  success: boolean;
  message: string;
}

/**
 * Get the current voice ordering integration status.
 */
export async function getVoiceOrderingStatus(): Promise<ApiResponse<VoiceOrderingStatusResponse>> {
  try {
    const response = await api.get<ApiResponse<VoiceOrderingStatusResponse>>(
      '/integrations/voice-ordering/status'
    );
    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get voice ordering status',
    };
  }
}

/**
 * Handle a fulfillment webhook from Alexa or Google Assistant.
 */
export async function handleFulfillment(
  request: VoiceFulfillmentRequest
): Promise<ApiResponse<VoiceFulfillmentResponse>> {
  try {
    const response = await api.post<ApiResponse<VoiceFulfillmentResponse>>(
      '/integrations/voice-ordering/fulfillment',
      request
    );
    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process voice command',
    };
  }
}

/**
 * Link a customer account with a voice assistant user ID.
 */
export async function linkCustomerAccount(
  customerId: string,
  voiceUserId: string
): Promise<ApiResponse<AccountLinkResponse>> {
  try {
    const response = await api.post<ApiResponse<AccountLinkResponse>>(
      '/integrations/voice-ordering/link-account',
      { customerId, voiceUserId }
    );
    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to link account',
    };
  }
}

/**
 * Get recent voice orders for the dashboard.
 */
export async function getRecentVoiceOrders(
  limit: number = 10
): Promise<ApiResponse<{ orders: Array<{ id: string; orderNumber: string; total: number; status: string; createdAt: string }> }>> {
  try {
    const response = await api.get<ApiResponse<{ orders: Array<{ id: string; orderNumber: string; total: number; status: string; createdAt: string }> }>>(
      `/integrations/voice-ordering/recent-orders?limit=${limit}`
    );
    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch voice orders',
    };
  }
}

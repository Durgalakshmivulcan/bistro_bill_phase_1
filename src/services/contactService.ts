import { api } from './api';
import { ApiResponse, SearchParams } from '../types/api';

/**
 * Lead Stage Enum — matches backend Prisma LeadStage
 */
export type LeadStage = 'NewRequest' | 'InitialContacted' | 'ScheduledDemo' | 'Completed' | 'ClosedWin' | 'ClosedLoss';

/** @deprecated Use LeadStage instead */
export type ContactStatus = LeadStage;

/**
 * Lead Entity from Backend (matches LeadResponse in lead.controller.ts)
 */
export interface Lead {
  id: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string | null;
  businessType: string | null;
  inquiryType: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  zipCode: string | null;
  address: string | null;
  description: string | null;
  stage: LeadStage;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Use Lead instead */
export type Contact = Lead;

/**
 * Input type for creating a new lead
 */
export interface CreateLeadInput {
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessType?: string;
  inquiryType?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  address?: string;
  description?: string;
}

/** @deprecated Use CreateLeadInput instead */
export type CreateContactInput = CreateLeadInput;

/**
 * Input type for updating an existing lead
 */
export interface UpdateLeadInput {
  restaurantName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  businessType?: string;
  inquiryType?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  address?: string;
  description?: string;
  stage?: LeadStage;
}

/** @deprecated Use UpdateLeadInput instead */
export type UpdateContactInput = UpdateLeadInput;

/**
 * Lead List Response (matches backend response shape)
 */
interface LeadListResponse {
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Lead API Service
 * Backend routes: /api/v1/super-admin/leads
 */

/**
 * Get all leads with optional search and pagination
 * GET /api/v1/super-admin/leads
 */
export const getLeads = async (params?: SearchParams): Promise<ApiResponse<LeadListResponse>> => {
  return api.get<ApiResponse<LeadListResponse>>('/super-admin/leads', { params });
};

/** @deprecated Use getLeads instead */
export const getContacts = getLeads;

/**
 * Get a single lead by ID
 * GET /api/v1/super-admin/leads/:id
 */
export const getLead = async (id: string): Promise<ApiResponse<Lead>> => {
  return api.get<ApiResponse<Lead>>(`/super-admin/leads/${id}`);
};

/** @deprecated Use getLead instead */
export const getContact = getLead;

/**
 * Create a new lead
 * POST /api/v1/super-admin/leads
 */
export const createLead = async (input: CreateLeadInput): Promise<ApiResponse<Lead>> => {
  return api.post<ApiResponse<Lead>>('/super-admin/leads', input);
};

/** @deprecated Use createLead instead */
export const createContact = createLead;

/**
 * Update an existing lead
 * PUT /api/v1/super-admin/leads/:id
 */
export const updateLead = async (id: string, input: UpdateLeadInput): Promise<ApiResponse<Lead>> => {
  return api.put<ApiResponse<Lead>>(`/super-admin/leads/${id}`, input);
};

/** @deprecated Use updateLead instead */
export const updateContact = updateLead;

/**
 * Delete a lead
 * DELETE /api/v1/super-admin/leads/:id
 */
export const deleteLead = async (id: string): Promise<ApiResponse<null>> => {
  return api.delete<ApiResponse<null>>(`/super-admin/leads/${id}`);
};

/** @deprecated Use deleteLead instead */
export const deleteContact = deleteLead;

/**
 * Update lead stage (for Kanban board drag-and-drop)
 * PATCH /api/v1/super-admin/leads/:id/stage
 */
export const updateLeadStage = async (id: string, stage: LeadStage): Promise<ApiResponse<Lead>> => {
  return api.patch<ApiResponse<Lead>>(`/super-admin/leads/${id}/stage`, { stage });
};

/** @deprecated Use updateLeadStage instead */
export const updateContactStatus = updateLeadStage;

/**
 * Get leads grouped by stage (client-side grouping using list endpoint)
 * Fetches all leads and groups them by stage for the kanban board view
 */
export const getLeadsByStage = async (): Promise<ApiResponse<Record<LeadStage, Lead[]>>> => {
  const response = await api.get<ApiResponse<LeadListResponse>>('/super-admin/leads', {
    params: { limit: 1000 },
  });

  if (response.success && response.data) {
    const grouped: Record<LeadStage, Lead[]> = {
      NewRequest: [],
      InitialContacted: [],
      ScheduledDemo: [],
      Completed: [],
      ClosedWin: [],
      ClosedLoss: [],
    };

    for (const lead of response.data.leads) {
      if (grouped[lead.stage]) {
        grouped[lead.stage].push(lead);
      }
    }

    return { success: true, data: grouped };
  }

  return response as unknown as ApiResponse<Record<LeadStage, Lead[]>>;
};

/** @deprecated Use getLeadsByStage instead */
export const getContactsByStatus = getLeadsByStage;

import { api } from './api';

// ============================================
// Type Definitions
// ============================================

export type ReportType = 'Sales' | 'Products' | 'Customers' | 'Inventory' | 'StaffPerformance';

export interface ReportFilter {
  dateRange?: { startDate: string; endDate: string };
  branchId?: string;
  categoryId?: string;
  paymentMode?: string;
  customerGroup?: string;
}

export interface ReportColumn {
  id: string;
  label: string;
  field: string;
  visible: boolean;
  isCurrency?: boolean;
  isDate?: boolean;
  isPercentage?: boolean;
}

export interface ScheduleConfig {
  frequency: 'Daily' | 'Weekly' | 'Monthly';
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  emails: string[];
  format: 'CSV' | 'PDF' | 'Both';
}

export interface CustomReport {
  id: string;
  businessOwnerId: string;
  name: string;
  description: string | null;
  reportType: string;
  filters: ReportFilter;
  columns: ReportColumn[];
  schedule: ScheduleConfig | null;
  createdBy: string;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomReportInput {
  name: string;
  description?: string;
  reportType: ReportType;
  filters: ReportFilter;
  columns: ReportColumn[];
  schedule?: ScheduleConfig | null;
}

export interface ReportExecutionResult {
  reportId: string;
  reportName: string;
  reportType: string;
  data: Record<string, unknown>[];
  columns: ReportColumn[];
  summary: {
    totalRecords: number;
    generatedAt: string;
    dateRange: { startDate: string; endDate: string };
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  reportType: string;
  filters: ReportFilter;
  columns: ReportColumn[];
  isDefault: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

// ============================================
// API Functions
// ============================================

export async function createCustomReport(data: CustomReportInput): Promise<ApiResponse<CustomReport>> {
  try {
    const response = await api.post<ApiResponse<CustomReport>>('/reports/custom', data);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create report';
    return { success: false, error: { code: 'CREATE_REPORT_FAILED', message } };
  }
}

export async function getCustomReports(reportType?: string): Promise<ApiResponse<{ reports: CustomReport[]; total: number }>> {
  try {
    const params = new URLSearchParams();
    if (reportType) params.append('reportType', reportType);
    const query = params.toString();
    const url = `/reports/custom${query ? `?${query}` : ''}`;
    const response = await api.get<ApiResponse<{ reports: CustomReport[]; total: number }>>(url);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch reports';
    return { success: false, error: { code: 'FETCH_REPORTS_FAILED', message } };
  }
}

export async function getCustomReportById(reportId: string): Promise<ApiResponse<CustomReport>> {
  try {
    const response = await api.get<ApiResponse<CustomReport>>(`/reports/custom/${reportId}`);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch report';
    return { success: false, error: { code: 'FETCH_REPORT_FAILED', message } };
  }
}

export async function updateCustomReport(reportId: string, data: Partial<CustomReportInput>): Promise<ApiResponse<CustomReport>> {
  try {
    const response = await api.put<ApiResponse<CustomReport>>(`/reports/custom/${reportId}`, data);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update report';
    return { success: false, error: { code: 'UPDATE_REPORT_FAILED', message } };
  }
}

export async function deleteCustomReport(reportId: string): Promise<ApiResponse<{ deleted: boolean }>> {
  try {
    const response = await api.delete<ApiResponse<{ deleted: boolean }>>(`/reports/custom/${reportId}`);
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete report';
    return { success: false, error: { code: 'DELETE_REPORT_FAILED', message } };
  }
}

export async function executeReport(
  reportId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<ApiResponse<ReportExecutionResult>> {
  try {
    const response = await api.post<ApiResponse<ReportExecutionResult>>(
      `/reports/custom/${reportId}/execute`,
      { dateRange }
    );
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to execute report';
    return { success: false, error: { code: 'EXECUTE_REPORT_FAILED', message } };
  }
}

export async function getReportTemplates(): Promise<ApiResponse<{ templates: ReportTemplate[] }>> {
  try {
    const response = await api.get<ApiResponse<{ templates: ReportTemplate[] }>>('/reports/templates');
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch templates';
    return { success: false, error: { code: 'FETCH_TEMPLATES_FAILED', message } };
  }
}

export async function getAvailableColumns(reportType: ReportType): Promise<ApiResponse<{ columns: ReportColumn[] }>> {
  try {
    const response = await api.get<ApiResponse<{ columns: ReportColumn[] }>>(
      `/reports/columns?reportType=${reportType}`
    );
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch columns';
    return { success: false, error: { code: 'FETCH_COLUMNS_FAILED', message } };
  }
}

export async function scheduleReport(
  reportId: string,
  schedule: ScheduleConfig
): Promise<ApiResponse<CustomReport>> {
  try {
    const response = await api.put<ApiResponse<CustomReport>>(
      `/reports/custom/${reportId}`,
      { schedule }
    );
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to schedule report';
    return { success: false, error: { code: 'SCHEDULE_REPORT_FAILED', message } };
  }
}

export async function removeReportSchedule(
  reportId: string
): Promise<ApiResponse<CustomReport>> {
  try {
    const response = await api.put<ApiResponse<CustomReport>>(
      `/reports/custom/${reportId}`,
      { schedule: null }
    );
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove schedule';
    return { success: false, error: { code: 'REMOVE_SCHEDULE_FAILED', message } };
  }
}

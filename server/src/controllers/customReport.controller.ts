import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import {
  createCustomReport as createReport,
  getCustomReports as getReports,
  getCustomReportById as getReportById,
  updateCustomReport as updateReport,
  deleteCustomReport as deleteReport,
  executeReport as execReport,
  getReportTemplates as getTemplates,
  getAvailableColumns as getColumns,
  ReportType,
} from '../services/customReportBuilder.service';

/**
 * POST /api/v1/reports/custom
 * Create a new custom report
 */
export async function createCustomReport(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const businessOwnerId = req.user?.businessOwnerId;
    if (!businessOwnerId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Business owner context is required' },
      };
      res.status(403).json(response);
      return;
    }

    const createdBy = req.user?.id || '';
    const report = await createReport(businessOwnerId, createdBy, req.body);

    const response: ApiResponse = {
      success: true,
      data: report,
    };
    res.status(201).json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create report';
    const response: ApiResponse = {
      success: false,
      error: { code: 'CREATE_REPORT_FAILED', message },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/reports/custom
 * List custom reports, optionally filtered by reportType
 */
export async function getCustomReports(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const businessOwnerId = req.user?.businessOwnerId;
    if (!businessOwnerId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Business owner context is required' },
      };
      res.status(403).json(response);
      return;
    }

    const reportType = req.query.reportType as string | undefined;
    const reports = await getReports(businessOwnerId, reportType);

    const response: ApiResponse = {
      success: true,
      data: { reports, total: reports.length },
    };
    res.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch reports';
    const response: ApiResponse = {
      success: false,
      error: { code: 'FETCH_REPORTS_FAILED', message },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/reports/custom/:reportId
 * Get a single custom report by ID
 */
export async function getCustomReportById(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const businessOwnerId = req.user?.businessOwnerId;
    if (!businessOwnerId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Business owner context is required' },
      };
      res.status(403).json(response);
      return;
    }

    const { reportId } = req.params;
    const report = await getReportById(businessOwnerId, reportId);

    if (!report) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'REPORT_NOT_FOUND', message: 'Report not found' },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: report,
    };
    res.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch report';
    const response: ApiResponse = {
      success: false,
      error: { code: 'FETCH_REPORT_FAILED', message },
    };
    res.status(500).json(response);
  }
}

/**
 * PUT /api/v1/reports/custom/:reportId
 * Update an existing custom report
 */
export async function updateCustomReport(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const businessOwnerId = req.user?.businessOwnerId;
    if (!businessOwnerId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Business owner context is required' },
      };
      res.status(403).json(response);
      return;
    }

    const { reportId } = req.params;
    const report = await updateReport(businessOwnerId, reportId, req.body);

    if (!report) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'REPORT_NOT_FOUND', message: 'Report not found' },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: report,
    };
    res.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update report';
    const response: ApiResponse = {
      success: false,
      error: { code: 'UPDATE_REPORT_FAILED', message },
    };
    res.status(500).json(response);
  }
}

/**
 * DELETE /api/v1/reports/custom/:reportId
 * Delete a custom report
 */
export async function deleteCustomReport(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const businessOwnerId = req.user?.businessOwnerId;
    if (!businessOwnerId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Business owner context is required' },
      };
      res.status(403).json(response);
      return;
    }

    const { reportId } = req.params;
    const deleted = await deleteReport(businessOwnerId, reportId);

    if (!deleted) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'REPORT_NOT_FOUND', message: 'Report not found' },
      };
      res.status(404).json(response);
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: { deleted: true },
    };
    res.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete report';
    const response: ApiResponse = {
      success: false,
      error: { code: 'DELETE_REPORT_FAILED', message },
    };
    res.status(500).json(response);
  }
}

/**
 * POST /api/v1/reports/custom/:reportId/execute
 * Execute a custom report with a date range
 */
export async function executeReport(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const businessOwnerId = req.user?.businessOwnerId;
    if (!businessOwnerId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Business owner context is required' },
      };
      res.status(403).json(response);
      return;
    }

    const { reportId } = req.params;
    const { dateRange } = req.body;

    const result = await execReport(businessOwnerId, reportId, dateRange);

    const response: ApiResponse = {
      success: true,
      data: result,
    };
    res.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to execute report';
    const statusCode = message === 'Report not found' ? 404 : 500;
    const response: ApiResponse = {
      success: false,
      error: { code: 'EXECUTE_REPORT_FAILED', message },
    };
    res.status(statusCode).json(response);
  }
}

/**
 * GET /api/v1/reports/templates
 * Get pre-built report templates
 */
export async function getReportTemplates(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const templates = await getTemplates();

    const response: ApiResponse = {
      success: true,
      data: { templates },
    };
    res.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch templates';
    const response: ApiResponse = {
      success: false,
      error: { code: 'FETCH_TEMPLATES_FAILED', message },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/reports/columns
 * Get available columns for a report type
 */
export async function getAvailableColumns(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const reportType = req.query.reportType as ReportType | undefined;

    if (!reportType) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'MISSING_REPORT_TYPE', message: 'reportType query parameter is required' },
      };
      res.status(400).json(response);
      return;
    }

    const columns = getColumns(reportType);

    const response: ApiResponse = {
      success: true,
      data: { columns },
    };
    res.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch columns';
    const response: ApiResponse = {
      success: false,
      error: { code: 'FETCH_COLUMNS_FAILED', message },
    };
    res.status(500).json(response);
  }
}

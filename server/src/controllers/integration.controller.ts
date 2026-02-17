import { Response } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { prisma } from '../services/db.service';

/**
 * GET /api/v1/integrations/cctv/cameras
 * Get all security cameras for a branch
 */
export async function getCameras(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const businessOwnerId = req.user?.businessOwnerId;

    if (!businessOwnerId) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Business owner context required' },
      };
      res.status(403).json(response);
      return;
    }

    const branchId = req.query.branchId as string;

    const where: any = { businessOwnerId };
    if (branchId) {
      where.branchId = branchId;
    }

    const cameras = await prisma.securityCamera.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const response: ApiResponse = {
      success: true,
      data: { cameras },
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching cameras:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch cameras' },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/integrations/cctv/footage
 * Get footage link for a specific camera (stub — returns not-configured message)
 */
export async function getFootageLink(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const response: ApiResponse = {
      success: true,
      data: {
        url: null,
        message: 'CCTV integration not configured. Connect your NVR in Business Settings > Integrations.',
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Error getting footage link:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get footage link' },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/integrations/cctv/order-footage/:orderId
 * Get footage for a specific order (stub — returns not-configured message)
 */
export async function getOrderFootage(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const response: ApiResponse = {
      success: true,
      data: {
        url: null,
        message: 'CCTV integration not configured. Connect your NVR in Business Settings > Integrations.',
      },
    };
    res.json(response);
  } catch (error) {
    console.error('Error getting order footage:', error);
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get order footage' },
    };
    res.status(500).json(response);
  }
}

/**
 * GET /api/v1/integrations/voice-ordering/status
 * Get voice ordering integration status (stub)
 */
export async function getVoiceOrderingStatus(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const response: ApiResponse = {
    success: true,
    data: { enabled: false, provider: null, message: 'Voice ordering not configured.' },
  };
  res.json(response);
}

/**
 * POST /api/v1/integrations/voice-ordering/fulfillment
 * Handle voice ordering fulfillment (stub)
 */
export async function handleFulfillment(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const response: ApiResponse = {
    success: true,
    data: { success: true, message: 'Voice ordering not enabled.' },
  };
  res.json(response);
}

/**
 * POST /api/v1/integrations/voice-ordering/link-account
 * Link customer account to voice ordering (stub)
 */
export async function linkCustomerAccount(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const response: ApiResponse = {
    success: true,
    data: { success: true, message: 'Voice ordering not enabled.' },
  };
  res.json(response);
}

/**
 * GET /api/v1/integrations/voice-ordering/recent-orders
 * Get recent voice orders (stub)
 */
export async function getRecentVoiceOrders(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const response: ApiResponse = {
    success: true,
    data: { orders: [], total: 0 },
  };
  res.json(response);
}

/**
 * POST /api/v1/integrations/pos-hardware/print-receipt
 * Print a receipt (stub — no printer configured)
 */
export async function printReceipt(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const response: ApiResponse = {
    success: true,
    data: { success: false, message: 'No receipt printer configured. Set up in Business Settings > Integrations.' },
  };
  res.json(response);
}

/**
 * POST /api/v1/integrations/pos-hardware/open-drawer
 * Open cash drawer (stub — no drawer configured)
 */
export async function openCashDrawer(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const response: ApiResponse = {
    success: true,
    data: { success: false, message: 'No cash drawer configured.' },
  };
  res.json(response);
}

/**
 * GET /api/v1/integrations/pos-hardware/status
 * Get POS hardware connection status (stub)
 */
export async function getHardwareStatus(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const response: ApiResponse = {
    success: true,
    data: { printer: { connected: false }, cashDrawer: { connected: false }, display: { connected: false } },
  };
  res.json(response);
}

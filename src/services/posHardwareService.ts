import { api } from './api';
import { ApiResponse } from '../types/api';

/**
 * POS Hardware Service - Frontend service for Receipt Printer & Cash Drawer
 */

export interface PrintReceiptResponse {
  success: boolean;
  message: string;
  printJobId?: string;
}

export interface CashDrawerResponse {
  success: boolean;
  message: string;
}

export interface HardwareStatusResponse {
  success: boolean;
  configured: boolean;
  printerType?: string;
  cashDrawerEnabled?: boolean;
  lastPrintAt?: string;
}

/**
 * Print a receipt for an order.
 * Sends ESC/POS commands to the configured thermal printer.
 */
export async function printReceipt(orderId: string): Promise<ApiResponse<PrintReceiptResponse>> {
  try {
    const response = await api.post<ApiResponse<PrintReceiptResponse>>(
      '/integrations/pos-hardware/print-receipt',
      { orderId }
    );
    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to print receipt',
    };
  }
}

/**
 * Open the cash drawer via the printer's kick pulse command.
 */
export async function openCashDrawer(): Promise<ApiResponse<CashDrawerResponse>> {
  try {
    const response = await api.post<ApiResponse<CashDrawerResponse>>(
      '/integrations/pos-hardware/open-drawer',
      {}
    );
    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to open cash drawer',
    };
  }
}

/**
 * Get the current POS hardware configuration status.
 */
export async function getHardwareStatus(): Promise<ApiResponse<HardwareStatusResponse>> {
  try {
    const response = await api.get<ApiResponse<HardwareStatusResponse>>(
      '/integrations/pos-hardware/status'
    );
    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get hardware status',
    };
  }
}

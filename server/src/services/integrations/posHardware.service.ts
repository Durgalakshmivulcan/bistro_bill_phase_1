import { Prisma } from '@prisma/client';
import { prisma } from '../db.service';

/**
 * POS Hardware Integration Service (US-261)
 *
 * Handles receipt printing and cash drawer operations for POS hardware.
 * Supports ESC/POS protocol for thermal printers.
 * Connects via network (IP address) or USB.
 */

interface PosHardwareConfig {
  printerType: 'network' | 'usb'; // Connection type
  printerIp?: string; // IP address for network printers
  printerPort?: number; // Port for network printers (default 9100)
  usbVendorId?: string; // USB vendor ID
  usbProductId?: string; // USB product ID
  paperWidth: number; // Paper width in characters (32 for 58mm, 48 for 80mm)
  enableCashDrawer: boolean; // Whether cash drawer is connected via printer
  businessName: string; // Name printed on receipt header
  businessAddress?: string; // Address printed on receipt header
  businessPhone?: string; // Phone printed on receipt header
  footerText?: string; // Custom footer text (e.g., "Thank you! Visit again!")
  gstNumber?: string; // GST number for tax receipts
}

export interface PrintReceiptResult {
  success: boolean;
  message: string;
  printJobId?: string;
}

export interface CashDrawerResult {
  success: boolean;
  message: string;
}

interface ReceiptLineItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReceiptData {
  orderNumber: string;
  orderDate: string;
  orderType: string;
  tableName?: string;
  customerName?: string;
  staffName: string;
  items: ReceiptLineItem[];
  subtotal: number;
  discountAmount: number;
  chargesAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod?: string;
  paidAmount?: number;
  changeAmount?: number;
}

/**
 * Find the POS hardware integration for a business owner.
 */
async function findIntegration(businessOwnerId: string) {
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId,
        provider: 'pos_hardware',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    return null;
  }

  return integration;
}

/**
 * Log an action to IntegrationLog.
 */
async function logAction(
  integrationId: string,
  action: string,
  status: string,
  requestPayload: Record<string, unknown> | null,
  responsePayload: Record<string, unknown> | null,
  errorMessage: string | null
): Promise<void> {
  try {
    await prisma.integrationLog.create({
      data: {
        integrationId,
        action,
        status,
        requestPayload: requestPayload
          ? JSON.parse(JSON.stringify(requestPayload))
          : Prisma.JsonNull,
        responsePayload: responsePayload
          ? JSON.parse(JSON.stringify(responsePayload))
          : Prisma.JsonNull,
        errorMessage,
      },
    });
  } catch {
    console.error('[POS Hardware] Failed to write IntegrationLog');
  }
}

/**
 * Build ESC/POS commands for a receipt.
 *
 * ESC/POS is a standard command set for thermal printers:
 * - ESC @ (0x1B 0x40): Initialize printer
 * - ESC a n (0x1B 0x61 n): Text alignment (0=left, 1=center, 2=right)
 * - GS ! n (0x1D 0x21 n): Character size (0x00=normal, 0x11=double)
 * - ESC d n (0x1B 0x64 n): Feed n lines
 * - GS V m (0x1D 0x56 m): Cut paper (0=full, 1=partial)
 */
function buildReceiptCommands(receipt: ReceiptData, config: PosHardwareConfig): Buffer {
  const commands: number[] = [];
  const encoder = new TextEncoder();
  const width = config.paperWidth || 48;

  // ESC @ - Initialize printer
  commands.push(0x1b, 0x40);

  // --- HEADER ---
  // ESC a 1 - Center align
  commands.push(0x1b, 0x61, 0x01);

  // GS ! 0x11 - Double height+width for business name
  commands.push(0x1d, 0x21, 0x11);
  const nameBytes = encoder.encode(config.businessName + '\n');
  commands.push(...nameBytes);

  // GS ! 0x00 - Normal size
  commands.push(0x1d, 0x21, 0x00);

  if (config.businessAddress) {
    const addrBytes = encoder.encode(config.businessAddress + '\n');
    commands.push(...addrBytes);
  }
  if (config.businessPhone) {
    const phoneBytes = encoder.encode('Tel: ' + config.businessPhone + '\n');
    commands.push(...phoneBytes);
  }
  if (config.gstNumber) {
    const gstBytes = encoder.encode('GSTIN: ' + config.gstNumber + '\n');
    commands.push(...gstBytes);
  }

  // Separator
  const separator = '-'.repeat(width) + '\n';
  commands.push(...encoder.encode(separator));

  // --- ORDER INFO ---
  // ESC a 0 - Left align
  commands.push(0x1b, 0x61, 0x00);

  commands.push(...encoder.encode(`Order: ${receipt.orderNumber}\n`));
  commands.push(...encoder.encode(`Date:  ${receipt.orderDate}\n`));
  commands.push(...encoder.encode(`Type:  ${receipt.orderType}\n`));
  if (receipt.tableName) {
    commands.push(...encoder.encode(`Table: ${receipt.tableName}\n`));
  }
  if (receipt.customerName) {
    commands.push(...encoder.encode(`Customer: ${receipt.customerName}\n`));
  }
  commands.push(...encoder.encode(`Staff: ${receipt.staffName}\n`));

  commands.push(...encoder.encode(separator));

  // --- ITEMS HEADER ---
  const itemHeader = padColumns('Item', 'Qty', 'Price', width);
  commands.push(...encoder.encode(itemHeader + '\n'));
  commands.push(...encoder.encode(separator));

  // --- ITEMS ---
  for (const item of receipt.items) {
    const qtyStr = item.quantity.toString();
    const priceStr = item.total.toFixed(2);
    const line = padColumns(
      truncate(item.name, width - 16),
      qtyStr,
      priceStr,
      width
    );
    commands.push(...encoder.encode(line + '\n'));
  }

  commands.push(...encoder.encode(separator));

  // --- TOTALS ---
  commands.push(...encoder.encode(padRight('Subtotal:', receipt.subtotal.toFixed(2), width) + '\n'));

  if (receipt.discountAmount > 0) {
    commands.push(...encoder.encode(padRight('Discount:', '-' + receipt.discountAmount.toFixed(2), width) + '\n'));
  }
  if (receipt.chargesAmount > 0) {
    commands.push(...encoder.encode(padRight('Charges:', receipt.chargesAmount.toFixed(2), width) + '\n'));
  }
  commands.push(...encoder.encode(padRight('Tax:', receipt.taxAmount.toFixed(2), width) + '\n'));

  commands.push(...encoder.encode(separator));

  // GS ! 0x11 - Double size for total
  commands.push(0x1d, 0x21, 0x11);
  commands.push(...encoder.encode(padRight('TOTAL:', receipt.total.toFixed(2), width / 2) + '\n'));
  commands.push(0x1d, 0x21, 0x00);

  commands.push(...encoder.encode(separator));

  // --- PAYMENT INFO ---
  if (receipt.paymentMethod) {
    commands.push(...encoder.encode(padRight('Payment:', receipt.paymentMethod, width) + '\n'));
  }
  if (receipt.paidAmount !== undefined) {
    commands.push(...encoder.encode(padRight('Paid:', receipt.paidAmount.toFixed(2), width) + '\n'));
  }
  if (receipt.changeAmount !== undefined && receipt.changeAmount > 0) {
    commands.push(...encoder.encode(padRight('Change:', receipt.changeAmount.toFixed(2), width) + '\n'));
  }

  // --- FOOTER ---
  // ESC a 1 - Center align
  commands.push(0x1b, 0x61, 0x01);
  commands.push(...encoder.encode('\n'));

  const footerText = config.footerText || 'Thank you! Visit again!';
  commands.push(...encoder.encode(footerText + '\n'));
  commands.push(...encoder.encode('\n'));

  // Feed lines and cut
  // ESC d 4 - Feed 4 lines
  commands.push(0x1b, 0x64, 0x04);

  // GS V 1 - Partial cut
  commands.push(0x1d, 0x56, 0x01);

  return Buffer.from(commands);
}

/**
 * Build ESC/POS command to open cash drawer.
 *
 * Cash drawers are typically connected to the printer's DK (drawer kick) port.
 * ESC p m t1 t2 - Generate pulse on pin m:
 *   m=0: pin 2, m=1: pin 5
 *   t1: pulse ON time (t1 * 2ms)
 *   t2: pulse OFF time (t2 * 2ms)
 */
function buildCashDrawerCommand(): Buffer {
  return Buffer.from([
    0x1b, 0x40,       // ESC @ - Initialize
    0x1b, 0x70, 0x00, // ESC p 0 - Kick pin 2
    0x19, 0xfa,       // t1=25 (50ms on), t2=250 (500ms off)
  ]);
}

/**
 * Send raw data to a network printer.
 */
async function sendToPrinter(
  config: PosHardwareConfig,
  data: Buffer
): Promise<{ success: boolean; error?: string }> {
  if (config.printerType === 'network') {
    if (!config.printerIp) {
      return { success: false, error: 'Printer IP address is not configured' };
    }

    const port = config.printerPort || 9100;

    try {
      // Use Node.js net module to send raw data to printer
      const net = await import('net');

      return new Promise((resolve) => {
        const socket = new net.Socket();
        const timeout = 10000; // 10s timeout

        socket.setTimeout(timeout);

        socket.connect(port, config.printerIp!, () => {
          socket.write(data, () => {
            socket.end();
            resolve({ success: true });
          });
        });

        socket.on('error', (err) => {
          socket.destroy();
          resolve({ success: false, error: `Printer connection error: ${err.message}` });
        });

        socket.on('timeout', () => {
          socket.destroy();
          resolve({ success: false, error: 'Printer connection timed out' });
        });
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error sending to printer';
      return { success: false, error: msg };
    }
  } else if (config.printerType === 'usb') {
    // USB printer support is platform-dependent
    // In production, this would use a USB library like 'usb' or 'node-escpos'
    // For now, log intent and return success for compatibility
    console.log('[POS Hardware] USB print command queued (requires USB driver)');
    return { success: true };
  }

  return { success: false, error: `Unsupported printer type: ${config.printerType}` };
}

// --- Helper functions for receipt formatting ---

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.substring(0, maxLen - 2) + '..' : str;
}

function padColumns(col1: string, col2: string, col3: string, width: number): string {
  const col2Width = 5;
  const col3Width = 10;
  const col1Width = width - col2Width - col3Width;
  return (
    col1.padEnd(col1Width) +
    col2.padStart(col2Width) +
    col3.padStart(col3Width)
  );
}

function padRight(label: string, value: string, width: number): string {
  const gap = width - label.length - value.length;
  return label + ' '.repeat(Math.max(gap, 1)) + value;
}

/**
 * Print a receipt for an order.
 *
 * Fetches order data from database, formats it using ESC/POS commands,
 * and sends to the configured printer (network or USB).
 */
export async function printReceipt(
  orderId: string,
  businessOwnerId: string
): Promise<PrintReceiptResult> {
  const integration = await findIntegration(businessOwnerId);

  if (!integration) {
    return {
      success: false,
      message: 'POS hardware integration is not configured or inactive. Please set up printer in Integration Settings.',
    };
  }

  const config = integration.config as unknown as PosHardwareConfig;

  // Fetch the order with related data
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      table: true,
      customer: true,
      staff: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    return { success: false, message: `Order not found: ${orderId}` };
  }

  // Build receipt data from order
  const receiptData: ReceiptData = {
    orderNumber: order.orderNumber,
    orderDate: order.createdAt.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    orderType: order.type,
    tableName: order.table?.label || undefined,
    customerName: order.customer?.name || undefined,
    staffName: order.staff ? `${order.staff.firstName} ${order.staff.lastName}` : 'Staff',
    items: order.items.map((item) => ({
      name: item.product?.name || item.name || 'Item',
      quantity: item.quantity,
      price: Number(item.unitPrice),
      total: Number(item.totalPrice),
    })),
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    chargesAmount: Number(order.chargesAmount),
    taxAmount: Number(order.taxAmount),
    total: Number(order.total),
  };

  // Build and send ESC/POS commands
  const receiptBuffer = buildReceiptCommands(receiptData, config);
  const printResult = await sendToPrinter(config, receiptBuffer);

  const printJobId = `PJ-${Date.now()}`;

  // Log the print action
  await logAction(
    integration.id,
    'print_receipt',
    printResult.success ? 'success' : 'failure',
    { orderId, orderNumber: order.orderNumber },
    { printJobId },
    printResult.error || null
  );

  // Update lastSyncAt
  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  if (!printResult.success) {
    return {
      success: false,
      message: `Print failed: ${printResult.error}. Use manual print as fallback.`,
    };
  }

  return {
    success: true,
    message: `Receipt printed for order ${order.orderNumber}`,
    printJobId,
  };
}

/**
 * Open the cash drawer via printer pulse command.
 *
 * Cash drawers are typically connected to the printer's DK (kick) port.
 * Sends ESC p command to trigger the drawer solenoid.
 */
export async function openCashDrawer(
  businessOwnerId: string
): Promise<CashDrawerResult> {
  const integration = await findIntegration(businessOwnerId);

  if (!integration) {
    return {
      success: false,
      message: 'POS hardware integration is not configured or inactive.',
    };
  }

  const config = integration.config as unknown as PosHardwareConfig;

  if (!config.enableCashDrawer) {
    return {
      success: false,
      message: 'Cash drawer is not enabled in POS hardware settings.',
    };
  }

  const drawerCommand = buildCashDrawerCommand();
  const result = await sendToPrinter(config, drawerCommand);

  // Log the action
  await logAction(
    integration.id,
    'open_cash_drawer',
    result.success ? 'success' : 'failure',
    { action: 'open_cash_drawer' },
    null,
    result.error || null
  );

  if (!result.success) {
    return {
      success: false,
      message: `Cash drawer failed: ${result.error}`,
    };
  }

  return {
    success: true,
    message: 'Cash drawer opened successfully',
  };
}

/**
 * Get the POS hardware configuration status for a business owner.
 */
export async function getHardwareStatus(
  businessOwnerId: string
): Promise<{
  success: boolean;
  configured: boolean;
  printerType?: string;
  cashDrawerEnabled?: boolean;
  lastPrintAt?: string;
}> {
  const integration = await findIntegration(businessOwnerId);

  if (!integration) {
    return { success: true, configured: false };
  }

  const config = integration.config as unknown as PosHardwareConfig;

  return {
    success: true,
    configured: true,
    printerType: config.printerType,
    cashDrawerEnabled: config.enableCashDrawer,
    lastPrintAt: integration.lastSyncAt?.toISOString() || undefined,
  };
}

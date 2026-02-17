import { prisma } from '../db.service';

/**
 * Tally XML voucher structure for invoice sync
 */
interface TallyVoucherItem {
  name: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface TallyVoucher {
  voucherType: string;
  date: string;
  partyName: string;
  voucherNumber: string;
  amount: number;
  taxAmount: number;
  items: TallyVoucherItem[];
}

/**
 * Result of a Tally sync operation
 */
export interface TallySyncResult {
  success: boolean;
  message: string;
  voucherNumber?: string;
  tallyResponse?: string;
}

/**
 * Format a Date to Tally's expected date format (YYYYMMDD)
 */
function formatTallyDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Generate Tally XML for a sales voucher (invoice)
 */
function generateTallyXML(voucher: TallyVoucher): string {
  const itemsXML = voucher.items
    .map(
      (item) => `
        <ALLINVENTORYENTRIES.LIST>
          <STOCKITEMNAME>${escapeXml(item.name)}</STOCKITEMNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <RATE>${item.rate}</RATE>
          <ACTUALQTY>${item.quantity}</ACTUALQTY>
          <BILLEDQTY>${item.quantity}</BILLEDQTY>
          <AMOUNT>${item.amount}</AMOUNT>
        </ALLINVENTORYENTRIES.LIST>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${escapeXml(voucher.voucherType)}" ACTION="Create">
            <DATE>${voucher.date}</DATE>
            <VOUCHERTYPENAME>${escapeXml(voucher.voucherType)}</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(voucher.voucherNumber)}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${escapeXml(voucher.partyName)}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
            <ISINVOICE>Yes</ISINVOICE>
            <EFFECTIVEDATE>${voucher.date}</EFFECTIVEDATE>
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(voucher.partyName)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${voucher.amount + voucher.taxAmount}</AMOUNT>
            </LEDGERENTRIES.LIST>
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>Sales Account</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${voucher.amount}</AMOUNT>
            </LEDGERENTRIES.LIST>
            <LEDGERENTRIES.LIST>
              <LEDGERNAME>GST Output</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${voucher.taxAmount}</AMOUNT>
            </LEDGERENTRIES.LIST>${itemsXML}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

  return xml;
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Send XML to Tally ERP via HTTP POST
 */
async function sendToTally(xml: string, serverUrl: string): Promise<{ success: boolean; response: string }> {
  try {
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xml,
    });

    const responseText = await response.text();

    // Tally returns XML response - check for CREATED or error indicators
    const isSuccess =
      response.ok &&
      (responseText.includes('CREATED') || responseText.includes('1'));

    return { success: isSuccess, response: responseText };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error connecting to Tally';
    return { success: false, response: message };
  }
}

/**
 * Sync an order as an invoice to Tally ERP
 *
 * Fetches the order with items and customer, generates Tally XML,
 * sends it to the Tally server, updates Integration.lastSyncAt,
 * and logs the attempt in IntegrationLog.
 *
 * @param orderId - The order ID to sync
 * @returns TallySyncResult with success/failure info
 */
export async function syncInvoice(orderId: string): Promise<TallySyncResult> {
  // Fetch the order with items, customer, and business owner
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      customer: true,
      branch: {
        include: {
          businessOwner: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  // Find the Tally integration for this business owner
  const integration = await prisma.integration.findUnique({
    where: {
      businessOwnerId_provider: {
        businessOwnerId: order.businessOwnerId,
        provider: 'tally',
      },
    },
  });

  if (!integration || integration.status !== 'active') {
    throw new Error('Tally integration is not configured or inactive');
  }

  // Extract Tally server URL from config
  const config = integration.config as { serverUrl?: string; port?: number };
  const serverUrl = config.serverUrl || `http://localhost:${config.port || 9000}`;

  // Build voucher data from order
  const partyName = order.customer
    ? order.customer.name
    : 'Walk-in Customer';

  const voucher: TallyVoucher = {
    voucherType: 'Sales',
    date: formatTallyDate(order.createdAt),
    partyName,
    voucherNumber: order.orderNumber,
    amount: parseFloat(order.subtotal.toString()),
    taxAmount: parseFloat(order.taxAmount.toString()),
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      rate: parseFloat(item.unitPrice.toString()),
      amount: parseFloat(item.totalPrice.toString()),
    })),
  };

  // Generate XML
  const xml = generateTallyXML(voucher);

  // Send to Tally
  const tallyResult = await sendToTally(xml, serverUrl);

  // Update Integration lastSyncAt
  await prisma.integration.update({
    where: { id: integration.id },
    data: { lastSyncAt: new Date() },
  });

  // Log sync attempt in IntegrationLog
  await prisma.integrationLog.create({
    data: {
      integrationId: integration.id,
      action: 'sync_invoice',
      status: tallyResult.success ? 'success' : 'failure',
      requestPayload: { orderId, orderNumber: order.orderNumber, xml },
      responsePayload: { response: tallyResult.response },
      errorMessage: tallyResult.success ? null : tallyResult.response,
    },
  });

  return {
    success: tallyResult.success,
    message: tallyResult.success
      ? `Invoice ${order.orderNumber} synced to Tally successfully`
      : `Failed to sync invoice to Tally: ${tallyResult.response}`,
    voucherNumber: order.orderNumber,
    tallyResponse: tallyResult.response,
  };
}

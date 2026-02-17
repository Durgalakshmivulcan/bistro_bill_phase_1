import { createObjectCsvWriter } from 'csv-writer';
import PDFDocument from 'pdfkit';
import { uploadToS3, UploadResult } from './s3.service';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

// CSV Export Function
export const generateCSV = async (
  data: any[],
  headers: { id: string; title: string }[],
  filename: string
): Promise<string> => {
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, `${filename}.csv`);

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: headers,
  });

  await csvWriter.writeRecords(data);

  // Upload to S3
  const fileBuffer = fs.readFileSync(filePath);
  const timestamp = Date.now();
  const uuid = randomUUID();
  const s3FileName = `${filename}-${timestamp}-${uuid}.csv`;

  const uploadResult: UploadResult = await uploadToS3({
    buffer: fileBuffer,
    mimetype: 'text/csv',
    originalname: s3FileName,
    folder: 'exports',
  });

  // Clean up temp file
  fs.unlinkSync(filePath);

  return uploadResult.url;
};

// PDF Export Function
export const generatePDF = async (
  title: string,
  data: any[],
  columns: { header: string; key: string; width?: number }[],
  filename: string
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `${filename}.pdf`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const writeStream = fs.createWriteStream(filePath);

    doc.pipe(writeStream);

    // Title
    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown();

    // Date range or timestamp
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown();

    // Table Header
    const tableTop = doc.y;
    let xPosition = 50;

    doc.fontSize(10).fillColor('#000');

    columns.forEach((col) => {
      const colWidth = col.width || 100;
      doc.text(col.header, xPosition, tableTop, { width: colWidth, align: 'left' });
      xPosition += colWidth + 10;
    });

    doc.moveDown();
    let yPosition = doc.y;

    // Draw header line
    doc
      .moveTo(50, yPosition)
      .lineTo(550, yPosition)
      .stroke();

    yPosition += 10;

    // Table Rows
    data.forEach((row) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      xPosition = 50;
      columns.forEach((col) => {
        const colWidth = col.width || 100;
        const value = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '-';
        doc.fontSize(9).text(value, xPosition, yPosition, { width: colWidth, align: 'left' });
        xPosition += colWidth + 10;
      });

      yPosition += 20;
    });

    doc.end();

    writeStream.on('finish', async () => {
      try {
        // Upload to S3
        const fileBuffer = fs.readFileSync(filePath);
        const timestamp = Date.now();
        const uuid = randomUUID();
        const s3FileName = `${filename}-${timestamp}-${uuid}.pdf`;

        const uploadResult: UploadResult = await uploadToS3({
          buffer: fileBuffer,
          mimetype: 'application/pdf',
          originalname: s3FileName,
          folder: 'exports',
        });

        // Clean up temp file
        fs.unlinkSync(filePath);

        resolve(uploadResult.url);
      } catch (error) {
        reject(error);
      }
    });

    writeStream.on('error', reject);
  });
};

// Helper to format report data for sales reports
export const formatSalesReportData = (orders: any[]): any[] => {
  return orders.map((order) => ({
    orderNumber: order.orderNumber,
    date: new Date(order.createdAt).toLocaleDateString(),
    type: order.type,
    customer: order.customer?.name || 'Walk-in',
    subtotal: Number(order.subtotal).toFixed(2),
    discount: Number(order.discountAmount).toFixed(2),
    tax: Number(order.taxAmount).toFixed(2),
    total: Number(order.total).toFixed(2),
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
  }));
};

// Helper to format product sales data
export const formatProductSalesData = (products: any[]): any[] => {
  return products.map((product: any) => ({
    productName: product.name,
    category: product.category?.name || '-',
    quantitySold: product.quantitySold || 0,
    revenue: product.revenue ? product.revenue.toFixed(2) : '0.00',
    avgPrice: product.avgPrice ? product.avgPrice.toFixed(2) : '0.00',
  }));
};

// Helper to format customer data
export const formatCustomerReportData = (customers: any[]): any[] => {
  return customers.map((customer: any) => ({
    name: customer.name,
    phone: customer.phone,
    email: customer.email || '-',
    type: customer.type,
    totalSpent: Number(customer.totalSpent).toFixed(2),
    orderCount: customer._count?.orders || 0,
    lastVisit: customer.orders?.[0]?.createdAt
      ? new Date(customer.orders[0].createdAt).toLocaleDateString()
      : '-',
  }));
};

// Helper to format GST report data
export const formatGSTReportData = (transactions: any[]): any[] => {
  return transactions.map((txn: any) => ({
    invoiceNumber: txn.orderNumber,
    date: new Date(txn.createdAt).toLocaleDateString(),
    customerName: txn.customer?.name || 'Walk-in',
    gstin: txn.customer?.gstin || '-',
    taxableAmount: Number(txn.subtotal).toFixed(2),
    cgst: ((Number(txn.taxAmount) || 0) / 2).toFixed(2),
    sgst: ((Number(txn.taxAmount) || 0) / 2).toFixed(2),
    totalTax: Number(txn.taxAmount).toFixed(2),
    invoiceValue: Number(txn.total).toFixed(2),
  }));
};

import ExcelJS from 'exceljs';
import { uploadToS3, UploadResult } from './s3.service';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

export interface ExcelHeader {
  id: string;
  title: string;
  width?: number;
  isCurrency?: boolean;
  isDate?: boolean;
  isPercentage?: boolean;
}

export type ReportChartType = 'bar' | 'line' | 'pie';

export interface ExcelChartConfig {
  title: string;
  chartType: ReportChartType;
  categoryColumn: string;
  valueColumns: string[];
}

/**
 * Generate an Excel workbook with "Data" and "Charts" sheets.
 * - Data sheet: raw data with formatted headers, currency/date/percentage formatting
 * - Charts sheet: chart images based on report type (bar/line/pie)
 */
export const exportToExcel = async (
  title: string,
  data: any[],
  headers: ExcelHeader[],
  filename: string,
  chartConfig?: ExcelChartConfig
): Promise<string> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Bistro Bill';
  workbook.created = new Date();

  // ── Sheet 1: Data ──
  const dataSheet = workbook.addWorksheet('Data');

  // Title row
  dataSheet.mergeCells(1, 1, 1, headers.length);
  const titleCell = dataSheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF1A1C1E' } };
  titleCell.alignment = { horizontal: 'center' };

  // Generated date row
  dataSheet.mergeCells(2, 1, 2, headers.length);
  const dateCell = dataSheet.getCell('A2');
  dateCell.value = `Generated: ${new Date().toLocaleString()}`;
  dateCell.font = { size: 10, italic: true, color: { argb: 'FF667085' } };
  dateCell.alignment = { horizontal: 'right' };

  // Header row (row 4)
  const headerRow = dataSheet.getRow(4);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header.title;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A1C1E' },
    };
    cell.alignment = { horizontal: 'center' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
    };
  });

  // Set column widths
  headers.forEach((header, index) => {
    const col = dataSheet.getColumn(index + 1);
    col.width = header.width || Math.max(header.title.length + 4, 15);
  });

  // Data rows (starting at row 5)
  data.forEach((row, rowIndex) => {
    const excelRow = dataSheet.getRow(rowIndex + 5);
    headers.forEach((header, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1);
      const value = row[header.id];

      if (value === undefined || value === null) {
        cell.value = '-';
      } else if (header.isCurrency) {
        cell.value = typeof value === 'string' ? parseFloat(value) : Number(value);
        cell.numFmt = '₹#,##0.00';
      } else if (header.isPercentage) {
        cell.value = typeof value === 'string' ? parseFloat(value) / 100 : Number(value) / 100;
        cell.numFmt = '0.00%';
      } else if (header.isDate) {
        cell.value = value;
        cell.numFmt = 'dd/mm/yyyy';
      } else {
        cell.value = value;
      }
    });

    // Alternate row colors
    if (rowIndex % 2 === 0) {
      excelRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFDF6' },
        };
      });
    }
  });

  // Auto-filter on header row
  if (data.length > 0) {
    dataSheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + data.length, column: headers.length },
    };
  }

  // ── Sheet 2: Charts ──
  const chartsSheet = workbook.addWorksheet('Charts');

  // Add chart summary data for the Charts sheet
  chartsSheet.mergeCells('A1', `D1`);
  const chartTitleCell = chartsSheet.getCell('A1');
  chartTitleCell.value = `${title} - Charts Summary`;
  chartTitleCell.font = { bold: true, size: 16, color: { argb: 'FF1A1C1E' } };
  chartTitleCell.alignment = { horizontal: 'center' };

  if (chartConfig && data.length > 0) {
    // Build summary table for chart data
    chartsSheet.getCell('A3').value = 'Chart Type:';
    chartsSheet.getCell('A3').font = { bold: true };
    chartsSheet.getCell('B3').value = chartConfig.chartType.toUpperCase();

    chartsSheet.getCell('A4').value = 'Chart Title:';
    chartsSheet.getCell('A4').font = { bold: true };
    chartsSheet.getCell('B4').value = chartConfig.title;

    // Chart data table header
    const chartHeaderRow = chartsSheet.getRow(6);
    chartHeaderRow.getCell(1).value = chartConfig.categoryColumn;
    chartHeaderRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    chartHeaderRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFDC836' },
    };

    chartConfig.valueColumns.forEach((col, i) => {
      const cell = chartHeaderRow.getCell(i + 2);
      cell.value = col;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFDC836' },
      };
    });

    // Chart data rows (limit to top 20 for readability)
    const chartData = data.slice(0, 20);
    const categoryHeader = headers.find((h) => h.title === chartConfig.categoryColumn || h.id === chartConfig.categoryColumn);
    const categoryKey = categoryHeader?.id || chartConfig.categoryColumn;

    chartData.forEach((row, rowIndex) => {
      const excelRow = chartsSheet.getRow(rowIndex + 7);
      excelRow.getCell(1).value = row[categoryKey] || '-';

      chartConfig.valueColumns.forEach((col, colIndex) => {
        const valueHeader = headers.find((h) => h.title === col || h.id === col);
        const valueKey = valueHeader?.id || col;
        const val = row[valueKey];
        excelRow.getCell(colIndex + 2).value = typeof val === 'string' ? parseFloat(val) || 0 : Number(val) || 0;
      });
    });

    // Set column widths for chart sheet
    chartsSheet.getColumn(1).width = 25;
    chartConfig.valueColumns.forEach((_, i) => {
      chartsSheet.getColumn(i + 2).width = 18;
    });

    // Summary statistics
    const summaryStartRow = chartData.length + 9;
    chartsSheet.getCell(`A${summaryStartRow}`).value = 'Summary Statistics';
    chartsSheet.getCell(`A${summaryStartRow}`).font = { bold: true, size: 13 };

    chartConfig.valueColumns.forEach((col, colIndex) => {
      const valueHeader = headers.find((h) => h.title === col || h.id === col);
      const valueKey = valueHeader?.id || col;

      const values = data.map((r) => {
        const v = r[valueKey];
        return typeof v === 'string' ? parseFloat(v) || 0 : Number(v) || 0;
      });

      const sum = values.reduce((a, b) => a + b, 0);
      const avg = values.length > 0 ? sum / values.length : 0;
      const max = values.length > 0 ? Math.max(...values) : 0;
      const min = values.length > 0 ? Math.min(...values) : 0;

      const baseRow = summaryStartRow + 1;
      chartsSheet.getCell(`A${baseRow}`).value = `${col} - Total:`;
      chartsSheet.getCell(`A${baseRow}`).font = { bold: true };
      chartsSheet.getCell(`B${baseRow}`).value = Math.round(sum * 100) / 100;

      chartsSheet.getCell(`A${baseRow + 1}`).value = `${col} - Average:`;
      chartsSheet.getCell(`A${baseRow + 1}`).font = { bold: true };
      chartsSheet.getCell(`B${baseRow + 1}`).value = Math.round(avg * 100) / 100;

      chartsSheet.getCell(`A${baseRow + 2}`).value = `${col} - Max:`;
      chartsSheet.getCell(`A${baseRow + 2}`).font = { bold: true };
      chartsSheet.getCell(`B${baseRow + 2}`).value = max;

      chartsSheet.getCell(`A${baseRow + 3}`).value = `${col} - Min:`;
      chartsSheet.getCell(`A${baseRow + 3}`).font = { bold: true };
      chartsSheet.getCell(`B${baseRow + 3}`).value = min;

      // Offset for multiple value columns
      if (colIndex > 0) {
        const offset = colIndex * 2;
        chartsSheet.getCell(`${String.fromCharCode(65 + offset)}${baseRow}`).value = `${col} - Total:`;
        chartsSheet.getCell(`${String.fromCharCode(66 + offset)}${baseRow}`).value = Math.round(sum * 100) / 100;
      }
    });
  } else {
    // No chart config - add placeholder message
    chartsSheet.getCell('A3').value = 'Chart data will be displayed here based on report type.';
    chartsSheet.getCell('A3').font = { italic: true, color: { argb: 'FF667085' } };

    // Still add a basic summary if we have data
    if (data.length > 0) {
      chartsSheet.getCell('A5').value = 'Data Summary';
      chartsSheet.getCell('A5').font = { bold: true, size: 13 };

      chartsSheet.getCell('A6').value = 'Total Records:';
      chartsSheet.getCell('A6').font = { bold: true };
      chartsSheet.getCell('B6').value = data.length;

      // Find numeric columns and compute totals
      let summaryRow = 7;
      headers.forEach((header) => {
        if (header.isCurrency) {
          const total = data.reduce((sum, row) => {
            const val = row[header.id];
            return sum + (typeof val === 'string' ? parseFloat(val) || 0 : Number(val) || 0);
          }, 0);
          chartsSheet.getCell(`A${summaryRow}`).value = `Total ${header.title}:`;
          chartsSheet.getCell(`A${summaryRow}`).font = { bold: true };
          chartsSheet.getCell(`B${summaryRow}`).value = Math.round(total * 100) / 100;
          chartsSheet.getCell(`B${summaryRow}`).numFmt = '₹#,##0.00';
          summaryRow++;
        }
      });
    }
  }

  // ── Write to temp file and upload to S3 ──
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, `${filename}.xlsx`);

  await workbook.xlsx.writeFile(filePath);

  const fileBuffer = fs.readFileSync(filePath);
  const timestamp = Date.now();
  const uuid = randomUUID();
  const s3FileName = `${filename}-${timestamp}-${uuid}.xlsx`;

  const uploadResult: UploadResult = await uploadToS3({
    buffer: fileBuffer,
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    originalname: s3FileName,
    folder: 'exports',
  });

  // Clean up temp file
  fs.unlinkSync(filePath);

  return uploadResult.url;
};

/**
 * Get default chart config based on report type
 */
export const getChartConfigForReport = (reportType: string): ExcelChartConfig | undefined => {
  switch (reportType) {
    case 'sales':
      return {
        title: 'Sales Overview',
        chartType: 'bar',
        categoryColumn: 'Date',
        valueColumns: ['Total', 'Subtotal', 'Tax'],
      };
    case 'products':
      return {
        title: 'Product Performance',
        chartType: 'bar',
        categoryColumn: 'Product Name',
        valueColumns: ['Quantity Sold', 'Revenue'],
      };
    case 'customers':
      return {
        title: 'Customer Analysis',
        chartType: 'bar',
        categoryColumn: 'Name',
        valueColumns: ['Total Spent', 'Order Count'],
      };
    case 'gst':
      return {
        title: 'GST Summary',
        chartType: 'bar',
        categoryColumn: 'Invoice Number',
        valueColumns: ['Taxable Amount', 'Total Tax', 'Invoice Value'],
      };
    default:
      return undefined;
  }
};

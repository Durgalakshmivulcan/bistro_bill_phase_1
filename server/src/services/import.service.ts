import csv from 'csv-parser';
import { Readable } from 'stream';

export interface CSVRow {
  [key: string]: string;
}

/**
 * Parse CSV buffer to array of objects
 * @param buffer - CSV file buffer
 * @returns Promise<CSVRow[]> - Array of parsed CSV rows
 */
export const parseCSV = (buffer: Buffer): Promise<CSVRow[]> => {
  return new Promise((resolve, reject) => {
    const results: CSVRow[] = [];
    const stream = Readable.from(buffer);

    stream
      .pipe(csv())
      .on('data', (data: CSVRow) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error: Error) => reject(error));
  });
};

/**
 * Validate CSV headers against expected columns
 * @param headers - Headers from CSV file
 * @param requiredHeaders - Required column names
 * @returns Object with isValid boolean and missing headers array
 */
export const validateCSVHeaders = (
  headers: string[],
  requiredHeaders: string[]
): { isValid: boolean; missing: string[] } => {
  const missing = requiredHeaders.filter(
    (required) => !headers.includes(required)
  );
  return {
    isValid: missing.length === 0,
    missing,
  };
};

/**
 * Sanitize CSV value - trim whitespace and handle empty values
 * @param value - Raw CSV value
 * @returns Sanitized value or undefined for empty strings
 */
export const sanitizeCSVValue = (value: string | undefined): string | undefined => {
  if (!value || value.trim() === '') {
    return undefined;
  }
  return value.trim();
};

/**
 * Parse boolean value from CSV (handles Yes/No, True/False, 1/0)
 * @param value - CSV value
 * @returns boolean
 */
export const parseCSVBoolean = (value: string | undefined): boolean => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'yes' || normalized === 'true' || normalized === '1';
};

/**
 * Parse number value from CSV with fallback
 * @param value - CSV value
 * @param fallback - Default value if parsing fails
 * @returns number
 */
export const parseCSVNumber = (value: string | undefined, fallback: number = 0): number => {
  if (!value) return fallback;
  const parsed = parseFloat(value.trim());
  return isNaN(parsed) ? fallback : parsed;
};

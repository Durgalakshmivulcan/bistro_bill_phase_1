/**
 * Barcode utility functions for EAN-13 generation, validation, and rendering.
 */

/**
 * Generates a random 12-digit number and appends the EAN-13 check digit.
 * Uses a "200" prefix (in-store / internal use range per GS1).
 */
export function generateEAN13(): string {
  // 200-299 prefix = internal / in-store use
  const prefix = '200';
  const random = Array.from({ length: 9 }, () =>
    Math.floor(Math.random() * 10)
  ).join('');
  const raw = prefix + random; // 12 digits
  const checkDigit = calculateEAN13CheckDigit(raw);
  return raw + checkDigit;
}

/**
 * Calculates the EAN-13 check digit for a 12-digit string.
 */
function calculateEAN13CheckDigit(digits12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits12[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const remainder = sum % 10;
  return remainder === 0 ? '0' : String(10 - remainder);
}

/**
 * Validates that a string is a valid EAN-13 barcode (13 digits, correct check digit).
 */
export function isValidEAN13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) return false;
  const expected = calculateEAN13CheckDigit(barcode.substring(0, 12));
  return barcode[12] === expected;
}

/**
 * Validates barcode format – accepts EAN-13 (13 digits) or any alphanumeric string
 * between 4 and 48 characters for manual entry (e.g. CODE128).
 */
export function isValidBarcode(barcode: string): boolean {
  if (!barcode || barcode.trim().length === 0) return false;
  // EAN-13 exact match
  if (/^\d{13}$/.test(barcode)) return isValidEAN13(barcode);
  // General alphanumeric barcode (CODE128 compatible)
  return /^[A-Za-z0-9\-_.]{4,48}$/.test(barcode);
}

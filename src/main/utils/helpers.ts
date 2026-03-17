/**
 * SA ERP - Utility Functions
 */

import { BrowserWindow } from 'electron';
import crypto from 'crypto';

/**
 * Generate UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Generate document number with prefix and fiscal year
 */
export function generateDocNumber(
  prefix: string, 
  sequence: number, 
  fiscalYear?: string,
  width: number = 6
): string {
  const paddedNum = sequence.toString().padStart(width, '0');
  const fy = fiscalYear ? `/${fiscalYear}/` : '/';
  return `${prefix}${fy}${paddedNum}`;
}

/**
 * Get current fiscal year (Indian: April - March)
 */
export function getCurrentFiscalYear(date: Date = new Date()): string {
  const month = date.getMonth();
  const year = date.getFullYear();
  
  if (month >= 3) { // April onwards
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
}

/**
 * Get fiscal year start date
 */
export function getFiscalYearStart(fiscalYear: string): Date {
  const startYear = parseInt(fiscalYear.split('-')[0]);
  return new Date(startYear, 3, 1); // April 1
}

/**
 * Get fiscal year end date
 */
export function getFiscalYearEnd(fiscalYear: string): Date {
  const startYear = parseInt(fiscalYear.split('-')[0]);
  return new Date(startYear + 1, 2, 31); // March 31
}

/**
 * Format date for display (Indian format: DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date for database (ISO format)
 */
export function formatDateForDb(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Format currency (Indian numbering system)
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'INR',
  decimals: number = 2
): string {
  if (currency === 'INR') {
    // Indian numbering: 1,00,000 instead of 100,000
    const parts = amount.toFixed(decimals).split('.');
    let intPart = parts[0];
    const decPart = parts[1];
    
    let lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    
    const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
    return `₹ ${formatted}${decPart ? '.' + decPart : ''}`;
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
}

/**
 * Parse Indian formatted currency string to number
 */
export function parseCurrency(value: string): number {
  // Remove currency symbol and commas
  const cleaned = value.replace(/[₹,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Round to specified decimal places
 */
export function round(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate GST amounts
 */
export function calculateGST(
  amount: number,
  gstRate: number,
  isInterState: boolean
): {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  grandTotal: number;
} {
  const totalGst = round(amount * gstRate / 100);
  
  if (isInterState) {
    return {
      taxableAmount: amount,
      cgst: 0,
      sgst: 0,
      igst: totalGst,
      totalGst,
      grandTotal: round(amount + totalGst)
    };
  }
  
  const halfGst = round(totalGst / 2);
  return {
    taxableAmount: amount,
    cgst: halfGst,
    sgst: halfGst,
    igst: 0,
    totalGst,
    grandTotal: round(amount + totalGst)
  };
}

/**
 * Calculate TDS amount
 */
export function calculateTDS(
  amount: number,
  tdsRate: number,
  threshold?: number
): {
  grossAmount: number;
  tdsAmount: number;
  netAmount: number;
} {
  if (threshold && amount < threshold) {
    return {
      grossAmount: amount,
      tdsAmount: 0,
      netAmount: amount
    };
  }
  
  const tdsAmount = round(amount * tdsRate / 100);
  return {
    grossAmount: amount,
    tdsAmount,
    netAmount: round(amount - tdsAmount)
  };
}

/**
 * Validate GSTIN format
 */
export function validateGSTIN(gstin: string): boolean {
  if (!gstin || gstin.length !== 15) return false;
  
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(gstin);
}

/**
 * Validate PAN format
 */
export function validatePAN(pan: string): boolean {
  if (!pan || pan.length !== 10) return false;
  
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
}

/**
 * Extract state code from GSTIN
 */
export function getStateFromGSTIN(gstin: string): string {
  if (!gstin || gstin.length < 2) return '';
  return gstin.substring(0, 2);
}

/**
 * Check if transaction is inter-state
 */
export function isInterStateTransaction(
  sellerStateCode: string,
  buyerStateCode: string
): boolean {
  return sellerStateCode !== buyerStateCode;
}

/**
 * Convert number to words (Indian format)
 */
export function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';
  if (num < 0) return 'Minus ' + numberToWords(Math.abs(num));

  const parts: string[] = [];
  
  // Crores
  if (num >= 10000000) {
    parts.push(numberToWords(Math.floor(num / 10000000)) + ' Crore');
    num %= 10000000;
  }
  
  // Lakhs
  if (num >= 100000) {
    parts.push(numberToWords(Math.floor(num / 100000)) + ' Lakh');
    num %= 100000;
  }
  
  // Thousands
  if (num >= 1000) {
    parts.push(numberToWords(Math.floor(num / 1000)) + ' Thousand');
    num %= 1000;
  }
  
  // Hundreds
  if (num >= 100) {
    parts.push(ones[Math.floor(num / 100)] + ' Hundred');
    num %= 100;
  }
  
  // Tens and ones
  if (num >= 20) {
    let tensPart = tens[Math.floor(num / 10)];
    if (num % 10 !== 0) {
      tensPart += ' ' + ones[num % 10];
    }
    parts.push(tensPart);
  } else if (num >= 10) {
    parts.push(teens[num - 10]);
  } else if (num > 0) {
    parts.push(ones[num]);
  }
  
  return parts.join(' ');
}

/**
 * Convert amount to words with currency
 */
export function amountToWords(amount: number, currency: string = 'INR'): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  let result = numberToWords(rupees);
  
  if (currency === 'INR') {
    result += ' Rupees';
    if (paise > 0) {
      result += ' and ' + numberToWords(paise) + ' Paise';
    }
    result += ' Only';
  }
  
  return result;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get main window
 */
export function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows();
  return windows.length > 0 ? windows[0] : null;
}

/**
 * Send message to renderer process
 */
export function sendToRenderer(channel: string, ...args: unknown[]): void {
  const mainWindow = getMainWindow();
  if (mainWindow) {
    mainWindow.webContents.send(channel, ...args);
  }
}

/**
 * Indian State codes mapping
 */
export const INDIAN_STATES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
  '97': 'Other Territory'
};

/**
 * TDS Section codes
 */
export const TDS_SECTIONS: Record<string, { description: string; rate: number; threshold: number }> = {
  '194A': { description: 'Interest other than securities', rate: 10, threshold: 40000 },
  '194C': { description: 'Payment to Contractors', rate: 1, threshold: 30000 },
  '194H': { description: 'Commission/Brokerage', rate: 5, threshold: 15000 },
  '194I': { description: 'Rent', rate: 10, threshold: 240000 },
  '194J': { description: 'Professional/Technical fees', rate: 10, threshold: 30000 },
  '194Q': { description: 'Purchase of goods', rate: 0.1, threshold: 5000000 }
};


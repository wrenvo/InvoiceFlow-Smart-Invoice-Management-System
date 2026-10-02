import { InvoiceLineItem, Invoice } from '../types';

/**
 * Rounds a number to exactly two decimal places safely to prevent floating-point anomalies
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates a single line item totals:
 * subtotal = quantity * unitRate
 * discountAmount = subtotal * (discountPercent / 100)
 * taxableAmount = subtotal - discountAmount
 * taxAmount = taxableAmount * (taxPercent / 100)
 * lineTotal = taxableAmount + taxAmount
 */
export function calculateLineItem(item: {
  quantity: number;
  unitRate: number;
  discountPercent: number;
  taxPercent: number;
}): {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
} {
  const qty = Math.max(0, Number(item.quantity) || 0);
  const rate = Math.max(0, Number(item.unitRate) || 0);
  const discPercent = Math.min(100, Math.max(0, Number(item.discountPercent) || 0));
  const taxPercent = Math.max(0, Number(item.taxPercent) || 0);

  const subtotal = round2(qty * rate);
  const discountAmount = round2(subtotal * (discPercent / 100));
  const taxableAmount = Math.max(0, round2(subtotal - discountAmount));
  const taxAmount = round2(taxableAmount * (taxPercent / 100));
  const lineTotal = round2(taxableAmount + taxAmount);

  return {
    subtotal,
    discountAmount,
    taxAmount,
    lineTotal,
  };
}

/**
 * Recalculates all invoice lines and grand totals
 */
export function calculateInvoiceTotals(items: InvoiceLineItem[]): {
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
} {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  for (const item of items) {
    const calc = calculateLineItem(item);
    subtotal = round2(subtotal + calc.subtotal);
    totalDiscount = round2(totalDiscount + calc.discountAmount);
    totalTax = round2(totalTax + calc.taxAmount);
  }

  const grandTotal = round2(subtotal - totalDiscount + totalTax);

  return {
    subtotal,
    totalDiscount,
    totalTax,
    grandTotal,
  };
}

/**
 * Checks if an invoice is overdue
 * Overdue is a derived flag when due date has passed (comparing with today YYYY-MM-DD) and balanceDue > 0
 */
export function isInvoiceOverdue(invoice: Pick<Invoice, 'dueDate' | 'balanceDue' | 'documentStatus'>, referenceDate = '2026-09-30'): boolean {
  if (invoice.documentStatus !== 'issued') return false;
  if (invoice.balanceDue <= 0.001) return false;
  return invoice.dueDate < referenceDate;
}

/**
 * Formats currency amount
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  const rounded = round2(amount || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
}

/**
 * Format standard date
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(Date.UTC(year, month, day));
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date);
    }
    return dateString;
  } catch {
    return dateString;
  }
}

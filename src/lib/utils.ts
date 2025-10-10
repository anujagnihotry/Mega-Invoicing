import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD', forPdf: boolean = false) {
  if (forPdf && currency === 'INR') {
    // jsPDF default fonts don't support the Rupee symbol, so use a fallback for PDFs.
    return `Rs. ${amount.toFixed(2)}`;
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });

  if (currency === 'INR') {
    return formatter.format(amount).replace('₹', '₹ ');
  }

  return formatter.format(amount);
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

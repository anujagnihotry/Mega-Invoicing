import { createContext } from 'react';
import type { Invoice, AppSettings, Product, Purchase, Unit } from '@/lib/types';

export interface AppContextType {
  licenseKey: string | null;
  setLicenseKey: (key: string | null) => void;
  isLoading: boolean;
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'currency' | 'items'> & { items: Omit<Invoice['items'][0], 'id'>[] }) => void;
  updateInvoice: (invoice: Omit<Invoice, 'currency' | 'items'> & { items: Omit<Invoice['items'][0], 'id'>[] }) => void;
  getInvoice: (id: string) => Invoice | undefined;
  deleteInvoice: (id: string) => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  products: Product[];
  addPurchase: (purchase: Purchase) => void;
  addProduct: (product: Omit<Product, 'id' | 'quantity' | 'sales'>) => void;
  purchases: Purchase[];
  units: Unit[];
  addUnit: (unit: Unit) => void;
  getAvailableStock: (productId: string, currentInvoiceId?: string) => number;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

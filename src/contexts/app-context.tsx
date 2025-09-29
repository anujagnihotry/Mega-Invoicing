
import { createContext } from 'react';
import type { Invoice, AppSettings, Product, Purchase, Unit, Tax, Supplier } from '@/lib/types';

export interface AppContextType {
  isLoading: boolean;
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'currency' | 'items' | 'taxAmount'> & { items: Omit<Invoice['items'][0], 'id'>[] }) => void;
  updateInvoice: (invoice: Omit<Invoice, 'currency' | 'items' | 'taxAmount'> & { items: Omit<Invoice['items'][0], 'id'>[] }) => void;
  getInvoice: (id: string) => Invoice | undefined;
  deleteInvoice: (id: string) => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<Omit<AppSettings, 'taxes'>>) => void;
  products: Product[];
  addPurchase: (purchase: Omit<Purchase, 'id' | 'status'>) => void;
  updatePurchase: (purchase: Purchase) => void;
  deletePurchase: (purchaseId: string) => void;
  addProduct: (product: Omit<Product, 'id' | 'sales'>) => void;
  purchases: Purchase[];
  units: Unit[];
  addUnit: (unit: Unit) => void;
  getAvailableStock: (productId: string, currentInvoiceId?: string) => number;
  addTax: (tax: Omit<Tax, 'id'>) => void;
  updateTax: (tax: Tax) => void;
  deleteTax: (taxId: string) => void;
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  getSupplier: (id: string) => Supplier | undefined;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

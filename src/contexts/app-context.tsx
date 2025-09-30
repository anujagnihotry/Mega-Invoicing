
import { createContext } from 'react';
import type { Invoice, AppSettings, Product, PurchaseOrder, Unit, Tax, Supplier, PurchaseEntry, Category } from '@/lib/types';

export interface AppContextType {
  isLoading: boolean;
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'currency' | 'items' | 'taxAmount'> & { items: Omit<Invoice['items'][0], 'id'>[] }) => void;
  updateInvoice: (invoice: Omit<Invoice, 'currency' | 'items' | 'taxAmount'> & { items: Omit<Invoice['items'][0], 'id'>[] }) => void;
  getInvoice: (id: string) => Invoice | undefined;
  deleteInvoice: (id: string) => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (purchaseOrder: Omit<PurchaseOrder, 'id'>) => void;
  updatePurchaseOrder: (purchaseOrder: PurchaseOrder) => void;
  deletePurchaseOrder: (purchaseOrderId: string) => void;
  getPurchaseOrder: (id: string) => PurchaseOrder | undefined;
  addProduct: (product: Omit<Product, 'id' | 'sales'>) => void;
  units: Unit[];
  addUnit: (unit: Unit) => void;
  categories: Category[];
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  getAvailableStock: (productId: string, currentInvoiceId?: string) => number;
  addTax: (tax: Omit<Tax, 'id'>) => void;
  updateTax: (tax: Tax) => void;
  deleteTax: (taxId: string) => void;
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (supplierId: string) => void;
  getSupplier: (id: string) => Supplier | undefined;
  purchaseEntries: PurchaseEntry[];
  addPurchaseEntry: (purchaseEntry: Omit<PurchaseEntry, 'id'>) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

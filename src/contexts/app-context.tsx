import { createContext } from 'react';
import type { Invoice, AppSettings } from '@/lib/types';

export interface AppContextType {
  licenseKey: string | null;
  setLicenseKey: (key: string | null) => void;
  isLoading: boolean;
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoice: Invoice) => void;
  getInvoice: (id: string) => Invoice | undefined;
  deleteInvoice: (id: string) => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

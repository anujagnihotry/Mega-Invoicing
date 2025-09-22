export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  price: number;
  discount?: {
    type: 'fixed' | 'percentage';
    value: number;
  };
  taxPercent?: number;
};

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Cancelled';

export type Invoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  invoiceDate: string;
  dueDate: string;
  items: LineItem[];
  currency: string;
  status: InvoiceStatus;
  totalDiscount?: {
    type: 'fixed' | 'percentage';
    value: number;
  };
};

export type CompanyProfile = {
  name: string;
  address: string;
  phone: string;
  taxNumber: string;
};

export type AppSettings = {
  currency: string;
  companyProfile: CompanyProfile;
  defaultTaxRule: 'per-item' | 'per-bill';
  globalTaxPercent?: number;
};

export type Unit = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unitId: string;
  discount?: {
    type: 'fixed' | 'percentage';
    value: number;
  };
  thresholdValue?: number;
  taxPercent?: number;
};

export type Purchase = {
  id: string;
  invoiceNumber: string;
  date: string;
  vendorName: string;
  vendorContact?: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
};

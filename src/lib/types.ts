
export type LineItem = {
  id: string;
  productId: string; // Link to the product
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
  clientContact?: string; // New field
  invoiceDate: string;
  dueDate: string;
  items: LineItem[];
  currency: string;
  status: InvoiceStatus;
  totalDiscount?: {
    type: 'fixed' | 'percentage';
    value: number;
  };
  taxId?: string | null;
  taxAmount?: number;
};

export type CompanyProfile = {
  name: string;
  address: string;
  phone: string;
  taxNumber?: string;
};

export type Tax = {
    id: string;
    name: string;
    rate: number; // Percentage
};

export type AppSettings = {
  currency: string;
  companyProfile: CompanyProfile;
  defaultTaxRule: 'per-item' | 'per-bill';
  globalTaxPercent?: number;
  taxes: Tax[];
};

export type Unit = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  unitId: string;
  sales: { invoiceId: string, quantity: number }[]; // Track sales for inventory adjustments
  discount?: {
    type: 'fixed' | 'percentage';
    value: number;
  };
  thresholdValue?: number;
  taxPercent?: number;
};

export type PurchaseOrderStatus = 'Pending' | 'Completed' | 'Cancelled' | 'Partially Fulfilled';

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  date: string;
  vendorName: string;
  vendorContact?: string;
  supplierId: string;
  expectedDeliveryDate?: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: PurchaseOrderStatus;
};

export type PurchaseEntryStatus = 'Draft' | 'Completed';

export type PurchaseEntry = {
    id: string;
    purchaseOrderId?: string; // Link to the original PO
    entryDate: string;
    supplierId: string;
    notes?: string;
    items: {
        productId: string;
        quantityReceived: number;
    }[];
    status: PurchaseEntryStatus;
};


export type Supplier = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
};

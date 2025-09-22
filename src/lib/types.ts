export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  price: number;
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
};

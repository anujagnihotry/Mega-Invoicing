
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppContext, AppContextType } from '@/contexts/app-context';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Invoice, AppSettings, Product, PurchaseOrder, Unit, Tax, Supplier, PurchaseEntry, Category } from '@/lib/types';
import { generateId, formatCurrency } from '@/lib/utils';
import { useUser } from '@/firebase';
import { sendEmail } from '@/ai/flows/send-email';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}


const defaultSettings: AppSettings = {
  currency: 'USD',
  companyProfile: {
    name: 'Your Company',
    address: '123 Main St, Anytown, USA',
    phone: '+1 (555) 123-4567',
    taxNumber: 'TAX-123456789',
  },
  defaultTaxRule: 'per-item',
  taxes: [],
  smtp: {
    host: '',
    port: 587,
    user: '',
    pass: ''
  },
  email: {
    sendOnNewInvoice: false,
  }
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('settings', defaultSettings);
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [purchaseOrders, setPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchaseOrders', []);
  const [purchaseEntries, setPurchaseEntries] = useLocalStorage<PurchaseEntry[]>('purchaseEntries', []);
  const [units, setUnits] = useLocalStorage<Unit[]>('units', []);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', []);
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  const { toast } = useToast();
  
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      const isAuthPage = ['/login', '/signup', '/forgot-password'].includes(pathname);
      if (!user && !isAuthPage) {
        router.replace('/login');
      } else if (user && isAuthPage) {
        router.replace('/');
      }
    }
  }, [isUserLoading, user, pathname, router]);
  
  const getInvoice = useCallback((id: string): Invoice | undefined => {
    return invoices.find(invoice => invoice.id === id);
  }, [invoices]);

  const getSupplier = useCallback((id: string): Supplier | undefined => {
    return suppliers.find(supplier => supplier.id === id);
  }, [suppliers]);
  
  const getPurchaseOrder = useCallback((id: string): PurchaseOrder | undefined => {
    return purchaseOrders.find(p => p.id === id);
  }, [purchaseOrders]);

  const getProduct = useCallback((id: string): Product | undefined => {
    return products.find(p => p.id === id);
  }, [products]);

  const getAvailableStock = useCallback((productId: string, currentInvoiceId?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;

    const stockFromPurchaseEntries = purchaseEntries
      .filter(p => p.status === 'Completed') // Only count completed entries
      .flatMap(p => p.items)
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.quantityReceived, 0);

    const sales = product.sales || [];
    const stockSold = sales
      .filter(sale => sale.invoiceId !== currentInvoiceId) // Exclude current invoice from calculation
      .reduce((sum, sale) => sum + sale.quantity, 0);
      
    return stockFromPurchaseEntries - stockSold;
  }, [products, purchaseEntries]);

  const calculateTaxAmount = (subtotal: number, taxId?: string | null): number => {
    if (!taxId) return 0;
    const tax = settings.taxes.find(t => t.id === taxId);
    if (!tax) return 0;
    return (subtotal * tax.rate) / 100;
  }

  const addInvoice = useCallback((invoiceData: Omit<Invoice, 'id' | 'currency' | 'taxAmount'>) => {
    let newInvoice: Invoice | null = null;
    setProducts(prevProducts => {
      const newProducts = [...prevProducts];
      const invoiceId = generateId();
      const subtotal = invoiceData.items.reduce((acc, item) => acc + item.quantity * item.price, 0);

      newInvoice = {
        ...invoiceData,
        id: invoiceId,
        currency: settings.currency,
        items: invoiceData.items.map(item => ({ ...item, id: generateId() })),
        taxAmount: calculateTaxAmount(subtotal, invoiceData.taxId),
      };

      for (const item of newInvoice.items) {
        const productIndex = newProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          if (!newProducts[productIndex].sales) {
            newProducts[productIndex].sales = [];
          }
          newProducts[productIndex].sales.push({ invoiceId: newInvoice.id, quantity: item.quantity });
        }
      }
      setInvoices(prev => [...prev, newInvoice!]);
      return newProducts;
    });

    if (newInvoice && settings.email.sendOnNewInvoice) {
      if (!settings.smtp.host || !settings.smtp.user || !settings.smtp.pass) {
          toast({
              variant: 'destructive',
              title: 'Email Not Sent',
              description: 'SMTP settings are not configured. Please configure them in Settings.',
          });
          return;
      }
      
      const subtotal = newInvoice.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
      const appliedTax = newInvoice.taxId ? settings.taxes.find(t => t.id === newInvoice.taxId) : null;
      const total = subtotal + (newInvoice.taxAmount || 0);

      const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'N/A';

      const emailHtml = `
        <div style="font-family: sans-serif; line-height: 1.6;">
            <h2>Invoice from ${settings.companyProfile.name}</h2>
            <p>Dear ${newInvoice.clientName},</p>
            <p>Please find your invoice #${newInvoice.invoiceNumber} attached.</p>
            <p><b>Due Date:</b> ${new Date(newInvoice.dueDate).toLocaleDateString()}</p>
            <hr />
            <h3>Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Item</th>
                        <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Quantity</th>
                        <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Price</th>
                        <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${newInvoice.items.map(item => `
                        <tr>
                            <td style="padding: 8px;">${getProductName(item.productId)}</td>
                            <td style="text-align: right; padding: 8px;">${item.quantity}</td>
                            <td style="text-align: right; padding: 8px;">${formatCurrency(item.price, newInvoice!.currency)}</td>
                            <td style="text-align: right; padding: 8px;">${formatCurrency(item.quantity * item.price, newInvoice!.currency)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <hr />
            <table style="width: 100%; margin-top: 20px;">
                <tbody>
                    <tr>
                        <td style="text-align: right;">Subtotal:</td>
                        <td style="text-align: right; width: 120px;">${formatCurrency(subtotal, newInvoice.currency)}</td>
                    </tr>
                    ${appliedTax ? `
                    <tr>
                        <td style="text-align: right;">${appliedTax.name} (${appliedTax.rate}%):</td>
                        <td style="text-align: right;">${formatCurrency(newInvoice.taxAmount || 0, newInvoice.currency)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="text-align: right; font-weight: bold;">Total:</td>
                        <td style="text-align: right; font-weight: bold;">${formatCurrency(total, newInvoice.currency)}</td>
                    </tr>
                </tbody>
            </table>
            <p>Thank you for your business!</p>
        </div>
      `;

      // Create PDF
      const doc = new jsPDF();
      doc.text(`Invoice #${newInvoice.invoiceNumber}`, 14, 22);
      doc.text(`Client: ${newInvoice.clientName}`, 14, 30);
      doc.text(`Date: ${new Date(newInvoice.invoiceDate).toLocaleDateString()}`, 14, 38);
      doc.text(`Due: ${new Date(newInvoice.dueDate).toLocaleDateString()}`, 14, 46);

      doc.autoTable({
          startY: 60,
          head: [['Item', 'Quantity', 'Price', 'Total']],
          body: newInvoice.items.map(item => [
              getProductName(item.productId),
              item.quantity,
              formatCurrency(item.price, newInvoice!.currency),
              formatCurrency(item.quantity * item.price, newInvoice!.currency),
          ]),
          foot: [
              ['', '', 'Subtotal', formatCurrency(subtotal, newInvoice.currency)],
              ...(appliedTax ? [['', '', `${appliedTax.name} (${appliedTax.rate}%)`, formatCurrency(newInvoice.taxAmount || 0, newInvoice.currency)]] : []),
              ['', '', 'Total', formatCurrency(total, newInvoice.currency)],
          ],
          footStyles: { fontStyle: 'bold' }
      });
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      
      sendEmail({
          to: newInvoice.clientEmail,
          subject: `Invoice #${newInvoice.invoiceNumber} from ${settings.companyProfile.name}`,
          html: emailHtml,
          smtpConfig: settings.smtp,
          attachments: [
              {
                  filename: `Invoice-${newInvoice.invoiceNumber}.pdf`,
                  content: pdfBase64,
                  encoding: 'base64',
              }
          ]
      }).then(() => {
          toast({
              title: 'Email Sent',
              description: `Invoice sent to ${newInvoice?.clientEmail}.`,
          });
      }).catch(err => {
           toast({
              variant: 'destructive',
              title: 'Email Failed to Send',
              description: 'Please check your SMTP settings. If using Gmail, you may need to use an "App Password".',
          });
          console.error(err);
      })
    }

  }, [setInvoices, setProducts, settings, toast, products]);


  const updateInvoice = useCallback((updatedInvoiceData: Omit<Invoice, 'currency' | 'taxAmount'>) => {
     setProducts(prevProducts => {
        const newProducts = [...prevProducts];
        
        // 1. Revert stock changes from the original invoice
        const originalInvoice = invoices.find(inv => inv.id === updatedInvoiceData.id);
        if (originalInvoice) {
            for (const item of originalInvoice.items) {
                const productIndex = newProducts.findIndex(p => p.id === item.productId);
                if (productIndex !== -1 && newProducts[productIndex].sales) {
                    const saleIndex = newProducts[productIndex].sales.findIndex(s => s.invoiceId === originalInvoice.id);
                    if (saleIndex !== -1) {
                        newProducts[productIndex].sales.splice(saleIndex, 1);
                    }
                }
            }
        }

        // 2. Apply stock changes for the updated invoice
        for (const item of updatedInvoiceData.items) {
            const productIndex = newProducts.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                 if (!newProducts[productIndex].sales) {
                    newProducts[productIndex].sales = [];
                 }
                 newProducts[productIndex].sales.push({ invoiceId: updatedInvoiceData.id, quantity: item.quantity });
            }
        }

        // 3. Update the invoice itself
        const subtotal = updatedInvoiceData.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
        const updatedInvoice: Invoice = {
          ...updatedInvoiceData,
          currency: settings.currency,
          items: updatedInvoiceData.items.map(item => ({...item, id: item.id || generateId()})),
          taxAmount: calculateTaxAmount(subtotal, updatedInvoiceData.taxId),
        };
        
        setInvoices(prevInvoices => prevInvoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));

        return newProducts;
    });
  }, [invoices, setInvoices, setProducts, settings.currency, settings.taxes]);


  const deleteInvoice = useCallback((id: string) => {
    const invoiceToDelete = invoices.find(inv => inv.id === id);
    if (!invoiceToDelete) return;

    setProducts(prevProducts => {
        const newProducts = [...prevProducts];
        for (const item of invoiceToDelete.items) {
            const productIndex = newProducts.findIndex(p => p.id === item.productId);
            if (productIndex !== -1 && newProducts[productIndex].sales) {
                 const saleIndex = newProducts[productIndex].sales.findIndex(s => s.invoiceId === id);
                 if(saleIndex !== -1) {
                    newProducts[productIndex].sales.splice(saleIndex, 1);
                 }
            }
        }
        return newProducts;
    });

    setInvoices(prev => prev.filter(inv => inv.id !== id));
  }, [invoices, setInvoices, setProducts]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);


  const addProduct = useCallback((productData: Omit<Product, 'id' | 'sales'>) => {
    const newProduct: Product = {
      id: generateId(),
      sales: [],
      ...productData,
    };
    setProducts(prev => [...prev, newProduct]);
  }, [setProducts]);

  const updateProduct = useCallback((product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  }, [setProducts]);
  
  const deleteProduct = useCallback((productId: string) => {
    // Also remove this product from any invoices that might be using it
    setInvoices(prev => prev.map(invoice => ({
        ...invoice,
        items: invoice.items.filter(item => item.productId !== productId)
    })));
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, [setProducts, setInvoices]);

  const addPurchaseOrder = useCallback((purchaseOrderData: Omit<PurchaseOrder, 'id'>) => {
    const newPurchaseOrder: PurchaseOrder = {
      id: generateId(),
      ...purchaseOrderData,
    };
    setPurchaseOrders(prev => [...prev, newPurchaseOrder]);
  }, [setPurchaseOrders]);
  
  const updatePurchaseOrder = useCallback((purchaseOrder: PurchaseOrder) => {
    setPurchaseOrders(prev => prev.map(p => p.id === purchaseOrder.id ? purchaseOrder : p));
  }, [setPurchaseOrders]);

  const deletePurchaseOrder = useCallback((purchaseOrderId: string) => {
    setPurchaseOrders(prev => prev.filter(p => p.id !== purchaseOrderId));
  }, [setPurchaseOrders]);

  const addUnit = useCallback((unit: Unit) => {
    setUnits(prev => [...prev, unit]);
  }, [setUnits]);

  const addCategory = useCallback((category: Category) => {
    setCategories(prev => [...prev, category]);
  }, [setCategories]);

  const updateCategory = useCallback((category: Category) => {
    setCategories(prev => prev.map(c => c.id === category.id ? category : c));
  }, [setCategories]);
  
  const deleteCategory = useCallback((categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
  }, [setCategories]);
  
  const addTax = useCallback((tax: Omit<Tax, 'id'>) => {
    const newTax: Tax = { id: generateId(), ...tax };
    setSettings(prev => {
        const updatedTaxes = [...(prev.taxes || []), newTax];
        return { ...prev, taxes: updatedTaxes };
    });
  }, [setSettings]);
  
  const updateTax = useCallback((tax: Tax) => {
    setSettings(prev => {
        const updatedTaxes = (prev.taxes || []).map(t => t.id === tax.id ? tax : t);
        return { ...prev, taxes: updatedTaxes };
    });
  }, [setSettings]);

  const deleteTax = useCallback((taxId: string) => {
    setSettings(prev => {
        const updatedTaxes = (prev.taxes || []).filter(t => t.id !== taxId);
        return { ...prev, taxes: updatedTaxes };
    });
  }, [setSettings]);
  
  const addSupplier = useCallback((supplier: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = { id: generateId(), ...supplier };
    setSuppliers(prev => [...prev, newSupplier]);
  }, [setSuppliers]);

  const updateSupplier = useCallback((supplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === supplier.id ? supplier : s));
  }, [setSuppliers]);

  const deleteSupplier = useCallback((supplierId: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
  }, [setSuppliers]);

  const addPurchaseEntry = useCallback((entry: Omit<PurchaseEntry, 'id'>) => {
    const newEntry: PurchaseEntry = { id: generateId(), ...entry };
    setPurchaseEntries(prev => [...prev, newEntry]);
  }, [setPurchaseEntries]);

  const contextValue: AppContextType = {
    isLoading: isUserLoading,
    invoices,
    addInvoice: addInvoice as any,
    updateInvoice: updateInvoice as any,
    getInvoice,
    deleteInvoice,
    settings,
    updateSettings: updateSettings as any,
    products,
    addProduct: addProduct as any,
    updateProduct: updateProduct as any,
    deleteProduct,
    getProduct,
    purchaseOrders,
    addPurchaseOrder: addPurchaseOrder as any,
    updatePurchaseOrder,
    deletePurchaseOrder,
    getPurchaseOrder,
    units,
    addUnit,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getAvailableStock,
    addTax,
    updateTax,
    deleteTax,
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplier,
    purchaseEntries,
    addPurchaseEntry: addPurchaseEntry as any,
  };
  
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}



'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppContext, AppContextType } from '@/contexts/app-context';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Invoice, AppSettings, Product, PurchaseOrder, Unit, Tax, Supplier, PurchaseEntry, Category, PurchaseOrderStatus } from '@/lib/types';
import { generateId, formatCurrency } from '@/lib/utils';
import { useUser } from '@/firebase';
import { sendEmail } from '@/ai/flows/send-email';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { APP_NAME } from '@/lib/constants';

declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}


const defaultSettings: AppSettings = {
  appName: APP_NAME,
  appLogo: '',
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
      const isAuthPage = ['/login', '/signup', '/forgot-password', '/auth/action'].includes(pathname);
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
      const getUnitName = (productId: string) => {
          const product = products.find(p => p.id === productId);
          if (!product) return '';
          const unit = units.find(u => u.id === product.unitId);
          return unit ? unit.name : '';
      };


      const emailHtml = `
        <div style="font-family: -apple-system, 'system-ui', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; max-width: 600px; margin: 40px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      ${settings.appLogo ? `<img src="${settings.appLogo}" alt="${settings.appName}" style="height: 32px; width: auto;">` : ''}
                      <h1 style="font-size: 24px; font-weight: bold; margin: 10px 0 0 0;">${settings.companyProfile.name}</h1>
                      <p style="color: #666; font-size: 14px; margin: 5px 0;">${settings.companyProfile.address.replace(/\n/g, '<br>')}</p>
                      <p style="color: #666; font-size: 14px; margin: 5px 0;">${settings.companyProfile.phone}</p>
                    </td>
                    <td style="text-align: right; vertical-align: top;">
                      <h2 style="font-size: 36px; font-weight: bold; color: #888; margin: 0;">INVOICE</h2>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 40px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%">
                      <p style="font-size: 14px; font-weight: bold; color: #333; margin: 0 0 5px 0;">Bill To</p>
                      <p style="font-size: 16px; font-weight: bold; margin: 0 0 5px 0;">${newInvoice.clientName}</p>
                      <p style="font-size: 14px; color: #666; margin: 0;">${newInvoice.clientEmail}</p>
                      ${newInvoice.clientContact ? `<p style="font-size: 14px; color: #666; margin: 5px 0 0 0;">${newInvoice.clientContact}</p>` : ''}
                    </td>
                    <td width="50%" style="text-align: right;">
                      <table align="right" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-weight: bold; padding: 2px 10px 2px 0;">Invoice #</td>
                          <td>${newInvoice.invoiceNumber}</td>
                        </tr>
                        <tr>
                          <td style="font-weight: bold; padding: 2px 10px 2px 0;">Invoice Date</td>
                          <td>${new Date(newInvoice.invoiceDate).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                          <td style="font-weight: bold; padding: 2px 10px 2px 0;">Due Date</td>
                          <td>${new Date(newInvoice.dueDate).toLocaleDateString()}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 40px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                  <thead style="background-color: #f9f9f9;">
                    <tr>
                      <th style="padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase;">Item</th>
                      <th style="padding: 10px; text-align: center; font-size: 12px; text-transform: uppercase;">Quantity</th>
                      <th style="padding: 10px; text-align: center; font-size: 12px; text-transform: uppercase;">Unit</th>
                      <th style="padding: 10px; text-align: right; font-size: 12px; text-transform: uppercase;">Price</th>
                      <th style="padding: 10px; text-align: right; font-size: 12px; text-transform: uppercase;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${newInvoice.items.map(item => `
                      <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px; font-weight: bold;">${getProductName(item.productId)}</td>
                        <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                        <td style="padding: 10px; text-align: center;">${getUnitName(item.productId)}</td>
                        <td style="padding: 10px; text-align: right;">${formatCurrency(item.price, newInvoice!.currency)}</td>
                        <td style="padding: 10px; text-align: right;">${formatCurrency(item.quantity * item.price, newInvoice!.currency)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="50%"></td>
                    <td width="50%">
                      <table align="right" width="250px" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 5px 0; color: #666;">Subtotal</td>
                          <td style="padding: 5px 0; text-align: right;">${formatCurrency(subtotal, newInvoice.currency)}</td>
                        </tr>
                        ${appliedTax ? `
                        <tr>
                          <td style="padding: 5px 0; color: #666;">${appliedTax.name} (${appliedTax.rate}%)</td>
                          <td style="padding: 5px 0; text-align: right;">${formatCurrency(newInvoice.taxAmount || 0, newInvoice.currency)}</td>
                        </tr>
                        ` : ''}
                        <tr><td colspan="2" style="border-bottom: 2px solid #333; padding-top: 5px;"></td></tr>
                        <tr>
                          <td style="padding: 10px 0; font-weight: bold; font-size: 18px;">Total</td>
                          <td style="padding: 10px 0; text-align: right; font-weight: bold; font-size: 18px;">${formatCurrency(total, newInvoice.currency)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <p style="font-weight: bold; font-size: 14px; margin: 20px 0 5px 0;">Notes</p>
                <p style="font-size: 12px; color: #666; margin: 0;">Thank you for your business. Please pay within the due date.</p>
              </td>
            </tr>
          </table>
        </div>
      `;

      // Create PDF
      const doc = new jsPDF();
      
      // Header
      if (settings.appLogo) {
        try {
          doc.addImage(settings.appLogo, 'PNG', 14, 15, 20, 20);
        } catch(e) { console.error("Could not add logo to PDF:", e)}
      }
      doc.setFontSize(20);
      doc.text(settings.companyProfile.name, 40, 22);
      doc.setFontSize(10);
      doc.text(settings.companyProfile.address, 40, 28);
      doc.text(settings.companyProfile.phone, 40, 34);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', 196, 22, { align: 'right' });
      
      // Bill To & Invoice Details
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To', 14, 50);
      doc.setFont('helvetica', 'normal');
      doc.text(newInvoice.clientName, 14, 56);
      doc.text(newInvoice.clientEmail, 14, 62);
      if(newInvoice.clientContact) doc.text(newInvoice.clientContact, 14, 68);

      const detailsX = 196;
      doc.text(`Invoice #: ${newInvoice.invoiceNumber}`, detailsX, 50, { align: 'right' });
      doc.text(`Invoice Date: ${new Date(newInvoice.invoiceDate).toLocaleDateString()}`, detailsX, 56, { align: 'right' });
      doc.text(`Due Date: ${new Date(newInvoice.dueDate).toLocaleDateString()}`, detailsX, 62, { align: 'right' });

      // Table
      doc.autoTable({
          startY: 80,
          head: [['Item', 'Quantity', 'Unit', 'Price', 'Amount']],
          body: newInvoice.items.map(item => [
              getProductName(item.productId),
              item.quantity,
              getUnitName(item.productId),
              formatCurrency(item.price, newInvoice!.currency),
              formatCurrency(item.quantity * item.price, newInvoice!.currency),
          ]),
          headStyles: { fillColor: [248, 249, 250], textColor: 50 },
          styles: { halign: 'left' },
          columnStyles: {
              1: { halign: 'center' },
              2: { halign: 'center' },
              3: { halign: 'right' },
              4: { halign: 'right' },
          }
      });
      
      const finalY = (doc as any).lastAutoTable.finalY;

      // Summary
      doc.setFontSize(11);
      doc.text('Subtotal', 140, finalY + 10);
      doc.text(formatCurrency(subtotal, newInvoice.currency), 196, finalY + 10, { align: 'right' });
      
      let summaryY = finalY + 16;
      if (appliedTax) {
          doc.text(`${appliedTax.name} (${appliedTax.rate}%)`, 140, summaryY);
          doc.text(formatCurrency(newInvoice.taxAmount || 0, newInvoice.currency), 196, summaryY, { align: 'right' });
          summaryY += 6;
      }
      doc.setDrawColor(180);
      doc.line(140, summaryY, 196, summaryY);
      summaryY += 8;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Total', 140, summaryY);
      doc.text(formatCurrency(total, newInvoice.currency), 196, summaryY, { align: 'right' });

      // Footer Notes
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes', 14, summaryY + 20);
      doc.setFont('helvetica', 'normal');
      doc.text('Thank you for your business. Please pay within the due date.', 14, summaryY + 25);

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
            const errorMessage = (err as Error).message || '';
            let description = 'Please check your SMTP settings and try again.';
            if (errorMessage.includes('Application-specific password required')) {
                description = 'Your email provider requires an "App Password" for SMTP. Please generate one in your account settings and update it in the app.';
            } else if (errorMessage.includes('Invalid login')) {
                description = 'Invalid SMTP credentials. Please check the username and password in settings.';
            }
            
            toast({
                variant: 'destructive',
                title: 'Email Failed to Send',
                description: description,
            });
            console.error(err);
      })
    }

  }, [setInvoices, setProducts, settings, toast, products, units]);


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
      items: purchaseOrderData.items.map(item => ({...item, quantityReceived: 0 })),
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

    // If the entry is linked to a PO, update the PO's received quantities and status
    if (entry.purchaseOrderId) {
      setPurchaseOrders(prevPOs => {
        return prevPOs.map(po => {
          if (po.id === entry.purchaseOrderId) {
            const updatedItems = po.items.map(poItem => {
              const entryItem = entry.items.find(ei => ei.productId === poItem.productId);
              if (entryItem) {
                return {
                  ...poItem,
                  quantityReceived: poItem.quantityReceived + entryItem.quantityReceived,
                };
              }
              return poItem;
            });

            let newStatus: PurchaseOrderStatus = 'Partially Fulfilled';
            const allItemsFulfilled = updatedItems.every(item => item.quantityReceived >= item.quantity);
            if (allItemsFulfilled) {
              newStatus = 'Completed';
            }
            if (po.status === 'Cancelled' || po.status === 'Completed') {
              newStatus = po.status;
            }

            return { ...po, items: updatedItems, status: newStatus };
          }
          return po;
        });
      });
    }
  }, [setPurchaseEntries, setPurchaseOrders]);

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

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppContext, AppContextType } from '@/contexts/app-context';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Invoice, AppSettings, Product, PurchaseOrder, Unit, Tax, Supplier, PurchaseEntry, Category, PurchaseOrderStatus, InvoiceStatus } from '@/lib/types';
import { generateId, formatCurrency } from '@/lib/utils';
import { useUser } from '@/firebase';
import { sendEmail } from '@/ai/flows/send-email';
import { generateStripePaymentLink } from '@/ai/flows/generate-stripe-payment-link';
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
  },
  stripe: {
    secretKey: '',
    publishableKey: '',
    webhookSecret: '',
    dashboardUrl: 'https://dashboard.stripe.com',
    webhookUrl: '',
  },
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

   // Effect to check for successful Stripe payment on redirect.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stripeSuccess = urlParams.get('stripe_payment') === 'success';
    const invoiceId = urlParams.get('invoice_id');

    if (stripeSuccess && invoiceId) {
        setInvoices(prevInvoices => {
            const alreadyPaid = prevInvoices.find(inv => inv.id === invoiceId)?.status === 'Paid';
            if (alreadyPaid) {
                // Clean up URL and do nothing if already paid
                const newUrl = pathname; // URL without query params
                if (window.history.replaceState) {
                  window.history.replaceState({ path: newUrl }, '', newUrl);
                }
                return prevInvoices;
            }

            const newInvoices = prevInvoices.map(inv => {
                if (inv.id === invoiceId) {
                    toast({
                        title: 'Payment Confirmed!',
                        description: `Invoice ${inv.invoiceNumber} has been marked as Paid.`,
                    });
                    return { ...inv, status: 'Paid' as InvoiceStatus };
                }
                return inv;
            });
            return newInvoices;
        });
        
        // Clean up URL after processing
        const newUrl = pathname; // URL without query params
        if (window.history.replaceState) {
            window.history.replaceState({ path: newUrl }, '', newUrl);
        }
    }
  }, [setInvoices, toast, pathname]);
  
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
  
  const addInvoice = useCallback(async (invoiceData: Omit<Invoice, 'id' | 'currency' | 'taxAmount'>) => {
    const newInvoiceId = generateId();
    let newInvoice: Invoice | null = null;
    const subtotal = invoiceData.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const taxAmount = calculateTaxAmount(subtotal, invoiceData.taxId);
    const total = subtotal + taxAmount;

    let paymentLink: string | undefined = undefined;

    if (settings.stripe?.secretKey) {
        try {
            const result = await generateStripePaymentLink({
                invoice_id: newInvoiceId, // Pass the new invoice ID to Stripe
                amount: total,
                currency: settings.currency,
                description: `Payment for Invoice #${invoiceData.invoiceNumber}`,
                stripeSecretKey: settings.stripe.secretKey,
            });
            paymentLink = result.payment_link_url;
        } catch (error) {
            console.error("Failed to generate Stripe payment link:", error);
            toast({
                variant: 'destructive',
                title: 'Stripe Error',
                description: 'Could not generate payment link. Please check your Stripe settings.',
            });
        }
    }


    setProducts(prevProducts => {
      const newProducts = [...prevProducts];
      
      newInvoice = {
        ...invoiceData,
        id: newInvoiceId,
        currency: settings.currency,
        items: invoiceData.items.map(item => ({ ...item, id: generateId() })),
        taxAmount: taxAmount,
        paymentLink: paymentLink,
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
      
      const emailHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="font-size: 22px; color: #000; text-align: center;">Invoice from ${settings.companyProfile.name}</h2>
                <p>Hi ${newInvoice.clientName},</p>
                <p>Please find your invoice #${newInvoice.invoiceNumber} for <strong>${formatCurrency(total, newInvoice.currency)}</strong> attached to this email.</p>
                ${newInvoice.paymentLink ? `
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${newInvoice.paymentLink}" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">Pay Now</a>
                </div>
                ` : ''}
                <p>If you have any questions, please don't hesitate to contact us.</p>
                <p>Thank you for your business!</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #777;">${settings.companyProfile.name} | ${settings.companyProfile.address} | ${settings.companyProfile.phone}</p>
            </div>
      `;

      const doc = new jsPDF();
      if (settings.appLogo) {
        try {
            doc.addImage(settings.appLogo, 'PNG', 14, 15, 20, 20);
        } catch(e) { console.error("Could not add logo to PDF:", e)}
      }
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.companyProfile.name, 40, 22);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(settings.companyProfile.address, 40, 28);
      doc.text(settings.companyProfile.phone, 40, 34);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', 196, 22, { align: 'right' });
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Bill To', 14, 50);
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text(newInvoice.clientName, 14, 56);
      doc.setFont('helvetica', 'normal');
      doc.text(newInvoice.clientEmail, 14, 62);
      if(newInvoice.clientContact) doc.text(newInvoice.clientContact, 14, 68);
      const detailsX = 150;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100);
      doc.text('Invoice #', detailsX, 50);
      doc.text('Invoice Date', detailsX, 56);
      doc.text('Due Date', detailsX, 62);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'normal');
      doc.text(newInvoice.invoiceNumber, 196, 50, { align: 'right' });
      doc.text(new Date(newInvoice.invoiceDate).toLocaleDateString(), 196, 56, { align: 'right' });
      doc.text(new Date(newInvoice.dueDate).toLocaleDateString(), 196, 62, { align: 'right' });
      const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'N/A';
      const getUnitName = (productId: string) => {
          const product = products.find(p => p.id === productId);
          if (!product) return '';
          const unit = units.find(u => u.id === product.unitId);
          return unit ? unit.name : '';
      };
      
      doc.autoTable({
          startY: 80,
          head: [['Item', 'Quantity', 'Unit', 'Price', 'Amount']],
          headStyles: {
            fillColor: [238, 238, 238],
            textColor: [51, 51, 51],
            halign: 'center',
          },
          columnStyles: {
            0: { halign: 'left' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' }
          },
          body: newInvoice.items.map(item => [
              getProductName(item.productId),
              item.quantity,
              getUnitName(item.productId),
              formatCurrency(item.price, newInvoice!.currency, true),
              formatCurrency(item.quantity * item.price, newInvoice!.currency, true),
          ]),
      });
      const finalY = (doc as any).lastAutoTable.finalY;
      const appliedTax = newInvoice.taxId ? settings.taxes.find(t => t.id === newInvoice.taxId) : null;
      const summaryX = 140;
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text('Subtotal', summaryX, finalY + 10);
      let summaryY = finalY + 16;
      if (appliedTax) {
          doc.text(`${appliedTax.name} (${appliedTax.rate}%)`, summaryX, summaryY);
          summaryY += 6;
      }
      summaryY += 2; // Separator space
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Total', summaryX, summaryY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(formatCurrency(subtotal, newInvoice.currency, true), 196, finalY + 10, { align: 'right' });
      if (appliedTax) {
        doc.text(formatCurrency(newInvoice.taxAmount || 0, newInvoice.currency, true), 196, summaryY - 6, { align: 'right' });
      }
      doc.setDrawColor(238, 238, 238); // #eeeeee
      doc.line(summaryX, summaryY, 196, summaryY);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(total, newInvoice.currency, true), 196, summaryY + 6, { align: 'right' });
      if (newInvoice.paymentLink) {
        doc.setFontSize(11);
        doc.setTextColor(40, 116, 240); // Blue color for link
        doc.textWithLink('Click here to pay online', 14, summaryY + 12, { url: newInvoice.paymentLink });
      }
      const notesStartY = summaryY + 30;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes', 14, notesStartY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(newInvoice.notes || 'Thank you for your business. Please pay within the due date.', 14, notesStartY + 5);

      const pdfBase64 = doc.output('datauristring').split(',')[1];
      
      try {
        await sendEmail({
            to: newInvoice.clientEmail,
            subject: `Invoice #${newInvoice.invoiceNumber} from ${settings.appName}`,
            html: emailHtml,
            smtpConfig: settings.smtp,
            attachments: [
                {
                    filename: `Invoice-${newInvoice.invoiceNumber}.pdf`,
                    content: pdfBase64,
                    encoding: 'base64',
                }
            ]
        });
      } catch (err) {
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
      }
    }

  }, [setInvoices, setProducts, settings, toast, products, units]);


  const updateInvoice = useCallback(async (updatedInvoiceData: Omit<Invoice, 'currency' | 'taxAmount'>) => {
    const subtotal = updatedInvoiceData.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const taxAmount = calculateTaxAmount(subtotal, updatedInvoiceData.taxId);
    const total = subtotal + taxAmount;

    let paymentLink: string | undefined = updatedInvoiceData.paymentLink;
    const originalInvoice = invoices.find(inv => inv.id === updatedInvoiceData.id);
    const originalTotal = originalInvoice ? (originalInvoice.items.reduce((acc, item) => acc + item.quantity * item.price, 0) + (originalInvoice.taxAmount || 0)) : 0;

    if (settings.stripe?.secretKey && (!paymentLink || total !== originalTotal)) {
        try {
            const result = await generateStripePaymentLink({
                invoice_id: updatedInvoiceData.id, // Pass existing ID
                amount: total,
                currency: settings.currency,
                description: `Payment for Invoice #${updatedInvoiceData.invoiceNumber}`,
                stripeSecretKey: settings.stripe.secretKey,
            });
            paymentLink = result.payment_link_url;
        } catch (error) {
            console.error("Failed to generate Stripe payment link:", error);
            toast({
                variant: 'destructive',
                title: 'Stripe Error',
                description: 'Could not regenerate payment link. Please check your Stripe settings.',
            });
        }
    }
     
     setProducts(prevProducts => {
        const newProducts = [...prevProducts];
        
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

        for (const item of updatedInvoiceData.items) {
            const productIndex = newProducts.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                 if (!newProducts[productIndex].sales) {
                    newProducts[productIndex].sales = [];
                 }
                 newProducts[productIndex].sales.push({ invoiceId: updatedInvoiceData.id, quantity: item.quantity });
            }
        }

        let updatedInvoice: Invoice = {
          ...updatedInvoiceData,
          currency: settings.currency,
          items: updatedInvoiceData.items.map(item => ({...item, id: item.id || generateId()})),
          taxAmount: taxAmount,
          paymentLink: paymentLink
        };
        
        setInvoices(prevInvoices => prevInvoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));

        return newProducts;
    });
  }, [invoices, setInvoices, setProducts, settings.currency, settings.taxes, settings.stripe, toast]);


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

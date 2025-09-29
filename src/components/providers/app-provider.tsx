
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppContext, AppContextType } from '@/contexts/app-context';
import useLocalStorage from '@/hooks/use-local-storage';
import type { Invoice, AppSettings, Product, Purchase, Unit, Tax, Supplier } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { useUser } from '@/firebase';

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
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('settings', defaultSettings);
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [purchases, setPurchases] = useLocalStorage<Purchase[]>('purchases', []);
  const [units, setUnits] = useLocalStorage<Unit[]>('units', []);
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', []);
  
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

  const getAvailableStock = useCallback((productId: string, currentInvoiceId?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;

    const stockFromPurchases = purchases
      .flatMap(p => p.items)
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);

    const sales = product.sales || [];
    const stockSold = sales
      .filter(sale => sale.invoiceId !== currentInvoiceId) // Exclude current invoice from calculation
      .reduce((sum, sale) => sum + sale.quantity, 0);
      
    return stockFromPurchases - stockSold;
  }, [products, purchases]);

  const calculateTaxAmount = (subtotal: number, taxId?: string | null): number => {
    if (!taxId) return 0;
    const tax = settings.taxes.find(t => t.id === taxId);
    if (!tax) return 0;
    return (subtotal * tax.rate) / 100;
  }

  const addInvoice = useCallback((invoiceData: Omit<Invoice, 'id' | 'currency' | 'taxAmount'>) => {
    setProducts(prevProducts => {
      const newProducts = [...prevProducts];
      const invoiceId = generateId();
      const subtotal = invoiceData.items.reduce((acc, item) => acc + item.quantity * item.price, 0);

      const newInvoice: Invoice = {
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
      setInvoices(prev => [...prev, newInvoice]);
      return newProducts;
    });
  }, [setInvoices, setProducts, settings.currency, settings.taxes]);


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

  const addPurchase = useCallback((purchaseData: Omit<Purchase, 'id' | 'status'>) => {
    const newPurchase: Purchase = {
      ...purchaseData,
      id: generateId(),
      status: 'Pending',
    };
    setPurchases(prev => [...prev, newPurchase]);
  }, [setPurchases]);
  
  const updatePurchase = useCallback((purchase: Purchase) => {
    setPurchases(prev => prev.map(p => p.id === purchase.id ? purchase : p));
  }, [setPurchases]);

  const deletePurchase = useCallback((purchaseId: string) => {
    setPurchases(prev => prev.filter(p => p.id !== purchaseId));
  }, [setPurchases]);

  const addUnit = useCallback((unit: Unit) => {
    setUnits(prev => [...prev, unit]);
  }, [setUnits]);
  
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


  const contextValue: AppContextType = {
    isLoading: isUserLoading,
    invoices,
    addInvoice: addInvoice as any, // Cast to satisfy the complex type
    updateInvoice: updateInvoice as any, // Cast to satisfy the complex type
    getInvoice,
    deleteInvoice,
    settings,
    updateSettings: updateSettings as any,
    products,
    addProduct: addProduct as any,
    purchases,
    addPurchase: addPurchase as any,
    updatePurchase,
    deletePurchase,
    units,
    addUnit,
    getAvailableStock,
    addTax,
    updateTax,
    deleteTax,
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplier
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

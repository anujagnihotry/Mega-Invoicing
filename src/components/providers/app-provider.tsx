'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppContext, AppContextType } from '@/contexts/app-context';
import useLocalStorage from '@/hooks/use-local-storage';
import { VALID_LICENSE_KEY } from '@/lib/constants';
import type { Invoice, AppSettings, Product, Purchase, Unit, LineItem } from '@/lib/types';
import { generateId } from '@/lib/utils';

const defaultSettings: AppSettings = {
  currency: 'USD',
  companyProfile: {
    name: 'Your Company',
    address: '123 Main St, Anytown, USA',
    phone: '+1 (555) 123-4567',
    taxNumber: 'TAX-123456789',
  },
  defaultTaxRule: 'per-item',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [licenseKey, setLicenseKey] = useLocalStorage<string | null>('licenseKey', null);
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('settings', defaultSettings);
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [purchases, setPurchases] = useLocalStorage<Purchase[]>('purchases', []);
  const [units, setUnits] = useLocalStorage<Unit[]>('units', []);
  
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const isActivatePage = pathname === '/activate';
      if (!licenseKey && !isActivatePage) {
        router.replace('/activate');
      } else if (licenseKey && licenseKey !== VALID_LICENSE_KEY && !isActivatePage) {
        setLicenseKey(null);
        router.replace('/activate');
      } else if (licenseKey === VALID_LICENSE_KEY && isActivatePage) {
        router.replace('/');
      }
    }
  }, [isLoading, licenseKey, pathname, router, setLicenseKey]);

  const getAvailableStock = useCallback((productId: string, currentInvoiceId?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;

    const stockFromPurchases = purchases
      .flatMap(p => p.items)
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);

    const stockSold = product.sales
      .filter(sale => sale.invoiceId !== currentInvoiceId) // Exclude current invoice from calculation
      .reduce((sum, sale) => sum + sale.quantity, 0);
      
    return stockFromPurchases - stockSold;
  }, [products, purchases]);

  const addInvoice = useCallback((invoiceData: Omit<Invoice, 'id' | 'currency'>) => {
    setProducts(prevProducts => {
      const newProducts = [...prevProducts];
      const invoiceId = generateId();

      const newInvoice: Invoice = {
        ...invoiceData,
        id: invoiceId,
        currency: settings.currency,
        items: invoiceData.items.map(item => ({ ...item, id: generateId() })),
      };

      for (const item of newInvoice.items) {
        const productIndex = newProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          newProducts[productIndex].sales.push({ invoiceId: newInvoice.id, quantity: item.quantity });
        }
      }
      setInvoices(prev => [...prev, newInvoice]);
      return newProducts;
    });
  }, [setInvoices, setProducts, settings.currency]);


  const updateInvoice = useCallback((updatedInvoiceData: Omit<Invoice, 'currency'>) => {
     setProducts(prevProducts => {
        const newProducts = [...prevProducts];
        
        // 1. Revert stock changes from the original invoice
        const originalInvoice = invoices.find(inv => inv.id === updatedInvoiceData.id);
        if (originalInvoice) {
            for (const item of originalInvoice.items) {
                const productIndex = newProducts.findIndex(p => p.id === item.productId);
                if (productIndex !== -1) {
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
                 newProducts[productIndex].sales.push({ invoiceId: updatedInvoiceData.id, quantity: item.quantity });
            }
        }

        // 3. Update the invoice itself
        const updatedInvoice: Invoice = {
          ...updatedInvoiceData,
          currency: settings.currency,
          items: updatedInvoiceData.items.map(item => ({...item, id: item.id || generateId()}))
        };
        
        setInvoices(prevInvoices => prevInvoices.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv));

        return newProducts;
    });
  }, [invoices, setInvoices, setProducts, settings.currency]);


  const deleteInvoice = useCallback((id: string) => {
    const invoiceToDelete = invoices.find(inv => inv.id === id);
    if (!invoiceToDelete) return;

    setProducts(prevProducts => {
        const newProducts = [...prevProducts];
        for (const item of invoiceToDelete.items) {
            const productIndex = newProducts.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
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
  
  const getInvoice = useCallback((id: string): Invoice | undefined => {
    return invoices.find(invoice => invoice.id === id);
  }, [invoices]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings, companyProfile: {...prev.companyProfile, ...newSettings.companyProfile} }));
  }, [setSettings]);

  const addProduct = useCallback((productData: Omit<Product, 'id' | 'quantity' | 'sales'>) => {
    const newProduct: Product = {
      id: generateId(),
      quantity: 0, // Initial quantity is 0, will be updated by purchases
      sales: [],
      ...productData,
    };
    setProducts(prev => [...prev, newProduct]);
  }, [setProducts]);

  const addPurchase = useCallback((purchase: Purchase) => {
    setPurchases(prev => [...prev, purchase]);
    
    // Note: We no longer directly update product.quantity from purchases.
    // The available stock is now a calculated value.
  }, [setPurchases]);
  
  const addUnit = useCallback((unit: Unit) => {
    setUnits(prev => [...prev, unit]);
  }, [setUnits]);

  const contextValue: AppContextType = {
    licenseKey,
    setLicenseKey,
    isLoading,
    invoices,
    addInvoice: addInvoice as any, // Cast to satisfy the complex type
    updateInvoice: updateInvoice as any, // Cast to satisfy the complex type
    getInvoice,
    deleteInvoice,
    settings,
    updateSettings,
    products,
    addProduct: addProduct as any,
    purchases,
    addPurchase,
    units,
    addUnit,
    getAvailableStock,
  };
  
  if (isLoading || (!licenseKey && pathname !== '/activate')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

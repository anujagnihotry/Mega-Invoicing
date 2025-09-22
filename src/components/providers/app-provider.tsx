'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppContext } from '@/contexts/app-context';
import useLocalStorage from '@/hooks/use-local-storage';
import { VALID_LICENSE_KEY } from '@/lib/constants';
import type { Invoice, AppSettings, Product, Purchase, Unit } from '@/lib/types';
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
        // Invalid license, but let them stay on activation page if they are there
        setLicenseKey(null);
        router.replace('/activate');
      } else if (licenseKey === VALID_LICENSE_KEY && isActivatePage) {
        router.replace('/');
      }
    }
  }, [isLoading, licenseKey, pathname, router, setLicenseKey]);

  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices(prev => [...prev, invoice]);
  }, [setInvoices]);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    setInvoices(prev => prev.map(inv => (inv.id === updatedInvoice.id ? updatedInvoice : inv)));
  }, [setInvoices]);

  const getInvoice = useCallback((id: string) => {
    return invoices.find(inv => inv.id === id);
  }, [invoices]);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  }, [setInvoices]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings, companyProfile: {...prev.companyProfile, ...newSettings.companyProfile} }));
  }, [setSettings]);

  const addProduct = useCallback((productData: Omit<Product, 'id' | 'quantity'>) => {
    const newProduct: Product = {
      id: generateId(),
      quantity: 0,
      ...productData,
    };
    setProducts(prev => [...prev, newProduct]);
  }, [setProducts]);

  const addPurchase = useCallback((purchase: Purchase) => {
    setPurchases(prev => [...prev, purchase]);
    
    const productUpdates = new Map<string, number>();
    purchase.items.forEach(item => {
        productUpdates.set(item.productId, (productUpdates.get(item.productId) || 0) + item.quantity);
    });

    setProducts(prevProducts => {
      return prevProducts.map(p => {
        if (productUpdates.has(p.id)) {
          return { ...p, quantity: p.quantity + (productUpdates.get(p.id) || 0) };
        }
        return p;
      });
    });
  }, [setProducts, setPurchases]);
  
  const addUnit = useCallback((unit: Unit) => {
    setUnits(prev => [...prev, unit]);
  }, [setUnits]);

  const contextValue = {
    licenseKey,
    setLicenseKey,
    isLoading,
    invoices,
    addInvoice,
    updateInvoice,
    getInvoice,
    deleteInvoice,
    settings,
    updateSettings,
    products,
    addProduct,
    purchases,
    addPurchase,
    units,
    addUnit,
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

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppContext } from '@/contexts/app-context';
import useLocalStorage from '@/hooks/use-local-storage';
import { VALID_LICENSE_KEY } from '@/lib/constants';
import type { Invoice, AppSettings } from '@/lib/types';

const defaultSettings: AppSettings = {
  currency: 'USD',
  companyProfile: {
    name: 'Your Company',
    address: '123 Main St, Anytown, USA',
    phone: '+1 (555) 123-4567',
    taxNumber: 'TAX-123456789',
  },
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [licenseKey, setLicenseKey] = useLocalStorage<string | null>('licenseKey', null);
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('settings', defaultSettings);
  
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
    setInvoices([...invoices, invoice]);
  }, [invoices, setInvoices]);

  const updateInvoice = useCallback((updatedInvoice: Invoice) => {
    setInvoices(invoices.map(inv => (inv.id === updatedInvoice.id ? updatedInvoice : inv)));
  }, [invoices, setInvoices]);

  const getInvoice = useCallback((id: string) => {
    return invoices.find(inv => inv.id === id);
  }, [invoices]);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices(invoices.filter(inv => inv.id !== id));
  }, [invoices, setInvoices]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings, companyProfile: {...prev.companyProfile, ...newSettings.companyProfile} }));
  }, [setSettings]);

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

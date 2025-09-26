'use client';

import { useParams } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { useEffect, useState } from 'react';
import type { Invoice } from '@/lib/types';
import { InvoiceDisplay } from '@/components/invoice-display';

export default function PrintInvoicePage() {
  const params = useParams();
  const { getInvoice, settings, products, units } = useApp();
  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);

  useEffect(() => {
    const invoiceId = params.id as string;
    if (invoiceId) {
      const foundInvoice = getInvoice(invoiceId);
      setInvoice(foundInvoice);
    }
  }, [params.id, getInvoice]);
  
  useEffect(() => {
    if (invoice) {
      // Small timeout to allow everything to render before printing
      setTimeout(() => window.print(), 500);
    }
  }, [invoice]);

  if (!invoice) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <InvoiceDisplay invoice={invoice} settings={settings} products={products} units={units} />;
}

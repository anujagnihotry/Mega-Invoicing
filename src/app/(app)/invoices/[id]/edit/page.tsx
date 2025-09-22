'use client';

import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { InvoiceForm } from '@/components/invoice-form';
import { useEffect, useState } from 'react';
import type { Invoice } from '@/lib/types';

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { getInvoice } = useApp();
  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const invoiceId = params.id as string;
    if (invoiceId) {
      const foundInvoice = getInvoice(invoiceId);
      if (foundInvoice) {
        setInvoice(foundInvoice);
      } else {
        router.replace('/invoices');
      }
    }
    setLoading(false);
  }, [params.id, getInvoice, router]);

  if (loading) {
    return (
       <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!invoice) {
    return null; // Or a "Not Found" component
  }

  return <InvoiceForm invoice={invoice} />;
}

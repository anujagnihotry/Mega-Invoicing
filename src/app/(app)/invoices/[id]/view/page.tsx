
'use client';

import { useParams } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { useEffect, useState } from 'react';
import type { Invoice } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { InvoiceDisplay } from '@/components/invoice-display';

export default function ViewInvoicePage() {
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
  
  if (!invoice) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center no-print">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="print-container">
      <div className="flex items-center mb-4 no-print">
         <h1 className="font-semibold text-lg md:text-2xl">Invoice {invoice.invoiceNumber}</h1>
         <div className="ml-auto flex items-center gap-2">
            {invoice.paymentLink && (
                <Button asChild variant="secondary">
                    <Link href={invoice.paymentLink} target="_blank">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay Online
                    </Link>
                </Button>
            )}
            <Button asChild>
                <Link href={`/invoices/${invoice.id}/print`} target="_blank">
                    <Printer className="mr-2 h-4 w-4" />
                    Print / Download PDF
                </Link>
            </Button>
          </div>
      </div>
      <InvoiceDisplay invoice={invoice} settings={settings} products={products} units={units} />
    </div>
  );
}

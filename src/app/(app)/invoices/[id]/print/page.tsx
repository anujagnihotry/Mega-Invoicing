'use client';

import { useParams } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { useEffect, useState } from 'react';
import type { Invoice } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function PrintInvoicePage() {
  const params = useParams();
  const { getInvoice, settings, products } = useApp();
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

  const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const appliedTax = invoice.taxId ? settings.taxes.find(t => t.id === invoice.taxId) : null;
  const taxAmount = invoice.taxAmount || 0;
  const total = subtotal + taxAmount;
  
  const getItemDescription = (productId: string) => {
      const product = products.find(p => p.id === productId);
      return product?.name || 'Unknown Item';
  }

  return (
      <Card className="w-full max-w-4xl mx-auto p-4 sm:p-10 border-none shadow-none">
        <CardHeader className="p-0">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{settings.companyProfile.name}</h1>
              <p className="text-muted-foreground">{settings.companyProfile.address}</p>
              <p className="text-muted-foreground">{settings.companyProfile.phone}</p>
            </div>
            <h2 className="text-4xl font-bold text-muted-foreground tracking-widest uppercase">Invoice</h2>
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Bill To</h3>
              <p className="font-bold">{invoice.clientName}</p>
              <p className="text-muted-foreground">{invoice.clientEmail}</p>
              {invoice.clientContact && <p className="text-muted-foreground">{invoice.clientContact}</p>}
            </div>
            <div className="text-right">
              <div className="grid grid-cols-2">
                <span className="font-semibold">Invoice #</span>
                <span>{invoice.invoiceNumber}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold">Invoice Date</span>
                <span>{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="font-semibold">Due Date</span>
                <span>{new Date(invoice.dueDate).toLocaleDateString()}</span>
              </div>
              <Badge className="mt-4" variant={invoice.status === 'Paid' ? 'default' : 'destructive'}>{invoice.status}</Badge>
            </div>
          </div>

          <Separator className="my-8" />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Item</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{getItemDescription(item.productId)}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price, invoice.currency)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.price * item.quantity, invoice.currency)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-8" />

          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal, invoice.currency)}</span>
              </div>
              {appliedTax && (
                <div className="flex justify-between">
                    <span className="text-muted-foreground">{appliedTax.name} ({appliedTax.rate}%)</span>
                    <span>{formatCurrency(taxAmount, invoice.currency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(total, invoice.currency)}</span>
              </div>
            </div>
          </div>

          <div className="mt-16">
            <h3 className="font-semibold">Notes</h3>
            <p className="text-muted-foreground text-sm">Thank you for your business. Please pay within the due date.</p>
          </div>
        </CardContent>
      </Card>
  );
}

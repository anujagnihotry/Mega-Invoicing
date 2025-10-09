'use client';

import type { Invoice, AppSettings, Product, Unit } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface InvoiceDisplayProps {
  invoice: Invoice;
  settings: AppSettings;
  products: Product[];
  units: Unit[];
}

export function InvoiceDisplay({ invoice, settings, products, units }: InvoiceDisplayProps) {

  const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const appliedTax = invoice.taxId ? settings.taxes.find(t => t.id === invoice.taxId) : null;
  const taxAmount = invoice.taxAmount || 0;
  const total = subtotal + taxAmount;
  
  const getItemDescription = (productId: string) => {
      const product = products.find(p => p.id === productId);
      return product?.name || 'Unknown Item';
  }

  const getUnitName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return '';
    const unit = units.find(u => u.id === product.unitId);
    return unit ? unit.name : '';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-4 sm:p-10 print-card">
      <CardHeader className="p-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {settings.appLogo && <Image src={settings.appLogo} alt={settings.appName} width={64} height={64} className="h-16 w-16" />}
            <div>
                <h1 className="text-3xl font-bold">{settings.companyProfile.name}</h1>
                <p className="text-muted-foreground">{settings.companyProfile.address.replace(/\n/g, ', ')}</p>
                <p className="text-muted-foreground">{settings.companyProfile.phone}</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-muted-foreground tracking-widest uppercase">Invoice</h2>
        </div>
      </CardHeader>
      <CardContent className="p-0 mt-10">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Bill To</h3>
            <p className="font-bold text-lg">{invoice.clientName}</p>
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
            <Badge className="mt-4 text-base" variant={invoice.status === 'Paid' ? 'default' : 'destructive'}>{invoice.status}</Badge>
          </div>
        </div>

        <Separator className="my-8" />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%] text-left uppercase">Item</TableHead>
              <TableHead className="text-center uppercase">Quantity</TableHead>
              <TableHead className="text-center uppercase">Unit</TableHead>
              <TableHead className="text-right uppercase">Price</TableHead>
              <TableHead className="text-right uppercase">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoice.items.map((item) => (
              <TableRow key={item.id} className="border-b">
                <TableCell className="font-medium py-3">{getItemDescription(item.productId)}</TableCell>
                <TableCell className="text-center py-3">{item.quantity}</TableCell>
                <TableCell className="text-center py-3">{getUnitName(item.productId)}</TableCell>
                <TableCell className="text-right py-3">{formatCurrency(item.price, invoice.currency)}</TableCell>
                <TableCell className="text-right py-3 font-medium">{formatCurrency(item.price * item.quantity, invoice.currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-end mt-8">
          <div className="w-full max-w-sm space-y-2">
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
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-xl">
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


'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/hooks/use-app';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/types';

type Transaction = {
  date: Date;
  productName: string;
  details: string; // Invoice # or Vendor Name
  quantity: number;
  unitName: string;
  status: 'IN' | 'OUT';
};

function getProductName(productId: string, products: Product[]): string {
    return products.find(p => p.id === productId)?.name || 'Unknown Product';
}

export default function ItemTrackingPage() {
  const { purchases, invoices, products, units } = useApp();

  const transactions = React.useMemo(() => {
    const allTransactions: Transaction[] = [];

    // Process Purchases (IN)
    purchases.forEach(purchase => {
      purchase.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const unit = units.find(u => u.id === product?.unitId);
        allTransactions.push({
          date: new Date(purchase.date),
          productName: product?.name || 'N/A',
          details: purchase.vendorName,
          quantity: item.quantity,
          unitName: unit?.name || 'N/A',
          status: 'IN',
        });
      });
    });

    // Process Invoices (OUT)
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const unit = units.find(u => u.id === product?.unitId);
        allTransactions.push({
          date: new Date(invoice.invoiceDate),
          productName: product?.name || 'N/A',
          details: `Invoice #${invoice.invoiceNumber}`,
          quantity: item.quantity,
          unitName: unit?.name || 'N/A',
          status: 'OUT',
        });
      });
    });

    // Sort transactions by date, descending
    return allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [purchases, invoices, products, units]);

  return (
    <>
      <div className="flex items-center mb-4">
        <h1 className="font-semibold text-lg md:text-2xl">Item Tracking</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Inventory Movement</CardTitle>
          <CardDescription>A complete history of stock moving in and out.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length > 0 ? (
                transactions.map((tx, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{tx.date.toLocaleDateString()}</TableCell>
                    <TableCell>{tx.productName}</TableCell>
                    <TableCell>{tx.details}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn({
                          'bg-green-100 text-green-800 border-green-200': tx.status === 'IN',
                          'bg-red-100 text-red-800 border-red-200': tx.status === 'OUT',
                        })}
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{tx.quantity}</TableCell>
                    <TableCell>{tx.unitName}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No item movements recorded.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

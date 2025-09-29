
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/hooks/use-app';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { subDays, startOfMonth } from 'date-fns';

type Transaction = {
  date: Date;
  productName: string;
  details: string; // Invoice # or Vendor Name
  quantity: number;
  unitName: string;
  status: 'IN' | 'OUT';
};

type DateRange = 'all' | 'this_month' | 'last_30_days';

export default function ItemTrackingPage() {
  const { purchases, invoices, products, units } = useApp();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'IN' | 'OUT'>('all');
  const [dateFilter, setDateFilter] = React.useState<DateRange>('all');

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

  const filteredTransactions = React.useMemo(() => {
    let filtered = transactions;

    // Apply search term filter
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.productName.toLowerCase().includes(lowercasedTerm) ||
        tx.details.toLowerCase().includes(lowercasedTerm)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      if (dateFilter === 'this_month') {
        startDate = startOfMonth(now);
      } else { // last_30_days
        startDate = subDays(now, 30);
      }
      filtered = filtered.filter(tx => tx.date >= startDate);
    }

    return filtered;
  }, [transactions, searchTerm, statusFilter, dateFilter]);

  const stockByUnit = React.useMemo(() => {
    const totals: { [unitName: string]: { stockIn: number; stockOut: number } } = {};

    filteredTransactions.forEach(tx => {
      if (tx.unitName === 'N/A') return; // Skip items with no unit

      if (!totals[tx.unitName]) {
        totals[tx.unitName] = { stockIn: 0, stockOut: 0 };
      }

      if (tx.status === 'IN') {
        totals[tx.unitName].stockIn += tx.quantity;
      } else {
        totals[tx.unitName].stockOut += tx.quantity;
      }
    });

    return Object.entries(totals).map(([unitName, values]) => ({
      unitName,
      ...values,
    }));
  }, [filteredTransactions]);


  return (
    <>
      <div className="flex items-center mb-4">
        <h1 className="font-semibold text-lg md:text-2xl">Item Tracking</h1>
      </div>
      
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
          {stockByUnit.length > 0 ? stockByUnit.map(({ unitName, stockIn, stockOut }) => (
            <Card key={unitName}>
                <CardHeader>
                    <CardTitle>{unitName}</CardTitle>
                    <CardDescription>Summary for this unit</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm font-medium text-green-800">Stock In</p>
                        <p className="text-2xl font-bold text-green-900">{stockIn.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-red-800">Stock Out</p>
                        <p className="text-2xl font-bold text-red-900">{stockOut.toFixed(2)}</p>
                    </div>
                </CardContent>
            </Card>
          )) : (
            <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-4">
                No stock movement data to display for the selected filters.
            </div>
          )}
      </div>

       <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
        <div className="relative w-full md:flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by item or details..."
            className="pl-9 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'IN' | 'OUT')}>
            <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="IN">IN</SelectItem>
                <SelectItem value="OUT">OUT</SelectItem>
            </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateRange)}>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
            </SelectContent>
            </Select>
        </div>
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
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx, index) => (
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
                    No item movements found for the selected filters.
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

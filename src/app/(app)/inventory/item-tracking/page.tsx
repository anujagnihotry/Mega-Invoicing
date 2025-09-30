
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/hooks/use-app';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowUpDown } from 'lucide-react';
import { subDays, startOfMonth } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

type Transaction = {
  date: Date;
  productName: string;
  details: string; // Invoice # or "Purchase Entry"
  quantity: number;
  unitName: string;
  status: 'IN' | 'OUT';
};

type SortableKeys = keyof Transaction;
type DateRange = 'all' | 'this_month' | 'last_30_days';

export default function ItemTrackingPage() {
  const { purchaseEntries, invoices, products, units, suppliers, purchaseOrders } = useApp();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'IN' | 'OUT'>('all');
  const [dateFilter, setDateFilter] = React.useState<DateRange>('all');
  const [sortConfig, setSortConfig] = React.useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'date', direction: 'descending' });

  const transactions = React.useMemo(() => {
    const allTransactions: Transaction[] = [];

    // Process Purchase Entries (IN)
    purchaseEntries.forEach(entry => {
      const supplier = suppliers.find(s => s.id === entry.supplierId);
      const purchaseOrder = entry.purchaseOrderId ? purchaseOrders.find(po => po.id === entry.purchaseOrderId) : null;
      
      entry.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const unit = units.find(u => u.id === product?.unitId);
        
        let details = `Manual Entry from ${supplier?.name || 'N/A'}`;
        if (purchaseOrder) {
          details = `PO #${purchaseOrder.poNumber} from ${supplier?.name || 'N/A'}`;
        } else if (!entry.purchaseOrderId) {
           details = `Manual Entry from ${supplier?.name || 'N/A'}`;
        }

        allTransactions.push({
          date: new Date(entry.entryDate),
          productName: product?.name || 'N/A',
          details: details,
          quantity: item.quantityReceived,
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

    // Initial sort transactions by date, descending
    return allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [purchaseEntries, invoices, products, units, suppliers, purchaseOrders]);

  const filteredAndSortedTransactions = React.useMemo(() => {
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

    // Apply sorting
    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [transactions, searchTerm, statusFilter, dateFilter, sortConfig]);

  const stockByUnit = React.useMemo(() => {
    const totals: { [unitName: string]: { stockIn: number; stockOut: number } } = {};

    filteredAndSortedTransactions.forEach(tx => {
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
  }, [filteredAndSortedTransactions]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortableKeys) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-50" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <span className="ml-2">▲</span>;
    }
    return <span className="ml-2">▼</span>;
  };

  const SortableHeader = ({ sortKey, children }: { sortKey: SortableKeys, children: React.ReactNode }) => (
    <TableHead>
        <Button variant="ghost" onClick={() => requestSort(sortKey)} className="group px-0">
            {children}
            {getSortIndicator(sortKey)}
        </Button>
    </TableHead>
  );


  return (
    <>
      <div className="flex items-center mb-4">
        <h1 className="font-semibold text-lg md:text-2xl">Item Tracking</h1>
      </div>
      
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mb-4">
          <Card>
            <CardHeader>
                <CardTitle className="text-green-700">Stock In by Unit</CardTitle>
                <CardDescription>Total items added to inventory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {stockByUnit.filter(item => item.stockIn > 0).length > 0 ? stockByUnit.filter(item => item.stockIn > 0).map(({ unitName, stockIn }, index) => (
                    <React.Fragment key={unitName}>
                        <div className="flex justify-between items-center">
                            <span className="font-medium">{unitName}</span>
                            <span className="font-bold text-lg text-green-800">{stockIn.toFixed(2)}</span>
                        </div>
                        {index < stockByUnit.filter(item => item.stockIn > 0).length - 1 && <Separator />}
                    </React.Fragment>
                )) : (
                     <div className="text-center text-muted-foreground py-4">No incoming stock.</div>
                )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
                <CardTitle className="text-red-700">Stock Out by Unit</CardTitle>
                <CardDescription>Total items removed from inventory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {stockByUnit.filter(item => item.stockOut > 0).length > 0 ? stockByUnit.filter(item => item.stockOut > 0).map(({ unitName, stockOut }, index) => (
                    <React.Fragment key={unitName}>
                        <div className="flex justify-between items-center">
                            <span className="font-medium">{unitName}</span>
                            <span className="font-bold text-lg text-red-800">{stockOut.toFixed(2)}</span>
                        </div>
                        {index < stockByUnit.filter(item => item.stockOut > 0).length - 1 && <Separator />}
                    </React.Fragment>
                )) : (
                    <div className="text-center text-muted-foreground py-4">No outgoing stock.</div>
                )}
            </CardContent>
          </Card>
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
                <SortableHeader sortKey="date">Date</SortableHeader>
                <SortableHeader sortKey="productName">Item</SortableHeader>
                <SortableHeader sortKey="details">Details</SortableHeader>
                <SortableHeader sortKey="status">Status</SortableHeader>
                <TableHead className="text-right">
                  <Button variant="ghost" onClick={() => requestSort('quantity')} className="group px-0 w-full justify-end">
                      Quantity
                      {getSortIndicator('quantity')}
                  </Button>
                </TableHead>
                <SortableHeader sortKey="unitName">Unit</SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTransactions.length > 0 ? (
                filteredAndSortedTransactions.map((tx, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{new Date(tx.date).toLocaleDateString()}</TableCell>
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

    
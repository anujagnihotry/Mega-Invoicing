
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/hooks/use-app';
import { formatCurrency } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Receipt } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import type { Invoice } from '@/lib/types';

export default function TaxReportingPage() {
  const { invoices, settings } = useApp();
  const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const filteredInvoices = React.useMemo(() => {
    return invoices.filter((invoice: Invoice) => {
      if (invoice.taxAmount === undefined || invoice.taxAmount === null || invoice.taxAmount === 0) {
        return false;
      }
      const invoiceDate = parseISO(invoice.invoiceDate);
      if (dateRange.from && invoiceDate < dateRange.from) {
        return false;
      }
      if (dateRange.to && invoiceDate > dateRange.to) {
        return false;
      }
      return true;
    });
  }, [invoices, dateRange]);

  const totalInvoices = filteredInvoices.length;
  const totalTax = filteredInvoices.reduce((sum, invoice) => sum + (invoice.taxAmount || 0), 0);

  const getTaxName = (taxId?: string | null) => {
    if (!taxId) return 'N/A';
    const tax = settings.taxes.find(t => t.id === taxId);
    return tax ? `${tax.name} (${tax.rate}%)` : 'N/A';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Tax Reporting</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Report</CardTitle>
          <CardDescription>Select a date range to filter the tax report.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className="w-[280px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? format(dateRange.from, 'PPP') : <span>From date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => setDateRange(prev => ({...prev, from: date as Date}))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className="w-[280px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.to ? format(dateRange.to, 'PPP') : <span>To date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateRange.to}
                onSelect={(date) => setDateRange(prev => ({...prev, to: date as Date}))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
           <Button onClick={() => setDateRange({ from: undefined, to: undefined })}>
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">in the selected period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax Collected</CardTitle>
            <span className="text-muted-foreground text-sm">{settings.currency}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTax, settings.currency)}</div>
            <p className="text-xs text-muted-foreground">in the selected period</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tax Details</CardTitle>
          <CardDescription>Breakdown of taxes collected from invoices in the selected period.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Tax Applied</TableHead>
                <TableHead className="text-right">Tax Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice: Invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{format(parseISO(invoice.invoiceDate), 'PPP')}</TableCell>
                    <TableCell>{getTaxName(invoice.taxId)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(invoice.taxAmount || 0, settings.currency)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No invoices with taxes found for the selected period.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { ArrowUpRight, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/hooks/use-app';
import { formatCurrency } from '@/lib/utils';
import { Invoice } from '@/lib/types';

export default function Dashboard() {
  const { invoices, settings } = useApp();

  const totalRevenue = invoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((acc, inv) => acc + inv.items.reduce((sum, item) => sum + item.quantity * item.price, 0), 0);

  const outstandingRevenue = invoices
    .filter((inv) => inv.status === 'Sent' || inv.status === 'Draft')
    .reduce((acc, inv) => acc + inv.items.reduce((sum, item) => sum + item.quantity * item.price, 0), 0);

  const recentInvoices = [...invoices].sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()).slice(0, 5);

  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-8">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/invoices/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="text-muted-foreground text-sm">{settings.currency}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue, settings.currency)}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Revenue</CardTitle>
            <span className="text-muted-foreground text-sm">{settings.currency}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(outstandingRevenue, settings.currency)}</div>
            <p className="text-xs text-muted-foreground">Amount due from clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">+2 since last week</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>An overview of your most recent invoices.</CardDescription>
          </div>
          <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/invoices">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentInvoices.length > 0 ? (
                recentInvoices.map((invoice: Invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="font-medium">{invoice.clientName}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">{invoice.clientEmail}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className="text-xs" variant={invoice.status === 'Paid' ? 'secondary' : 'outline'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        invoice.items.reduce((acc, item) => acc + item.quantity * item.price, 0),
                        invoice.currency
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No recent invoices. <Link href="/invoices/new" className="text-primary underline">Create one now</Link>!
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

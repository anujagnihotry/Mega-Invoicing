'use client';

import * as React from 'react';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/hooks/use-app';
import { formatCurrency } from '@/lib/utils';
import { Invoice, InvoiceStatus } from '@/lib/types';
import { useRouter } from 'next/navigation';

const statusTabs: (InvoiceStatus | 'All')[] = ['All', 'Draft', 'Sent', 'Paid', 'Cancelled'];

export default function InvoicesPage() {
  const { invoices, deleteInvoice } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<InvoiceStatus | 'All'>('All');

  const filteredInvoices = React.useMemo(() => {
    if (activeTab === 'All') return invoices;
    return invoices.filter((invoice) => invoice.status === activeTab);
  }, [invoices, activeTab]);

  return (
    <Tabs defaultValue="All" onValueChange={(value) => setActiveTab(value as InvoiceStatus | 'All')}>
      <div className="flex items-center">
        <TabsList>
          {statusTabs.map((status) => (
            <TabsTrigger key={status} value={status}>
              {status}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline">
            Export
          </Button>
          <Button asChild size="sm">
            <Link href="/invoices/new">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </Button>
        </div>
      </div>
      <TabsContent value={activeTab}>
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Manage your invoices and track their status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  <TableHead className="text-right">Invoice Amount</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((invoice: Invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{invoice.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden md-table-cell">{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(
                          invoice.items.reduce((acc, item) => acc + item.quantity * item.price, 0) + (invoice.taxAmount || 0),
                          invoice.currency
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}/view`)}>View</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}/edit`)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteInvoice(invoice.id)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No invoices found. <Link href="/invoices/new" className="text-primary underline">Create one now</Link>!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { cn, formatCurrency, generateId } from '@/lib/utils';
import { format } from 'date-fns';
import { useApp } from '@/hooks/use-app';
import type { Invoice, InvoiceStatus, LineItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { InvoiceReadabilityModal } from './invoice-readability-modal';

const formSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email address'),
  invoiceDate: z.date({ required_error: 'Invoice date is required' }),
  dueDate: z.date({ required_error: 'Due date is required' }),
  status: z.enum(['Draft', 'Sent', 'Paid', 'Cancelled']),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    price: z.coerce.number().min(0, 'Price cannot be negative'),
  })).min(1, 'At least one item is required'),
});

type InvoiceFormProps = {
  invoice?: Invoice;
};

export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter();
  const { addInvoice, updateInvoice, settings, invoices } = useApp();
  const { toast } = useToast();
  
  const defaultValues = invoice ? {
    ...invoice,
    invoiceDate: new Date(invoice.invoiceDate),
    dueDate: new Date(invoice.dueDate),
    items: invoice.items.map(item => ({...item}))
  } : {
    invoiceNumber: `INV-${(invoices.length + 1).toString().padStart(4, '0')}`,
    clientName: '',
    clientEmail: '',
    invoiceDate: new Date(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    status: 'Draft' as InvoiceStatus,
    items: [{ description: '', quantity: 1, price: 0 }],
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const invoiceData: Invoice = {
      id: invoice?.id || generateId(),
      ...values,
      invoiceDate: values.invoiceDate.toISOString(),
      dueDate: values.dueDate.toISOString(),
      currency: settings.currency,
      items: values.items.map(item => ({...item, id: generateId()})),
    };

    if (invoice) {
      updateInvoice(invoiceData);
      toast({ title: "Success", description: "Invoice updated successfully." });
    } else {
      addInvoice(invoiceData);
      toast({ title: "Success", description: "Invoice created successfully." });
    }
    router.push('/invoices');
  };

  const watchItems = form.watch('items');
  const subtotal = watchItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
  
  const getInvoiceTextForAnalysis = () => {
    const values = form.getValues();
    let text = `Invoice for: ${values.clientName}\n`;
    text += `Invoice #: ${values.invoiceNumber}\n\n`;
    text += `Items:\n`;
    values.items.forEach(item => {
      text += `- ${item.description} (Qty: ${item.quantity}, Price: ${formatCurrency(item.price, settings.currency)})\n`;
    });
    text += `\nSubtotal: ${formatCurrency(subtotal, settings.currency)}`;
    return text;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{invoice ? 'Edit Invoice' : 'Create Invoice'}</h1>
            <p className="text-muted-foreground">{invoice ? `Editing invoice ${invoice.invoiceNumber}` : 'Fill in the details below.'}</p>
          </div>
          <div className="flex gap-2">
            <InvoiceReadabilityModal invoiceText={getInvoiceTextForAnalysis()} />
            <Button type="submit">
              {invoice ? 'Save Changes' : 'Create Invoice'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['Draft', 'Sent', 'Paid', 'Cancelled'].map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="invoiceDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Invoice Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>Add items to your invoice.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <Input placeholder="Item description" {...field} />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <Input type="number" {...field} />
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`items.${index}.price`}
                        render={({ field }) => (
                          <Input type="number" step="0.01" {...field} />
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency((watchItems[index]?.quantity || 0) * (watchItems[index]?.price || 0), settings.currency)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => append({ description: '', quantity: 1, price: 0 })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Card className="w-full max-w-sm">
             <CardContent className="p-4 space-y-2">
               <div className="flex justify-between text-lg font-semibold">
                 <span>Total</span>
                 <span>{formatCurrency(subtotal, settings.currency)}</span>
               </div>
             </CardContent>
          </Card>
        </div>
      </form>
    </Form>
  );
}

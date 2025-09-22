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
import { Table, TableHeader, TableRow, TableHead, TableBody } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, PlusCircle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { useApp } from '@/hooks/use-app';
import type { Invoice, InvoiceStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { InvoiceReadabilityModal } from './invoice-readability-modal';
import { InvoiceItemRow } from './invoice-item-row';
import { useEffect } from 'react';

const lineItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, 'Please select a product.'),
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
});

const formSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email address'),
  clientContact: z.string().optional(),
  invoiceDate: z.date({ required_error: 'Invoice date is required' }),
  dueDate: z.date({ required_error: 'Due date is required' }),
  status: z.enum(['Draft', 'Sent', 'Paid', 'Cancelled']),
  items: z.array(lineItemSchema).min(1, 'At least one item is required'),
});

type InvoiceFormProps = {
  invoice?: Invoice;
};

export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter();
  const { addInvoice, updateInvoice, settings, invoices, products, getAvailableStock } = useApp();
  const { toast } = useToast();

  // Custom validation refinement
  const refinedSchema = formSchema.refine((data) => {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const availableStock = getAvailableStock(item.productId, invoice?.id);
      if (item.quantity > availableStock) {
         toast({
          variant: 'destructive',
          title: 'Insufficient Stock',
          description: `Cannot sell ${item.quantity} of ${item.description}. Only ${availableStock} available.`,
        });
        return false;
      }
    }
    return true;
  }, {
    message: "One or more items has insufficient stock.",
    // path: ['items'] // This would put the error on the whole array
  });

  const defaultValues = invoice ? {
    ...invoice,
    invoiceDate: new Date(invoice.invoiceDate),
    dueDate: new Date(invoice.dueDate),
  } : {
    invoiceNumber: `INV-${(invoices.length + 1).toString().padStart(4, '0')}`,
    clientName: '',
    clientEmail: '',
    clientContact: '',
    invoiceDate: new Date(),
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    status: 'Draft' as InvoiceStatus,
    items: [],
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(refinedSchema),
    defaultValues,
  });
  
  useEffect(() => {
    if (invoice && products.length > 0) {
      form.reset({
        ...invoice,
        invoiceDate: new Date(invoice.invoiceDate),
        dueDate: new Date(invoice.dueDate),
        items: invoice.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            ...item,
            description: product?.name || item.description, // Ensure description is up-to-date
          }
        }),
      });
    }
  }, [invoice, products, form.reset, form]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (invoice) {
      updateInvoice({ id: invoice.id, ...values });
      toast({ title: "Success", description: "Invoice updated successfully." });
    } else {
      addInvoice(values);
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

  const handleAddProduct = () => {
    const firstProduct = products[0];
    if (firstProduct) {
       append({
        productId: firstProduct.id,
        description: firstProduct.name,
        quantity: 1,
        price: firstProduct.price,
      });
    } else {
      toast({
        variant: "destructive",
        title: "No Products",
        description: "Please add a product in the Inventory page before creating an invoice."
      })
    }
  }

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
          <CardContent className="grid md:grid-cols-3 gap-4">
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
             <FormField
              control={form.control}
              name="clientContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Contact (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 987-6543" {...field} />
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
                  <TableHead className="w-2/5">Item</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                    <InvoiceItemRow 
                        key={field.id}
                        form={form}
                        index={index}
                        remove={remove}
                        currentInvoiceId={invoice?.id}
                    />
                ))}
              </TableBody>
            </Table>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleAddProduct}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item
            </Button>
             <FormMessage>{form.formState.errors.items?.root?.message}</FormMessage>
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

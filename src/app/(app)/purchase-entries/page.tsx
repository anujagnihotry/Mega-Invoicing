
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { PurchaseEntryStatus, PurchaseOrder } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const purchaseEntrySchema = z.object({
  purchaseOrderId: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier is required'),
  entryDate: z.date({ required_error: 'Entry date is required' }),
  notes: z.string().optional(),
  status: z.enum(['Draft', 'Completed']),
  items: z.array(z.object({
    productId: z.string().min(1, 'Please select a product.'),
    quantityReceived: z.coerce.number().gt(0, 'Quantity must be greater than 0'),
  })).min(1, 'At least one item is required'),
});

export default function NewPurchaseEntryPage() {
  const router = useRouter();
  const { products, suppliers, addPurchaseEntry, purchaseOrders } = useApp();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof purchaseEntrySchema>>({
    resolver: zodResolver(purchaseEntrySchema),
    defaultValues: {
      supplierId: '',
      entryDate: new Date(),
      notes: '',
      items: [],
      status: 'Completed' as PurchaseEntryStatus,
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  
  const watchedSupplierId = form.watch('supplierId');
  const watchedPurchaseOrderId = form.watch('purchaseOrderId');

  const availablePurchaseOrders = React.useMemo(() => {
    if (!watchedSupplierId) return [];
    return purchaseOrders
      .filter(po => po.supplierId === watchedSupplierId && (po.status === 'Pending' || po.status === 'Partially Fulfilled'))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [watchedSupplierId, purchaseOrders]);

  React.useEffect(() => {
    if (watchedPurchaseOrderId) {
      const selectedPO = purchaseOrders.find(po => po.id === watchedPurchaseOrderId);
      if (selectedPO) {
        const newItems = selectedPO.items.map(item => ({
          productId: item.productId,
          quantityReceived: item.quantity,
        }));
        replace(newItems);
      }
    } else {
      replace([]); // Clear items if no PO is selected
    }
  }, [watchedPurchaseOrderId, purchaseOrders, replace]);

  const onSubmit = (values: z.infer<typeof purchaseEntrySchema>) => {
    addPurchaseEntry({
      ...values,
      entryDate: values.entryDate.toISOString(),
    });
    toast({ title: 'Success', description: 'Purchase entry created and stock updated.' });
    router.push('/inventory/item-tracking');
  };

  const isFormEmpty = products.length === 0 || suppliers.length === 0;

  if (isFormEmpty) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Create Purchase Entry</h1>
        <Card>
            <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                    {products.length === 0 && "You need to add products to your inventory. "}
                    {suppliers.length === 0 && "You need to add suppliers. "}
                </p>
                {products.length === 0 && (
                    <Button asChild className="mt-4 mr-2">
                        <Link href="/inventory">Go to Inventory</Link>
                    </Button>
                )}
                 {suppliers.length === 0 && (
                    <Button asChild className="mt-4">
                        <Link href="/suppliers">Go to Suppliers</Link>
                    </Button>
                )}
            </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Purchase Entry</h1>
      <p className="text-muted-foreground mb-6">
        Record items that have arrived from a supplier to update your inventory stock.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('purchaseOrderId', ''); // Reset PO when supplier changes
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a supplier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {watchedSupplierId && (
              <FormField
                control={form.control}
                name="purchaseOrderId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Purchase Order (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Import from a PO..." />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {availablePurchaseOrders.map((po: PurchaseOrder) => (
                            <SelectItem key={po.id} value={po.id}>{po.poNumber} - {new Date(po.date).toLocaleDateString()}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="entryDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Entry Date</FormLabel>
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
          </div>

          <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Received Items</CardTitle>
                    <Button
                        type="button"
                        onClick={() => append({ productId: '', quantityReceived: 1 })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Item
                    </Button>
                </div>
                <CardDescription>
                    List all items and quantities received in this shipment.
                </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-3/5">Item Name</TableHead>
                    <TableHead>Quantity Received</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.productId`}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an item..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products.map(product => (
                                  <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantityReceived`}
                          render={({ field }) => (
                            <Input type="number" step="any" {...field} />
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
               <FormMessage>{form.formState.errors.items?.root?.message || form.formState.errors.items?.message}</FormMessage>
            </CardContent>
          </Card>

           <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="e.g. Shipment arrived in good condition." {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Save Entry and Update Stock</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

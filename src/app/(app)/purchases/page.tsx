
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { Purchase } from '@/lib/types';
import { generateId } from '@/lib/utils';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';

const purchaseFormSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  date: z.string().min(1, 'Date is required'),
  vendorName: z.string().min(1, 'Vendor name is required'),
  items: z.array(z.object({
    productId: z.string().min(1, 'Please select a product.'),
    quantity: z.coerce.number().gt(0, 'Quantity must be greater than 0'),
    price: z.coerce.number().gt(0, 'Price must be greater than 0'),
  })).min(1, 'At least one item is required'),
});

export default function PurchasePage() {
  const router = useRouter();
  const { products, addPurchase, units } = useApp();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof purchaseFormSchema>>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      invoiceNumber: '',
      date: new Date().toISOString().split('T')[0],
      vendorName: '',
      items: [{ productId: '', quantity: 1, price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const onSubmit = (values: z.infer<typeof purchaseFormSchema>) => {
    const totalAmount = values.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const purchaseData: Purchase = {
      id: generateId(),
      invoiceNumber: values.invoiceNumber,
      date: new Date(values.date).toISOString(),
      vendorName: values.vendorName,
      items: values.items,
      totalAmount: totalAmount,
    };

    addPurchase(purchaseData);
    toast({ title: "Success", description: "Purchase recorded and inventory updated." });
    router.push('/inventory');
  };

  const getUnitName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return '';
    const unit = units.find(u => u.id === product.unitId);
    return unit ? unit.name : '';
  }

  return (
    <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">New Purchase Entry</h1>
            <p className="text-muted-foreground">Record a new purchase to update your inventory.</p>
          </div>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">You need to add products to your inventory before you can record a purchase.</p>
                <Button asChild className="mt-4">
                    <Link href="/inventory">Go to Inventory</Link>
                </Button>
            </CardContent>
          </Card>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Details</CardTitle>
                <CardDescription>Enter vendor and purchase details.</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="vendorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/2">Product</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead />
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
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a product" />
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
                                            name={`items.${index}.quantity`}
                                            render={({ field }) => (
                                                <Input type="number" step="any" {...field} />
                                            )}
                                        />
                                    </TableCell>
                                     <TableCell>
                                        {getUnitName(form.watch(`items.${index}.productId`))}
                                    </TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.price`}
                                            render={({ field }) => (
                                                <Input type="number" step="any" {...field} />
                                            )}
                                        />
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
                        onClick={() => append({ productId: '', quantity: 1, price: 0 })}
                        >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Item
                    </Button>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit">
                Record Purchase
                </Button>
            </div>
          </form>
        </Form>
        )}
    </div>
  );
}

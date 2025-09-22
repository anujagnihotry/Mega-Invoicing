'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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

const purchaseFormSchema = z.object({
  productId: z.string().min(1, 'Please select a product.'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

export default function PurchasePage() {
  const router = useRouter();
  const { products, addPurchase } = useApp();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof purchaseFormSchema>>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      productId: '',
      quantity: 1,
    },
  });

  const onSubmit = (values: z.infer<typeof purchaseFormSchema>) => {
    const purchaseData: Purchase = {
      id: generateId(),
      productId: values.productId,
      quantity: values.quantity,
      purchaseDate: new Date().toISOString(),
    };

    addPurchase(purchaseData);
    toast({ title: "Success", description: "Purchase recorded and inventory updated." });
    router.push('/inventory');
  };

  return (
    <div className="max-w-2xl mx-auto">
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
                <CardDescription>Select a product and enter the quantity purchased.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

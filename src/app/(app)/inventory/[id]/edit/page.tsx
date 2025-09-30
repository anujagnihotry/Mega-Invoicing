
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.coerce.number().gt(0, 'Price must be greater than 0'),
  unitId: z.string().min(1, 'Unit is required'),
  categoryId: z.string().optional(),
  thresholdValue: z.coerce.number().optional(),
});

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const { getProduct, updateProduct, units, categories } = useApp();
    const { toast } = useToast();

    const productId = params.id as string;
    const product = getProduct(productId);

    const form = useForm<z.infer<typeof productFormSchema>>({
        resolver: zodResolver(productFormSchema),
        // Default values are set here, but will be overwritten by useEffect
        defaultValues: product ? { 
            ...product, 
            categoryId: product.categoryId || '',
            thresholdValue: product.thresholdValue || 0,
        } : {},
    });

    React.useEffect(() => {
        if (product) {
            form.reset({
              ...product,
              categoryId: product.categoryId || '',
              thresholdValue: product.thresholdValue || 0,
            });
        } else if (productId) {
            // If product is not found after some time, it probably doesn't exist
            const timer = setTimeout(() => {
                if (!getProduct(productId)) {
                    toast({ variant: 'destructive', title: 'Error', description: 'Product not found.' });
                    router.replace('/inventory');
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [product, productId, form, router, getProduct, toast]);

    const onSubmit = (values: z.infer<typeof productFormSchema>) => {
        if (!product) return;
        updateProduct({ 
            id: product.id,
            sales: product.sales, 
            ...values 
        });
        toast({ title: "Success", description: "Product updated successfully." });
        router.push('/inventory');
    };
    
    if (!product) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
             <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Details</CardTitle>
                            <CardDescription>Update the information for the product.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product Name</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Price</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unitId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a unit" />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                            {units.map(unit => (
                                                <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                                            ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category (Optional)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ''}>
                                            <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                            {categories.map(category => (
                                                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                                            ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="thresholdValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Threshold (Optional)</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.push('/inventory')}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}


'use client';

import * as React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApp } from '@/hooks/use-app';
import { Product } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const addProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.coerce.number().gt(0, 'Price must be greater than 0'),
  unitId: z.string().min(1, 'Unit is required'),
  categoryId: z.string().optional(),
});

export default function InventoryPage() {
  const { products, addProduct, units, categories, getAvailableStock } = useApp();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const form = useForm<z.infer<typeof addProductSchema>>({
    resolver: zodResolver(addProductSchema),
    defaultValues: {
      name: '',
      price: 0,
      unitId: '',
      categoryId: '',
    },
  });

  const onSubmit = (values: z.infer<typeof addProductSchema>) => {
    addProduct({ 
        name: values.name,
        price: values.price,
        unitId: values.unitId,
        categoryId: values.categoryId,
    });
    form.reset();
    setIsDialogOpen(false);
  };
  
  const getUnitName = (unitId: string) => {
    const unit = units.find(u => u.id === unitId);
    return unit ? unit.name : 'N/A';
  }

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'N/A';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'N/A';
  }

  return (
    <>
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Inventory</h1>
        <div className="ml-auto flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={units.length === 0}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  {units.length > 0 ? "Enter the details of the new product." : "Please add a unit in the Unit Master page before adding products."}
                </DialogDescription>
              </DialogHeader>
              {units.length > 0 && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. T-Shirt" {...field} />
                          </FormControl>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Button type="submit">Add Product</Button>
                  </form>
                </Form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Manage your product inventory.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Available Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length > 0 ? (
                products.map((product: Product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                    <TableCell>{getUnitName(product.unitId)}</TableCell>
                    <TableCell className="text-right">{getAvailableStock(product.id)}</TableCell>
                     <TableCell className="text-right">{product.price}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No products found. Add one to get started.
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

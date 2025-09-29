
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { Purchase, PurchaseStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const purchaseFormSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  supplierId: z.string().min(1, 'Supplier is required'),
  orderDate: z.date({ required_error: 'Order date is required' }),
  expectedDeliveryDate: z.date().optional(),
  notes: z.string().optional(),
  status: z.enum(['Pending', 'Completed', 'Cancelled']),
  items: z.array(z.object({
    productId: z.string().min(1, 'Please select a product.'),
    quantity: z.coerce.number().gt(0, 'Quantity must be greater than 0'),
    price: z.coerce.number().gt(0, 'Price must be greater than 0'),
  })).min(1, 'At least one item is required'),
});

export default function EditPurchasePage() {
    const router = useRouter();
    const params = useParams();
    const { products, updatePurchase, units, suppliers, purchases } = useApp();
    const { toast } = useToast();
    const { id } = params;

    const purchase = purchases.find(p => p.id === id);

    const form = useForm<z.infer<typeof purchaseFormSchema>>({
        resolver: zodResolver(purchaseFormSchema),
        defaultValues: {
            items: [],
        },
    });

    useEffect(() => {
        if (purchase) {
            form.reset({
                ...purchase,
                orderDate: new Date(purchase.date),
                expectedDeliveryDate: purchase.expectedDeliveryDate ? new Date(purchase.expectedDeliveryDate) : undefined,
            });
        }
    }, [purchase, form]);

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items"
    });

    const onSubmit = (values: z.infer<typeof purchaseFormSchema>) => {
        if (!purchase) return;

        const totalAmount = values.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const supplier = suppliers.find(s => s.id === values.supplierId);
        
        if (!supplier) {
            toast({ variant: "destructive", title: "Error", description: "Invalid supplier selected." });
            return;
        }

        const updatedPurchase: Purchase = {
          ...purchase,
          invoiceNumber: values.invoiceNumber,
          supplierId: values.supplierId,
          vendorName: supplier.name,
          date: values.orderDate.toISOString(),
          expectedDeliveryDate: values.expectedDeliveryDate?.toISOString(),
          notes: values.notes,
          status: values.status,
          items: values.items,
          totalAmount: totalAmount,
        };

        updatePurchase(updatedPurchase);
        toast({ title: "Success", description: "Purchase order updated." });
        router.push(`/suppliers/${purchase.supplierId}/view`);
    };

    const getUnitName = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (!product) return '';
        const unit = units.find(u => u.id === product.unitId);
        return unit ? unit.name : '';
    }
    
    if (!purchase) {
         return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Edit Purchase Order {purchase.invoiceNumber}</h1>
            
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="supplierId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Supplier</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormField
                        control={form.control}
                        name="orderDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Order Date</FormLabel>
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
                        name="expectedDeliveryDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Expected Delivery Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant="outline"
                                    className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                                    >
                                    {field.value ? format(field.value, 'PPP') : <span>dd-mm-yyyy</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                
                 <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Items</CardTitle>
                            <Button
                                type="button"
                                onClick={() => append({ productId: '', quantity: 1, price: 0 })}
                                >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Item
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-2/5">Item Name</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead>Unit Price</TableHead>
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
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                        <Input {...field} type="hidden" />
                    )}
                />

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit">
                        Save Changes
                    </Button>
                </div>
            </form>
            </Form>
        </div>
    );
}

    
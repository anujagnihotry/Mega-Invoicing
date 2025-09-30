
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { PurchaseOrder, PurchaseOrderStatus } from '@/lib/types';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const purchaseOrderFormSchema = z.object({
  poNumber: z.string().min(1, 'PO number is required'),
  supplierId: z.string().min(1, 'Supplier is required'),
  orderDate: z.date({ required_error: 'Order date is required' }),
  expectedDeliveryDate: z.date().optional(),
  notes: z.string().optional(),
  status: z.enum(['Pending', 'Completed', 'Cancelled', 'Partially Fulfilled']),
  items: z.array(z.object({
    productId: z.string().min(1, 'Please select a product.'),
    quantity: z.coerce.number().gt(0, 'Quantity must be greater than 0'),
    quantityReceived: z.coerce.number().min(0, 'Received quantity cannot be negative'),
    price: z.coerce.number().gt(0, 'Price must be greater than 0'),
  })).min(1, 'At least one item is required'),
});

type PurchaseOrderFormProps = {
  purchaseOrder?: PurchaseOrder;
};

export function PurchaseOrderForm({ purchaseOrder }: PurchaseOrderFormProps) {
  const router = useRouter();
  const { products, addPurchaseOrder, updatePurchaseOrder, units, suppliers, purchaseOrders } = useApp();
  const { toast } = useToast();

  const defaultValues = purchaseOrder ? {
    ...purchaseOrder,
    orderDate: new Date(purchaseOrder.date),
    expectedDeliveryDate: purchaseOrder.expectedDeliveryDate ? new Date(purchaseOrder.expectedDeliveryDate) : undefined,
  } : {
    poNumber: `PO-${(purchaseOrders.length + 1).toString().padStart(4, '0')}`,
    supplierId: '',
    orderDate: new Date(),
    expectedDeliveryDate: undefined,
    notes: '',
    items: [],
    status: 'Pending' as PurchaseOrderStatus,
  };

  const form = useForm<z.infer<typeof purchaseOrderFormSchema>>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (purchaseOrder) {
      form.reset({
        ...purchaseOrder,
        orderDate: new Date(purchaseOrder.date),
        expectedDeliveryDate: purchaseOrder.expectedDeliveryDate ? new Date(purchaseOrder.expectedDeliveryDate) : undefined,
        items: purchaseOrder.items.map(item => ({
            ...item,
            quantityReceived: item.quantityReceived || 0 // ensure it exists
        })),
      });
    }
  }, [purchaseOrder, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  const onSubmit = (values: z.infer<typeof purchaseOrderFormSchema>) => {
    const totalAmount = values.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const supplier = suppliers.find(s => s.id === values.supplierId);
    
    if (!supplier) {
        toast({ variant: "destructive", title: "Error", description: "Invalid supplier selected." });
        return;
    }

    const poData = {
      poNumber: values.poNumber,
      supplierId: values.supplierId,
      vendorName: supplier.name,
      date: values.orderDate.toISOString(),
      expectedDeliveryDate: values.expectedDeliveryDate?.toISOString(),
      notes: values.notes,
      status: values.status,
      items: values.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          quantityReceived: item.quantityReceived,
          price: item.price
      })),
      totalAmount: totalAmount,
    };
    
    if (purchaseOrder) {
        updatePurchaseOrder({ ...poData, id: purchaseOrder.id });
        toast({ title: "Success", description: "Purchase order updated." });
        router.push(`/suppliers/${purchaseOrder.supplierId}/view`);
    } else {
        addPurchaseOrder(poData as Omit<PurchaseOrder, 'id'>);
        toast({ title: "Success", description: "Purchase order created." });
        router.push('/suppliers');
    }
  };
  
  const getUnitName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return '';
    const unit = units.find(u => u.id === product.unitId);
    return unit ? unit.name : '';
  }

  const isFormEmpty = products.length === 0 || suppliers.length === 0;

  return (
    <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{purchaseOrder ? `Edit Purchase Order ${purchaseOrder.poNumber}`: 'Create Purchase Order'}</h1>
        
        {isFormEmpty && !purchaseOrder ? (
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
        ) : (
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
                            <SelectItem value="Partially Fulfilled">Partially Fulfilled</SelectItem>
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
                            onClick={() => append({ productId: '', quantity: 1, quantityReceived: 0, price: 0 })}
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
                name="poNumber"
                render={({ field }) => (
                    <Input {...field} type="hidden" />
                )}
            />

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit">
                    {purchaseOrder ? 'Save Changes' : 'Save'}
                </Button>
            </div>
          </form>
        </Form>
        )}
    </div>
  );
}

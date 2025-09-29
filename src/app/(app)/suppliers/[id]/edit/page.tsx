
'use client';

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
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';

const supplierFormSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
});

export default function EditSupplierPage() {
    const router = useRouter();
    const params = useParams();
    const { getSupplier, updateSupplier } = useApp();
    const { toast } = useToast();

    const supplierId = params.id as string;
    const supplier = getSupplier(supplierId);

    const form = useForm<z.infer<typeof supplierFormSchema>>({
        resolver: zodResolver(supplierFormSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            address: '',
        },
    });

    useEffect(() => {
        if (supplier) {
            form.reset(supplier);
        } else if(supplierId) {
            // Redirect if supplier not found, maybe after a small delay to ensure data has loaded
            setTimeout(() => router.replace('/suppliers'), 500);
        }
    }, [supplier, supplierId, form, router]);

    const onSubmit = (values: z.infer<typeof supplierFormSchema>) => {
        if (!supplier) return;
        updateSupplier({ id: supplier.id, ...values });
        toast({ title: "Success", description: "Supplier updated successfully." });
        router.push('/suppliers');
    };
    
    if (!supplier) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
             <h1 className="text-2xl font-bold mb-4">Edit Supplier</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Supplier Details</CardTitle>
                            <CardDescription>Update the information for the supplier.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Supplier Name</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl><Input type="email" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl><Textarea {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => router.push('/suppliers')}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}

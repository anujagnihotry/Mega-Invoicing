
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

const supplierFormSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
});

export default function NewSupplierPage() {
    const router = useRouter();
    const { addSupplier } = useApp();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof supplierFormSchema>>({
        resolver: zodResolver(supplierFormSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            address: '',
        },
    });

    const onSubmit = (values: z.infer<typeof supplierFormSchema>) => {
        addSupplier(values);
        toast({ title: "Success", description: "Supplier added successfully." });
        router.push('/suppliers');
    };

    return (
        <div className="max-w-2xl mx-auto">
             <h1 className="text-2xl font-bold mb-4">Add New Supplier</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Supplier Details</CardTitle>
                            <CardDescription>Fill in the information for the new supplier.</CardDescription>
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
                        <Button type="submit">Add Supplier</Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}

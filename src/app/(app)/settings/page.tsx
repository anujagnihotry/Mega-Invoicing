
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react';

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'];

const settingsSchema = z.object({
  currency: z.string().min(1, 'Currency is required'),
  companyProfile: z.object({
    name: z.string().min(1, 'Company name is required'),
    address: z.string().min(1, 'Address is required'),
    phone: z.string().min(1, 'Phone number is required'),
    taxNumber: z.string().optional(),
  }),
});

const taxFormSchema = z.object({
    name: z.string().min(1, 'Tax name is required'),
    rate: z.coerce.number().min(0, 'Rate must be non-negative').max(100, 'Rate cannot exceed 100'),
});

export default function SettingsPage() {
  const { settings, updateSettings, addTax } = useApp();
  const { toast } = useToast();
  const [isTaxDialogOpen, setIsTaxDialogOpen] = React.useState(false);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });
  
  const taxForm = useForm<z.infer<typeof taxFormSchema>>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: { name: '', rate: 0 },
  });

  React.useEffect(() => {
    form.reset(settings);
  }, [settings, form]);

  const onSubmit = (values: z.infer<typeof settingsSchema>) => {
    updateSettings(values);
    toast({
      title: 'Settings Saved',
      description: 'Your changes have been saved successfully.',
    });
  };
  
  const onTaxSubmit = (values: z.infer<typeof taxFormSchema>) => {
    addTax(values);
    toast({ title: 'Tax Added', description: `${values.name} has been added.` });
    taxForm.reset();
    setIsTaxDialogOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your application and company settings.</p>
          </div>
          <div className="ml-auto">
            <Button type="submit">Save Changes</Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Company Profile</CardTitle>
                    <CardDescription>Update your company's information. This will appear on invoices.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                    control={form.control}
                    name="companyProfile.name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Acme Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="companyProfile.address"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                            <Textarea placeholder="123 Main St, Anytown, USA" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="companyProfile.phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="companyProfile.taxNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tax Number (Optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="TAX-123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                    <CardDescription>Customize application settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Default Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a currency" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {currencies.map(currency => (
                                <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
            </Card>
            
            <Card className="lg:col-span-3">
                <CardHeader className="flex flex-row items-center">
                    <div>
                        <CardTitle>Tax Master</CardTitle>
                        <CardDescription>Manage tax rates for your invoices.</CardDescription>
                    </div>
                     <div className="ml-auto">
                        <Dialog open={isTaxDialogOpen} onOpenChange={setIsTaxDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    New Tax
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Tax Rate</DialogTitle>
                                </DialogHeader>
                                <Form {...taxForm}>
                                    <form onSubmit={taxForm.handleSubmit(onTaxSubmit)} className="space-y-4">
                                        <FormField
                                            control={taxForm.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tax Name</FormLabel>
                                                    <FormControl><Input placeholder="e.g. GST, VAT" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={taxForm.control}
                                            name="rate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Rate (%)</FormLabel>
                                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit">Add Tax</Button>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tax Name</TableHead>
                                <TableHead className="text-right">Rate (%)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {settings.taxes?.length > 0 ? (
                                settings.taxes.map((tax) => (
                                    <TableRow key={tax.id}>
                                        <TableCell className="font-medium">{tax.name}</TableCell>
                                        <TableCell className="text-right">{tax.rate.toFixed(2)}%</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-24 text-center">
                                        No tax rates found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </form>
    </Form>
  );
}

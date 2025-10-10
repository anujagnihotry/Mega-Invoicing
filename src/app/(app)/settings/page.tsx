

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MoreHorizontal, PlusCircle, Trash2, Pencil, Image as ImageIcon, Upload, AlertTriangle } from 'lucide-react';
import type { AppSettings, Tax } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'];

const settingsSchema = z.object({
  appName: z.string().min(1, 'Application name is required'),
  appLogo: z.string().optional().or(z.literal('')),
  currency: z.string().min(1, 'Currency is required'),
  companyProfile: z.object({
    name: z.string().min(1, 'Company name is required'),
    address: z.string().min(1, 'Address is required'),
    phone: z.string().min(1, 'Phone number is required'),
    taxNumber: z.string().optional(),
  }),
  smtp: z.object({
      host: z.string().min(1, 'SMTP Host is required'),
      port: z.coerce.number().gt(0, 'Port must be a positive number'),
      user: z.string().min(1, 'SMTP User is required'),
      pass: z.string().min(1, 'SMTP Password is required'),
  }),
  email: z.object({
      sendOnNewInvoice: z.boolean(),
  }),
  stripe: z.object({
    secretKey: z.string().refine(val => val.startsWith('sk_'), { message: 'Secret key must start with "sk_"' }),
    publishableKey: z.string().refine(val => val.startsWith('pk_'), { message: 'Publishable key must start with "pk_"' }),
    dashboardUrl: z.string().url('Must be a valid URL'),
    webhookUrl: z.string().url('Must be a valid URL'),
  }),
});

const taxFormSchema = z.object({
    name: z.string().min(1, 'Tax name is required'),
    rate: z.coerce.number().min(0, 'Rate must be non-negative').max(100, 'Rate cannot exceed 100'),
});

export default function SettingsPage() {
  const { settings, updateSettings, addTax, updateTax, deleteTax } = useApp();
  const { toast } = useToast();

  const [isAddTaxDialogOpen, setIsAddTaxDialogOpen] = React.useState(false);
  const [isEditTaxDialogOpen, setIsEditTaxDialogOpen] = React.useState(false);
  const [editingTax, setEditingTax] = React.useState<Tax | null>(null);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });
  
  React.useEffect(() => {
    const webhookUrl = `${window.location.origin}/api/webhooks/stripe`;
    const newSettings = { ...settings };
    if (!newSettings.stripe) {
      newSettings.stripe = {
        secretKey: '',
        publishableKey: '',
        dashboardUrl: 'https://dashboard.stripe.com',
        webhookUrl: webhookUrl,
      }
    }
    newSettings.stripe.webhookUrl = webhookUrl;
    form.reset(newSettings);
  }, [settings, form]);


  const taxForm = useForm<z.infer<typeof taxFormSchema>>({
    resolver: zodResolver(taxFormSchema),
    defaultValues: { name: '', rate: 0 },
  });

  React.useEffect(() => {
    if (editingTax) {
      taxForm.reset({ name: editingTax.name, rate: editingTax.rate });
    } else {
      taxForm.reset({ name: '', rate: 0 });
    }
  }, [editingTax, taxForm]);


  const onSubmit = (values: z.infer<typeof settingsSchema>) => {
    updateSettings(values);
    toast({
      title: 'Settings Saved',
      description: 'Your application settings have been saved.',
    });
  };
  
  const onAddTaxSubmit = (values: z.infer<typeof taxFormSchema>) => {
    addTax(values);
    toast({ title: 'Tax Added', description: `${values.name} has been added.` });
    taxForm.reset();
    setIsAddTaxDialogOpen(false);
  }
  
  const onEditTaxSubmit = (values: z.infer<typeof taxFormSchema>) => {
    if (!editingTax) return;
    updateTax({ id: editingTax.id, ...values });
    toast({ title: 'Tax Updated', description: `${values.name} has been updated.` });
    setEditingTax(null);
    setIsEditTaxDialogOpen(false);
  };
  
  const handleDeleteTax = (taxId: string) => {
    deleteTax(taxId);
    toast({ title: 'Tax Deleted', description: 'The tax rate has been deleted.' });
  }

  const handleEditClick = (tax: Tax) => {
    setEditingTax(tax);
    setIsEditTaxDialogOpen(true);
  }
  
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('appLogo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const currentTaxes = settings.taxes || [];
  const appLogo = form.watch('appLogo');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application and company settings.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                  <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="appName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Application Name</FormLabel>
                            <FormControl>
                              <Input placeholder="SwiftInvoice" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name="appLogo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Application Logo</FormLabel>
                             <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-md border flex items-center justify-center bg-muted overflow-hidden">
                                  {appLogo ? (
                                    <Image src={appLogo} alt="App Logo" width={64} height={64} className="object-contain" />
                                  ) : (
                                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                  )}
                                </div>
                                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Browse
                                </Button>
                                <FormControl>
                                    <Input 
                                        type="file" 
                                        className="hidden" 
                                        ref={fileInputRef}
                                        onChange={handleLogoChange}
                                        accept="image/png, image/jpeg, image/gif, image/svg+xml"
                                    />
                                </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
          </div>

          <Card>
                <CardHeader>
                    <CardTitle>Stripe Payments</CardTitle>
                    <CardDescription>
                        Configure your Stripe account to accept payments via generated links.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Security Warning</AlertTitle>
                        <AlertDescription>
                           Your Stripe Secret Key is a sensitive credential. It will be stored in your browser's local storage. Avoid using this on public or shared computers.
                        </AlertDescription>
                    </Alert>
                    <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="stripe.secretKey"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Stripe Secret Key</FormLabel>
                                    <FormControl><Input type="password" placeholder="sk_test_..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="stripe.publishableKey"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Stripe Publishable Key</FormLabel>
                                    <FormControl><Input placeholder="pk_test_..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="stripe.dashboardUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stripe Dashboard URL</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="stripe.webhookUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Webhook URL (Read-only)</FormLabel>
                                <FormControl><Input readOnly {...field} /></FormControl>
                                <p className="text-sm text-muted-foreground">
                                    Use this URL to set up a webhook in your Stripe Dashboard to listen for payment events.
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
          
           <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>SMTP Configuration</CardTitle>
                    <CardDescription>Configure your email server to send invoices and notifications.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField
                        control={form.control}
                        name="smtp.host"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>SMTP Host</FormLabel>
                                <FormControl><Input placeholder="smtp.example.com" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="smtp.port"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>SMTP Port</FormLabel>
                                <FormControl><Input type="number" placeholder="587" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="smtp.user"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>SMTP Username</FormLabel>
                                <FormControl><Input placeholder="user@example.com" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="smtp.pass"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>SMTP Password</FormLabel>
                                <FormControl><Input type="password" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
            
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>Manage automated email settings.</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="email.sendOnNewInvoice"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Send Email on New Invoice</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically send an email to the client when a new invoice is created.
                                    </p>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>

          <div className="flex justify-end">
             <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Form>
      
      <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center">
              <div>
                  <CardTitle>Tax Master</CardTitle>
                  <CardDescription>Manage tax rates for your invoices.</CardDescription>
              </div>
               <div className="ml-auto">
                  <Dialog open={isAddTaxDialogOpen} onOpenChange={setIsAddTaxDialogOpen}>
                      <DialogTrigger asChild>
                          <Button size="sm" onClick={() => taxForm.reset()}>
                              <PlusCircle className="h-4 w-4 mr-2" />
                              New Tax
                          </Button>
                      </DialogTrigger>
                      <DialogContent>
                          <DialogHeader>
                              <DialogTitle>Add New Tax Rate</DialogTitle>
                          </DialogHeader>
                          <Form {...taxForm}>
                              <form onSubmit={taxForm.handleSubmit(onAddTaxSubmit)} className="space-y-4">
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
                          <TableHead className="text-right w-[150px]">Rate (%)</TableHead>
                          <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {currentTaxes.length > 0 ? (
                          currentTaxes.map((tax: Tax) => (
                              <TableRow key={tax.id}>
                                  <TableCell className="font-medium">{tax.name}</TableCell>
                                  <TableCell className="text-right">{tax.rate.toFixed(2)}%</TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => handleEditClick(tax)}>
                                                <Pencil className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the tax rate.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteTax(tax.id)}>
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          ))
                      ) : (
                          <TableRow>
                              <TableCell colSpan={3} className="h-24 text-center">
                                  No tax rates found. Add one to get started.
                              </TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
      
       <Dialog open={isEditTaxDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) setEditingTax(null);
            setIsEditTaxDialogOpen(isOpen);
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Tax Rate</DialogTitle>
                </DialogHeader>
                <Form {...taxForm}>
                    <form onSubmit={taxForm.handleSubmit(onEditTaxSubmit)} className="space-y-4">
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
                        <Button type="submit">Save Changes</Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    </div>
  );
}

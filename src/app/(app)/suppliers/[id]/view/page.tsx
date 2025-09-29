
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { useEffect, useState, useMemo } from 'react';
import type { Supplier, Purchase, PurchaseStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Mail, Phone, MapPin, PlusCircle, PackageOpen, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export default function ViewSupplierPage() {
    const router = useRouter();
    const params = useParams();
    const { getSupplier, purchases, settings } = useApp();
    const [supplier, setSupplier] = useState<Supplier | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    const supplierId = params.id as string;

    useEffect(() => {
        if (supplierId) {
            const foundSupplier = getSupplier(supplierId);
            if (foundSupplier) {
                setSupplier(foundSupplier);
            } else {
                // Keep the router.replace for safety, but the initial check should handle it
                router.replace('/suppliers');
            }
        }
        setLoading(false);
    }, [supplierId, getSupplier, router]);

    const supplierPurchases = useMemo(() => {
        if (!supplier) return [];
        return purchases.filter(p => p.supplierId === supplier.id);
    }, [purchases, supplier]);

    const getStatusBadgeVariant = (status: PurchaseStatus) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100';
            case 'Completed':
                return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100';
            case 'Cancelled':
                return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!supplier) {
        return (
            <div className="text-center p-8">
                <h1 className="text-xl text-muted-foreground">Supplier not found.</h1>
                <Button asChild variant="link">
                    <Link href="/suppliers">Return to Suppliers List</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">{supplier.name}</h1>

            <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                    <Building className="w-8 h-8 text-muted-foreground" />
                    <div>
                        <CardTitle>Supplier Information</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                            <p>{supplier.name}</p>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <a href={`tel:${supplier.phone}`} className="text-primary hover:underline">{supplier.phone}</a>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                             <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">{supplier.email}</a>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <p>{supplier.address}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <PackageOpen className="w-8 h-8 text-muted-foreground" />
                        <div>
                            <CardTitle>Purchase Orders</CardTitle>
                            <CardDescription>View all purchase orders for this supplier</CardDescription>
                        </div>
                    </div>
                    <Button asChild>
                        <Link href="/purchases">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Purchase Order
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>PO Number</TableHead>
                                <TableHead>Order Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {supplierPurchases.length > 0 ? (
                                supplierPurchases.map((purchase: Purchase) => (
                                    <TableRow key={purchase.id}>
                                        <TableCell className="font-medium">{purchase.invoiceNumber}</TableCell>
                                        <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                                        <TableCell>{formatCurrency(purchase.totalAmount, settings.currency)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(getStatusBadgeVariant(purchase.status))}>
                                                {purchase.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <PackageOpen className="h-12 w-12 text-muted-foreground" />
                                            <p className="text-muted-foreground">No purchase orders found for this supplier.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}


'use client';

import type { Purchase, AppSettings, Product, Unit, Supplier } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PurchaseOrderDisplayProps {
  purchase: Purchase;
  settings: AppSettings;
  products: Product[];
  units: Unit[];
  supplier?: Supplier;
}

export function PurchaseOrderDisplay({ purchase, settings, products, units, supplier }: PurchaseOrderDisplayProps) {
  
  const getItemDescription = (productId: string) => {
      const product = products.find(p => p.id === productId);
      return product?.name || 'Unknown Item';
  }

  const getUnitName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return '';
    const unit = units.find(u => u.id === product.unitId);
    return unit ? unit.name : '';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-4 sm:p-10 print-card">
      <CardHeader className="p-0">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{settings.companyProfile.name}</h1>
            <p className="text-muted-foreground">{settings.companyProfile.address}</p>
            <p className="text-muted-foreground">{settings.companyProfile.phone}</p>
          </div>
          <h2 className="text-4xl font-bold text-muted-foreground tracking-widest uppercase">Purchase Order</h2>
        </div>
      </CardHeader>
      <CardContent className="p-0 mt-10">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Supplier</h3>
            <p className="font-bold">{supplier?.name}</p>
            <p className="text-muted-foreground">{supplier?.email}</p>
            <p className="text-muted-foreground">{supplier?.phone}</p>
            <p className="text-muted-foreground">{supplier?.address}</p>
          </div>
          <div className="text-right">
            <div className="grid grid-cols-2">
              <span className="font-semibold">PO #</span>
              <span>{purchase.invoiceNumber}</span>
            </div>
            <div className="grid grid-cols-2">
              <span className="font-semibold">Order Date</span>
              <span>{new Date(purchase.date).toLocaleDateString()}</span>
            </div>
             {purchase.expectedDeliveryDate && (
                <div className="grid grid-cols-2">
                    <span className="font-semibold">Expected By</span>
                    <span>{new Date(purchase.expectedDeliveryDate).toLocaleDateString()}</span>
                </div>
             )}
            <Badge className="mt-4">{purchase.status}</Badge>
          </div>
        </div>

        <Separator className="my-8" />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[45%]">Item</TableHead>
              <TableHead className="text-center">Quantity</TableHead>
              <TableHead className="text-center">Unit</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchase.items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{getItemDescription(item.productId)}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-center">{getUnitName(item.productId)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.price, settings.currency)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.price * item.quantity, settings.currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Separator className="my-8" />

        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(purchase.totalAmount, settings.currency)}</span>
            </div>
          </div>
        </div>
        
        {purchase.notes && (
            <div className="mt-16">
              <h3 className="font-semibold">Notes</h3>
              <p className="text-muted-foreground text-sm">{purchase.notes}</p>
            </div>
        )}

      </CardContent>
    </Card>
  );
}

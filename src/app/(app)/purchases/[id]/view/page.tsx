
'use client';

import { useParams } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { useEffect, useState } from 'react';
import type { PurchaseOrder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import Link from 'next/link';
import { PurchaseOrderDisplay } from '@/components/purchase-order-display';

export default function ViewPurchaseOrderPage() {
  const params = useParams();
  const { purchaseOrders, settings, products, units, suppliers } = useApp();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | undefined>(undefined);

  useEffect(() => {
    const purchaseOrderId = params.id as string;
    if (purchaseOrderId) {
      const foundPurchase = purchaseOrders.find(p => p.id === purchaseOrderId);
      setPurchaseOrder(foundPurchase);
    }
  }, [params.id, purchaseOrders]);
  
  if (!purchaseOrder) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center no-print">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  const supplier = suppliers.find(s => s.id === purchaseOrder.supplierId);

  return (
    <div className="print-container">
      <div className="flex items-center mb-4 no-print">
         <h1 className="font-semibold text-lg md:text-2xl">Purchase Order {purchaseOrder.poNumber}</h1>
         <div className="ml-auto">
            <Button asChild>
                <Link href={`/purchases/${purchaseOrder.id}/print`} target="_blank">
                    <Printer className="mr-2 h-4 w-4" />
                    Print / Download PDF
                </Link>
            </Button>
          </div>
      </div>
      <PurchaseOrderDisplay purchaseOrder={purchaseOrder} settings={settings} products={products} units={units} supplier={supplier} />
    </div>
  );
}


'use client';

import { useParams } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { useEffect, useState } from 'react';
import type { PurchaseOrder } from '@/lib/types';
import { PurchaseOrderDisplay } from '@/components/purchase-order-display';

export default function PrintPurchaseOrderPage() {
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
  
  useEffect(() => {
    if (purchaseOrder) {
      // Small timeout to allow everything to render before printing
      setTimeout(() => window.print(), 500);
    }
  }, [purchaseOrder]);

  if (!purchaseOrder) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  const supplier = suppliers.find(s => s.id === purchaseOrder.supplierId);

  return <PurchaseOrderDisplay purchaseOrder={purchaseOrder} settings={settings} products={products} units={units} supplier={supplier} />;
}

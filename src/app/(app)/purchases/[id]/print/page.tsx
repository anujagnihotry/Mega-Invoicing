
'use client';

import { useParams } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { useEffect, useState } from 'react';
import type { Purchase } from '@/lib/types';
import { PurchaseOrderDisplay } from '@/components/purchase-order-display';

export default function PrintPurchaseOrderPage() {
  const params = useParams();
  const { purchases, settings, products, units, suppliers } = useApp();
  const [purchase, setPurchase] = useState<Purchase | undefined>(undefined);

  useEffect(() => {
    const purchaseId = params.id as string;
    if (purchaseId) {
      const foundPurchase = purchases.find(p => p.id === purchaseId);
      setPurchase(foundPurchase);
    }
  }, [params.id, purchases]);
  
  useEffect(() => {
    if (purchase) {
      // Small timeout to allow everything to render before printing
      setTimeout(() => window.print(), 500);
    }
  }, [purchase]);

  if (!purchase) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  const supplier = suppliers.find(s => s.id === purchase.supplierId);

  return <PurchaseOrderDisplay purchase={purchase} settings={settings} products={products} units={units} supplier={supplier} />;
}

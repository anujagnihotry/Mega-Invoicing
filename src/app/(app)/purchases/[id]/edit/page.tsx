
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { PurchaseOrderForm } from '@/components/purchase-order-form';
import { useEffect, useState } from 'react';
import type { PurchaseOrder } from '@/lib/types';

export default function EditPurchaseOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { getPurchaseOrder } = useApp();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const purchaseOrderId = params.id as string;
    if (purchaseOrderId) {
      const foundPurchaseOrder = getPurchaseOrder(purchaseOrderId);
      if (foundPurchaseOrder) {
        setPurchaseOrder(foundPurchaseOrder);
      } else {
        router.replace('/suppliers');
      }
    }
    setLoading(false);
  }, [params.id, getPurchaseOrder, router]);

  if (loading) {
    return (
       <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!purchaseOrder) {
    return null; // Or a "Not Found" component
  }

  return <PurchaseOrderForm purchaseOrder={purchaseOrder} />;
}

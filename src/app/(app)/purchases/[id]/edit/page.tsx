
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { PurchaseForm } from '@/components/purchase-form';
import { useEffect, useState } from 'react';
import type { Purchase } from '@/lib/types';

export default function EditPurchasePage() {
  const router = useRouter();
  const params = useParams();
  const { getPurchase } = useApp(); // Assuming getPurchase exists
  const [purchase, setPurchase] = useState<Purchase | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const purchaseId = params.id as string;
    if (purchaseId) {
      // Simple direct find, assuming `getPurchase` is synchronous from a context
      const foundPurchase = getPurchase(purchaseId);
      if (foundPurchase) {
        setPurchase(foundPurchase);
      } else {
        // If not found, redirect. This could happen if the data is not yet loaded
        // or the ID is invalid.
        router.replace('/suppliers');
      }
    }
    setLoading(false);
  }, [params.id, getPurchase, router]);

  if (loading) {
    return (
       <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!purchase) {
    return null; // Or a "Not Found" component
  }

  return <PurchaseForm purchase={purchase} />;
}

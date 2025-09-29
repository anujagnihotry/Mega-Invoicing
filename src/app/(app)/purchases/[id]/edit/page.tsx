
'use client';

import { useParams } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { useMemo } from 'react';

export default function EditPurchasePage() {
    const params = useParams();
    const { id } = params;
    const { purchases } = useApp();

    const purchase = useMemo(() => {
        return purchases.find(p => p.id === id);
    }, [id, purchases]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold">Edit Purchase Order {purchase?.invoiceNumber || id}</h1>
            <p className="text-muted-foreground">This page is under construction.</p>
        </div>
    );
}

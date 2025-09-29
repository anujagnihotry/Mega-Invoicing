'use client';

import { useParams } from 'next/navigation';

export default function ViewPurchasePage() {
    const params = useParams();
    const { id } = params;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold">View Purchase Order {id}</h1>
            <p className="text-muted-foreground">This page is under construction.</p>
        </div>
    );
}

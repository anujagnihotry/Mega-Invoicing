'use client';

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '@/hooks/use-app';
import type { Product } from '@/lib/types';

export function LowStockNotification() {
  const { products, getAvailableStock } = useApp();

  const lowStockProducts = React.useMemo(() => {
    return products.filter(product => {
      if (product.thresholdValue === undefined || product.thresholdValue === null || product.thresholdValue <= 0) {
        return false;
      }
      const availableStock = getAvailableStock(product.id);
      return availableStock <= product.thresholdValue;
    });
  }, [products, getAvailableStock]);

  if (lowStockProducts.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Low Stock Warning</AlertTitle>
      <AlertDescription>
        The following items are running low on stock: {lowStockProducts.map(p => p.name).join(', ')}. Please reorder soon.
      </AlertDescription>
    </Alert>
  );
}

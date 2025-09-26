
'use client';

import { UseFieldArrayRemove, UseFormReturn } from 'react-hook-form';
import { FormField, FormControl, FormMessage } from '@/components/ui/form';
import { TableRow, TableCell } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { useApp } from '@/hooks/use-app';
import { formatCurrency } from '@/lib/utils';
import { Badge } from './ui/badge';

interface InvoiceItemRowProps {
  form: UseFormReturn<any>;
  index: number;
  remove: UseFieldArrayRemove;
  currentInvoiceId?: string;
}

export function InvoiceItemRow({ form, index, remove, currentInvoiceId }: InvoiceItemRowProps) {
  const { products, settings, getAvailableStock } = useApp();

  const watchItems = form.watch('items');
  const currentItem = watchItems[index];
  const selectedProductId = form.watch(`items.${index}.productId`);
  
  const availableStock = getAvailableStock(selectedProductId, currentInvoiceId);

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.productId`, productId);
      form.setValue(`items.${index}.description`, product.name);
      form.setValue(`items.${index}.price`, product.price);
    }
  };

  return (
    <TableRow>
      <TableCell>
        <FormField
          control={form.control}
          name={`items.${index}.productId`}
          render={({ field }) => (
            <>
              <Select onValueChange={handleProductChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </>
          )}
        />
      </TableCell>
       <TableCell>
        <Badge variant={availableStock > 0 ? "outline" : "destructive"}>{availableStock}</Badge>
      </TableCell>
      <TableCell>
        <FormField
          control={form.control}
          name={`items.${index}.quantity`}
          render={({ field }) => (
            <>
                <Input type="number" step="any" {...field} />
                <FormMessage />
            </>
          )}
        />
      </TableCell>
      <TableCell>
        <FormField
          control={form.control}
          name={`items.${index}.price`}
          render={({ field }) => (
            <>
                <Input type="number" step="any" {...field} />
                <FormMessage />
            </>
          )}
        />
      </TableCell>
      <TableCell className="text-right">
        {formatCurrency((currentItem?.quantity || 0) * (currentItem?.price || 0), settings.currency)}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="icon" onClick={() => remove(index)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

'use client';

import { useState } from 'react';
import { suggestInvoiceReadability, SuggestInvoiceReadabilityOutput } from '@/ai/flows/invoice-readability';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Loader2, Wand2 } from 'lucide-react';
import { Separator } from './ui/separator';

type InvoiceReadabilityModalProps = {
  invoiceText: string;
};

export function InvoiceReadabilityModal({ invoiceText }: InvoiceReadabilityModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestInvoiceReadabilityOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const result = await suggestInvoiceReadability({ invoiceText });
      setSuggestions(result);
    } catch (e) {
      console.error(e);
      setError('Failed to get suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Wand2 className="mr-2 h-4 w-4" />
          Improve Readability
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Invoice Readability Analysis</DialogTitle>
          <DialogDescription>
            Use AI to get suggestions for improving your invoice's clarity and professionalism.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[60vh] overflow-y-auto">
          <div>
            <h3 className="font-semibold mb-2">Current Invoice Text</h3>
            <div className="rounded-md border bg-muted p-4 text-sm whitespace-pre-wrap">{invoiceText || 'No text to analyze.'}</div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">AI Suggestions</h3>
            {isLoading ? (
              <div className="flex items-center justify-center rounded-md border p-4 h-full">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-muted-foreground">Analyzing your invoice...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center rounded-md border border-destructive/50 bg-destructive/10 p-4 h-full">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            ) : suggestions ? (
              <div className="space-y-4">
                <div className="rounded-md border p-4 bg-background">
                  <h4 className="font-medium mb-2">Suggested Text</h4>
                  <p className="text-sm whitespace-pre-wrap">{suggestions.suggestedText}</p>
                </div>
                <div className="rounded-md border p-4 bg-background">
                  <h4 className="font-medium mb-2">Suggested Line Spacing</h4>
                  <p className="text-sm">{suggestions.suggestedLineSpacing}</p>
                </div>
                <div className="rounded-md border p-4 bg-background">
                  <h4 className="font-medium mb-2">Explanation</h4>
                  <p className="text-sm text-muted-foreground">{suggestions.explanation}</p>
                </div>
              </div>
            ) : (
               <div className="flex items-center justify-center rounded-md border-dashed border-2 p-4 h-full">
                <div className="text-center">
                   <p className="text-muted-foreground text-sm">Click "Analyze Now" to get suggestions.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <Separator />
        <div className="flex justify-end pt-4">
          <Button onClick={handleAnalyze} disabled={isLoading || !invoiceText}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Analyze Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

'use server';

/**
 * @fileOverview A reusable workflow to generate a Stripe Payment Link.
 * 
 * - generateStripePaymentLink - A function that creates a Stripe payment link.
 * - GenerateStripePaymentLinkInput - The input type for the function.
 * - GenerateStripePaymentLinkOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateStripePaymentLinkInputSchema = z.object({
  invoice_id: z.string().describe('The ID of the invoice.'),
  amount: z.number().describe('The total amount for the payment.'),
  currency: z.string().describe('The currency for the payment (e.g., USD, INR).'),
  description: z.string().describe('A description for the payment.'),
  stripeSecretKey: z.string().describe('The Stripe Secret Key for authentication.'),
});
export type GenerateStripePaymentLinkInput = z.infer<typeof GenerateStripePaymentLinkInputSchema>;

const GenerateStripePaymentLinkOutputSchema = z.object({
  payment_link_url: z.string().url().describe('The generated Stripe payment link URL.'),
});
export type GenerateStripePaymentLinkOutput = z.infer<typeof GenerateStripePaymentLinkOutputSchema>;

export async function generateStripePaymentLink(
  input: GenerateStripePaymentLinkInput
): Promise<GenerateStripePaymentLinkOutput> {
  return generateStripePaymentLinkFlow(input);
}

const generateStripePaymentLinkFlow = ai.defineFlow(
  {
    name: 'generateStripePaymentLinkFlow',
    inputSchema: GenerateStripePaymentLinkInputSchema,
    outputSchema: GenerateStripePaymentLinkOutputSchema,
  },
  async (input) => {
    const { amount, currency, description, stripeSecretKey } = input;

    // Stripe requires the amount in the smallest currency unit (e.g., cents)
    const unitAmount = Math.round(amount * 100);

    const formData = new URLSearchParams();
    formData.append('line_items[0][price_data][currency]', currency);
    formData.append('line_items[0][price_data][product_data][name]', description);
    formData.append('line_items[0][price_data][unit_amount]', unitAmount.toString());
    formData.append('line_items[0][quantity]', '1');

    const response = await fetch('https://api.stripe.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Stripe API Error:', errorData);
      throw new Error(`Stripe API request failed: ${errorData.error.message}`);
    }

    const responseData = await response.json();
    
    return {
      payment_link_url: responseData.url,
    };
  }
);

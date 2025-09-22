'use server';

/**
 * @fileOverview AI tool suggests appropriate text and line spacing to maximize invoice readability.
 *
 * - suggestInvoiceReadability - A function that handles the invoice readability suggestion process.
 * - SuggestInvoiceReadabilityInput - The input type for the suggestInvoiceReadability function.
 * - SuggestInvoiceReadabilityOutput - The return type for the suggestInvoiceReadability function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestInvoiceReadabilityInputSchema = z.object({
  invoiceText: z.string().describe('The text content of the invoice.'),
  currentLineSpacing: z
    .number()
    .optional()
    .describe('The current line spacing of the invoice (optional).'),
});
export type SuggestInvoiceReadabilityInput = z.infer<
  typeof SuggestInvoiceReadabilityInputSchema
>;

const SuggestInvoiceReadabilityOutputSchema = z.object({
  suggestedText: z
    .string()
    .describe('The suggested text for improved readability.'),
  suggestedLineSpacing: z
    .number()
    .describe('The suggested line spacing for improved readability.'),
  explanation: z
    .string()
    .describe('Explanation of the readability suggestions.'),
});
export type SuggestInvoiceReadabilityOutput = z.infer<
  typeof SuggestInvoiceReadabilityOutputSchema
>;

export async function suggestInvoiceReadability(
  input: SuggestInvoiceReadabilityInput
): Promise<SuggestInvoiceReadabilityOutput> {
  return suggestInvoiceReadabilityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestInvoiceReadabilityPrompt',
  input: {schema: SuggestInvoiceReadabilityInputSchema},
  output: {schema: SuggestInvoiceReadabilityOutputSchema},
  prompt: `You are an AI assistant specialized in optimizing invoice readability.

  Given the following invoice text and current line spacing (if available), suggest improvements to the text and line spacing to maximize readability. Explain your suggestions.

  Invoice Text: {{{invoiceText}}}
  Current Line Spacing: {{{currentLineSpacing}}}

  Your goal is to make the invoice as easy to read and understand as possible.
  Consider things like font size, text formatting, and line spacing.
  The suggested line spacing should be a number.

  Please provide the suggested text, suggested line spacing, and an explanation of your suggestions.
  `,
});

const suggestInvoiceReadabilityFlow = ai.defineFlow(
  {
    name: 'suggestInvoiceReadabilityFlow',
    inputSchema: SuggestInvoiceReadabilityInputSchema,
    outputSchema: SuggestInvoiceReadabilityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


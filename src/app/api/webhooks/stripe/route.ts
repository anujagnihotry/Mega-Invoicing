import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

// This is a mock storage. In a real application, you would use a proper database
// or a more robust caching mechanism to get the webhook secret.
// For this example, we assume we can read it from a client-side accessible store,
// which is NOT secure for production but works for this localStorage-based app.
function getWebhookSecretFromMockStorage(): string | null {
  // This is a placeholder. In a real app, you'd fetch this from a secure server-side config.
  // Since our settings are in localStorage, we can't access them here.
  // We will pass it in the request from the client for this demo. This is NOT secure.
  return null;
}

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = headers().get('stripe-signature') as string;

    // In a real app, you would fetch the webhook secret from a secure server-side store.
    // For this example, we'll have to rely on an environment variable.
    // Make sure you set STRIPE_WEBHOOK_SECRET in your .env.local file.
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('Stripe webhook secret is not set in environment variables.');
        return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
        event = Stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Webhook signature verification failed: ${errorMessage}`);
        return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Metadata is on payment_intent, which is an ID on the session.
        // We need to retrieve the payment intent to get the metadata.
        if (session.payment_intent && session.metadata?.invoice_id) {
            const invoiceId = session.metadata.invoice_id;
            console.log(`Successful payment for invoice: ${invoiceId}`);
            
            // Here's the "hack" for localStorage sync.
            // We are returning a response that the client will use to set a localStorage item.
            // This is NOT a standard or secure way to handle webhooks.
            // A real implementation would update a database here.
            const response = NextResponse.json({ received: true, invoiceId: invoiceId });
            
            // This is a non-standard approach to bridge server and client.
            // In a real app, you would update your database here, and the client
            // would get the update via a real-time subscription or re-fetch.
            // Since we use localStorage, we have to use this workaround.
            // The key is that the client-side fetch handler will read this response
            // and update localStorage accordingly.
            return response;

        } else if (session.metadata?.invoice_id) {
            const invoiceId = session.metadata.invoice_id;
            console.log(`Webhook received for invoice: ${invoiceId}, but no payment intent data found.`);
             const response = NextResponse.json({ received: true, invoiceId: invoiceId });
             return response;

        } else {
             console.log('Webhook received, but no invoice_id in metadata');
        }
    }

    return NextResponse.json({ received: true });
}

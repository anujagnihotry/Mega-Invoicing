import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

// This is a mock function to simulate fetching the secret from a secure place.
// In a real app, this would come from process.env or a secret manager.
async function getStripeSecretsFromSomewhere() {
    // In a real app, you might fetch this from a database or a service like Google Secret Manager
    // For this localStorage app, we can't access client-side storage from the server.
    // We will rely on environment variables.
    return {
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    };
}


export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = headers().get('stripe-signature') as string;
    const { webhookSecret } = await getStripeSecretsFromSomewhere();

    if (!webhookSecret) {
        console.error('Stripe webhook secret is not set in environment variables.');
        return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-04-10' });
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Webhook signature verification failed: ${errorMessage}`);
        return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.invoice_id) {
            const invoiceId = session.metadata.invoice_id;
            console.log(`Successful payment for invoice: ${invoiceId}`);
            
            // In a real database-backed application, you would now update the invoice status.
            // For example: await db.invoices.update({ where: { id: invoiceId }, data: { status: 'Paid' } });
            
            // Since this app uses localStorage, we can't update it from the server.
            // The client-side redirect flow will handle the status update.
            // This webhook is now primarily for logging or other backend tasks (like sending a thank you email).
        } else {
             console.warn('Webhook received checkout.session.completed, but no invoice_id in metadata');
        }
    }

    return NextResponse.json({ received: true });
}

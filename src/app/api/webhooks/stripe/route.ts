import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = headers().get('stripe-signature') as string;
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

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.invoice_id) {
            const invoiceId = session.metadata.invoice_id;
            console.log(`Successful payment for invoice: ${invoiceId}`);

            // This is a "hack" for the localStorage-based app.
            // The client-side will listen for this localStorage key being set.
            // A more robust solution would involve a database and real-time updates (e.g., WebSockets).
            // Since this is a server-side route, we can't directly set localStorage.
            // So we return a special response that a client-side fetch handler can use.
            // However, webhooks are called directly by Stripe, not by our client, so this approach is flawed.
            // The correct approach for a localStorage app is to have the client poll or check status upon returning from Stripe.
            
            // For now, we just log it. The client-side polling will handle the update.
            // A simple "flag" in local storage is a viable workaround if the client can set it.
            // The webhook can't set it, but we can make the client do it after it gets a success redirect from Stripe.

            // A simple workaround for our localStorage app: The webhook can't update the client.
            // But we can create a client-side listener that checks for this event.
            // For the purpose of this demo, we'll return a special JSON response that the client *could* theoretically use,
            // but the AppProvider will be updated to handle this more realistically.
            const response = NextResponse.json({
                status: 'success',
                message: `Webhook processed for invoice ${invoiceId}`,
                invoiceId: invoiceId
            });

            // This is where you would typically update your database.
            // e.g., await db.invoices.update({ where: { id: invoiceId }, data: { status: 'Paid' } });
            
            // Since we can't update the DB, we rely on the client to eventually sync.
            // The `useEffect` in AppProvider will handle this.
            return response;

        } else {
             console.warn('Webhook received, but no invoice_id in metadata');
        }
    }

    return NextResponse.json({ received: true });
}

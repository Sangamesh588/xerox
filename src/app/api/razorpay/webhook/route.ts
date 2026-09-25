import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getStoredOrders, saveStoredOrders } from '@/lib/serverDb';

/**
 * POST /api/razorpay/webhook
 *
 * Razorpay calls this URL automatically for every payment event.
 * Set this URL in Razorpay Dashboard → Webhooks:
 *   https://yourdomain.com/api/razorpay/webhook
 *
 * Listens for:
 *   - payment.captured  → mark order paid
 *   - payment.failed    → mark order failed
 *   - order.paid        → confirmation that full order is settled
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // ── Verify webhook signature ───────────────────────────────────────────
    if (webhookSecret) {
      if (!signature) {
        console.warn('Webhook received with no signature header.');
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      const signaturesMatch =
        expectedSignature.length === signature.length &&
        crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'hex'),
          Buffer.from(signature, 'hex')
        );

      if (!signaturesMatch) {
        console.warn('Webhook signature mismatch — ignoring.');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event.event;
    const payload = event.payload;

    console.log(`[Razorpay Webhook] Event: ${eventType}`);

    // ── payment.captured — payment is successful & captured ───────────────
    if (eventType === 'payment.captured') {
      const payment = payload?.payment?.entity;
      if (payment) {
        const razorpayOrderId = payment.order_id;
        const paymentId = payment.id;

        const orders = await getStoredOrders();
        // Match by internal order receipt (we set receipt = our internal order id)
        const idx = orders.findIndex(
          (o) =>
            o.paymentId === paymentId ||
            // receipt format: rcpt_{timestamp} — fallback match by shop+amount if needed
            (o.pricing.totalCost * 100 === payment.amount && o.paymentStatus === 'pending')
        );

        if (idx >= 0) {
          orders[idx] = {
            ...orders[idx],
            paymentId,
            paymentStatus: 'paid',
            status: 'pending', // shop owner still needs to process
            updatedAt: new Date().toISOString(),
          };
          await saveStoredOrders(orders);
          console.log(`[Webhook] Order ${orders[idx].id} marked paid via payment.captured`);
        } else {
          console.warn(`[Webhook] No matching order found for Razorpay order ${razorpayOrderId}`);
        }
      }
    }

    // ── payment.failed — payment failed ───────────────────────────────────
    if (eventType === 'payment.failed') {
      const payment = payload?.payment?.entity;
      if (payment) {
        const paymentId = payment.id;
        const errorDesc = payment.error_description || 'Payment failed';

        const orders = await getStoredOrders();
        const idx = orders.findIndex(
          (o) => o.paymentId === paymentId && o.paymentStatus === 'pending'
        );

        if (idx >= 0) {
          orders[idx] = {
            ...orders[idx],
            paymentStatus: 'failed',
            status: 'cancelled',
            updatedAt: new Date().toISOString(),
          };
          await saveStoredOrders(orders);
          console.log(`[Webhook] Order ${orders[idx].id} marked failed: ${errorDesc}`);
        }
      }
    }

    // ── order.paid — full order settled ───────────────────────────────────
    if (eventType === 'order.paid') {
      const order = payload?.order?.entity;
      const payment = payload?.payment?.entity;
      if (order && payment) {
        const paymentId = payment.id;
        const orders = await getStoredOrders();
        const idx = orders.findIndex((o) => o.paymentId === paymentId);
        if (idx >= 0 && orders[idx].paymentStatus !== 'paid') {
          orders[idx] = {
            ...orders[idx],
            paymentStatus: 'paid',
            updatedAt: new Date().toISOString(),
          };
          await saveStoredOrders(orders);
          console.log(`[Webhook] order.paid confirmed for order ${orders[idx].id}`);
        }
      }
    }

    // Always respond 200 quickly so Razorpay doesn't retry
    return NextResponse.json({ received: true, event: eventType });
  } catch (error) {
    console.error('[Razorpay Webhook] Error:', error);
    // Return 200 anyway to prevent Razorpay from retrying on parse errors
    return NextResponse.json({ received: true });
  }
}

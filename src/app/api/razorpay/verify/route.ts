import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getStoredOrders, saveStoredOrders } from '@/lib/serverDb';

/**
 * POST /api/razorpay/verify
 * Verifies Razorpay payment signature using HMAC-SHA256.
 * Only marks the order as paid if signatures match.
 * KEY_SECRET never reaches the frontend.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: 'Missing required payment fields.' },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error('RAZORPAY_KEY_SECRET not set — cannot verify payment.');
      return NextResponse.json(
        { success: false, message: 'Payment verification unavailable.' },
        { status: 500 }
      );
    }

    // --- SIGNATURE VERIFICATION (HMAC-SHA256) ---
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const signaturesMatch =
      generatedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature, 'hex'),
        Buffer.from(razorpay_signature, 'hex')
      );

    if (!signaturesMatch) {
      console.warn('Razorpay signature mismatch — possible tampering attempt.');
      return NextResponse.json(
        { success: false, message: 'Payment verification failed: invalid signature.' },
        { status: 400 }
      );
    }

    // --- SIGNATURE VERIFIED: persist the order ---
    if (order) {
      const verifiedOrder = {
        ...order,
        paymentId: razorpay_payment_id,
        paymentStatus: 'paid' as const,
        updatedAt: new Date().toISOString(),
      };

      const orders = await getStoredOrders();
      // Upsert — avoid duplicates if the handler fires twice
      const existing = orders.findIndex((o) => o.id === verifiedOrder.id);
      if (existing >= 0) {
        orders[existing] = verifiedOrder;
      } else {
        orders.unshift(verifiedOrder);
      }
      await saveStoredOrders(orders);

      return NextResponse.json({
        success: true,
        message: 'Payment verified and order placed successfully.',
        paymentId: razorpay_payment_id,
        order: verifiedOrder,
      });
    }

    // No order body — just return verification result (used for standalone checks)
    return NextResponse.json({
      success: true,
      message: 'Payment signature verified.',
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error('Razorpay verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Verification failed due to a server error.' },
      { status: 500 }
    );
  }
}

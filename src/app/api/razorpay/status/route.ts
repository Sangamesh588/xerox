import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

/**
 * GET /api/razorpay/status?paymentId=pay_xxxx
 * Fetches live payment status directly from Razorpay API.
 * Used to double-check payment status on the server.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Payment gateway not configured.' }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const payment = await razorpay.payments.fetch(paymentId);

    return NextResponse.json({
      id: payment.id,
      status: payment.status,           // created | authorized | captured | refunded | failed
      amount: payment.amount,
      currency: payment.currency,
      order_id: payment.order_id,
      method: payment.method,
      captured: payment.captured,
      description: payment.description,
      email: payment.email,
      contact: payment.contact,
      created_at: payment.created_at,
    });
  } catch (error) {
    console.error('Razorpay payment status fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment status.' }, { status: 500 });
  }
}

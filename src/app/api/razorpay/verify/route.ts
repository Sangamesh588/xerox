import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keySecret) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature === razorpay_signature) {
        return NextResponse.json({ success: true, message: 'Payment verified successfully' });
      } else {
        return NextResponse.json({ success: false, message: 'Invalid payment signature' }, { status: 400 });
      }
    }

    // In mock mode or when keySecret is not set, treat as verified for local testing
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully (Mock Mode)',
      paymentId: razorpay_payment_id || `pay_mock_${Date.now()}`,
    });
  } catch (error) {
    console.error('Razorpay Verification API Error:', error);
    return NextResponse.json({ success: false, message: 'Verification failed' }, { status: 500 });
  }
}

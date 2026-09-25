import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

/**
 * POST /api/razorpay
 * Creates a Razorpay order on the backend.
 * The KEY_SECRET never leaves the server.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt } = body;

    // Validate: amount must be a positive number
    const amountNum = Number(amount);
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be a positive number.' },
        { status: 400 }
      );
    }

    // Convert to paise and enforce minimum of 100 paise (₹1)
    const amountInPaise = Math.round(amountNum * 100);
    if (amountInPaise < 100) {
      return NextResponse.json(
        { error: 'Minimum order amount is ₹1 (100 paise).' },
        { status: 400 }
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('Razorpay credentials missing in environment variables.');
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact support.' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    });

    // Return only safe fields — KEY_SECRET never sent to client
    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error: unknown) {
    console.error('Razorpay create-order error:', error);

    // Surface Razorpay API errors cleanly
    if (
      error &&
      typeof error === 'object' &&
      'statusCode' in error &&
      'error' in error
    ) {
      const rzpErr = error as { statusCode: number; error: { description: string } };
      return NextResponse.json(
        { error: rzpErr.error?.description || 'Razorpay API error' },
        { status: rzpErr.statusCode || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment order. Please try again.' },
      { status: 500 }
    );
  }
}

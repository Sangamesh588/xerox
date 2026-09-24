import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', orderId } = body;

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keyId && keySecret) {
      // Real Razorpay API call
      const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // amount in paise
          currency,
          receipt: orderId || `receipt_${Date.now()}`,
        }),
      });

      const data = await res.json();
      return NextResponse.json({
        ...data,
        key: keyId,
      });
    }

    // Fallback Mock Razorpay order for instant testing without API keys
    const mockRazorpayOrderId = `order_${Math.random().toString(36).substring(2, 12)}`;
    return NextResponse.json({
      id: mockRazorpayOrderId,
      entity: 'order',
      amount: Math.round(amount * 100),
      amount_paid: 0,
      amount_due: Math.round(amount * 100),
      currency,
      receipt: orderId || `receipt_${Date.now()}`,
      status: 'created',
      attempts: 0,
      created_at: Math.floor(Date.now() / 1000),
      isMock: true,
      key: keyId || 'rzp_test_XeroxBooking2026',
    });
  } catch (error) {
    console.error('Razorpay Order API Error:', error);
    return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
  }
}

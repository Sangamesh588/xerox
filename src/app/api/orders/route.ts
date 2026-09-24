import { NextResponse } from 'next/server';
import { XeroxOrder } from '@/types';
import { getStoredOrders, saveStoredOrders } from '@/lib/serverDb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get('shopId');

  const allOrders = await getStoredOrders();

  if (shopId) {
    const shopOrders = allOrders.filter((o) => o.shopId === shopId);
    return NextResponse.json(shopOrders);
  }

  return NextResponse.json(allOrders);
}

export async function POST(request: Request) {
  try {
    const newOrder: XeroxOrder = await request.json();
    const orders = await getStoredOrders();
    orders.unshift(newOrder);
    await saveStoredOrders(orders);
    return NextResponse.json({ success: true, order: newOrder, orders });
  } catch (err) {
    console.error('POST /api/orders error:', err);
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    let orders = await getStoredOrders();
    orders = orders.map((o) =>
      o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
    );
    await saveStoredOrders(orders);

    return NextResponse.json({ success: true, orders });
  } catch (err) {
    console.error('PUT /api/orders error:', err);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (orderId) {
      let orders = await getStoredOrders();
      orders = orders.filter((o) => o.id !== orderId);
      await saveStoredOrders(orders);
      return NextResponse.json({ success: true, orders });
    }

    return NextResponse.json({ error: 'Missing order id' }, { status: 400 });
  } catch (err) {
    console.error('DELETE /api/orders error:', err);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}

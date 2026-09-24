import { NextResponse } from 'next/server';
import { XeroxOrder } from '@/types';

let globalOrders: XeroxOrder[] = [];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get('shopId');

  if (shopId) {
    const shopOrders = globalOrders.filter((o) => o.shopId === shopId);
    return NextResponse.json(shopOrders);
  }

  return NextResponse.json(globalOrders);
}

export async function POST(request: Request) {
  try {
    const newOrder: XeroxOrder = await request.json();
    globalOrders.unshift(newOrder);
    return NextResponse.json({ success: true, order: newOrder, orders: globalOrders });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    globalOrders = globalOrders.map((o) =>
      o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
    );

    return NextResponse.json({ success: true, orders: globalOrders });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (orderId) {
      globalOrders = globalOrders.filter((o) => o.id !== orderId);
    }

    return NextResponse.json({ success: true, orders: globalOrders });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}

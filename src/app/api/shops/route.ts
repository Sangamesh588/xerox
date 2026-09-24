import { NextResponse } from 'next/server';
import { XeroxShop } from '@/types';
import { getStoredShops, saveStoredShops } from '@/lib/serverDb';

export async function GET() {
  const shops = await getStoredShops();
  return NextResponse.json(shops);
}

export async function POST(request: Request) {
  try {
    const newShop: XeroxShop = await request.json();
    const shops = await getStoredShops();

    // Upsert: update if exists, insert if new
    const existingIndex = shops.findIndex((s) => s.id === newShop.id);
    if (existingIndex >= 0) {
      shops[existingIndex] = { ...shops[existingIndex], ...newShop };
    } else {
      shops.unshift(newShop);
    }

    await saveStoredShops(shops);
    return NextResponse.json({ success: true, shops });
  } catch (err) {
    console.error('POST /api/shops error:', err);
    return NextResponse.json({ error: 'Failed to save shop' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { shopId, action, rates, isOpen, googleMapsUrl, lat, lng } = body;

    const shops = await getStoredShops();
    const shopIndex = shops.findIndex((s) => s.id === shopId);

    if (shopIndex >= 0) {
      if (action === 'toggleOpen') {
        shops[shopIndex].isOpen = isOpen;
      } else if (action === 'updateRates') {
        if (rates) shops[shopIndex].rates = rates;
        if (googleMapsUrl !== undefined) shops[shopIndex].googleMapsUrl = googleMapsUrl;
        if (lat !== undefined && !isNaN(lat)) shops[shopIndex].lat = lat;
        if (lng !== undefined && !isNaN(lng)) shops[shopIndex].lng = lng;
      }
      await saveStoredShops(shops);
    }

    return NextResponse.json({ success: true, shops });
  } catch (err) {
    console.error('PUT /api/shops error:', err);
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('id');

    if (shopId) {
      let shops = await getStoredShops();
      shops = shops.filter((s) => s.id !== shopId);
      await saveStoredShops(shops);
      return NextResponse.json({ success: true, shops });
    }

    return NextResponse.json({ error: 'Missing shop id' }, { status: 400 });
  } catch (err) {
    console.error('DELETE /api/shops error:', err);
    return NextResponse.json({ error: 'Failed to delete shop' }, { status: 500 });
  }
}

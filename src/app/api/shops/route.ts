import { NextResponse } from 'next/server';
import { XeroxShop } from '@/types';

// In-Memory Server Store for global shop persistence across all devices & users
let globalShops: XeroxShop[] = [
  {
    id: 'shop-sangamesh',
    name: 'Sangamesh Xerox & Digital Print Hub',
    ownerName: 'Sangamesh',
    ownerPhone: '+91 98765 43210',
    ownerEmail: 'sangamesh.print@gmail.com',
    ownerUsername: 'sangamesh',
    ownerPassword: 'bhagya@123',
    address: 'Opp. Main College Gate, Hosur Road, Bangalore',
    lat: 12.9344,
    lng: 77.6060,
    rating: 4.9,
    reviewCount: 150,
    isOpen: true,
    openingHours: '08:00 AM - 10:00 PM',
    rates: {
      bwSingle: 1.50,
      bwDouble: 2.50,
      colorSingle: 6.00,
      colorDouble: 10.00,
      spiralBinding: 25.00,
      hardBinding: 75.00,
      cornerClip: 10.00,
    },
    features: ['Duplex High Speed Xerox', 'Color Printing', 'Spiral & Hard Binding'],
  },
];

export async function GET() {
  return NextResponse.json(globalShops);
}

export async function POST(request: Request) {
  try {
    const newShop: XeroxShop = await request.json();
    
    // Check if shop already exists
    const existingIndex = globalShops.findIndex((s) => s.id === newShop.id);
    if (existingIndex >= 0) {
      globalShops[existingIndex] = { ...globalShops[existingIndex], ...newShop };
    } else {
      globalShops.unshift(newShop);
    }

    return NextResponse.json({ success: true, shops: globalShops });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save shop' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { shopId, action, rates, isOpen, googleMapsUrl } = body;

    const shopIndex = globalShops.findIndex((s) => s.id === shopId);
    if (shopIndex >= 0) {
      if (action === 'toggleOpen') {
        globalShops[shopIndex].isOpen = isOpen;
      } else if (action === 'updateRates') {
        if (rates) globalShops[shopIndex].rates = rates;
        if (googleMapsUrl !== undefined) globalShops[shopIndex].googleMapsUrl = googleMapsUrl;
      }
    }

    return NextResponse.json({ success: true, shops: globalShops });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('id');

    if (shopId) {
      globalShops = globalShops.filter((s) => s.id !== shopId);
    }

    return NextResponse.json({ success: true, shops: globalShops });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete shop' }, { status: 500 });
  }
}

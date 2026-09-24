import { XeroxShop, XeroxOrder, ShopEarningsAnalytics } from '@/types';

export const INITIAL_SHOPS: XeroxShop[] = [
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

export const INITIAL_ORDERS: XeroxOrder[] = [];

// Local cache
let memoryShops: XeroxShop[] = INITIAL_SHOPS;
let memoryOrders: XeroxOrder[] = INITIAL_ORDERS;

// Async API Fetchers for Server-Wide Persistence across all browsers & devices
export async function fetchShopsFromServer(): Promise<XeroxShop[]> {
  try {
    const res = await fetch('/api/shops', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        memoryShops = data;
        saveShopsLocal(data);
        return data;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch server shops:', err);
  }
  return getShops();
}

export async function fetchOrdersFromServer(shopId?: string): Promise<XeroxOrder[]> {
  try {
    const url = shopId ? `/api/orders?shopId=${shopId}` : '/api/orders';
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        memoryOrders = data;
        saveOrdersLocal(data);
        return data;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch server orders:', err);
  }
  return getOrders();
}

export function getShops(): XeroxShop[] {
  if (typeof window === 'undefined') return memoryShops;
  const stored = localStorage.getItem('xerox_shops');
  if (!stored) {
    localStorage.setItem('xerox_shops', JSON.stringify(memoryShops));
    return memoryShops;
  }
  try {
    const parsed = JSON.parse(stored);
    return parsed;
  } catch {
    return memoryShops;
  }
}

function saveShopsLocal(shops: XeroxShop[]): void {
  memoryShops = shops;
  if (typeof window !== 'undefined') {
    localStorage.setItem('xerox_shops', JSON.stringify(shops));
  }
}

export async function addShop(shop: XeroxShop): Promise<void> {
  const current = getShops();
  const updated = [shop, ...current.filter((s) => s.id !== shop.id)];
  saveShopsLocal(updated);

  try {
    await fetch('/api/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shop),
    });
  } catch (err) {
    console.warn('Failed to post shop to server:', err);
  }
}

export async function deleteShop(shopId: string): Promise<void> {
  const current = getShops();
  const updated = current.filter((s) => s.id !== shopId);
  saveShopsLocal(updated);

  try {
    await fetch(`/api/shops?id=${shopId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Failed to delete shop on server:', err);
  }
}

export async function toggleShopOpenStatus(shopId: string, isOpen: boolean): Promise<void> {
  const shops = getShops();
  const updated = shops.map((s) => (s.id === shopId ? { ...s, isOpen } : s));
  saveShopsLocal(updated);

  try {
    await fetch('/api/shops', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, action: 'toggleOpen', isOpen }),
    });
  } catch (err) {
    console.warn('Failed to update shop status on server:', err);
  }
}

export async function updateShopRates(
  shopId: string,
  newRates: XeroxShop['rates'],
  googleMapsUrl?: string
): Promise<void> {
  const shops = getShops();
  const updated = shops.map((s) => {
    if (s.id === shopId) {
      return {
        ...s,
        rates: newRates,
        googleMapsUrl: googleMapsUrl !== undefined ? googleMapsUrl : s.googleMapsUrl,
      };
    }
    return s;
  });
  saveShopsLocal(updated);

  try {
    await fetch('/api/shops', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, action: 'updateRates', rates: newRates, googleMapsUrl }),
    });
  } catch (err) {
    console.warn('Failed to update shop rates on server:', err);
  }
}

export function getOrders(): XeroxOrder[] {
  if (typeof window === 'undefined') return memoryOrders;
  const stored = localStorage.getItem('xerox_orders');
  if (!stored) {
    localStorage.setItem('xerox_orders', JSON.stringify(memoryOrders));
    return memoryOrders;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return memoryOrders;
  }
}

function saveOrdersLocal(orders: XeroxOrder[]): void {
  memoryOrders = orders;
  if (typeof window !== 'undefined') {
    localStorage.setItem('xerox_orders', JSON.stringify(orders));
  }
}

export async function addOrder(order: XeroxOrder): Promise<void> {
  const current = getOrders();
  const updated = [order, ...current];
  saveOrdersLocal(updated);

  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
  } catch (err) {
    console.warn('Failed to post order to server:', err);
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  const current = getOrders();
  const updated = current.filter((o) => o.id !== orderId);
  saveOrdersLocal(updated);

  try {
    await fetch(`/api/orders?id=${orderId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Failed to delete order on server:', err);
  }
}

export async function updateOrderStatus(orderId: string, status: XeroxOrder['status']): Promise<void> {
  const current = getOrders();
  const updated = current.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o));
  saveOrdersLocal(updated);

  try {
    await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
  } catch (err) {
    console.warn('Failed to update order status on server:', err);
  }
}

export function authenticateUser(
  targetRole: 'owner' | 'admin',
  usernameInput: string,
  passwordInput: string
): { success: boolean; shop?: XeroxShop; message?: string } {
  const cleanUsername = usernameInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  // Super Admin Check (ID: sangamesh, Pass: bhagya@123)
  if (targetRole === 'admin') {
    if (cleanUsername === 'sangamesh' && cleanPassword === 'bhagya@123') {
      return { success: true };
    }
    return { success: false, message: 'Invalid Admin User ID or Password. Please try again.' };
  }

  // Shop Owner Check
  const shops = getShops();
  const foundShop = shops.find(
    (s) =>
      (s.ownerUsername && s.ownerUsername.toLowerCase() === cleanUsername) ||
      (s.ownerEmail && s.ownerEmail.toLowerCase() === cleanUsername)
  );

  if (!foundShop) {
    return { success: false, message: 'Invalid User ID or Password. Please try again.' };
  }

  const validPassword = foundShop.ownerPassword || 'bhagya@123';
  if (cleanPassword === validPassword) {
    return { success: true, shop: foundShop };
  }

  return { success: false, message: 'Invalid User ID or Password. Please try again.' };
}

export function calculateShopAnalytics(
  shopId: string,
  timeframe: '1week' | '1month' | '1year'
): ShopEarningsAnalytics {
  const allOrders = getOrders().filter((o) => o.shopId === shopId && o.paymentStatus === 'paid');

  const now = new Date();
  let daysLimit = 7;
  if (timeframe === '1month') daysLimit = 30;
  if (timeframe === '1year') daysLimit = 365;

  const cutoff = new Date(now.getTime() - daysLimit * 24 * 3600 * 1000);
  const filteredOrders = allOrders.filter((o) => new Date(o.createdAt) >= cutoff);

  const totalEarnings = filteredOrders.reduce((sum, o) => sum + o.pricing.totalCost, 0);
  const totalOrders = filteredOrders.length;
  const totalPrintedPages = filteredOrders.reduce((sum, o) => sum + o.pricing.effectivePages * o.config.copies, 0);

  const chartData: { label: string; earnings: number; pages: number }[] = [];

  if (timeframe === '1week') {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const dayLabel = dayNames[d.getDay()];
      const dayOrders = filteredOrders.filter((o) => {
        const od = new Date(o.createdAt);
        return od.getDate() === d.getDate() && od.getMonth() === d.getMonth();
      });
      const dayEarn = dayOrders.reduce((s, o) => s + o.pricing.totalCost, 0);
      const dayPages = dayOrders.reduce((s, o) => s + o.pricing.effectivePages * o.config.copies, 0);

      chartData.push({
        label: dayLabel,
        earnings: dayEarn,
        pages: dayPages,
      });
    }
  } else if (timeframe === '1month') {
    for (let w = 4; w >= 1; w--) {
      const label = `Week ${5 - w}`;
      chartData.push({
        label,
        earnings: Math.floor(totalEarnings / 4),
        pages: Math.floor(totalPrintedPages / 4),
      });
    }
  } else {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let m = 0; m < 12; m++) {
      chartData.push({
        label: months[m],
        earnings: 0,
        pages: 0,
      });
    }
  }

  return {
    timeframe,
    totalEarnings,
    totalOrders,
    totalPrintedPages,
    chartData,
  };
}

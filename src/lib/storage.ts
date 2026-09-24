import { XeroxShop, XeroxOrder, ShopEarningsAnalytics } from '@/types';

// ============================================================================
// SERVER-FIRST STORAGE LAYER
// All data is persisted in Upstash Redis via /api/shops and /api/orders.
// No localStorage caching - every read hits the server for real-time accuracy.
// ============================================================================

// --- SHOPS ---

export async function fetchShopsFromServer(): Promise<XeroxShop[]> {
  try {
    const res = await fetch('/api/shops', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('Failed to fetch shops from server:', err);
  }
  return [];
}

export async function addShop(shop: XeroxShop): Promise<void> {
  try {
    await fetch('/api/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shop),
    });
  } catch (err) {
    console.warn('Failed to add shop:', err);
  }
}

export async function deleteShop(shopId: string): Promise<void> {
  try {
    await fetch(`/api/shops?id=${shopId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Failed to delete shop:', err);
  }
}

export async function toggleShopOpenStatus(shopId: string, isOpen: boolean): Promise<void> {
  try {
    await fetch('/api/shops', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, action: 'toggleOpen', isOpen }),
    });
  } catch (err) {
    console.warn('Failed to toggle shop status:', err);
  }
}

export async function updateShopRates(
  shopId: string,
  newRates: XeroxShop['rates'],
  googleMapsUrl?: string,
  lat?: number,
  lng?: number,
): Promise<void> {
  try {
    await fetch('/api/shops', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, action: 'updateRates', rates: newRates, googleMapsUrl, lat, lng }),
    });
  } catch (err) {
    console.warn('Failed to update shop rates:', err);
  }
}

// --- ORDERS ---

export async function fetchOrdersFromServer(shopId?: string): Promise<XeroxOrder[]> {
  try {
    const url = shopId ? `/api/orders?shopId=${shopId}` : '/api/orders';
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('Failed to fetch orders from server:', err);
  }
  return [];
}

export async function addOrder(order: XeroxOrder): Promise<void> {
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
  } catch (err) {
    console.warn('Failed to add order:', err);
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  try {
    await fetch(`/api/orders?id=${orderId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Failed to delete order:', err);
  }
}

export async function updateOrderStatus(orderId: string, status: XeroxOrder['status']): Promise<void> {
  try {
    await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
  } catch (err) {
    console.warn('Failed to update order status:', err);
  }
}

// --- AUTHENTICATION ---

export async function authenticateUser(
  targetRole: 'owner' | 'admin',
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; shop?: XeroxShop; message?: string }> {
  const cleanUsername = usernameInput.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  // Super Admin Check (ID: sangamesh, Pass: bhagya@123)
  if (targetRole === 'admin') {
    if (cleanUsername === 'sangamesh' && cleanPassword === 'bhagya@123') {
      return { success: true };
    }
    return { success: false, message: 'Invalid Admin User ID or Password. Please try again.' };
  }

  // Shop Owner Check - fetch fresh from server
  const shops = await fetchShopsFromServer();
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

// --- ANALYTICS ---

export async function calculateShopAnalytics(
  shopId: string,
  timeframe: '1week' | '1month' | '1year'
): Promise<ShopEarningsAnalytics> {
  const allOrders = await fetchOrdersFromServer(shopId);
  const paidOrders = allOrders.filter((o) => o.paymentStatus === 'paid');

  const now = new Date();
  let daysLimit = 7;
  if (timeframe === '1month') daysLimit = 30;
  if (timeframe === '1year') daysLimit = 365;

  const cutoff = new Date(now.getTime() - daysLimit * 24 * 3600 * 1000);
  const filteredOrders = paidOrders.filter((o) => new Date(o.createdAt) >= cutoff);

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
      chartData.push({ label: dayLabel, earnings: dayEarn, pages: dayPages });
    }
  } else if (timeframe === '1month') {
    for (let w = 4; w >= 1; w--) {
      chartData.push({
        label: `Week ${5 - w}`,
        earnings: Math.floor(totalEarnings / 4),
        pages: Math.floor(totalPrintedPages / 4),
      });
    }
  } else {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let m = 0; m < 12; m++) {
      const monthOrders = filteredOrders.filter((o) => new Date(o.createdAt).getMonth() === m);
      chartData.push({
        label: months[m],
        earnings: monthOrders.reduce((s, o) => s + o.pricing.totalCost, 0),
        pages: monthOrders.reduce((s, o) => s + o.pricing.effectivePages * o.config.copies, 0),
      });
    }
  }

  return { timeframe, totalEarnings, totalOrders, totalPrintedPages, chartData };
}

import { XeroxShop, XeroxOrder, ShopEarningsAnalytics } from '@/types';

export const INITIAL_SHOPS: XeroxShop[] = [];
export const INITIAL_ORDERS: XeroxOrder[] = [];

export function getShops(): XeroxShop[] {
  if (typeof window === 'undefined') return INITIAL_SHOPS;
  const stored = localStorage.getItem('xerox_shops');
  if (!stored) {
    localStorage.setItem('xerox_shops', JSON.stringify(INITIAL_SHOPS));
    return INITIAL_SHOPS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_SHOPS;
  }
}

export function saveShops(shops: XeroxShop[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('xerox_shops', JSON.stringify(shops));
  }
}

export function addShop(shop: XeroxShop): void {
  const current = getShops();
  const updated = [shop, ...current];
  saveShops(updated);
}

export function deleteShop(shopId: string): void {
  const current = getShops();
  const updated = current.filter((s) => s.id !== shopId);
  saveShops(updated);
}

export function toggleShopOpenStatus(shopId: string, isOpen: boolean): void {
  const shops = getShops();
  const updated = shops.map((s) => (s.id === shopId ? { ...s, isOpen } : s));
  saveShops(updated);
}

export function updateShopRates(
  shopId: string,
  newRates: XeroxShop['rates'],
  googleMapsUrl?: string
): void {
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
  saveShops(updated);
}

export function getOrders(): XeroxOrder[] {
  if (typeof window === 'undefined') return INITIAL_ORDERS;
  const stored = localStorage.getItem('xerox_orders');
  if (!stored) {
    localStorage.setItem('xerox_orders', JSON.stringify(INITIAL_ORDERS));
    return INITIAL_ORDERS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveOrders(orders: XeroxOrder[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('xerox_orders', JSON.stringify(orders));
  }
}

export function addOrder(order: XeroxOrder): void {
  const current = getOrders();
  const updated = [order, ...current];
  saveOrders(updated);
}

export function deleteOrder(orderId: string): void {
  const current = getOrders();
  const updated = current.filter((o) => o.id !== orderId);
  saveOrders(updated);
}

export function updateOrderStatus(orderId: string, status: XeroxOrder['status']): void {
  const current = getOrders();
  const updated = current.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o));
  saveOrders(updated);
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

import fs from 'fs';
import path from 'path';
import { XeroxShop, XeroxOrder } from '@/types';
import redis, { SHOPS_KEY, ORDERS_KEY } from './redis';

const DATA_DIR = path.join(process.cwd(), 'data');
const SHOPS_FILE = path.join(DATA_DIR, 'shops.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

export const DEFAULT_SHOPS: XeroxShop[] = [
  {
    id: 'shop-christ-blr',
    name: 'Campus Xerox & Digital Print Hub',
    ownerName: 'Ramesh Kumar',
    ownerPhone: '+91 98450 12345',
    ownerEmail: 'ramesh@xerox.com',
    ownerUsername: 'owner_ramesh',
    ownerPassword: 'bhagya@123',
    address: 'Opp. Christ University Central Campus, Hosur Road, Bangalore - 560029',
    lat: 12.9344,
    lng: 77.6060,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=12.9344,77.6060',
    rating: 4.9,
    reviewCount: 142,
    isOpen: true,
    openingHours: '07:30 AM - 10:00 PM',
    rates: {
      bwSingle: 1.5,
      bwDouble: 2.5,
      colorSingle: 6.0,
      colorDouble: 10.0,
      spiralBinding: 25.0,
      hardBinding: 75.0,
      cornerClip: 10.0,
    },
    features: ['Duplex Printing', 'Spiral & Thesis Binding', 'Color Xerox', 'Express Pickup'],
  },
  {
    id: 'shop-koramangala-blr',
    name: 'PrintStop Fast Xerox & Stationery',
    ownerName: 'Suresh Patel',
    ownerPhone: '+91 97420 67890',
    ownerEmail: 'suresh@xerox.com',
    ownerUsername: 'owner_suresh',
    ownerPassword: 'bhagya@123',
    address: '80 Feet Road, 5th Block, Koramangala, Bangalore - 560095',
    lat: 12.9352,
    lng: 77.6245,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=12.9352,77.6245',
    rating: 4.8,
    reviewCount: 98,
    isOpen: true,
    openingHours: '08:00 AM - 09:30 PM',
    rates: {
      bwSingle: 1.25,
      bwDouble: 2.0,
      colorSingle: 5.0,
      colorDouble: 9.0,
      spiralBinding: 30.0,
      hardBinding: 80.0,
      cornerClip: 12.0,
    },
    features: ['Duplex Xerox', 'Glossy Paper', 'Color Printing', 'Hardcover Binding'],
  },
  {
    id: 'shop-pes-blr',
    name: 'Prime Copy & Thesis Binding Center',
    ownerName: 'Manjunath Rao',
    ownerPhone: '+91 98860 54321',
    ownerEmail: 'manju@xerox.com',
    ownerUsername: 'owner_manju',
    ownerPassword: 'bhagya@123',
    address: 'Near PES University Ring Road Campus, Banashankari 3rd Stage, Bangalore - 560085',
    lat: 12.9343,
    lng: 77.5348,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=12.9343,77.5348',
    rating: 4.7,
    reviewCount: 64,
    isOpen: true,
    openingHours: '08:00 AM - 10:30 PM',
    rates: {
      bwSingle: 1.5,
      bwDouble: 2.25,
      colorSingle: 6.0,
      colorDouble: 10.0,
      spiralBinding: 25.0,
      hardBinding: 70.0,
      cornerClip: 10.0,
    },
    features: ['Engineering Drawing Printing', 'Thesis Hard Binding', 'Duplex', 'Spiral Binding'],
  },
  {
    id: 'shop-iitd-delhi',
    name: 'IIT TechPrint & Xerox Hub',
    ownerName: 'Anand Sharma',
    ownerPhone: '+91 99100 23456',
    ownerEmail: 'anand@xerox.com',
    ownerUsername: 'owner_anand',
    ownerPassword: 'bhagya@123',
    address: 'Hauz Khas Market, Near IIT Delhi Gate, New Delhi - 110016',
    lat: 28.5450,
    lng: 77.1926,
    googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=28.5450,77.1926',
    rating: 4.9,
    reviewCount: 210,
    isOpen: true,
    openingHours: '07:00 AM - 11:00 PM',
    rates: {
      bwSingle: 1.0,
      bwDouble: 1.8,
      colorSingle: 5.0,
      colorDouble: 8.0,
      spiralBinding: 20.0,
      hardBinding: 65.0,
      cornerClip: 8.0,
    },
    features: ['Ultra Fast Bulk Xerox', 'Duplex', 'Color Printing', 'Spiral Binding'],
  },
];

// Helper to check if Upstash Redis credentials are valid
function isRedisConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return Boolean(url && token && url.startsWith('http') && token.length > 5);
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// In-memory cache for ultra-fast response
let cachedShops: XeroxShop[] | null = null;
let cachedOrders: XeroxOrder[] | null = null;

// --- SHOPS STORAGE ---

export async function getStoredShops(): Promise<XeroxShop[]> {
  ensureDataDir();

  // Try Redis if configured
  if (isRedisConfigured()) {
    try {
      const data = await redis.get<XeroxShop[]>(SHOPS_KEY);
      if (Array.isArray(data) && data.length > 0) {
        cachedShops = data;
        return data;
      }
    } catch (err) {
      console.warn('Redis read failed, falling back to local file storage:', err);
    }
  }

  // Use file storage
  try {
    if (fs.existsSync(SHOPS_FILE)) {
      const raw = fs.readFileSync(SHOPS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedShops = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading shops.json:', err);
  }

  // Seed default shops if none exist
  cachedShops = DEFAULT_SHOPS;
  try {
    fs.writeFileSync(SHOPS_FILE, JSON.stringify(DEFAULT_SHOPS, null, 2), 'utf-8');
    if (isRedisConfigured()) {
      redis.set(SHOPS_KEY, DEFAULT_SHOPS).catch(() => {});
    }
  } catch (err) {
    console.error('Error saving default shops:', err);
  }

  return cachedShops;
}

export async function saveStoredShops(shops: XeroxShop[]): Promise<void> {
  ensureDataDir();
  cachedShops = shops;

  try {
    fs.writeFileSync(SHOPS_FILE, JSON.stringify(shops, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing shops.json:', err);
  }

  if (isRedisConfigured()) {
    redis.set(SHOPS_KEY, shops).catch((err) => {
      console.warn('Failed to sync shops to Redis:', err);
    });
  }
}

// --- ORDERS STORAGE ---

export async function getStoredOrders(): Promise<XeroxOrder[]> {
  ensureDataDir();

  if (isRedisConfigured()) {
    try {
      const data = await redis.get<XeroxOrder[]>(ORDERS_KEY);
      if (Array.isArray(data)) {
        cachedOrders = data;
        return data;
      }
    } catch (err) {
      console.warn('Redis read orders failed, falling back to file storage:', err);
    }
  }

  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        cachedOrders = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading orders.json:', err);
  }

  cachedOrders = cachedOrders || [];
  return cachedOrders;
}

export async function saveStoredOrders(orders: XeroxOrder[]): Promise<void> {
  ensureDataDir();
  cachedOrders = orders;

  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing orders.json:', err);
  }

  if (isRedisConfigured()) {
    redis.set(ORDERS_KEY, orders).catch((err) => {
      console.warn('Failed to sync orders to Redis:', err);
    });
  }
}

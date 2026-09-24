import { Redis } from '@upstash/redis';

// Create Redis client - uses env vars UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

export default redis;

// Keys
export const SHOPS_KEY = 'xerox:shops';
export const ORDERS_KEY = 'xerox:orders';

import { Redis } from '@upstash/redis'
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } from './env.js'

// Only instantiate Redis if the required credentials are provided
const hasRedisConfig = UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN

export const redis = hasRedisConfig
  ? new Redis({
    url: UPSTASH_REDIS_REST_URL as string,
    token: UPSTASH_REDIS_REST_TOKEN as string,
  })
  : null

// Cache key namespaces — keeps keys organised and easy to invalidate by prefix
export const CacheKey = {
  innovations: (id?: string) => id ? `innovations:${id}` : 'innovations:list',
  events: (id?: string) => id ? `events:${id}` : 'events:list',
  courses: (id?: string) => id ? `courses:${id}` : 'courses:list',
  news: (id?: string) => id ? `news:${id}` : 'news:list',
  partners: () => 'partners:list',
  resources: () => 'resources:list',
  user: (id: string) => `user:${id}`,
} as const

// Default TTLs in seconds
export const CacheTTL = {
  short: 60 * 5,        // 5 min  — frequently updated (events, news)
  medium: 60 * 30,       // 30 min — semi-static (courses, innovations)
  long: 60 * 60 * 6,   // 6 hrs  — static (partners, resources)
} as const

export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  // If Redis is not configured, fall back to executing the database/fetch query directly
  if (!redis) return fetcher()

  const cached = await redis.get<T>(key)
  if (cached !== null) return cached

  const fresh = await fetcher()
  await redis.setex(key, ttl, fresh)
  return fresh
}


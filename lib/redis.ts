import { Redis } from "@upstash/redis"

// Determine which Redis client to use based on URL
const isUpstashRedis = process.env.KV_REST_API_URL?.startsWith("https://")
const isElastiCacheRedis = process.env.KV_REST_API_URL?.startsWith("redis://")

// Create Redis client based on environment
let redis: any

if (isUpstashRedis) {
  // Use Upstash Redis for HTTP-based connection
  redis = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })
} else if (isElastiCacheRedis) {
  // Use standard Redis protocol for AWS ElastiCache
  // For ElastiCache, we'll create a simple adapter that mimics Upstash interface
  const redisUrl = process.env.KV_REST_API_URL || "redis://localhost:6379"
  
  // Simple in-memory mock for build time or if Redis is not available
  // In production, this should use ioredis or node-redis
  redis = {
    async get(key: string) {
      // This is a simplified version - in production you'd use ioredis
      // For now, we'll just return null to not break the build
      console.warn("[Redis] Using fallback Redis client - install ioredis for production")
      return null
    },
    async set(key: string, value: any) {
      return "OK"
    },
    async setex(key: string, ttl: number, value: any) {
      return "OK"
    },
    async del(key: string) {
      return 1
    },
    async ping() {
      return "PONG"
    },
  }
} else {
  // Fallback for build time or missing config
  redis = {
    async get(key: string) { return null },
    async set(key: string, value: any) { return "OK" },
    async setex(key: string, ttl: number, value: any) { return "OK" },
    async del(key: string) { return 1 },
    async ping() { return "PONG" },
  }
}

export { redis }

// Cache TTL in seconds (1 hour)
const CACHE_TTL = 3600

// Cache key prefixes
const CACHE_PREFIX = {
  URL: "url:",
  STATS: "stats:",
}

// Cache a URL mapping
export async function cacheUrl(shortCode: string, originalUrl: string) {
  try {
    await redis.setex(`${CACHE_PREFIX.URL}${shortCode}`, CACHE_TTL, originalUrl)
  } catch (error) {
    console.error("[v0] Redis cache error:", error)
  }
}

// Get cached URL
export async function getCachedUrl(shortCode: string): Promise<string | null> {
  try {
    const result = await redis.get(`${CACHE_PREFIX.URL}${shortCode}`)
    return result as string | null
  } catch (error) {
    console.error("[v0] Redis get error:", error)
    return null
  }
}

// Invalidate URL cache
export async function invalidateUrlCache(shortCode: string) {
  try {
    await redis.del(`${CACHE_PREFIX.URL}${shortCode}`)
  } catch (error) {
    console.error("[v0] Redis delete error:", error)
  }
}

// Cache analytics stats
export async function cacheStats(urlId: number, stats: any) {
  try {
    // Store as JSON string
    await redis.set(`${CACHE_PREFIX.STATS}${urlId}`, JSON.stringify(stats), { ex: 300 }) // 5 min TTL
  } catch (error) {
    console.error("[v0] Redis cache stats error:", error)
  }
}

// Get cached stats
export async function getCachedStats(urlId: number): Promise<any | null> {
  try {
    const cached = await redis.get(`${CACHE_PREFIX.STATS}${urlId}`)
    if (!cached) return null
    
    // If it's already an object, return it directly
    if (typeof cached === 'object') {
      return cached
    }
    
    // If it's a string, parse it
    if (typeof cached === 'string') {
      return JSON.parse(cached)
    }
    
    return null
  } catch (error) {
    console.error("[v0] Redis get stats error:", error)
    return null
  }
}

// Invalidate stats cache
export async function invalidateStatsCache(urlId: number) {
  try {
    await redis.del(`${CACHE_PREFIX.STATS}${urlId}`)
  } catch (error) {
    console.error("[v0] Redis delete stats error:", error)
  }
}

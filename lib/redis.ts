import { Redis } from "@upstash/redis"

// Create Redis client
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

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
    return await redis.get<string>(`${CACHE_PREFIX.URL}${shortCode}`)
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

import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { redis } from "@/lib/redis"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // Check database connection
    const dbCheck = await sql`SELECT 1 as health`
    
    // Check Redis connection
    let redisHealthy = true
    try {
      await redis.ping()
    } catch (error) {
      console.error("[Health] Redis check failed:", error)
      redisHealthy = false
    }

    const status = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: dbCheck.length > 0 ? "up" : "down",
        redis: redisHealthy ? "up" : "degraded",
      },
    }

    return NextResponse.json(status, { status: 200 })
  } catch (error) {
    console.error("[Health] Health check failed:", error)
    
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    )
  }
}

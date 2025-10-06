import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { trackClick } from "@/lib/analytics"
import { invalidateStatsCache } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shortCode } = body

    // Get URL ID
    const result = await sql`
      SELECT id FROM urls WHERE short_code = ${shortCode}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 })
    }

    const urlId = result[0].id as number

    // Extract request metadata
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || null
    const userAgent = request.headers.get("user-agent") || null
    const referrer = request.headers.get("referer") || null

    // Track the click
    await trackClick(urlId, ipAddress, userAgent, referrer)

    // Invalidate stats cache
    await invalidateStatsCache(urlId)

    return NextResponse.json({
      success: true,
      message: "Click tracked successfully",
    })
  } catch (error) {
    console.error("[v0] Error tracking click:", error)
    return NextResponse.json({ error: "Failed to track click" }, { status: 500 })
  }
}

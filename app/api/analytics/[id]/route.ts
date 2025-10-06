import { type NextRequest, NextResponse } from "next/server"
import { getUrlAnalytics } from "@/lib/analytics"
import { getCachedStats, cacheStats } from "@/lib/redis"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const days = Number.parseInt(searchParams.get("days") || "30")

    const urlId = Number.parseInt(id)

    // Try to get from cache first
    let stats = await getCachedStats(urlId)

    if (!stats) {
      // Cache miss - fetch from database
      stats = await getUrlAnalytics(urlId, days)

      // Cache the stats
      await cacheStats(urlId, stats)
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("[v0] Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Get all URLs with click counts
    const urls = await sql`
      SELECT 
        u.id,
        u.short_code,
        u.original_url,
        u.created_at,
        u.expires_at,
        u.is_active,
        COUNT(c.id) as click_count
      FROM urls u
      LEFT JOIN clicks c ON u.id = c.url_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin

    const urlsWithShortUrl = urls.map((url) => ({
      ...url,
      short_url: `${baseUrl}/${url.short_code}`,
      click_count: Number.parseInt(url.click_count as string),
    }))

    return NextResponse.json({
      success: true,
      data: urlsWithShortUrl,
    })
  } catch (error) {
    console.error("[v0] Error fetching URLs:", error)
    return NextResponse.json({ error: "Failed to fetch URLs" }, { status: 500 })
  }
}

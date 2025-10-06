import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { generateShortCode, isValidUrl } from "@/lib/short-code"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, customCode, expiresIn } = body

    // Validate URL
    if (!url || !isValidUrl(url)) {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Generate or use custom short code
    let shortCode = customCode || generateShortCode()

    // If custom code provided, validate it
    if (customCode) {
      if (!/^[a-zA-Z0-9_-]{3,20}$/.test(customCode)) {
        return NextResponse.json({ error: "Custom code must be 3-20 alphanumeric characters" }, { status: 400 })
      }

      // Check if custom code already exists
      const existing = await sql`
        SELECT id FROM urls WHERE short_code = ${customCode}
      `
      if (existing.length > 0) {
        return NextResponse.json({ error: "Custom code already in use" }, { status: 409 })
      }
    } else {
      // Generate unique short code
      let attempts = 0
      while (attempts < 10) {
        const existing = await sql`
          SELECT id FROM urls WHERE short_code = ${shortCode}
        `
        if (existing.length === 0) break
        shortCode = generateShortCode()
        attempts++
      }

      if (attempts === 10) {
        return NextResponse.json({ error: "Failed to generate unique short code" }, { status: 500 })
      }
    }

    // Calculate expiration date if provided
    let expiresAt = null
    if (expiresIn) {
      const now = new Date()
      expiresAt = new Date(now.getTime() + expiresIn * 24 * 60 * 60 * 1000)
    }

    // Insert into database
    const result = await sql`
      INSERT INTO urls (short_code, original_url, expires_at)
      VALUES (${shortCode}, ${url}, ${expiresAt})
      RETURNING id, short_code, original_url, created_at, expires_at
    `

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    const shortUrl = `${baseUrl}/${result[0].short_code}`

    return NextResponse.json({
      success: true,
      data: {
        ...result[0],
        short_url: shortUrl,
      },
    })
  } catch (error) {
    console.error("[v0] Error creating short URL:", error)
    return NextResponse.json({ error: "Failed to create short URL" }, { status: 500 })
  }
}

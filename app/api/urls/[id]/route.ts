import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const result = await sql`
      SELECT 
        u.*,
        COUNT(c.id) as click_count
      FROM urls u
      LEFT JOIN clicks c ON u.id = c.url_id
      WHERE u.id = ${id}
      GROUP BY u.id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin

    return NextResponse.json({
      success: true,
      data: {
        ...result[0],
        short_url: `${baseUrl}/${result[0].short_code}`,
        click_count: Number.parseInt(result[0].click_count as string),
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching URL:", error)
    return NextResponse.json({ error: "Failed to fetch URL" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await sql`
      DELETE FROM urls WHERE id = ${id}
    `

    return NextResponse.json({
      success: true,
      message: "URL deleted successfully",
    })
  } catch (error) {
    console.error("[v0] Error deleting URL:", error)
    return NextResponse.json({ error: "Failed to delete URL" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { is_active } = body

    const result = await sql`
      UPDATE urls
      SET is_active = ${is_active}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "URL not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    })
  } catch (error) {
    console.error("[v0] Error updating URL:", error)
    return NextResponse.json({ error: "Failed to update URL" }, { status: 500 })
  }
}

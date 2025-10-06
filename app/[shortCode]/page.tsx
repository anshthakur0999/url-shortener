import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { sql } from "@/lib/db"
import { getCachedUrl, cacheUrl } from "@/lib/redis"
import { trackClick } from "@/lib/analytics"
import { invalidateStatsCache } from "@/lib/redis"

export default async function RedirectPage({ params }: { params: Promise<{ shortCode: string }> }) {
  const { shortCode } = await params
  const headersList = await headers()

  try {
    // Try to get from cache first
    let originalUrl = await getCachedUrl(shortCode)
    let urlId: number | null = null

    if (!originalUrl) {
      // Cache miss - fetch from database
      const result = await sql`
        SELECT id, original_url, expires_at, is_active
        FROM urls
        WHERE short_code = ${shortCode}
      `

      if (result.length === 0) {
        return (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold">404</h1>
              <p className="mt-2 text-muted-foreground">Short URL not found</p>
            </div>
          </div>
        )
      }

      const url = result[0]
      urlId = url.id

      // Check if URL is active
      if (!url.is_active) {
        return (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold">410</h1>
              <p className="mt-2 text-muted-foreground">This short URL has been disabled</p>
            </div>
          </div>
        )
      }

      // Check if URL has expired
      if (url.expires_at && new Date(url.expires_at) < new Date()) {
        return (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold">410</h1>
              <p className="mt-2 text-muted-foreground">This short URL has expired</p>
            </div>
          </div>
        )
      }

      originalUrl = url.original_url

      // Cache the URL for future requests
      await cacheUrl(shortCode, originalUrl)
    } else {
      const result = await sql`
        SELECT id FROM urls WHERE short_code = ${shortCode}
      `
      if (result.length > 0) {
        urlId = result[0].id
      }
    }

    if (urlId) {
      // Extract request metadata from headers
      const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || 
                        headersList.get("x-real-ip") || 
                        null
      const userAgent = headersList.get("user-agent") || null
      const referrer = headersList.get("referer") || null
      
      // Track the click with actual data
      trackClick(urlId, ipAddress, userAgent, referrer).catch((err) => console.error("[v0] Track error:", err))
      invalidateStatsCache(urlId).catch((err) => console.error("[v0] Cache invalidation error:", err))
    }

    // Redirect to the original URL
    redirect(originalUrl)
  } catch (error) {
    // Check if it's a Next.js redirect (which is expected)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error // Re-throw redirect errors
    }
    
    console.error("[v0] Error resolving short URL:", error)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Error</h1>
          <p className="mt-2 text-muted-foreground">Failed to resolve short URL</p>
        </div>
      </div>
    )
  }
}

import { sql } from "@/lib/db"
import type { ClickStats } from "@/lib/db"

// Parse user agent to extract device, browser, and OS info
export function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()

  // Detect device type
  let deviceType = "desktop"
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    deviceType = "tablet"
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) {
    deviceType = "mobile"
  }

  // Detect browser
  let browser = "unknown"
  if (ua.includes("firefox")) browser = "Firefox"
  else if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome"
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari"
  else if (ua.includes("edg")) browser = "Edge"
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera"

  // Detect OS
  let os = "unknown"
  if (ua.includes("windows")) os = "Windows"
  else if (ua.includes("mac")) os = "macOS"
  else if (ua.includes("linux")) os = "Linux"
  else if (ua.includes("android")) os = "Android"
  else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) os = "iOS"

  return { deviceType, browser, os }
}

// Track a click event
export async function trackClick(
  urlId: number,
  ipAddress: string | null,
  userAgent: string | null,
  referrer: string | null,
) {
  try {
    const { deviceType, browser, os } = userAgent
      ? parseUserAgent(userAgent)
      : { deviceType: null, browser: null, os: null }

    await sql`
      INSERT INTO clicks (url_id, ip_address, user_agent, referrer, device_type, browser, os)
      VALUES (${urlId}, ${ipAddress}, ${userAgent}, ${referrer}, ${deviceType}, ${browser}, ${os})
    `
  } catch (error) {
    console.error("[v0] Error tracking click:", error)
  }
}

// Get analytics for a specific URL
export async function getUrlAnalytics(urlId: number, days = 30): Promise<ClickStats> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Total clicks and unique IPs
    const totals = await sql`
      SELECT 
        COUNT(*) as total_clicks,
        COUNT(DISTINCT ip_address) as unique_ips
      FROM clicks
      WHERE url_id = ${urlId}
        AND clicked_at >= ${startDate.toISOString()}
    `

    // Clicks by date
    const clicksByDate = await sql`
      SELECT 
        DATE(clicked_at) as date,
        COUNT(*) as count
      FROM clicks
      WHERE url_id = ${urlId}
        AND clicked_at >= ${startDate.toISOString()}
      GROUP BY DATE(clicked_at)
      ORDER BY date DESC
    `

    // Clicks by country
    const clicksByCountry = await sql`
      SELECT 
        COALESCE(country, 'Unknown') as country,
        COUNT(*) as count
      FROM clicks
      WHERE url_id = ${urlId}
        AND clicked_at >= ${startDate.toISOString()}
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `

    // Clicks by device
    const clicksByDevice = await sql`
      SELECT 
        COALESCE(device_type, 'Unknown') as device_type,
        COUNT(*) as count
      FROM clicks
      WHERE url_id = ${urlId}
        AND clicked_at >= ${startDate.toISOString()}
      GROUP BY device_type
      ORDER BY count DESC
    `

    // Clicks by browser
    const clicksByBrowser = await sql`
      SELECT 
        COALESCE(browser, 'Unknown') as browser,
        COUNT(*) as count
      FROM clicks
      WHERE url_id = ${urlId}
        AND clicked_at >= ${startDate.toISOString()}
      GROUP BY browser
      ORDER BY count DESC
      LIMIT 10
    `

    // Top referrers
    const topReferrers = await sql`
      SELECT 
        COALESCE(referrer, 'Direct') as referrer,
        COUNT(*) as count
      FROM clicks
      WHERE url_id = ${urlId}
        AND clicked_at >= ${startDate.toISOString()}
      GROUP BY referrer
      ORDER BY count DESC
      LIMIT 10
    `

    return {
      total_clicks: Number.parseInt(totals[0].total_clicks as string),
      unique_ips: Number.parseInt(totals[0].unique_ips as string),
      clicks_by_date: clicksByDate.map((row) => ({
        date: row.date as string,
        count: Number.parseInt(row.count as string),
      })),
      clicks_by_country: clicksByCountry.map((row) => ({
        country: row.country as string,
        count: Number.parseInt(row.count as string),
      })),
      clicks_by_device: clicksByDevice.map((row) => ({
        device_type: row.device_type as string,
        count: Number.parseInt(row.count as string),
      })),
      clicks_by_browser: clicksByBrowser.map((row) => ({
        browser: row.browser as string,
        count: Number.parseInt(row.count as string),
      })),
      top_referrers: topReferrers.map((row) => ({
        referrer: row.referrer as string,
        count: Number.parseInt(row.count as string),
      })),
    }
  } catch (error) {
    console.error("[v0] Error getting analytics:", error)
    throw error
  }
}

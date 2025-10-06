import { neon } from "@neondatabase/serverless"

// Create a reusable SQL client
export const sql = neon(process.env.DATABASE_URL!)

// Database types
export interface Url {
  id: number
  short_code: string
  original_url: string
  created_at: Date
  expires_at: Date | null
  is_active: boolean
}

export interface Click {
  id: number
  url_id: number
  clicked_at: Date
  ip_address: string | null
  user_agent: string | null
  referrer: string | null
  country: string | null
  city: string | null
  device_type: string | null
  browser: string | null
  os: string | null
}

// Analytics aggregation types
export interface ClickStats {
  total_clicks: number
  unique_ips: number
  clicks_by_date: Array<{ date: string; count: number }>
  clicks_by_country: Array<{ country: string; count: number }>
  clicks_by_device: Array<{ device_type: string; count: number }>
  clicks_by_browser: Array<{ browser: string; count: number }>
  top_referrers: Array<{ referrer: string; count: number }>
}

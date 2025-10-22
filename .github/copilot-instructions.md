# URL Shortener - AI Agent Instructions

## Architecture Overview

Next.js 15 full-stack URL shortener with real-time analytics. Core services:
- **Frontend**: React 19, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API routes on Vercel serverless
- **Database**: Neon PostgreSQL serverless (`@neondatabase/serverless` driver)
- **Cache**: Upstash Redis HTTP API (also supports AWS ElastiCache in `lib/redis.ts`)
- **Analytics**: Vercel Analytics + custom click tracking with device/browser/location parsing

## Data Flow Architecture

**URL Shortening**: `POST /api/shorten` → validate URL → generate/validate short code → insert to `urls` table → return short URL
- Short codes: 4 chars default (alphanumeric, customizable 3-20 chars with collision detection)
- Custom codes checked for existing entries before insertion
- Optional `expiresIn` param (days) stored as `expires_at` timestamp

**URL Resolution**: `GET /[shortCode]` (server component) → check Redis cache → fallback to DB → check `is_active` and `expires_at` → cache hit → trigger client-side `/api/track` → redirect
- Returns 404 if short code not found
- Returns 410 if URL disabled (`is_active=false`) or expired
- Headers extracted for analytics: `x-forwarded-for`, `x-real-ip`, `user-agent`, `referer`

**Click Analytics**: `/api/track` POST → extract IP/UA/referrer → call `trackClick()` → insert to `clicks` table → invalidate stats cache
- `parseUserAgent()` extracts: deviceType (mobile/tablet/desktop), browser (Chrome/Firefox/Safari/Edge/Opera), OS (Windows/macOS/Linux/Android/iOS)
- `invalidateStatsCache()` deletes Redis key to force fresh aggregation on next analytics request

**Stats Aggregation**: `GET /api/analytics/[id]` → check 5-min Redis cache → miss: query aggregations → cache → return
- Queries: total_clicks, unique_ips, clicks_by_date, clicks_by_country, clicks_by_device, clicks_by_browser, top_referrers
- 30-day lookback default (configurable via `days` query param)

## Project Patterns

### Database Access
Tagged template literals with Neon SQL client:
```typescript
const result = await sql`SELECT * FROM urls WHERE short_code = ${code}`
// Result is array of objects with automatic type inference
```

### Cache Keys & TTL
- URLs: prefix `url:<shortCode>`, TTL 3600s (1 hour)
- Stats: prefix `stats:<urlId>`, TTL 300s (5 minutes)
- Always invalidate after mutations: `await invalidateStatsCache(urlId)` or `invalidateUrlCache(shortCode)`

### Error Responses (Consistent)
```typescript
// Errors
return NextResponse.json({ error: "message" }, { status: 400|404|409|500 })
// Success
return NextResponse.json({ success: true, data: result })
```

### UI & Forms
- All UI via shadcn/ui components in `components/ui/`
- Client components: `"use client"` directive required for state/effects
- Server components handle data fetching, then pass to client components
- Toast notifications: `const { toast } = useToast()` from `hooks/use-toast`
- Form submission: manual fetch (no Form library used)

### Logging
Error logs prefixed with `[v0]` for easy filtering in production:
```typescript
console.error("[v0] Error message:", error)
```

## Setup & Environment

### Database
Run `scripts/001-create-tables.sql` on Neon PostgreSQL to create `urls` and `clicks` tables with indexes.

### Required Env Vars
```
DATABASE_URL=postgresql://[user]:[password]@[host]/[db]
KV_REST_API_URL=https://[region].upstash.io  # or redis:// for ElastiCache
KV_REST_API_TOKEN=...                         # empty for ElastiCache
NEXT_PUBLIC_BASE_URL=https://example.com      # for generating short URLs in API responses
```

### Dev Commands
```bash
pnpm dev       # localhost:3000, hot reload
pnpm build     # compile to .next/
pnpm start     # production server
pnpm lint      # ESLint (Next.js config)
```

## Path Aliases & Imports
All imports use `@/` prefix (mapped to project root in `tsconfig.json`):
```typescript
import { sql } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { trackClick } from "@/lib/analytics"
```

## Key Files Reference
- `lib/db.ts` - Neon client init, interface definitions (Url, Click, ClickStats)
- `lib/redis.ts` - Redis abstraction, cacheUrl/getCachedUrl, cacheStats/getCachedStats, invalidation
- `lib/analytics.ts` - parseUserAgent(), trackClick(), getUrlAnalytics() aggregation
- `lib/short-code.ts` - generateShortCode(), isValidUrl()
- `app/api/shorten/route.ts` - URL creation, custom code validation, collision detection
- `app/[shortCode]/page.tsx` - Server-side redirect logic, cache check, click tracking
- `app/api/track/route.ts` - Click insertion, cache invalidation
- `app/api/analytics/[id]/route.ts` - Stats aggregation with caching</content>
<parameter name="filePath">c:\Users\Ansh\Desktop\url-shortener\.github\copilot-instructions.md
# URL Shortener - AI Agent Instructions

## Architecture Overview

This is a Next.js 15 URL shortener application with analytics tracking. Key architectural components:

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS, shadcn/ui components
- **Database**: Neon PostgreSQL with serverless driver (`@neondatabase/serverless`)
- **Cache**: Upstash Redis for URL caching and analytics stats
- **Analytics**: Vercel Analytics + custom click tracking with geolocation data
- **Deployment**: Optimized for Vercel with static generation where possible

## Core Data Flow

1. **URL Creation**: `/api/shorten` → Generate short code → Store in `urls` table → Cache in Redis
2. **URL Resolution**: `/[shortCode]` → Check Redis cache → Fallback to DB → Return original URL
3. **Click Tracking**: Client-side redirect → `/api/track` → Store click data → Invalidate stats cache
4. **Analytics**: `/api/analytics/[id]` → Aggregate click data → Cache results for 5 minutes

## Critical Developer Workflows

### Database Setup
Run the schema in `scripts/001-create-tables.sql` against your Neon database. Required environment variables:
- `DATABASE_URL`: Neon PostgreSQL connection string

### Caching Strategy
- URLs cached in Redis for 1 hour (`CACHE_TTL = 3600`)
- Analytics stats cached for 5 minutes
- Cache invalidation required after URL updates or new clicks

### Analytics Implementation
Custom click tracking extracts: IP, User-Agent, Referrer, Device/Browser/OS from `parseUserAgent()` in `lib/analytics.ts`

## Project-Specific Patterns

### Path Aliases
Use `@/` prefix for all imports:
```typescript
import { sql } from "@/lib/db"
import { Button } from "@/components/ui/button"
```

### Error Handling
API routes return consistent error responses:
```typescript
return NextResponse.json({ error: "Error message" }, { status: 400 })
```
Success responses:
```typescript
return NextResponse.json({ success: true, data: result })
```

### Component Structure
- shadcn/ui components in `components/ui/` with `components.json` configuration
- Client components marked with `"use client"` directive
- Server components for data fetching (API routes, page components)

### Database Queries
Use tagged template literals with the Neon client:
```typescript
const result = await sql`SELECT * FROM urls WHERE short_code = ${code}`
```

### Form Handling
React Hook Form with Zod validation (though minimal in current codebase):
```typescript
const { toast } = useToast()
toast({ title: "Success!", description: "Message" })
```

## Integration Points

### External Services
- **Neon DB**: Serverless PostgreSQL - use connection pooling for production
- **Upstash Redis**: Serverless Redis - automatic scaling, REST API
- **Vercel Analytics**: Automatic page view tracking (configured in `layout.tsx`)

### Environment Variables Required
```
DATABASE_URL=postgresql://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
```

## Key Files to Reference

- `lib/db.ts`: Database client and type definitions
- `lib/redis.ts`: Caching utilities and patterns
- `lib/analytics.ts`: Click tracking and user agent parsing
- `lib/short-code.ts`: URL validation and code generation
- `scripts/001-create-tables.sql`: Database schema
- `components/ui/`: shadcn/ui component library setup
- `app/api/`: Next.js API routes following REST conventions

## Development Commands

```bash
pnpm dev      # Start development server
pnpm build    # Production build
pnpm lint     # ESLint checking
```

## Common Patterns

- **URL Validation**: Use `isValidUrl()` from `lib/short-code.ts`
- **Short Code Generation**: `generateShortCode()` with collision detection
- **Cache Invalidation**: Always invalidate after data mutations
- **Error Logging**: Console errors prefixed with `[v0]` for filtering
- **UI Components**: Prefer shadcn/ui over custom implementations</content>
<parameter name="filePath">c:\Users\Ansh\Desktop\url-shortener\.github\copilot-instructions.md
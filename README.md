# URL Shortener

A modern, full-stack URL shortening service built with Next.js 15, featuring real-time analytics, Redis caching, and a beautiful UI powered by shadcn/ui.

## 🚀 Features

- **URL Shortening**: Convert long URLs into short, shareable links (4-character codes by default)
- **Custom Short Codes**: Option to create custom branded short links
- **Click Analytics**: Comprehensive tracking including:
  - Total clicks and unique visitors
  - Geographic data (country, city)
  - Device type (mobile, tablet, desktop)
  - Browser and OS information
  - Referrer tracking
  - Time-based analytics with charts
- **Redis Caching**: Fast URL resolution with 1-hour cache TTL
- **Expiration Support**: Optional expiration dates for temporary links
- **Active/Inactive Toggle**: Enable or disable short URLs without deletion
- **Modern UI**: Clean, responsive interface built with Tailwind CSS and shadcn/ui components
- **Real-time Updates**: Instant updates when creating or managing URLs

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library
- **Recharts** - Data visualization for analytics
- **Geist Font** - Modern typography

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Neon PostgreSQL** - Serverless Postgres database
- **Upstash Redis** - Serverless Redis for caching
- **Vercel Analytics** - Built-in web analytics

### Key Libraries
- `@neondatabase/serverless` - Database connection
- `@upstash/redis` - Redis client
- `react-hook-form` - Form handling
- `zod` - Schema validation
- `date-fns` - Date formatting
- `lucide-react` - Icon library

## 📁 Project Structure

```
url-shortener/
├── app/
│   ├── api/
│   │   ├── shorten/        # Create short URLs
│   │   ├── track/          # Click tracking endpoint
│   │   ├── analytics/[id]/ # Analytics data API
│   │   ├── urls/           # List all URLs
│   │   └── urls/[id]/      # Update/delete specific URL
│   ├── analytics/[id]/     # Analytics dashboard page
│   ├── [shortCode]/        # Dynamic redirect route
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── analytics-dashboard.tsx
│   ├── url-shortener-form.tsx
│   └── url-list.tsx
├── lib/
│   ├── db.ts              # Database client and types
│   ├── redis.ts           # Redis caching utilities
│   ├── analytics.ts       # Click tracking logic
│   ├── short-code.ts      # URL validation & code generation
│   └── utils.ts           # Helper functions
├── scripts/
│   └── 001-create-tables.sql  # Database schema
└── .env.local             # Environment variables
```

## 🗄️ Database Schema

### URLs Table
```sql
CREATE TABLE urls (
  id SERIAL PRIMARY KEY,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);
```

### Clicks Table
```sql
CREATE TABLE clicks (
  id SERIAL PRIMARY KEY,
  url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  country VARCHAR(2),
  city VARCHAR(100),
  device_type VARCHAR(20),
  browser VARCHAR(50),
  os VARCHAR(50)
);
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+ and pnpm
- Neon PostgreSQL account
- Upstash Redis account

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd url-shortener
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Set Up Database
1. Create a [Neon](https://neon.tech) PostgreSQL database
2. Run the SQL script from `scripts/001-create-tables.sql` in your Neon SQL editor

### 4. Set Up Redis Cache
1. Create a [Upstash](https://upstash.com) Redis database
2. Copy your REST API URL and token

### 5. Configure Environment Variables
Create a `.env.local` file:
```env
# Database
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require

# Upstash Redis
KV_REST_API_URL=https://your-redis-url.upstash.io
KV_REST_API_TOKEN=your-redis-token

# Optional: Base URL for generated short URLs (auto-detects if not set)
# NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 6. Run Development Server
```bash
pnpm dev
```

Visit `http://localhost:3000` to see your URL shortener in action!

## 📊 How It Works

### URL Creation Flow
1. User submits a long URL (with optional custom code)
2. System generates a 4-character short code or uses custom code
3. Validates uniqueness against database
4. Stores URL in PostgreSQL with metadata
5. Caches URL in Redis for fast lookups
6. Returns shortened URL to user

### URL Resolution Flow
1. User visits shortened URL (e.g., `/aBc4`)
2. System checks Redis cache first
3. If cache miss, queries PostgreSQL database
4. Validates URL is active and not expired
5. Caches result in Redis (1-hour TTL)
6. Redirects user to original URL
7. Tracks click asynchronously with analytics data

### Analytics Tracking
- **Server-side tracking**: Extracts IP, User-Agent, Referrer from headers
- **User-Agent parsing**: Detects device type, browser, OS
- **Aggregation**: Stats cached for 5 minutes
- **Visualization**: Charts show clicks over time, by country, device, browser

## 🎨 Key Components

### URL Shortener Form (`url-shortener-form.tsx`)
- Input for long URL
- Optional custom short code
- Real-time validation
- Toast notifications
- Copy to clipboard functionality

### URL List (`url-list.tsx`)
- Displays all created short URLs
- Shows click counts
- Copy, analytics, and delete actions
- Active/inactive status badges

### Analytics Dashboard (`analytics-dashboard.tsx`)
- Overview cards (total clicks, unique visitors)
- Time-series chart (clicks over time)
- Geographic distribution
- Device type breakdown
- Browser statistics
- Top referrers

## 🚀 Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Import project to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

Your shortened URLs will automatically use your Vercel domain (e.g., `https://your-app.vercel.app/aBc4`)

### Custom Domain
1. Add your custom domain in Vercel settings
2. Update DNS records as instructed
3. URLs will use your custom domain automatically

## 🔐 Security & Performance

- **Input Validation**: URL format validation with type safety
- **SQL Injection Protection**: Parameterized queries via Neon client
- **Rate Limiting**: (Optional) Add rate limiting middleware
- **Caching Strategy**: 
  - URLs cached for 1 hour
  - Analytics stats cached for 5 minutes
  - Automatic cache invalidation on updates
- **Database Indexes**: Optimized queries with proper indexes
- **Serverless**: Scales automatically with traffic

## 📝 Configuration Options

### Short Code Length
Modify in `lib/short-code.ts`:
```typescript
export function generateShortCode(length = 4): string {
  // Change default length here (3-10 recommended)
}
```

### Cache TTL
Modify in `lib/redis.ts`:
```typescript
const CACHE_TTL = 3600 // 1 hour in seconds
```

### Analytics Retention
Currently unlimited. Consider adding cleanup logic for old click data.

## 🐛 Troubleshooting

### URLs not redirecting
- Ensure `app/[shortCode]/route.ts` doesn't exist (should only have `page.tsx`)
- Restart dev server after file changes
- Clear `.next` cache folder

### Database connection errors
- Verify `DATABASE_URL` is correct
- Ensure tables are created via SQL script
- Check Neon database is active

### Redis caching issues
- Verify Upstash credentials
- Check Redis dashboard for connectivity
- Caching is optional - app works without it

## 📈 Future Enhancements

- [ ] QR code generation for short URLs
- [ ] Bulk URL shortening via CSV import
- [ ] API authentication with API keys
- [ ] Rate limiting per user/IP
- [ ] Custom domains per user
- [ ] Password-protected URLs
- [ ] Link preview cards
- [ ] A/B testing for multiple destinations
- [ ] Webhook notifications for events
- [ ] Export analytics data (CSV, PDF)

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, React, and modern web technologies.

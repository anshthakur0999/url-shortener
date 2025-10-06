import { UrlShortenerForm } from "@/components/url-shortener-form"
import { UrlList } from "@/components/url-list"
import { Link2 } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Link2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-balance font-sans text-4xl font-bold tracking-tight">URL Shortener</h1>
          </div>
          <p className="text-pretty text-lg text-muted-foreground">
            Create short, trackable links with detailed analytics
          </p>
        </div>

        {/* URL Shortener Form */}
        <div className="mb-12">
          <UrlShortenerForm />
        </div>

        {/* URL List */}
        <div>
          <UrlList />
        </div>
      </div>
    </div>
  )
}

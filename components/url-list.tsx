"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, ExternalLink, Trash2, Copy, Check } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Url {
  id: number
  short_code: string
  original_url: string
  short_url: string
  created_at: string
  click_count: number
  is_active: boolean
}

export function UrlList() {
  const [urls, setUrls] = useState<Url[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const { toast } = useToast()

  const fetchUrls = async () => {
    try {
      const response = await fetch("/api/urls")
      const data = await response.json()
      if (data.success) {
        setUrls(data.data)
      }
    } catch (error) {
      console.error("[v0] Error fetching URLs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUrls()
  }, [])

  const copyToClipboard = async (url: string, id: number) => {
    await navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)

    toast({
      title: "Copied!",
      description: "Short URL copied to clipboard.",
    })
  }

  const deleteUrl = async (id: number) => {
    try {
      const response = await fetch(`/api/urls/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUrls(urls.filter((url) => url.id !== id))
        toast({
          title: "Deleted",
          description: "URL has been deleted successfully.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete URL",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your URLs</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your URLs</CardTitle>
        <CardDescription>Manage and track your shortened URLs</CardDescription>
      </CardHeader>
      <CardContent>
        {urls.length === 0 ? (
          <p className="text-center text-muted-foreground">No URLs yet. Create your first short URL above!</p>
        ) : (
          <div className="space-y-4">
            {urls.map((url) => (
              <div key={url.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{url.short_url}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(url.short_url, url.id)}
                    >
                      {copiedId === url.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                    <Badge variant="secondary" className="ml-2">
                      {url.click_count} clicks
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{url.original_url}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(url.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/analytics/${url.id}`}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={url.short_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteUrl(url.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

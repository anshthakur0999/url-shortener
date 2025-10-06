"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link2, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function UrlShortenerForm() {
  const [url, setUrl] = useState("")
  const [customCode, setCustomCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [shortUrl, setShortUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          customCode: customCode || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create short URL")
      }

      setShortUrl(data.data.short_url)
      setUrl("")
      setCustomCode("")

      toast({
        title: "Success!",
        description: "Your short URL has been created.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create short URL",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    toast({
      title: "Copied!",
      description: "Short URL copied to clipboard.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Short URL</CardTitle>
        <CardDescription>Enter a long URL to generate a short, shareable link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Original URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/very/long/url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customCode">Custom Code (Optional)</Label>
            <Input
              id="customCode"
              type="text"
              placeholder="my-custom-link"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              pattern="[a-zA-Z0-9_-]{3,20}"
              title="3-20 alphanumeric characters, dashes, or underscores"
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            <Link2 className="mr-2 h-4 w-4" />
            {isLoading ? "Creating..." : "Shorten URL"}
          </Button>
        </form>

        {shortUrl && (
          <div className="mt-6 space-y-2">
            <Label>Your Short URL</Label>
            <div className="flex gap-2">
              <Input value={shortUrl} readOnly className="font-mono" />
              <Button onClick={copyToClipboard} variant="outline" size="icon">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, Loader2, Globe } from "lucide-react"
import { analyzeWebsite } from "@/lib/api"
import type { AccessibilityResults } from "@/lib/types"

interface UrlInputFormProps {
  onResults?: (results: AccessibilityResults) => void
}

export function UrlInputForm({ onResults }: UrlInputFormProps) {
  const [url, setUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const results = await analyzeWebsite(url)
      onResults?.(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze website")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const isValidUrl = (str: string) => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  return (
    <Card className="p-8 max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="url" className="text-sm font-medium">
            Website URL
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-10 h-12 text-base"
              disabled={isAnalyzing}
            />
          </div>
          {url && !isValidUrl(url) && <p className="text-sm text-destructive">Please enter a valid URL</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-12 text-base"
          disabled={!url.trim() || !isValidUrl(url) || isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Website...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Analyze Accessibility
            </>
          )}
        </Button>

        {isAnalyzing && (
          <div className="text-center space-y-2">
            <div className="text-sm text-muted-foreground">Running comprehensive accessibility tests...</div>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
      </form>

      <div className="mt-6 pt-6 border-t border-border">
        <div className="text-sm text-muted-foreground text-center">
          <p className="mb-2">Try these example websites:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["https://github.com", "https://vercel.com", "https://stripe.com"].map((exampleUrl) => (
              <button
                key={exampleUrl}
                onClick={() => setUrl(exampleUrl)}
                className="px-3 py-1 rounded-md bg-muted hover:bg-muted/80 text-xs transition-colors"
                disabled={isAnalyzing}
              >
                {exampleUrl.replace("https://", "")}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

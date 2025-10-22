"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { UrlInputForm } from "@/components/url-input-form"
import { FeatureGrid } from "@/components/feature-grid"
import { ResultsDashboard } from "@/components/results-dashboard"
import type { AccessibilityResults } from "@/lib/types"

export default function HomePage() {
  const [results, setResults] = useState<AccessibilityResults | null>(null)

  const handleResults = (newResults: AccessibilityResults) => {
    setResults(newResults)
  }

  const handleBack = () => {
    setResults(null)
  }

  if (results) {
    return <ResultsDashboard results={results} onBack={handleBack} />
  }

  async function scrapePage(url) {
  const res = await fetch("/api/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data = await res.json();
  console.log("Packaged scrape:", data);
}


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              Web Accessibility Auditor
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-balance">
              Audit websites for <span className="text-primary">accessibility</span> compliance
            </h1>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Get comprehensive accessibility scores and actionable recommendations to make your websites more inclusive
              for all users.
            </p>
          </div>

          <UrlInputForm onResults={handleResults} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">WCAG 2.1</div>
              <div className="text-sm text-muted-foreground">Compliance Testing</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">100+</div>
              <div className="text-sm text-muted-foreground">Accessibility Checks</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">Real-time</div>
              <div className="text-sm text-muted-foreground">Analysis Results</div>
            </div>
          </div>
        </div>
      </main>

      <FeatureGrid />
    </div>
  )
}

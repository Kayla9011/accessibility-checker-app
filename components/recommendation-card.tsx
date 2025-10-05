"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Target, ExternalLink, Copy, CheckCircle } from "lucide-react"
import { useState } from "react"
import type { AccessibilityRecommendation } from "@/lib/types"

interface RecommendationCardProps {
  recommendation: AccessibilityRecommendation
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "low":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case "easy":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "moderate":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "complex":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  return (
    <Card className="p-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
              <div className="text-left">
                <h3 className="font-semibold">{recommendation.title}</h3>
                <p className="text-sm text-muted-foreground">{recommendation.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getPriorityColor(recommendation.priority)}>
                {recommendation.priority}
              </Badge>
              <Badge variant="outline" className={getEffortColor(recommendation.effort)}>
                {recommendation.effort}
              </Badge>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4">
          <div className="flex items-start gap-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
            <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <strong>Impact:</strong> {recommendation.impact}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Implementation Steps
            </h4>
            <ol className="space-y-2">
              {recommendation.steps.map((step, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {recommendation.codeExample && (
            <div className="space-y-3">
              <h4 className="font-medium">Code Example</h4>
              <div className="grid gap-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-500">Before (Incorrect)</span>
                    <Button variant="ghost" size="sm" onClick={() => copyCode(recommendation.codeExample!.before)}>
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    <code>{recommendation.codeExample.before}</code>
                  </pre>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-500">After (Correct)</span>
                    <Button variant="ghost" size="sm" onClick={() => copyCode(recommendation.codeExample!.after)}>
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    <code>{recommendation.codeExample.after}</code>
                  </pre>
                </div>
              </div>
            </div>
          )}

          {recommendation.resources.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Additional Resources</h4>
              <div className="space-y-2">
                {recommendation.resources.map((resource, index) => (
                  <Button key={index} variant="ghost" size="sm" className="justify-start h-auto p-2" asChild>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                      <div className="text-left">
                        <div className="font-medium">{resource.title}</div>
                        <div className="text-xs text-muted-foreground capitalize">{resource.type}</div>
                      </div>
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

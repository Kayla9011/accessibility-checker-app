"use client"

import type { AccessibilityResults } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RecommendationCard } from "@/components/recommendation-card"
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  ExternalLink,
  ArrowLeft,
  Calendar,
  Globe,
  Lightbulb,
} from "lucide-react"

interface ResultsDashboardProps {
  results: AccessibilityResults
  onBack: () => void
}

export function ResultsDashboard({ results, onBack }: ResultsDashboardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500"
    if (score >= 80) return "text-yellow-500"
    if (score >= 70) return "text-orange-500"
    return "text-red-500"
  }

  const getGradeColor = (grade: string) => {
    if (grade === "A") return "bg-green-500/10 text-green-500 border-green-500/20"
    if (grade === "B") return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    if (grade === "C") return "bg-orange-500/10 text-orange-500 border-orange-500/20"
    return "bg-red-500/10 text-red-500 border-red-500/20"
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "critical":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "serious":
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case "moderate":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "minor":
        return <Info className="w-4 h-4 text-blue-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "serious":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "moderate":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "minor":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Analyzer
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {new Date(results.analyzedAt).toLocaleString()}
            </div>
          </div>

          {/* URL and Score Overview */}
          <Card className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  Analyzed Website
                </div>
                <h1 className="text-2xl font-bold break-all">{results.url}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Tested with {results.testEngine}</span>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getScoreColor(results.score)}`}>{results.score}</div>
                  <div className="text-sm text-muted-foreground">Accessibility Score</div>
                </div>
                <Badge variant="outline" className={`text-lg px-4 py-2 ${getGradeColor(results.grade)}`}>
                  Grade {results.grade}
                </Badge>
              </div>
            </div>

            <div className="mt-6">
              <Progress value={results.score} className="h-3" />
            </div>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{results.summary.critical}</div>
              <div className="text-sm text-muted-foreground">Critical Issues</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-500">{results.summary.serious}</div>
              <div className="text-sm text-muted-foreground">Serious Issues</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">{results.summary.moderate}</div>
              <div className="text-sm text-muted-foreground">Moderate Issues</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{results.summary.passes}</div>
              <div className="text-sm text-muted-foreground">Tests Passed</div>
            </Card>
          </div>

          {/* Violations */}
          {results.violations.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <XCircle className="w-5 h-5 text-red-500" />
                <h2 className="text-xl font-semibold">Accessibility Violations</h2>
                <Badge variant="destructive">{results.violations.length}</Badge>
              </div>

              <div className="space-y-4">
                {results.violations.map((violation, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getImpactIcon(violation.impact)}
                          <h3 className="font-semibold">{violation.description}</h3>
                          <Badge variant="outline" className={getImpactColor(violation.impact)}>
                            {violation.impact}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{violation.help}</p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={violation.helpUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>

                    {violation.nodes.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Affected Elements:</div>
                        {violation.nodes.slice(0, 3).map((node, nodeIndex) => (
                          <div key={nodeIndex} className="bg-muted rounded p-3 space-y-1">
                            <div className="text-xs text-muted-foreground">Target: {node.target.join(", ")}</div>
                            <code className="text-xs bg-background px-2 py-1 rounded">{node.html}</code>
                            <div className="text-xs text-muted-foreground">{node.failureSummary}</div>
                          </div>
                        ))}
                        {violation.nodes.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{violation.nodes.length - 3} more elements affected
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {results.violations.some((v) => v.recommendation) && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-semibold">Actionable Recommendations</h2>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                  {results.violations.filter((v) => v.recommendation).length}
                </Badge>
              </div>

              <div className="space-y-4">
                {results.violations
                  .filter((violation) => violation.recommendation)
                  .map((violation, index) => (
                    <RecommendationCard key={index} recommendation={violation.recommendation!} />
                  ))}
              </div>
            </Card>
          )}

          {/* Passed Tests */}
          {results.passes.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h2 className="text-xl font-semibold">Passed Tests</h2>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  {results.passes.length}
                </Badge>
              </div>

              <div className="grid gap-3">
                {results.passes.map((pass, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-green-500/5 rounded-lg border border-green-500/10"
                  >
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{pass.description}</div>
                      <div className="text-xs text-muted-foreground">{pass.help}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

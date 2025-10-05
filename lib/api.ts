import type { AccessibilityResults } from "./types"

export async function analyzeWebsite(url: string): Promise<AccessibilityResults> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to analyze website")
  }

  return response.json()
}

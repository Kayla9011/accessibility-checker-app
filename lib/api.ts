import type { AccessibilityResults } from "./types"

export async function analyzeWebsite(url: string): Promise<AccessibilityResults> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })

  const raw = await res.text()

  if (!res.ok) {
    try {
      const { error } = JSON.parse(raw)
      throw new Error(error || `Request failed (${res.status})`)
    } catch {
      throw new Error(raw?.trim() || `Request failed (${res.status})`)
    }
  }

  if (!raw) throw new Error("Empty response from server")

  try {
    return JSON.parse(raw) as AccessibilityResults
  } catch {
    throw new Error("Invalid JSON from server")
  }
}

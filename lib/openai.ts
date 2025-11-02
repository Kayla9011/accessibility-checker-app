import OpenAI from "openai"
import type { Recommendation } from "@/lib/types"

type AxeNode = {
  target: string[]
  html?: string
  failureSummary?: string
}

type PendingViolation = {
  id: string
  description: string
  help?: string
  helpUrl?: string
  nodes?: AxeNode[]
}

type Violation = {
  id: string
  recommendation?: Recommendation
}

type RecoCache = Map<string, Recommendation>

const normalizeRecommendation = (raw: any): Recommendation | null => {
  if (!raw || !raw.id) return null

  const safe = (s: any, fallback = "") => (typeof s === "string" ? s : fallback)
  const arr = <T,>(a: any, fallback: T[]) => (Array.isArray(a) ? (a as T[]) : fallback)
  const lang = (l: any) => (l === "css" || l === "html" || l === "js" ? l : "html")
  const effort = (e: any) => (e === "easy" || e === "moderate" || e === "complex" ? e : "moderate")
  const priority = (p: any) => (p === "high" || p === "medium" || p === "low" ? p : "medium")

  const rec: Recommendation = {
    id: safe(raw.id),
    title: safe(raw.title, "General Accessibility Improvement"),
    description: safe(raw.description, "Refer to relevant WCAG and fix accordingly."),
    priority: priority(raw.priority),
    effort: effort(raw.effort),
    impact: safe(raw.impact, "Improves overall accessibility"),
    steps: arr<string>(raw.steps, []),
    codeExample: {
      before: safe(raw?.codeExample?.before),
      after: safe(raw?.codeExample?.after),
      language: lang(raw?.codeExample?.language),
    },
    resources: arr<any>(raw.resources, []).map((r: any) => ({
      title: safe(r?.title),
      url: safe(r?.url),
      type: (() => {
        const t = safe(r?.type, "guide")
        return t === "tool" || t === "guide" || t === "documentation" ? t : "guide"
      })(),
    })),
  }

  return rec
}

/**
 * generate recommendations using OpenAI API
 */
export async function generateRecommendations(
  pending: PendingViolation[],
  violations: Violation[],
  recoCache: RecoCache,
  client?: OpenAI
): Promise<Recommendation[]> {
  const openai = client ?? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // only process those not in cache
  const payload = pending.map((v) => ({
    id: v.id,
    description: v.description,
    help: v.help,
    helpUrl: v.helpUrl,
    html: v.nodes?.[0]?.html ?? "",
  }))

  const messages = [
    { role: "system" as const, content: "You are a web accessibility expert. Output JSON only." },
    {
      role: "user" as const,
      content:
        `Generate remediation recommendations for each violation in strict JSON object.\n` +
        `Respond with: { "items": [ ... ] }\n` +
        `Schema per item: { id, title, description, priority (high|medium|low), effort (easy|moderate|complex), ` +
        `impact, steps[], codeExample{before,after,language(css|html|js)}, ` +
        `resources[{title,url,type(guide|tool|documentation)}] }\n` +
        `Violations: ${JSON.stringify(payload)}`,
    },
  ]

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" }, // request JSON only
    messages,
  })

  let generated: Recommendation[] = []

  try {
    const content = res.choices?.[0]?.message?.content ?? "{}"
    const obj = JSON.parse(content)

    // support both array and { items: [] }
    const arr: any[] = Array.isArray(obj) ? obj : obj.items ?? Object.values(obj)
    generated = arr.map(normalizeRecommendation).filter(Boolean) as Recommendation[]
  } catch (e) {
    console.warn("[openai] JSON parse failed", e)
    generated = []
  }

  // update cache and violations
  for (const r of generated) {
    recoCache.set(r.id, r)
    const target = violations.find((v) => v.id === r.id && !v.recommendation)
    if (target) target.recommendation = r
  }

  return generated
}

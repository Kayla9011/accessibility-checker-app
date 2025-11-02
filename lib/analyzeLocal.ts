import PQueue from "p-queue";
import { runAxe } from "@/lib/runAxe";
import { runLighthouse } from "@/lib/runLighthouse";
import { getRecommendation } from "@/lib/recommendations";
import { generateRecommendations } from "@/lib/openai";
import type { Recommendation } from "@/lib/types";
import type {
  AccessibilityResults,
  AccessibilityViolation,
  Impact,
} from "@/lib/types";

function gradeFromScore(score: number): AccessibilityResults["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

// Simple in-memory cache key generator
function cacheKey(url: string) {
  const encoded = Buffer.from(url).toString("base64");
  return `accessibility:${encoded}`;
}

// In-memory cache for local analysis results
const localCache = new Map<
  string,
  { data: AccessibilityResults; expires: number }
>();

// Cache TTL: 10 minutes
const CACHE_TTL_MS = 10 * 60 * 1000;

// Limit concurrency to 2
const queue = new PQueue({ concurrency: 2 });

// Main function to analyze local website accessibility, if cached return cached result
export async function analyzeLocal(url: string): Promise<AccessibilityResults> {
  const key = cacheKey(url);
  const hit = localCache.get(key);
  const now = Date.now();
  if (hit && hit.expires > now) return hit.data;

  // Not cached or expired, perform analysis, run lighthouse and axe in parallel
  const data = await queue.add(async () => {
    const [lhScore, axeViolations] = await Promise.all([
      runLighthouse(url),
      runAxe(url),
    ]);

    // Process axe violations into our AccessibilityViolation format
    const violations: AccessibilityViolation[] = (axeViolations || []).map(
      (v: any) => ({
        id: v.id,
        impact: (v.impact || "moderate") as Impact,
        description: v.description || "",
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: (v.nodes || []).map((n: any) => ({
          target: n.target || [],
          html: n.html || "",
          failureSummary: n.failureSummary || "",
        })),
        recommendation: getRecommendation(v.id),
      })
    );

    // Generate recommendations for violations missing them
    const pending = violations
      .filter((v) => !v.recommendation)
      .map((v) => ({
        id: v.id,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes, 
      }));

    // Use a Map to avoid duplicate recommendations
    const recoCache: Map<string, Recommendation> = new Map();

    // generate recommendations using OpenAI for pending violations
    await generateRecommendations(pending, violations, recoCache);

    const counts: Record<Impact, number> = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    };
    for (const v of violations) counts[v.impact]++;

    // compute score based on counts if lighthouse score not available
    function scoreFromCounts(counts: Record<string, number>): number {
      const totalPenalty =
        counts.critical * 20 +
        counts.serious * 10 +
        counts.moderate * 5 +
        counts.minor * 2;

      const score = Math.max(100 - totalPenalty, 0);
      return Math.round(score);
    }

    const score = lhScore || scoreFromCounts(counts);
    const grade = gradeFromScore(score);

    const result: AccessibilityResults = {
      url,
      score,
      grade,
      violations,
      passes: [],
      summary: {
        total: violations.length,
        violations: violations.length,
        passes: 0,
        ...counts,
      },
      analyzedAt: new Date().toISOString(),
      testEngine: "axe+lighthouse",
    };

    return result;
  });

  localCache.set(key, { data, expires: now + CACHE_TTL_MS });
  return data;
}

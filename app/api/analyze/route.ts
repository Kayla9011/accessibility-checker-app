// app/api/analyze/route.ts
// Proxy-first to Backend-B (FastAPI). If B is unavailable, fall back to a local mock.
// Includes: Node runtime flags, strong typing, fixed "effort" union, non-optional resources,

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type {
  AccessibilityResults,
  AccessibilityViolation,
  AccessibilityPass,
} from "@/lib/types";
import { createAudit, waitForAuditResult } from "@/lib/backendB";

/** Validate incoming body: { url: string } */
const analyzeSchema = z.object({
  url: z.string().url("Please provide a valid URL"),
});

/** Impact union we will use for counters (keeps indexing safe) */
type Impact = "minor" | "moderate" | "serious" | "critical";

/** Recommendation shape that matches your front-end expectation (no undefined fields). */
type Recommendation = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  effort: "easy" | "moderate" | "complex";
  impact: string;
  steps: string[];
  codeExample: { before: string; after: string; language: "css" | "html" | "js" };
  resources: { title: string; url: string; type: "tool" | "guide" | "documentation" }[];
};

/** Literal keys we support for recommendations */
type RecommendationKey = "color-contrast" | "image-alt" | "heading-order" | "link-name";

/**
 * Strongly-typed recommendations map.
 * NOTE: arrays are mutable (string[]), and effort uses 'complex' instead of 'hard'.
 */
const recommendations: Record<RecommendationKey, Recommendation> = {
  "color-contrast": {
    id: "color-contrast",
    title: "Improve Color Contrast",
    description:
      "Ensure sufficient color contrast between text and background colors to meet WCAG AA standards.",
    priority: "high",
    effort: "easy",
    impact: "Improves readability for users with visual impairments and low vision",
    steps: [
      "Use a color contrast checker tool to test current contrast ratios",
      "Adjust text or background colors to meet 4.5:1 contrast ratio",
      "For large text (18pt+ or 14pt+ bold), ensure minimum 3:1 ratio",
      "Test improvements with real users or accessibility tools",
    ],
    codeExample: {
      before: `/* Poor contrast */
.button {
  background-color: #6366f1;
  color: #ffffff;
}`,
      after: `/* Good contrast */
.button {
  background-color: #4338ca;
  color: #ffffff;
}`,
      language: "css",
    },
    resources: [
      { title: "WebAIM Color Contrast Checker", url: "https://webaim.org/resources/contrastchecker/", type: "tool" },
      { title: "WCAG Color Contrast Guidelines", url: "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html", type: "documentation" },
    ],
  },
  "image-alt": {
    id: "image-alt",
    title: "Add Alternative Text to Images",
    description:
      "Provide meaningful alternative text for images to make content accessible to screen reader users.",
    priority: "high",
    effort: "easy",
    impact: "Essential for screen reader users to understand image content and context",
    steps: [
      "Identify images missing alt attributes",
      "Add descriptive alt text conveying purpose and content",
      'For decorative images, use alt=""',
      "For complex images, provide longer text descriptions or tables",
    ],
    codeExample: {
      before: `<img src="hero.jpg">`,
      after: `<img src="hero.jpg" alt="Team collaboration in modern office space">`,
      language: "html",
    },
    resources: [
      { title: "WebAIM Alternative Text Guide", url: "https://webaim.org/articles/alt/", type: "guide" },
      { title: "Alt Text Decision Tree", url: "https://www.w3.org/WAI/tutorials/images/decision-tree/", type: "tool" },
    ],
  },
  "heading-order": {
    id: "heading-order",
    title: "Fix Heading Structure",
    description:
      "Ensure headings follow a logical hierarchical order for proper document structure.",
    priority: "medium",
    effort: "moderate",
    impact: "Helps screen reader users navigate and understand page structure",
    steps: [
      "Use one h1 per page for the main title",
      "Follow logical order (h2 under h1, h3 under h2)",
      "Avoid skipping levels like h1 > h4",
      "Use CSS for visual style, not heading structure",
    ],
    codeExample: {
      before: `<h1>Main</h1><h4>Sub</h4>`,
      after: `<h1>Main</h1><h2>Section</h2><h3>Subsection</h3>`,
      language: "html",
    },
    resources: [
      { title: "WebAIM Heading Structure Guide", url: "https://webaim.org/articles/structure/", type: "guide" },
    ],
  },
  "link-name": {
    id: "link-name",
    title: "Provide Descriptive Link Text",
    description:
      "Ensure all links have meaningful text describing their purpose or destination.",
    priority: "high",
    effort: "easy",
    impact: "Critical for screen reader users to navigate effectively",
    steps: [
      "Find links that only have icons or vague text",
      "Add descriptive text or aria-labels to clarify purpose",
      'Avoid generic text like "click here"',
      "Ensure link text makes sense out of context",
    ],
    codeExample: {
      before: `<a href="/contact"><span class="icon"></span></a>`,
      after: `<a href="/contact" aria-label="Contact us"><span class="icon" aria-hidden="true"></span></a>`,
      language: "html",
    },
    resources: [
      { title: "WebAIM Link Text Guide", url: "https://webaim.org/techniques/hypertext/", type: "guide" },
    ],
  },
};

/** Helper: always return a valid Recommendation (never undefined) */
function getRecommendation(id: string): Recommendation {
  if (id in recommendations) {
    return recommendations[id as RecommendationKey];
  }
  // Fallback generic recommendation to satisfy non-optional shape
  return {
    id,
    title: "General Accessibility Improvement",
    description: "Refer to WCAG guidelines relevant to this rule and fix accordingly.",
    priority: "medium",
    effort: "moderate",
    impact: "Improves overall accessibility compliance",
    steps: ["Review WCAG 2.2 AA guidelines for this rule", "Fix issues and re-test"],
    codeExample: { before: "", after: "", language: "html" },
    resources: [],
  };
}

/** Build a summary block with typed counters. */
function buildSummary(
  violations: AccessibilityViolation[],
  passes: AccessibilityPass[]
) {
  const counts: Record<Impact, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };
  for (const v of violations) counts[v.impact as Impact]++;
  return {
    total: violations.length + passes.length,
    violations: violations.length,
    passes: passes.length,
    ...counts,
  };
}

/** Simple scoring heuristic used by the mock */
function scoreFromCounts(c: Record<Impact, number>) {
  const penalty = c.critical * 30 + c.serious * 20 + c.moderate * 10 + c.minor * 5;
  return Math.max(0, 100 - penalty);
}

/** Convert numeric score to letter grade */
function gradeFromScore(score: number): AccessibilityResults["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

/** Local mock analyzer (used if Backend-B is unavailable) */
async function analyzeAccessibilityMock(url: string): Promise<AccessibilityResults> {
  await new Promise((r) => setTimeout(r, 1200)); // simulate analyzer latency

  const violations: AccessibilityViolation[] = [
    {
      id: "color-contrast",
      impact: "serious",
      description: "Elements must have sufficient color contrast",
      help: "Ensure text/background colors meet WCAG AA contrast ratio thresholds",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.7/color-contrast",
      nodes: [
        {
          target: ["button.primary"],
          html: '<button class="primary">Submit</button>',
          failureSummary:
            "Element has insufficient color contrast (expected ≥ 4.5:1).",
        },
      ],
      recommendation: getRecommendation("color-contrast"),
    },
    {
      id: "image-alt",
      impact: "critical",
      description: "Images must have alternate text",
      help: "Ensures <img> elements have alt text or are marked decorative",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.7/image-alt",
      nodes: [
        {
          target: ['img[src="hero.jpg"]'],
          html: '<img src="hero.jpg" width="400" height="300">',
          failureSummary: "Element does not have an alt attribute",
        },
      ],
      recommendation: getRecommendation("image-alt"),
    },
    {
      id: "heading-order",
      impact: "moderate",
      description: "Heading levels should only increase by one",
      help: "Ensures the order of headings is semantically correct",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.7/heading-order",
      nodes: [
        {
          target: ["h4"],
          html: "<h4>Section Title</h4>",
          failureSummary: "Heading order invalid",
        },
      ],
      recommendation: getRecommendation("heading-order"),
    },
    {
      id: "link-name",
      impact: "serious",
      description: "Links must have discernible text",
      help: "Ensures links have text or accessible name",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.7/link-name",
      nodes: [
        {
          target: ['a[href="/contact"]'],
          html: '<a href="/contact"><span class="icon"></span></a>',
          failureSummary: "Link has no accessible name",
        },
      ],
      recommendation: getRecommendation("link-name"),
    },
  ];

  const passes: AccessibilityPass[] = [
    { id: "document-title", description: "Document has a non-empty <title>", help: "Describes topic or purpose" },
    { id: "landmark-one-main", description: "Page has a main landmark", help: "Provides a main region for navigation" },
  ];

  const summary = buildSummary(violations, passes);
  const score = scoreFromCounts(summary);
  const grade = gradeFromScore(score);

  return {
    url,
    score,
    grade,
    violations,
    passes,
    summary,
    analyzedAt: new Date().toISOString(),
    testEngine: "axe-core@4.7 (mock)",
  };
}

/** Types describing Backend-B violation payloads */
type BAuditViolation = {
  source: "axe" | "lighthouse";
  rule_id: string;
  severity: Impact;
  description?: string;
  help?: string;
  helpUrl?: string;
  wcag_refs?: string[];
  nodes?: { target: string[]; html?: string; failureSummary?: string }[];
};

/** Map Backend-B severity (same literals) to our impact union */
function mapSeverityToImpact(s: BAuditViolation["severity"]): Impact {
  return s;
}

/** Convert Backend-B AuditResult into the front-end AccessibilityResults */
function mapBResultToAccessibilityResults(b: any): AccessibilityResults {
  const violations: AccessibilityViolation[] = (b.violations ?? []).map(
    (v: BAuditViolation) => ({
      id: v.rule_id,
      impact: mapSeverityToImpact(v.severity),
      description: v.description ?? "",
      help: v.help ?? "",
      helpUrl: v.helpUrl ?? "",
      nodes: (v.nodes ?? []).map((n) => ({
        target: n.target,
        html: n.html ?? "",
        failureSummary: n.failureSummary ?? "",
      })),
      // Leave recommendation undefined; Backend-C can populate later
      recommendation: undefined,
    })
  );

  const passes: AccessibilityPass[] = []; // Backend-B doesn't provide passes yet

  const score: number = b.score ?? 0;
  const grade = gradeFromScore(score);

  const counts: Record<Impact, number> = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of violations) counts[v.impact]++;

  const summary = {
    total: violations.length + passes.length,
    violations: violations.length,
    passes: passes.length,
    ...counts,
  };

  return {
    url: b.url,
    score,
    grade,
    violations,
    passes,
    summary,
    analyzedAt: b.generated_at ?? new Date().toISOString(),
    testEngine: b.testEngine ?? "axe+lighthouse",
  };
}

/** Proxy-first: try Backend-B; if it errors or not configured, fall back to mock. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid request body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const B_URL = process.env.BACKEND_B_URL;
  const force = process.env.FORCE_BACKEND_B === "1";
  const url = parsed.data.url;
  console.log("[analyze] BACKEND_B_URL =", B_URL, "FORCE =", force);

  async function callBackendB(targetUrl: string) {
    if (!B_URL) throw new Error("BACKEND_B_URL not set");

    // 1) create job
    const createRes = await fetch(`${B_URL}/api/audits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: targetUrl }),
    });
    const createJson = await createRes.json().catch(() => ({}));
    console.log("[analyze] create:", createRes.status, createJson);
    if (!createRes.ok) throw new Error(`create failed ${createRes.status}`);

    const id: string | undefined = createJson.job_id ?? createJson.id;
    if (!id) throw new Error("create ok but no job_id/id");

    // 2) poll until done / score present
    const timeoutMs = Number(process.env.ANALYZE_TIMEOUT_MS || 30000);
    const pollMs = Number(process.env.ANALYZE_POLL_MS || 1200);
    const start = Date.now();

    while (true) {
      const pollRes = await fetch(`${B_URL}/api/audits/${id}`);
      const pollJson = await pollRes.json().catch(() => ({}));
      console.log("[analyze] poll:", pollRes.status, pollJson?.status ?? "—");
      if (!pollRes.ok) throw new Error(`poll failed ${pollRes.status}`);

      if (pollJson?.status === "done" || pollJson?.score !== undefined) {
        return pollJson;
      }
      if (Date.now() - start > timeoutMs) throw new Error("analyze timeout");
      await new Promise((r) => setTimeout(r, pollMs));
    }
  }

  try {
    const bRaw = await callBackendB(url);
    const mapped = mapBResultToAccessibilityResults(bRaw);
    return NextResponse.json(mapped, { status: 200 });
  } catch (e: any) {
    console.warn("[analyze] Backend-B error:", e?.message);
    if (force) {
      // show the real reason instead of masking with a mock
      return NextResponse.json(
        { error: "backend_b_failed", detail: String(e?.message) },
        { status: 502 }
      );
    }
    const mock = await analyzeAccessibilityMock(url);
    return NextResponse.json(mock, { status: 200 });
  }
}

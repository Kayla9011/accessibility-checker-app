// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import puppeteer from "puppeteer";
import type {
  AccessibilityResults,
  AccessibilityViolation,
  AccessibilityPass,
} from "@/lib/types";

const getRecommendation = (violationId: string) => {
  const recommendations = {
    "color-contrast": {
      id: "color-contrast",
      title: "Improve Color Contrast",
      description:
        "Ensure sufficient color contrast between text and background colors to meet WCAG AA standards.",
      priority: "high" as const,
      effort: "easy" as const,
      impact:
        "Improves readability for users with visual impairments and low vision",
      steps: [
        "Use a color contrast checker tool to test current contrast ratios",
        "Adjust text color, background color, or both to achieve minimum 4.5:1 ratio for normal text",
        "For large text (18pt+ or 14pt+ bold), ensure minimum 3:1 ratio",
        "Test with actual users or accessibility tools to verify improvements",
      ],
      codeExample: {
        before: `/* Poor contrast */
.button {
  background-color: #6366f1;
  color: #ffffff; /* Contrast ratio: 2.93:1 */
}`,
        after: `/* Good contrast */
.button {
  background-color: #4338ca;
  color: #ffffff; /* Contrast ratio: 4.52:1 */
}`,
        language: "css",
      },
      resources: [
        {
          title: "WebAIM Color Contrast Checker",
          url: "https://webaim.org/resources/contrastchecker/",
          type: "tool" as const,
        },
        {
          title: "WCAG Color Contrast Guidelines",
          url: "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html",
          type: "documentation" as const,
        },
      ],
    },
    "image-alt": {
      id: "image-alt",
      title: "Add Alternative Text to Images",
      description:
        "Provide meaningful alternative text for images to make content accessible to screen reader users.",
      priority: "high" as const,
      effort: "easy" as const,
      impact:
        "Essential for screen reader users to understand image content and context",
      steps: [
        "Identify all images missing alt attributes",
        "Write descriptive alt text that conveys the purpose and content of each image",
        'For decorative images, use empty alt="" or role="presentation"',
        "For complex images (charts, graphs), consider longer descriptions or data tables",
      ],
      codeExample: {
        before: ` Missing alt text 
<img src="hero.jpg" width="400" height="300">`,
        after: ` Descriptive alt text 
<img src="hero.jpg" alt="Team collaboration in modern office space" width="400" height="300">`,
        language: "html",
      },
      resources: [
        {
          title: "WebAIM Alternative Text Guide",
          url: "https://webaim.org/articles/alt/",
          type: "guide" as const,
        },
        {
          title: "Alt Text Decision Tree",
          url: "https://www.w3.org/WAI/tutorials/images/decision-tree/",
          type: "tool" as const,
        },
      ],
    },
    "heading-order": {
      id: "heading-order",
      title: "Fix Heading Structure",
      description:
        "Ensure headings follow a logical hierarchical order for proper document structure.",
      priority: "medium" as const,
      effort: "moderate" as const,
      impact:
        "Helps screen reader users navigate content efficiently and understand page structure",
      steps: [
        "Review current heading structure (h1, h2, h3, etc.)",
        "Ensure only one h1 per page (typically the main page title)",
        "Make sure headings increase by only one level (h2 after h1, h3 after h2)",
        "Use headings for structure, not just styling - use CSS for visual appearance",
      ],
      codeExample: {
        before: ` Incorrect heading order 
<h1>Main Title</h1>
<h4>Section Title</h4>  Skips h2, h3 `,
        after: ` Correct heading order 
<h1>Main Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>`,
        language: "html",
      },
      resources: [
        {
          title: "WebAIM Heading Structure Guide",
          url: "https://webaim.org/articles/structure/",
          type: "guide" as const,
        },
      ],
    },
    "link-name": {
      id: "link-name",
      title: "Provide Descriptive Link Text",
      description:
        "Ensure all links have meaningful text that describes their purpose or destination.",
      priority: "high" as const,
      effort: "easy" as const,
      impact:
        "Critical for screen reader users to understand link purposes and navigate effectively",
      steps: [
        "Review all links that contain only icons or non-descriptive text",
        "Add descriptive text or aria-label attributes to clarify link purpose",
        'Avoid generic text like "click here" or "read more"',
        "Ensure link text makes sense when read out of context",
      ],
      codeExample: {
        before: ` Non-descriptive link 
<a href="/contact"><span class="icon"></span></a>`,
        after: ` Descriptive link with aria-label 
<a href="/contact" aria-label="Contact us">
  <span class="icon" aria-hidden="true"></span>
</a>`,
        language: "html",
      },
      resources: [
        {
          title: "WebAIM Link Text Guide",
          url: "https://webaim.org/techniques/hypertext/",
          type: "guide" as const,
        },
      ],
    },
  };

  return recommendations[violationId as keyof typeof recommendations];
};

const analyzeSchema = z.object({
  url: z.string().url("Please provide a valid URL"),
});

// --- helpers to shape mock into your types ---
function buildSummary(
  violations: AccessibilityViolation[],
  passes: AccessibilityPass[]
) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const v of violations) {
    counts[v.impact]++;
  }
  return {
    total: violations.length + passes.length,
    violations: violations.length,
    passes: passes.length,
    ...counts,
  };
}

function scoreFromCounts(c: {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}) {
  // very simple scoring heuristic for mock
  const penalty =
    c.critical * 30 + c.serious * 20 + c.moderate * 10 + c.minor * 5;
  return Math.max(0, 100 - penalty);
}

function gradeFromScore(score: number): AccessibilityResults["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

// --- mock analyzer wired up to return a valid AccessibilityResults ---
async function analyzeAccessibility(
  url: string
): Promise<AccessibilityResults> {
  // simulate latency
  await new Promise((r) => setTimeout(r, 1200));

  const violations: AccessibilityViolation[] = [
    {
      id: "color-contrast",
      impact: "serious",
      description: "Elements must have sufficient color contrast",
      help: "Ensure all text elements have sufficient color contrast between text and background colors to meet WCAG AA contrast ratio thresholds",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.7/color-contrast",
      nodes: [
        {
          target: ["button.primary"],
          html: '<button class="primary">Submit</button>',
          failureSummary:
            "Fix any of the following: Element has insufficient color contrast of 2.93 (foreground color: #ffffff, background color: #6366f1, font size: 14.0pt (18.6667px), font weight: normal). Expected contrast ratio of 4.5:1",
        },
      ],
      recommendation: getRecommendation("color-contrast"),
    },
    {
      id: "image-alt",
      impact: "critical",
      description: "Images must have alternate text",
      help: "Ensures <img> elements have alternate text or a role of none or presentation",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.7/image-alt",
      nodes: [
        {
          target: ['img[src="hero.jpg"]'],
          html: '<img src="hero.jpg" width="400" height="300">',
          failureSummary:
            "Fix any of the following: Element does not have an alt attribute",
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
          failureSummary: "Fix any of the following: Heading order invalid",
        },
      ],
      recommendation: getRecommendation("heading-order"),
    },
    {
      id: "link-name",
      impact: "serious",
      description: "Links must have discernible text",
      help: "Ensures links have discernible text",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.7/link-name",
      nodes: [
        {
          target: ['a[href="/contact"]'],
          html: '<a href="/contact"><span class="icon"></span></a>',
          failureSummary:
            "Fix any of the following: Element does not have text that is visible to screen readers",
        },
      ],
      recommendation: getRecommendation("link-name"),
    },
  ];

  const passes: AccessibilityPass[] = [
    {
      id: "document-title",
      description: "Document has a non-empty <title>",
      help: "Ensures pages have a title that describes topic or purpose",
    },
    {
      id: "landmark-one-main",
      description: "Page has a main landmark",
      help: "Ensures the page has at least one main landmark for navigation",
    },
  ];

  const summary = buildSummary(violations, passes);
  const score = scoreFromCounts(summary);
  const grade = gradeFromScore(score);

  const results: AccessibilityResults = {
    url,
    score,
    grade,
    violations,
    passes,
    summary,
    analyzedAt: new Date().toISOString(),
    testEngine: "axe-core@4.7 (mock)",
  };

  return results;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = analyzeSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid request body";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const results = await analyzeAccessibility(parsed.data.url);
    return NextResponse.json(results, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

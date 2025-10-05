import { z } from "zod"

const analyzeSchema = z.object({
  url: z.string().url("Please provide a valid URL"),
})

const getRecommendation = (violationId: string) => {
  const recommendations = {
    "color-contrast": {
      id: "color-contrast",
      title: "Improve Color Contrast",
      description: "Ensure sufficient color contrast between text and background colors to meet WCAG AA standards.",
      priority: "high" as const,
      effort: "easy" as const,
      impact: "Improves readability for users with visual impairments and low vision",
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
      description: "Provide meaningful alternative text for images to make content accessible to screen reader users.",
      priority: "high" as const,
      effort: "easy" as const,
      impact: "Essential for screen reader users to understand image content and context",
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
      description: "Ensure headings follow a logical hierarchical order for proper document structure.",
      priority: "medium" as const,
      effort: "moderate" as const,
      impact: "Helps screen reader users navigate content efficiently and understand page structure",
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
      description: "Ensure all links have meaningful text that describes their purpose or destination.",
      priority: "high" as const,
      effort: "easy" as const,
      impact: "Critical for screen reader users to understand link purposes and navigate effectively",
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
  }

  return recommendations[violationId as keyof typeof recommendations]
}

// Mock accessibility analysis function
async function analyzeAccessibility(url: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Mock analysis results - in a real implementation, this would use axe-core or similar
  const violations = [
    {
      id: "color-contrast",
      impact: "serious" as const,
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
      impact: "critical" as const,
      description: "Images must have alternate text",
      help: "Ensures <img> elements have alternate text or a role of none or presentation",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.7/image-alt",
      nodes: [
        {
          target: ['img[src="hero.jpg"]'],
          html: '<img src="hero.jpg" width="400" height="300">',
          failureSummary: "Fix any of the following: Element does not have an alt attribute",
        },
      ],
      recommendation: getRecommendation("image-alt"),
    },
    {
      id: "heading-order",
      impact: "moderate" as const,
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
      impact: "serious" as const,
      description: "Links must have discernible text",
      help: "Ensures links have discernible text",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.7/link-name",
      nodes: [
        {
          target: ['a[href="/contact"]'],
          html: '<a href="/contact"><span class="icon"></span></a>',
          failureSummary: "Fix any of the following: Element does not have text that is visible to screen readers",
        },
      ],
      recommendation: getRecommendation("link-name"),
    },
  ]
}

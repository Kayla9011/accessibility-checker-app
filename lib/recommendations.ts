import type { Recommendation } from "@/lib/types"

export const recommendations: Record<string, Recommendation> = {
  "html-has-lang": {
    id: "html-has-lang",
    title: "Specify Page Language",
    description: "Ensure the <html> element declares a valid lang attribute.",
    priority: "medium",
    effort: "easy",
    impact: "Improves pronunciation and braille translation",
    steps: ["Add lang attribute", "Update dynamically for locale switch"],
    codeExample: {
      before: `<html>`,
      after: `<html lang="en">`,
      language: "html",
    },
    resources: [
      {
        title: "WCAG: Language of Page",
        url: "https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html",
        type: "documentation",
      },
    ],
  },

  "document-title": {
    id: "document-title",
    title: "Add a Descriptive <title>",
    description: "Ensure document has a meaningful <title> element.",
    priority: "medium",
    effort: "easy",
    impact: "Improves identification of pages in assistive tech",
    steps: ["Provide unique title per route", "Include brand and page purpose"],
    codeExample: {
      before: `<title></title>`,
      after: `<title>Pricing – Acme</title>`,
      language: "html",
    },
    resources: [
      {
        title: "HTML Standard: title",
        url: "https://html.spec.whatwg.org/multipage/semantics.html#the-title-element",
        type: "documentation",
      },
    ],
  },

  "aria-roles": {
    id: "aria-roles",
    title: "Use Valid ARIA Roles",
    description: "Ensure elements use permitted ARIA roles.",
    priority: "high",
    effort: "moderate",
    impact: "Prevents misleading semantics for AT",
    steps: ["Remove invalid roles", "Prefer native semantics over ARIA"],
    codeExample: {
      before: `<div role="button" tabindex="0">`,
      after: `<button>`,
      language: "html",
    },
    resources: [
      {
        title: "ARIA in HTML",
        url: "https://www.w3.org/TR/html-aria/",
        type: "documentation",
      },
    ],
  },

  "aria-allowed-attr": {
    id: "aria-allowed-attr",
    title: "Use Allowed ARIA Attributes",
    description:
      "Ensure ARIA attributes match the role's allowed states and properties.",
    priority: "medium",
    effort: "moderate",
    impact: "Improves AT consistency",
    steps: ["Check role's allowed attributes", "Remove unsupported aria-*"],
    codeExample: {
      before: `<div role="img" aria-checked="true">`,
      after: `<div role="img" aria-label="Logo">`,
      language: "html",
    },
    resources: [
      {
        title: "ARIA Spec",
        url: "https://www.w3.org/TR/wai-aria-1.2/",
        type: "documentation",
      },
    ],
  },

  label: {
    id: "label",
    title: "Label Form Controls",
    description: "Every form control must have a programmatic label.",
    priority: "high",
    effort: "easy",
    impact: "Enables AT users to understand form fields",
    steps: ["Use <label for>", "Or aria-label/aria-labelledby"],
    codeExample: {
      before: `<input id="email">`,
      after: `<label for="email">Email</label><input id="email">`,
      language: "html",
    },
    resources: [
      {
        title: "WAI Forms",
        url: "https://www.w3.org/WAI/tutorials/forms/",
        type: "guide",
      },
    ],
  },

  "form-field-multiple-labels": {
    id: "form-field-multiple-labels",
    title: "Avoid Multiple Labels",
    description: "Each form control should have a single accessible name.",
    priority: "medium",
    effort: "easy",
    impact: "Prevents conflicting announcements in AT",
    steps: ["Ensure one computed name", "Remove duplicate labels"],
    codeExample: {
      before: `<input aria-label="Email" aria-labelledby="id1 id2">`,
      after: `<input aria-labelledby="id1">`,
      language: "html",
    },
    resources: [
      {
        title: "Accessible Name & Description",
        url: "https://www.w3.org/TR/accname-1.2/",
        type: "documentation",
      },
    ],
  },
}

export function getRecommendation(id: string) {
  return (recommendations as Record<string, Recommendation>)[id]
}

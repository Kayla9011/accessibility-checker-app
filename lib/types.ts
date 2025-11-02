export type Impact = "minor" | "moderate" | "serious" | "critical";

export interface AccessibilityViolation {
  id: string;
  impact: Impact;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    target: string[];
    html?: string;
    failureSummary?: string;
  }>;
  recommendation?: Recommendation;
}

export interface AccessibilityPass {
  id: string;
  description: string;
  help?: string;
}

export interface AccessibilityResults {
  url: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  violations: AccessibilityViolation[];
  passes: AccessibilityPass[];
  summary: {
    total: number;
    violations: number;
    passes: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  analyzedAt: string;
  testEngine: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  effort: "easy" | "moderate" | "complex";
  impact: string;
  steps: string[];
  codeExample?: {
    before: string;
    after: string;
    language: string;
  };
  resources: Array<{
    title: string;
    url: string;
    type: "documentation" | "tool" | "guide";
  }>;
}

export interface AnalysisState {
  isLoading: boolean;
  results: AccessibilityResults | null;
  error: string | null;
}

import { Card } from "@/components/ui/card"
import { Shield, Zap, FileText, Users, BarChart3, CheckCircle } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "WCAG Compliance",
    description: "Comprehensive testing against WCAG 2.2 AA and AAA standards for complete accessibility coverage.",
  },
  {
    icon: Zap,
    title: "Real-time Analysis",
    description: "Get instant accessibility scores and detailed reports within seconds of submitting your URL.",
  },
  {
    icon: FileText,
    title: "Detailed Reports",
    description: "Receive comprehensive reports with specific violations, impact levels, and remediation guidance.",
  },
  {
    icon: Users,
    title: "User Impact Focus",
    description: "Understand how accessibility issues affect real users with disabilities and assistive technologies.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Monitor accessibility improvements over time with historical scoring and trend analysis.",
  },
  {
    icon: CheckCircle,
    title: "Actionable Fixes",
    description: "Get specific, developer-friendly recommendations with code examples and implementation guides.",
  },
]

export function FeatureGrid() {
  return (
    <section id="features" className="py-24 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Comprehensive Accessibility Testing</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to make your websites accessible to all users, with detailed insights and actionable
            recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

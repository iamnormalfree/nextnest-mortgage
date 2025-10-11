// Mobile-specific types extending existing SimpleAgentUI interfaces
export interface MobileInsightCardProps {
  title: string
  priority: 'high' | 'medium' | 'low'
  summary: string
  details?: string[]
  action?: MobileAction
  isExpanded?: boolean
  onToggle?: () => void
}

export interface MobileAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export interface MobileTab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

export interface MobileSectionTabsProps {
  tabs: MobileTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

export interface MobileScoreWidgetProps {
  score: number
  priority: string
  className?: string
}

// Re-export existing types from SimpleAgentUI for compatibility
export interface SituationalInsights {
  otpAnalysis?: {
    urgencyLevel: 'critical' | 'high' | 'moderate' | 'low'
    keyFactors: string[]
    recommendations: string[]
    timeline: string
  }
  paymentSchemeAnalysis?: {
    progressivePayment: {
      applicable: boolean
      benefit: string | null
    }
    deferredPayment: {
      applicable: boolean
      benefit: string | null
    }
    normalPayment: {
      recommendation: string
    }
  }
  lockInAnalysis?: {
    currentStatus: 'locked' | 'ending_soon' | 'free' | 'unknown'
    actionRequired: boolean
    timing: string
    strategy: string[]
  }
  overallRecommendation?: string
  nextSteps?: string[]
}

export interface RateIntelligence {
  marketPhase?: string
  fedStance?: string
  soraOutlook?: string
  recommendedPackageType?: string
  timingRecommendation?: string
  keyInsights?: string[]
  riskFactors?: string[]
}

export interface DefenseStrategy {
  strategies?: Array<{
    title: string
    description: string
    priority: 'high' | 'medium' | 'low'
  }>
  primaryFocus?: string
  nextActions?: string[]
}

export interface MobileAIBrokerUIProps {
  situationalInsights?: SituationalInsights | null
  rateIntelligence?: RateIntelligence | null
  defenseStrategy?: DefenseStrategy | null
  leadScore?: number | null
  isLoading?: boolean
  onBrokerConsultation?: () => void
}
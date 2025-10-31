// ABOUTME: A/B testing experiment configuration for mobile form optimization
// ABOUTME: Defines experiment variants and deterministic bucketing logic

export interface Experiment {
  id: string
  name: string
  description: string
  variants: string[]
  defaultVariant: string
  active: boolean
  startDate?: string
  endDate?: string
  targetAudience?: 'all' | 'mobile' | 'desktop'
}

export const EXPERIMENTS: Record<string, Experiment> = {
  mobile_form_rollout: {
    id: 'mobile_form_rollout',
    name: 'Mobile Form Rollout',
    description: 'Gradual rollout of mobile-optimized form experience',
    variants: ['control', 'mobile_optimized'],
    defaultVariant: 'control',
    active: true,
    targetAudience: 'mobile'
  },
  step2_cta_copy: {
    id: 'step2_cta_copy',
    name: 'Step 2 CTA Copy Variants',
    description: 'Test different call-to-action copy on Step 2 (Property Details)',
    variants: ['control', 'urgent', 'benefit', 'social_proof'],
    defaultVariant: 'control',
    active: true,
    targetAudience: 'mobile'
  },
  instant_calc_timing: {
    id: 'instant_calc_timing',
    name: 'Instant Calculation Timing',
    description: 'Test when to show instant calculation results',
    variants: ['auto', 'on_demand'],
    defaultVariant: 'auto',
    active: true,
    targetAudience: 'mobile'
  },
  step3_field_order: {
    id: 'step3_field_order',
    name: 'Step 3 Field Order',
    description: 'Test optimal order of income vs age fields in Step 3',
    variants: ['income_first', 'age_first'],
    defaultVariant: 'income_first',
    active: true,
    targetAudience: 'mobile'
  }
}

export const CTA_COPY_VARIANTS = {
  control: 'Continue',
  urgent: 'Get My Rate Now',
  benefit: 'See What I Qualify For',
  social_proof: 'Join 10,000+ Borrowers'
} as const

/**
 * Deterministic hash function for consistent user bucketing
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Gets session ID for experiment bucketing
 */
function getSessionId(): string {
  // Try to get existing session ID
  let sessionId = typeof window !== 'undefined'
    ? sessionStorage.getItem('nextnest_session_id')
    : null

  if (!sessionId) {
    // Generate new session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('nextnest_session_id', sessionId)
    }
  }

  return sessionId
}

/**
 * Determines if user should be included in experiment
 */
function shouldIncludeInExperiment(experiment: Experiment, sessionId: string): boolean {
  // Simple 50% traffic allocation for active experiments
  const hash = hashString(`${experiment.id}:${sessionId}`)
  return (hash % 100) < 50 // 50% of users
}

/**
 * Gets variant for a specific experiment
 */
export function getExperimentVariant(experimentId: string): string {
  const experiment = EXPERIMENTS[experimentId]

  if (!experiment || !experiment.active) {
    return experiment?.defaultVariant || 'control'
  }

  const sessionId = getSessionId()

  // Check if user should be included
  if (!shouldIncludeInExperiment(experiment, sessionId)) {
    return experiment.defaultVariant
  }

  // Deterministic bucketing based on session ID
  const hash = hashString(`${experimentId}:${sessionId}`)
  const variantIndex = hash % experiment.variants.length

  return experiment.variants[variantIndex]
}

/**
 * Gets all active experiments for the current user
 */
export function getActiveExperiments(): Record<string, string> {
  const sessionId = getSessionId()
  const activeExperiments: Record<string, string> = {}

  Object.values(EXPERIMENTS).forEach(experiment => {
    if (experiment.active && shouldIncludeInExperiment(experiment, sessionId)) {
      activeExperiments[experiment.id] = getExperimentVariant(experiment.id)
    }
  })

  return activeExperiments
}
/**
 * Event Bus Implementation
 * Lead: Sarah Lim - Senior Frontend Engineer
 * Co-Lead: Marcus Chen - Lead Full-Stack Architect
 * 
 * Event-driven architecture to prevent component coupling
 * Implements Circuit Breaker pattern for resilience
 */

import { DomainEvent, EventHandler } from '../contracts/form-contracts'

export type EventCallback = (event: DomainEvent) => void | Promise<void>

class EventBusImpl {
  private static instance: EventBusImpl
  private handlers: Map<string, Set<EventCallback>> = new Map()
  private eventQueue: DomainEvent[] = []
  private isProcessing = false
  private eventHistory: DomainEvent[] = []
  private maxHistorySize = 100
  private circuitBreaker: Map<string, CircuitBreakerState> = new Map()

  private constructor() {
    // Singleton pattern to ensure single event bus instance
    if (typeof window !== 'undefined') {
      // Browser environment - attach to window for debugging
      (window as any).__nextnest_eventbus = this
    }
  }

  static getInstance(): EventBusImpl {
    if (!EventBusImpl.instance) {
      EventBusImpl.instance = new EventBusImpl()
    }
    return EventBusImpl.instance
  }

  /**
   * Subscribe to events of a specific type
   */
  subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    
    this.handlers.get(eventType)!.add(callback)
    
    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType)
      if (handlers) {
        handlers.delete(callback)
        if (handlers.size === 0) {
          this.handlers.delete(eventType)
        }
      }
    }
  }

  /**
   * Publish an event to all subscribers
   */
  async publish(event: DomainEvent): Promise<void> {
    // Add to history for debugging and replay
    this.addToHistory(event)
    
    // Add to queue
    this.eventQueue.push(event)
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      await this.processQueue()
    }
  }

  /**
   * Process event queue with circuit breaker protection
   */
  private async processQueue(): Promise<void> {
    this.isProcessing = true
    
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!
      const handlers = this.handlers.get(event.eventType)
      
      if (handlers && handlers.size > 0) {
        // Check circuit breaker state
        const circuitState = this.getCircuitState(event.eventType)
        
        if (circuitState.state === 'open') {
          console.warn(`Circuit breaker OPEN for event type: ${event.eventType}`)
          continue
        }
        
        // Process handlers in parallel with error isolation
        const promises = Array.from(handlers).map(async (handler) => {
          try {
            await Promise.race([
              handler(event),
              this.timeout(5000) // 5 second timeout per handler
            ])
            
            // Success - update circuit breaker
            this.recordSuccess(event.eventType)
          } catch (error) {
            console.error(`Event handler error for ${event.eventType}:`, error)
            
            // Record failure for circuit breaker
            this.recordFailure(event.eventType)
            
            // Don't throw - continue with other handlers
          }
        })
        
        await Promise.allSettled(promises)
      }
    }
    
    this.isProcessing = false
  }

  /**
   * Circuit breaker implementation
   */
  private getCircuitState(eventType: string): CircuitBreakerState {
    if (!this.circuitBreaker.has(eventType)) {
      this.circuitBreaker.set(eventType, {
        state: 'closed',
        failures: 0,
        successes: 0,
        lastFailure: null,
        nextRetry: null
      })
    }
    
    const state = this.circuitBreaker.get(eventType)!
    
    // Check if circuit should be half-open
    if (state.state === 'open' && state.nextRetry && Date.now() > state.nextRetry) {
      state.state = 'half-open'
    }
    
    return state
  }

  private recordSuccess(eventType: string): void {
    const state = this.getCircuitState(eventType)
    state.successes++
    state.failures = 0
    
    if (state.state === 'half-open') {
      state.state = 'closed'
    }
  }

  private recordFailure(eventType: string): void {
    const state = this.getCircuitState(eventType)
    state.failures++
    state.lastFailure = Date.now()
    
    // Open circuit after 3 failures
    if (state.failures >= 3) {
      state.state = 'open'
      state.nextRetry = Date.now() + 30000 // Retry after 30 seconds
    }
  }

  /**
   * Event history management
   */
  private addToHistory(event: DomainEvent): void {
    this.eventHistory.push(event)
    
    // Trim history if too large
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize)
    }
  }

  /**
   * Get event history for debugging
   */
  getHistory(eventType?: string): DomainEvent[] {
    if (eventType) {
      return this.eventHistory.filter(e => e.eventType === eventType)
    }
    return [...this.eventHistory]
  }

  /**
   * Clear all handlers and reset state
   */
  reset(): void {
    this.handlers.clear()
    this.eventQueue = []
    this.eventHistory = []
    this.circuitBreaker.clear()
    this.isProcessing = false
  }

  /**
   * Timeout helper
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Event handler timeout')), ms)
    )
  }

  /**
   * Get current metrics for monitoring
   */
  getMetrics(): EventBusMetrics {
    return {
      handlerCounts: Array.from(this.handlers.entries()).map(([type, handlers]) => ({
        eventType: type,
        count: handlers.size
      })),
      queueLength: this.eventQueue.length,
      historySize: this.eventHistory.length,
      circuitBreakerStates: Array.from(this.circuitBreaker.entries()).map(([type, state]) => ({
        eventType: type,
        ...state
      }))
    }
  }
}

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open'
  failures: number
  successes: number
  lastFailure: number | null
  nextRetry: number | null
}

interface EventBusMetrics {
  handlerCounts: Array<{ eventType: string; count: number }>
  queueLength: number
  historySize: number
  circuitBreakerStates: Array<{ eventType: string } & CircuitBreakerState>
}

// Export singleton instance
export const eventBus = EventBusImpl.getInstance()

// ============================================================================
// REACT HOOKS FOR EVENT BUS
// ============================================================================

import { useEffect, useCallback, useRef } from 'react'

/**
 * Hook to subscribe to events in React components
 */
export function useEventSubscription(
  eventType: string,
  handler: EventCallback,
  deps: any[] = []
): void {
  const savedHandler = useRef<EventCallback>()
  
  // Update ref when handler changes
  useEffect(() => {
    savedHandler.current = handler
  }, [handler])
  
  useEffect(() => {
    // Create stable callback that uses latest handler
    const eventHandler: EventCallback = (event) => {
      if (savedHandler.current) {
        return savedHandler.current(event)
      }
    }
    
    // Subscribe
    const unsubscribe = eventBus.subscribe(eventType, eventHandler)
    
    // Cleanup
    return unsubscribe
  }, [eventType, ...deps])
}

/**
 * Hook to publish events
 */
export function useEventPublisher(): (event: DomainEvent) => Promise<void> {
  return useCallback((event: DomainEvent) => {
    return eventBus.publish(event)
  }, [])
}

/**
 * Hook to create domain events with metadata
 */
export function useCreateEvent(sessionId: string): (
  eventType: string,
  aggregateId: string,
  payload: any
) => DomainEvent {
  return useCallback((eventType: string, aggregateId: string, payload: any) => {
    return {
      eventType,
      aggregateId,
      payload,
      metadata: {
        timestamp: new Date(),
        sessionId,
        correlationId: generateCorrelationId()
      }
    }
  }, [sessionId])
}

/**
 * Generate unique correlation ID for event tracking
 */
function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ============================================================================
// PREDEFINED EVENT TYPES
// ============================================================================

export const FormEvents = {
  // Loan type events
  LOAN_TYPE_SELECTED: 'form.loan_type.selected',
  LOAN_TYPE_CHANGED: 'form.loan_type.changed',
  
  // Step progression events (updated terminology)
  STEP_STARTED: 'form.step.started',
  STEP_COMPLETED: 'form.step.completed',
  STEP_ABANDONED: 'form.step.abandoned',
  
  // Backward compatibility - Gate events (deprecated)
  GATE_STARTED: 'form.gate.started',
  GATE_COMPLETED: 'form.gate.completed',
  GATE_ABANDONED: 'form.gate.abandoned',
  
  // Field events
  FIELD_FOCUSED: 'form.field.focused',
  FIELD_CHANGED: 'form.field.changed',
  FIELD_VALIDATED: 'form.field.validated',
  FIELD_ERROR: 'form.field.error',
  
  // AI insight events
  AI_INSIGHT_REQUESTED: 'ai.insight.requested',
  AI_INSIGHT_RECEIVED: 'ai.insight.received',
  AI_INSIGHT_FAILED: 'ai.insight.failed',
  AI_FALLBACK_TRIGGERED: 'ai.fallback.triggered',
  
  // Trust signal events
  TRUST_SIGNAL_SHOWN: 'trust.signal.shown',
  TRUST_SIGNAL_CLICKED: 'trust.signal.clicked',
  TRUST_CASCADE_STARTED: 'trust.cascade.started',
  TRUST_CASCADE_COMPLETED: 'trust.cascade.completed',
  
  // Processing events
  PROCESSING_STARTED: 'processing.started',
  PROCESSING_TIER_COMPLETED: 'processing.tier.completed',
  PROCESSING_COMPLETED: 'processing.completed',
  PROCESSING_FAILED: 'processing.failed',
  
  // Lead scoring events
  LEAD_SCORED: 'lead.scored',
  LEAD_ROUTED: 'lead.routed',
  LEAD_QUALIFIED: 'lead.qualified',
  
  // User behavior events
  USER_HESITATED: 'user.hesitated',
  USER_RETURNED: 'user.returned',
  USER_ABANDONED: 'user.abandoned',
  USER_CONVERTED: 'user.converted',
  
  // System events
  ERROR_OCCURRED: 'system.error',
  PERFORMANCE_DEGRADED: 'system.performance.degraded',
  SECURITY_ALERT: 'system.security.alert'
} as const

export type FormEventType = typeof FormEvents[keyof typeof FormEvents]
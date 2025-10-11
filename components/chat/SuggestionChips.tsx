'use client'

import React from 'react'
import { TrendingUp, DollarSign, Clock, BarChart } from 'lucide-react'

interface SuggestionChipsProps {
  onChipClick?: (text: string) => void
  className?: string
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({
  onChipClick,
  className = ''
}) => {
  const suggestions = [
    {
      icon: TrendingUp,
      label: 'Rates',
      text: 'What are the current best rates available for my profile?'
    },
    {
      icon: DollarSign,
      label: 'Savings',
      text: 'How much can I save by refinancing now?'
    },
    {
      icon: Clock,
      label: 'Timing',
      text: 'When is the best time to refinance my mortgage?'
    },
    {
      icon: BarChart,
      label: 'Market',
      text: 'How do current rates compare to market trends?'
    }
  ]

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {suggestions.map((suggestion, index) => {
        const Icon = suggestion.icon
        return (
          <button
            key={index}
            onClick={() => onChipClick?.(suggestion.text)}
            className="h-8 px-3 bg-white border border-fog text-graphite hover:bg-mist hover:text-ink hover:border-gold transition-all duration-200 flex items-center gap-1.5 text-sm"
          >
            <Icon className="w-3.5 h-3.5" />
            {suggestion.label}
          </button>
        )
      })}
    </div>
  )
}

export default SuggestionChips
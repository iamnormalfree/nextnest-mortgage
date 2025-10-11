'use client'

import React from 'react'
import { Star, Bot } from 'lucide-react'

interface AdvisorHeaderProps {
  className?: string
}

export const AdvisorHeader: React.FC<AdvisorHeaderProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white border border-fog p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-light text-ink mb-2">
            AI Mortgage Advisor
          </h1>
          <p className="text-sm text-graphite">
            Powered by GPT-4 • Analyzing 286 packages in real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-gold text-ink text-xs font-medium px-3 py-1 flex items-center gap-1">
            <Bot className="w-3 h-3" />
            AI Enhanced
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center border border-fog hover:bg-mist transition-colors duration-200"
            aria-label="Add to favorites"
          >
            <Star className="w-4 h-4 text-graphite" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdvisorHeader
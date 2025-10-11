'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Home, RefreshCw, Building2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export type LoanType = 'new_purchase' | 'refinance' | 'commercial'

interface SimpleLoanTypeSelectorProps {
  onSelect?: (type: LoanType) => void
  redirectToApply?: boolean
}

export default function SimpleLoanTypeSelector({ onSelect, redirectToApply = true }: SimpleLoanTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<LoanType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSelect = (type: LoanType) => {
    setSelectedType(type)
    setIsLoading(true)

    // Simulate loading with error handling
    setTimeout(() => {
      try {
        setIsLoading(false)

        // If redirectToApply is true, navigate to /apply page
        if (redirectToApply) {
          router.push(`/apply?loanType=${type}`)
        } else if (onSelect) {
          // Otherwise use the callback if provided
          onSelect(type)
        }
      } catch (error) {
        console.error('SimpleLoanTypeSelector navigation error:', error)
        setIsLoading(false) // Reset loading state on error
      }
    }, 800)
  }

  const loanTypes = [
    {
      id: 'new_purchase' as LoanType,
      title: 'New Purchase',
      description: 'Buying your dream home',
      icon: Home,
    },
    {
      id: 'refinance' as LoanType,
      title: 'Refinancing',
      description: 'Switch to better rates',
      icon: RefreshCw,
    },
    {
      id: 'commercial' as LoanType,
      title: 'Commercial',
      description: 'Business property needs',
      icon: Building2,
    }
  ]

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-light text-ink mb-2">Choose Your Path</h2>
        <p className="text-graphite text-sm">Select the option that best describes your needs</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loanTypes.map((type) => {
          const IconComponent = type.icon
          const isSelected = selectedType === type.id
          return (
            <button
              key={type.id}
              onClick={() => handleSelect(type.id)}
              className={`
                relative p-6 border-2 transition-all duration-200 transform
                ${isSelected 
                  ? 'border-gold bg-gold/10 scale-[1.02] shadow-md' 
                  : 'border-fog bg-white hover:bg-mist hover:shadow-sm hover:scale-[1.01]'
                }
                cursor-pointer group
              `}
              disabled={isLoading}
            >
              <div className={`
                mb-4 inline-flex p-3 border transition-all duration-200
                ${isSelected 
                  ? 'bg-gold/10 border-gold text-ink' 
                  : 'bg-mist border-fog text-silver group-hover:text-graphite'
                }
              `}>
                <IconComponent className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <h3 className={`text-xl font-mono mb-2 ${isSelected ? 'text-ink' : 'text-ink'}`}>
                {type.title}
              </h3>
              <p className="text-graphite text-sm">{type.description}</p>
            </button>
          )
        })}
      </div>
      
      {isLoading && (
        <div className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50" onClick={() => setIsLoading(false)}>
          <div className="bg-white p-8 border border-fog" onClick={(e) => e.stopPropagation()}>
            <Progress value={60} className="w-48 h-1 bg-fog [&>*]:bg-gold mx-auto" />
            <p className="mt-4 text-graphite text-sm text-center">Preparing your form...</p>
            <button 
              onClick={() => setIsLoading(false)}
              className="mt-4 text-xs text-silver hover:text-graphite underline block mx-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
    </div>
  )
}
// ABOUTME: Mobile-optimized selection component using bottom sheet pattern
// ABOUTME: Replaces tiny dropdowns with full-screen selection for better UX

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface MobileSelectProps {
  label: string
  options: { value: string; label: string; description?: string }[]
  value: string
  onChange: (value: string) => void
  error?: string
  name?: string
}

export function MobileSelect({
  label,
  options,
  value,
  onChange,
  error,
  name
}: MobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(opt => opt.value === value)

  const handleOpen = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    setIsOpen(true)
  }

  const handleSelect = (optionValue: string) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    onChange(optionValue)
    setIsOpen(false)
  }

  // Prevent body scroll when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-black">
          {label}
        </label>

        <button
          type="button"
          onClick={handleOpen}
          name={name}
          className={cn(
            'w-full h-14 px-4 text-left',
            'border-2 border-[#E5E5E5]',
            'flex items-center justify-between',
            'touch-manipulation transition-colors',
            'focus:border-[#FCD34D] focus:outline-none',
            error && 'border-[#EF4444]'
          )}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <span className={cn(
            'text-base',
            selectedOption ? 'text-black' : 'text-[#666666]'
          )}>
            {selectedOption?.label || 'Select an option'}
          </span>
          <span className="text-[#666666]">▼</span>
        </button>

        {error && (
          <p className="text-sm text-[#EF4444]" role="alert">{error}</p>
        )}
      </div>

      {/* Bottom sheet overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 animate-fade-in"
          onClick={() => setIsOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${name}-dialog-title`}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-[#E5E5E5] px-4 py-3 z-10">
              <div className="flex items-center justify-between">
                <h3 id={`${name}-dialog-title`} className="font-semibold text-black">{label}</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-[#666666] px-3 py-1 hover:text-black transition-colors"
                  aria-label="Close"
                >
                  Done
                </button>
              </div>
            </div>

            <div className="divide-y divide-[#E5E5E5]">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'w-full px-4 py-4 text-left touch-manipulation transition-colors',
                    option.value === value && 'bg-[#FCD34D]/10'
                  )}
                  role="option"
                  aria-selected={option.value === value}
                >
                  <div className="font-medium text-black">{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-[#666666] mt-1">
                      {option.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

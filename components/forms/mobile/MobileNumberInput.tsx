// ABOUTME: Touch-optimized number input with native mobile keyboard and haptic feedback
// ABOUTME: Uses inputMode for numeric keyboard without type="number" restrictions

import React from 'react'
import { cn } from '@/lib/utils'

interface MobileNumberInputProps {
  label: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  prefix?: string
  error?: string
  helperText?: string
  name?: string
}

export function MobileNumberInput({
  label,
  value,
  onChange,
  placeholder,
  prefix = '$',
  error,
  helperText,
  name
}: MobileNumberInputProps) {
  const handleFocus = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10) // Subtle haptic feedback
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-black">
        {label}
      </label>

      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#666666] pointer-events-none">
            {prefix}
          </span>
        )}

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9,]*"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={cn(
            'w-full h-14 text-2xl font-mono',
            prefix ? 'pl-10 pr-4' : 'px-4',
            'border-2 border-[#E5E5E5]',
            'focus:border-[#FCD34D] focus:outline-none transition-colors',
            'touch-manipulation', // Disable double-tap zoom
            error && 'border-[#EF4444]'
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        />
      </div>

      {error && (
        <p id={`${name}-error`} className="text-sm text-[#EF4444]" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={`${name}-helper`} className="text-sm text-[#666666]">
          {helperText}
        </p>
      )}
    </div>
  )
}

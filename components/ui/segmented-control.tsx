'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SegmentedControlOption {
  value: string
  label: string
  disabled?: boolean
}

interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline'
}

const containerVariants = {
  default: 'bg-mist border border-fog',
  outline: 'bg-white border border-fog'
} as const

const buttonSizeMap = {
  sm: 'min-h-[40px] px-3 py-2 text-xs',
  md: 'min-h-[44px] px-3 py-2 text-sm',
  lg: 'min-h-[48px] px-4 py-2 text-base'
} as const

const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(({
  options,
  value,
  onValueChange,
  className,
  size = 'md',
  variant = 'default',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'flex w-full flex-col gap-2 p-1 md:inline-flex md:w-auto md:flex-row md:gap-1',
        containerVariants[variant],
        className
      )}
      role="radiogroup"
      {...props}
    >
      {options.map((option, index) => {
        const isSelected = value === option.value
        const isDisabled = option.disabled

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-disabled={isDisabled}
            onClick={() => {
              if (!isDisabled) {
                onValueChange?.(option.value)
              }
            }}
            disabled={isDisabled}
            className={cn(
              'relative flex-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
              'text-center md:min-w-[120px]',
              buttonSizeMap[size],
              isSelected
                ? 'bg-white text-ink shadow-sm ring-1 ring-inset ring-fog/60'
                : 'text-graphite hover:bg-white/60 hover:text-ink'
            )}
          >
            <span className="truncate">{option.label}</span>
            {isSelected && (
              <span className="absolute inset-x-3 bottom-1 hidden h-0.5 bg-gold md:block" aria-hidden="true"></span>
            )}
          </button>
        )
      })}
    </div>
  )
})

SegmentedControl.displayName = 'SegmentedControl'

export { SegmentedControl, type SegmentedControlOption, type SegmentedControlProps }
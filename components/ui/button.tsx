import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Bloomberg Terminal Button Component
 * Follows design principles: 48px height, no rounded corners, 200ms transitions
 * Consolidated from button.tsx and button-bloomberg.tsx
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary - Gold accent (5% of UI)
        default:
          "bg-gold text-ink hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98]",
        primary:
          "bg-gold text-ink hover:bg-gold-dark hover:scale-[1.02] active:scale-[0.98]",
        
        // Secondary - Ghost style
        secondary:
          "bg-transparent text-charcoal border border-fog hover:bg-mist",
        
        // Destructive - Ruby for errors only
        destructive:
          "bg-ruby text-white hover:bg-ruby/90",
        
        // Outline - Subtle border
        outline:
          "border border-fog bg-white hover:bg-mist text-charcoal",
        
        // Ghost - No border
        ghost:
          "hover:bg-mist text-charcoal",
        
        // Link - Text only
        link:
          "text-gold underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        // Bloomberg standard: 48px
        default: "h-12 px-8",
        
        // Small: 40px
        sm: "h-10 px-6 text-xs",
        
        // Large: 56px (mobile)
        lg: "h-14 px-10",
        
        // Icon only
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

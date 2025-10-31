import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-white text-ink border-fog",
        destructive: "border-red-200 bg-red-50 text-red-900 [&>svg]:text-red-600",
        warning: "border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600",
        success: "border-emerald-200 bg-emerald-50 text-emerald-900 [&>svg]:text-emerald-600",
        info: "border-blue-200 bg-blue-50 text-blue-900 [&>svg]:text-blue-600",
        gold: "border-gold/30 bg-gold/10 text-gold-dark [&>svg]:text-gold"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  collapsible?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, collapsible = false, defaultOpen = true, onOpenChange, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen)

    const handleToggle = () => {
      const newOpen = !isOpen
      setIsOpen(newOpen)
      onOpenChange?.(newOpen)
    }

    if (collapsible) {
      return (
        <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isOpen ? children : null}
            </div>
            <button
              onClick={handleToggle}
              className="ml-2 flex-shrink-0 text-xs font-medium underline opacity-70 hover:opacity-100 transition-opacity"
            >
              {isOpen ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }

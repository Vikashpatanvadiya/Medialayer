import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border border-input",
        success: "bg-[var(--green-1)]0/15 text-[var(--green-4)] dark:text-emerald-400 border border-emerald-500/20",
        warning: "bg-[var(--amber-1)]0/15 text-amber-700 dark:text-amber-400 border border-amber-500/20",
        info: "bg-[var(--sky-1)] text-[var(--sky-4)] border border-[var(--sky-2)]",
        purple: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function BeautifulBadge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cva(badgeVariants({ variant }), className)({ variant, className })} {...props} />
  )
}

export { BeautifulBadge, badgeVariants }

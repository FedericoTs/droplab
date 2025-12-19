import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-all duration-fast ease-out focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-200/80 dark:bg-emerald-900/50 dark:text-emerald-200 dark:hover:bg-emerald-800/60",
        secondary:
          "border-transparent bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700",
        destructive:
          "border-transparent bg-red-100 text-red-700 hover:bg-red-200/80 dark:bg-red-900/50 dark:text-red-200",
        outline:
          "border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800",
        success:
          "border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-200/80 dark:bg-emerald-900/50 dark:text-emerald-200",
        warning:
          "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200/80 dark:bg-amber-900/50 dark:text-amber-200",
        lime:
          "border-transparent bg-lime-100 text-lime-800 hover:bg-lime-200/80 dark:bg-lime-900/50 dark:text-lime-200",
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

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

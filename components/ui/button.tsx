import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-fast ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive tracking-wide",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-emerald-600 via-emerald-500 to-lime-500 text-white shadow-emerald hover:shadow-emerald-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90 hover:shadow-md active:shadow-sm focus-visible:ring-destructive/30 dark:bg-destructive/80",
        outline:
          "border border-neutral-200 bg-white text-neutral-700 shadow-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:bg-neutral-800/30 dark:border-neutral-700 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300",
        secondary:
          "bg-neutral-100 text-neutral-700 shadow-xs hover:bg-neutral-200/80 hover:shadow-sm dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700",
        ghost:
          "text-neutral-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-neutral-300 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-300",
        link:
          "text-emerald-600 underline-offset-4 hover:underline hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300",
        premium:
          "bg-gradient-to-r from-emerald-600 via-emerald-500 to-lime-500 text-white font-bold shadow-emerald-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:shadow-emerald",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-9 rounded-md gap-1.5 px-4 has-[>svg]:px-3 text-xs",
        lg: "h-12 rounded-lg px-8 has-[>svg]:px-6 text-base",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

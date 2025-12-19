import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      suppressHydrationWarning
      className={cn(
        "file:text-foreground placeholder:text-neutral-400 selection:bg-emerald-100 selection:text-emerald-900 dark:bg-neutral-800/30 border-neutral-200 h-10 w-full min-w-0 rounded-md border bg-white px-3.5 py-2 text-base shadow-xs transition-all duration-fast ease-out outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:shadow-sm",
        "hover:border-neutral-300 dark:hover:border-neutral-600",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "dark:border-neutral-700 dark:text-neutral-100 dark:placeholder:text-neutral-500",
        className
      )}
      {...props}
    />
  )
}

export { Input }

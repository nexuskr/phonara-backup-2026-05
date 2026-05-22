import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A1AA]">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            // Base - Premium mobile input
            "flex h-12 w-full rounded-xl border bg-[#0A0A0A] px-4 py-3 text-base text-white placeholder:text-[#71717A] transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]",
            "disabled:cursor-not-allowed disabled:opacity-60",
            // Left icon padding
            leftIcon && "pl-11",
            // Right icon padding
            rightIcon && "pr-11",
            // Error state
            error && "border-red-500 focus-visible:ring-red-500",
            // Success state
            success && "border-emerald-500 focus-visible:ring-emerald-500",
            // Default border
            !error && !success && "border-[#27272A] focus-visible:border-[#EAB308]",
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA]">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }

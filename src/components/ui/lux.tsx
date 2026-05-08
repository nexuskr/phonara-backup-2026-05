import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Phonara — Lux UI primitives
 * Imperial gold / neon / glass tokens unified into a single set of components.
 * All primitives enforce mobile-first touch targets (min 44–56px) and consistent
 * spacing, rounding, font weight and tabular-nums where applicable.
 */

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "ghost" | "gold" | "danger";

const SIZE_BTN: Record<Size, string> = {
  sm: "min-h-[44px] px-3.5 text-xs rounded-xl",
  md: "min-h-[48px] px-4 text-sm rounded-2xl",
  lg: "min-h-[56px] px-6 text-base rounded-2xl",
};

const VAR_BTN: Record<Variant, string> = {
  primary:
    "bg-gradient-primary text-primary-foreground glow-primary border border-primary/40",
  ghost:
    "glass-strong border border-border/60 text-foreground hover:border-primary/50",
  gold:
    "bg-gradient-gold text-gold-foreground glow-gold border border-gold/40",
  danger:
    "bg-destructive text-destructive-foreground border border-destructive/50",
};

export const LuxButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    block?: boolean;
  }
>(({ className, variant = "primary", size = "md", block, children, ...rest }, ref) => (
  <button
    ref={ref}
    {...rest}
    className={cn(
      "inline-flex items-center justify-center gap-2 font-imperial font-bold tracking-[0.08em]",
      "press transition active:scale-[0.985] disabled:opacity-50 disabled:pointer-events-none",
      "whitespace-nowrap break-keep",
      SIZE_BTN[size],
      VAR_BTN[variant],
      block && "w-full",
      className,
    )}
  >
    {children}
  </button>
));
LuxButton.displayName = "LuxButton";

export const LuxInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...rest }, ref) => (
  <input
    ref={ref}
    {...rest}
    className={cn(
      "w-full min-h-[48px] bg-input/70 border border-border/70 rounded-2xl px-4 text-sm",
      "text-foreground placeholder:text-muted-foreground/70 tabular-nums",
      "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition",
      className,
    )}
  />
));
LuxInput.displayName = "LuxInput";

export const LuxChip: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    active?: boolean;
    tone?: "default" | "gold";
  }
> = ({ active, tone = "default", className, children, ...rest }) => (
  <button
    {...rest}
    className={cn(
      "inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-full text-xs font-bold",
      "tracking-[0.06em] whitespace-nowrap break-keep press transition",
      active
        ? tone === "gold"
          ? "bg-gradient-gold text-gold-foreground glow-gold"
          : "bg-gradient-primary text-primary-foreground glow-primary"
        : "glass border border-border/60 text-muted-foreground hover:text-foreground",
      className,
    )}
  >
    {children}
  </button>
);

export const LuxCard: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...rest
}) => (
  <div
    {...rest}
    className={cn(
      "glass-strong rounded-3xl neon-border p-4 sm:p-5",
      className,
    )}
  />
);

/** Money number — guarantees tabular-nums + bright gold token, no gradient. */
export const Money: React.FC<
  React.HTMLAttributes<HTMLSpanElement> & { strong?: boolean }
> = ({ strong, className, ...rest }) => (
  <span
    {...rest}
    className={cn(
      "tabular-nums font-imperial",
      strong ? "text-money-strong" : "text-money",
      className,
    )}
  />
);

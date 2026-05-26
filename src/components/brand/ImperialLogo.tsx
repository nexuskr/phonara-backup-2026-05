import type { HTMLAttributes } from "react";
import { Crown } from "lucide-react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md";
  withWordmark?: boolean;
  withWorld?: boolean;
  to?: string;
  ariaLabel?: string;
}

const sizeClass = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
} as const;

export default function ImperialLogo({
  size = "md",
  withWordmark = false,
  withWorld = false,
  to,
  ariaLabel = "Imperial Logo",
  className = "",
  ...props
}: Props) {
  const content = (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      aria-label={ariaLabel}
      {...props}
    >
      <Crown className={`${sizeClass[size]} text-amber-300`} />
      {withWordmark && (
        <span className="text-sm font-black tracking-[0.2em]">IMPERIAL</span>
      )}
      {withWorld && (
        <span className="text-[10px] text-muted-foreground">WORLD</span>
      )}
    </div>
  );

  if (to) {
    return (
      <a
        href={to}
        aria-label={ariaLabel}
        className={`inline-flex ${className}`}
      >
        {content}
      </a>
    );
  }

  return content;
}

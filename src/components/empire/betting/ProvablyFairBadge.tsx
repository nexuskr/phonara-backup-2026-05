interface Props {
  size?: "sm" | "md";
}

const sizeClass = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
} as const;

export default function ProvablyFairBadge({ size = "sm" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-200 font-black uppercase tracking-[0.18em] ${sizeClass[size]}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300" />
      Provably Fair
    </span>
  );
}

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Row = { day: number; yield_phon: number; burn_phon: number };

export default function ProjectionChart({ series }: { series: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="phYield" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="phBurn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--pink))" stopOpacity={0.5} />
            <stop offset="100%" stopColor="hsl(var(--pink))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
        <YAxis tick={{ fontSize: 10 }} width={48} stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 11,
          }}
          formatter={(v: any) => `${Number(v).toLocaleString("ko-KR")} PHON`}
          labelFormatter={(d) => `D+${d}일`}
        />
        <Area type="monotone" dataKey="yield_phon" stroke="hsl(var(--primary))" fill="url(#phYield)" name="누적 배당" />
        <Area type="monotone" dataKey="burn_phon" stroke="hsl(var(--pink))" fill="url(#phBurn)" name="누적 소각" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

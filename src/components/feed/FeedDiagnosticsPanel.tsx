// V17 <FeedDiagnosticsPanel> — admin-only insight into the recommendation/viral pipeline.
// Three columns: persona distribution, top viral videos, posting queue health.
import { useEffect, useState } from "react";
import { Users, Flame, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingList } from "@/components/ui/loading-state";

type Persona = { persona: string; n: number };
type TopVideo = { video_id: string; viral_score: number; region: string | null };
type QueueRow = { status: string; n: number };

export default function FeedDiagnosticsPanel() {
  const [personas, setPersonas] = useState<Persona[] | null>(null);
  const [top, setTop] = useState<TopVideo[] | null>(null);
  const [queue, setQueue] = useState<QueueRow[] | null>(null);

  useEffect(() => {
    (async () => {
      const [p, t, q] = await Promise.all([
        supabase.from("user_feed_profile" as any).select("persona").limit(5000),
        supabase.from("viral_metrics" as any).select("video_id, viral_score, region").order("viral_score", { ascending: false }).limit(10),
        supabase.from("posting_schedule_queue" as any).select("status").limit(5000),
      ]);
      const pmap = new Map<string, number>();
      for (const r of (p.data ?? []) as unknown as Array<{ persona: string }>) pmap.set(r.persona, (pmap.get(r.persona) ?? 0) + 1);
      setPersonas([...pmap.entries()].map(([persona, n]) => ({ persona, n })).sort((a, b) => b.n - a.n));
      setTop((t.data ?? []) as unknown as TopVideo[]);
      const qmap = new Map<string, number>();
      for (const r of (q.data ?? []) as unknown as Array<{ status: string }>) qmap.set(r.status, (qmap.get(r.status) ?? 0) + 1);
      setQueue([...qmap.entries()].map(([status, n]) => ({ status, n })));
    })();
  }, []);

  return (
    <div className="grid md:grid-cols-3 gap-3">
      <Card title="페르소나 분포" icon={Users}>
        {!personas ? <LoadingList rows={1} /> : personas.length === 0 ? <Empty /> : (
          <ul className="space-y-1.5 text-xs">
            {personas.map((p) => (
              <li key={p.persona} className="flex items-center justify-between">
                <span className="capitalize">{p.persona}</span>
                <span className="font-bold tabular-nums">{p.n.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Top Viral Score" icon={Flame}>
        {!top ? <LoadingList rows={1} /> : top.length === 0 ? <Empty /> : (
          <ul className="space-y-1.5 text-xs">
            {top.map((v) => (
              <li key={v.video_id} className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-[10px] text-muted-foreground">{v.video_id.slice(0, 14)}</span>
                <span className="text-[10px] uppercase text-muted-foreground">{v.region ?? "—"}</span>
                <span className="font-bold tabular-nums text-primary">{v.viral_score.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="포스팅 큐 상태" icon={Clock}>
        {!queue ? <LoadingList rows={1} /> : queue.length === 0 ? <Empty /> : (
          <ul className="space-y-1.5 text-xs">
            {queue.map((q) => (
              <li key={q.status} className="flex items-center justify-between">
                <span className="capitalize">{q.status}</span>
                <span className="font-bold tabular-nums">{q.n.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <div className="glass-strong rounded-2xl p-4 border border-border/40">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
        <Icon className="w-3.5 h-3.5" /> {title}
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return <div className="text-xs text-muted-foreground">데이터가 아직 없습니다.</div>;
}

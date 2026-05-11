import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

type Job = { jobname: string; schedule: string; last_status: string | null; last_run_at: string | null };

export default function CronJobsCard() {
  const [rows, setRows] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await (supabase as any).rpc("admin_cron_status");
      if (!alive) return;
      if (error) setErr(error.message);
      setRows((data as Job[]) ?? []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return <div className="text-xs text-muted-foreground">크론 상태 불러오는 중…</div>;
  if (err) return null; // RPC absent → silently hide
  if (!rows.length) return null;

  return (
    <section className="glass border border-border/40 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-primary" />
        <h3 className="font-imperial text-sm tracking-widest text-gradient-imperial">크론 작업 · 운영 현황</h3>
      </div>
      <div className="space-y-1.5 text-xs">
        {rows.slice(0, 12).map((j) => {
          const ok = (j.last_status ?? "").toLowerCase().includes("succ");
          return (
            <div key={j.jobname} className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg bg-card/40 border border-border/20">
              <div className="flex items-center gap-2 min-w-0">
                {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                <span className="truncate font-mono">{j.jobname}</span>
              </div>
              <span className="text-muted-foreground shrink-0">{j.schedule}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

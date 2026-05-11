import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileCheck2, ShieldCheck, Activity } from "lucide-react";

type Row = { yesterday_count: number; yesterday_paid: number; freezes_active: number; tos_version: string };

export default function OpsTransparencyCard() {
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const [w, f, v] = await Promise.all([
          supabase.from("withdrawal_requests").select("amount,status,created_at").gte("created_at", since).eq("status", "completed"),
          supabase.from("account_freezes" as any).select("user_id", { count: "exact", head: true }).is("released_at", null),
          supabase.rpc("current_tos_version" as any),
        ]);
        if (!alive) return;
        const list = (w.data ?? []) as { amount: number }[];
        setRow({
          yesterday_count: list.length,
          yesterday_paid: list.reduce((s, x) => s + Number(x.amount || 0), 0),
          freezes_active: (f as any).count ?? 0,
          tos_version: (v.data as string) ?? "—",
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) return null;
  if (!row) return null;

  return (
    <section className="glass border border-border/40 rounded-2xl p-5 my-4">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <h3 className="font-imperial text-sm tracking-widest text-gradient-imperial">운영 투명성 · 24h</h3>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-card/40 border border-border/30 p-3">
          <FileCheck2 className="w-4 h-4 text-gold mx-auto mb-1" />
          <div className="text-[10px] text-muted-foreground">완료 출금</div>
          <div className="text-base font-black">{row.yesterday_count}건</div>
          <div className="text-[10px] text-muted-foreground">₩{row.yesterday_paid.toLocaleString("ko-KR")}</div>
        </div>
        <div className="rounded-xl bg-card/40 border border-border/30 p-3">
          <Activity className="w-4 h-4 text-secondary mx-auto mb-1" />
          <div className="text-[10px] text-muted-foreground">활성 동결</div>
          <div className="text-base font-black">{row.freezes_active}건</div>
          <div className="text-[10px] text-muted-foreground">위협 격리</div>
        </div>
        <div className="rounded-xl bg-card/40 border border-border/30 p-3">
          <ShieldCheck className="w-4 h-4 text-primary mx-auto mb-1" />
          <div className="text-[10px] text-muted-foreground">약관 버전</div>
          <div className="text-base font-black">{row.tos_version}</div>
          <div className="text-[10px] text-muted-foreground">최신 적용</div>
        </div>
      </div>
    </section>
  );
}

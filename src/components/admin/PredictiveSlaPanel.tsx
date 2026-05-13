/**
 * PR-22 Predictive SLA Panel
 * Lovable AI 기반 다음 1시간 큐 폭증 예측. 관리자 전용.
 */
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { notify } from "@/lib/notify";

type Pred = {
  risk?: "low" | "medium" | "high";
  hot_queue?: string;
  recommendation?: string;
  reason?: string;
  generated_at?: string;
};

const riskTone: Record<string, string> = {
  low:    "border-secondary/40 bg-secondary/5 text-secondary",
  medium: "border-gold/50 bg-gold/5 text-gold",
  high:   "border-destructive/60 bg-destructive/5 text-destructive animate-pulse",
};

export default function PredictiveSlaPanel() {
  const [pred, setPred] = useState<Pred | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("predict-sla", { body: {} });
      if (error) throw error;
      setPred(data as Pred);
    } catch (e: any) {
      notify.fail("예측 실패", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const tone = riskTone[pred?.risk ?? ""] ?? "border-border/40 bg-card/40 text-muted-foreground";

  return (
    <section className={`glass-strong rounded-2xl p-4 border ${tone}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <h3 className="font-display font-black text-sm">AI 예측 — 다음 1시간 SLA 위험</h3>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="rounded-lg px-3 py-1.5 text-[10px] font-black tracking-wider uppercase bg-primary/15 text-primary border border-primary/40 hover:bg-primary/25 transition disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {loading ? "분석 중" : "예측 실행"}
        </button>
      </div>

      {!pred ? (
        <div className="text-[11px] text-muted-foreground py-3">
          버튼을 눌러 현재 큐 통계 + 최근 1시간 추세를 LLM에 분석시킵니다.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-[0.3em] uppercase font-black opacity-70">위험도</span>
            <span className="font-display font-black text-2xl uppercase">
              {pred.risk ?? "—"}
            </span>
            {pred.hot_queue && pred.hot_queue !== "none" && (
              <span className="text-[10px] tracking-[0.2em] uppercase font-black ml-auto flex items-center gap-1 opacity-90">
                <AlertTriangle className="w-3 h-3" /> 핫 큐: {pred.hot_queue}
              </span>
            )}
          </div>
          {pred.recommendation && (
            <div className="text-xs font-bold">💡 {pred.recommendation}</div>
          )}
          {pred.reason && (
            <div className="text-[10px] text-muted-foreground italic">근거: {pred.reason}</div>
          )}
          {pred.generated_at && (
            <div className="text-[9px] tracking-wider uppercase opacity-50 text-right">
              {new Date(pred.generated_at).toLocaleTimeString("ko-KR")}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

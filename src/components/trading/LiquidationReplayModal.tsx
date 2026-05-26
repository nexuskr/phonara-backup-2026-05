import type { ReactNode } from "react";

export interface ReplayPayload {
  symbol: string;
  side: "long" | "short";
  leverage: number;
  margin: number;
  entry: number;
  exit: number;
  pnl: number;
  roi: number;
  feeOpen: number;
  feeClose: number;
  reason: "liquidation" | "manual";
  insuranceShare: number;
  slippage: number;
  openedAt?: string;
  closedAt?: string;
}

interface Props {
  payload: ReplayPayload | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-bold text-foreground">{value}</span>
    </div>
  );
}

export default function LiquidationReplayModal({ payload, onClose }: Props) {
  if (!payload) return null;

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/65 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-border/60 bg-card p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-rose-300">
              Liquidation Replay
            </div>
            <div className="text-lg font-black">
              {payload.symbol} · {payload.side.toUpperCase()}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            닫기
          </button>
        </div>

        <div className="space-y-2">
          <Row label="레버리지" value={`${payload.leverage}x`} />
          <Row label="진입가" value={payload.entry.toFixed(2)} />
          <Row label="청산가" value={payload.exit.toFixed(2)} />
          <Row
            label="P/L"
            value={`${payload.pnl >= 0 ? "+" : ""}${payload.pnl.toFixed(2)}`}
          />
          <Row label="ROI" value={`${(payload.roi * 100).toFixed(1)}%`} />
          <Row label="수수료" value={`${payload.feeOpen + payload.feeClose}`} />
          <Row label="슬리피지" value={payload.slippage} />
          <Row label="보험분배" value={payload.insuranceShare} />
          <Row
            label="사유"
            value={payload.reason === "liquidation" ? "강제 청산" : "수동 청산"}
          />
        </div>
      </div>
    </div>
  );
}

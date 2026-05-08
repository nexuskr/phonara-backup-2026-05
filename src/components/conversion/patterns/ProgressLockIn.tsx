import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ProgressLockIn({
  score = 73,
  required = 100,
}: {
  score?: number;
  required?: number;
}) {
  const { t } = useTranslation("convert");
  const pct = Math.min(100, (score / required) * 100);
  return (
    <div className="glass rounded-xl p-3">
      <div className="flex items-center justify-between text-[10px] mb-1.5">
        <span className="flex items-center gap-1 text-muted-foreground">
          <TrendingUp className="w-3 h-3 text-primary" /> {t("myScore")}
        </span>
        <span className="font-bold text-primary tabular-nums">
          {score} / {required}
        </span>
      </div>
      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-secondary font-bold mt-1.5 break-keep">
        {t("scoreUnlock")}
      </p>
    </div>
  );
}

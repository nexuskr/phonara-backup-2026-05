import { useDB, ATTENDANCE_REWARDS, formatKRW, todayStr } from "@/lib/store";
import { CalendarCheck, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function AttendanceCard() {
  const [db, setDb] = useDB();
  if (!db.user) return null;

  const today = todayStr();
  const u = db.user;
  const claimed = u.lastAttendance === today;
  const streak = u.attendanceStreak ?? 0;
  const rewards = ATTENDANCE_REWARDS[u.tier];
  const isWeekly = ((streak + 1) % 7) === 0;
  const todayReward = rewards.base + (isWeekly ? rewards.weeklyBonus : 0);

  function claim() {
    if (claimed) return;
    setDb((d) => {
      if (!d.user) return d;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,"0")}-${String(yesterday.getDate()).padStart(2,"0")}`;
      const continued = d.user.lastAttendance === yStr;
      const newStreak = continued ? (d.user.attendanceStreak ?? 0) + 1 : 1;
      const r = ATTENDANCE_REWARDS[d.user.tier];
      const weekly = (newStreak % 7) === 0;
      const reward = r.base + (weekly ? r.weeklyBonus : 0);
      return {
        ...d,
        user: {
          ...d.user,
          balance: d.user.balance + reward,
          todayEarnings: d.user.todayEarnings + reward,
          lastAttendance: today,
          attendanceStreak: newStreak,
        },
      };
    });
    toast({
      title: `🗓️ 출석 완료 +${formatKRW(todayReward)}`,
      description: isWeekly ? `7일 연속! 보너스 +${formatKRW(rewards.weeklyBonus)} 포함` : `${streak + 1}일 연속 출석`,
    });
  }

  return (
    <div className="glass-strong rounded-2xl p-4 neon-border relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-secondary/30 blur-3xl" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-cyber flex items-center justify-center glow-primary">
            <CalendarCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-[10px] tracking-widest text-secondary font-black">DAILY ATTENDANCE</div>
            <div className="text-sm font-display font-black">
              {claimed ? `오늘 출석 완료 · ${streak}일 연속` : `오늘의 출석 보상 +${formatKRW(todayReward)}`}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {u.tier} 등급 · 7일마다 보너스 +{formatKRW(rewards.weeklyBonus)}
            </div>
          </div>
        </div>
        <button
          onClick={claim}
          disabled={claimed}
          className="press shrink-0 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-bold glow-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {claimed ? "완료" : "출석"}
        </button>
      </div>
    </div>
  );
}

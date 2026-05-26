import { Loader2 } from "lucide-react";

export function AppRouteLoader() {
  return (
    <div className="min-h-screen bg-[#02030a] text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-fuchsia-400" />
        <p className="text-sm text-white/70">최고의 경험을 준비하고 있어요</p>
      </div>
    </div>
  );
}

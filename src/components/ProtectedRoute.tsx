// src/components/ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();
  const [checkingSession, setCheckingSession] = useState(false);

  // user가 없으면 Supabase에서 세션을 한 번 더 확인
  useEffect(() => {
    const checkSession = async () => {
      if (!user && initialized && !loading) {
        setCheckingSession(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // 세션이 있으면 새로고침해서 AuthContext가 다시 초기화되도록 함
          window.location.reload();
        }
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [user, initialized, loading]);

  if (!initialized || loading || checkingSession) {
    return (
      <div className="min-h-screen bg-[#02030a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <p className="text-white/70">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
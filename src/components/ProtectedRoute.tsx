// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // 로딩 중일 때는 로딩 스피너 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-[#02030a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-white/70">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 안 된 경우 → 로그인 페이지로 리다이렉트
  if (!user) {
    return (
      <Navigate 
        to="/auth" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // 로그인 했지만 온보딩을 완료하지 않은 경우 → 온보딩 페이지로 이동
  if (profile && profile.onboarding_completed === false) {
    return <Navigate to="/onboarding" replace />;
  }

  // 로그인 + 온보딩 완료된 경우 → 정상 페이지 렌더링
  return <>{children}</>;
}
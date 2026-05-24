// src/pages/Auth.tsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./auth/LoginPage";
import AuthCallback from "./AuthCallback";

export default function Auth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: Supabase Auth 상태 연동 예정
  useEffect(() => {
    // 나중에 Supabase auth listener 연결
    const checkAuth = async () => {
      // 임시: false로 설정 (실제로는 Supabase에서 확인)
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#03050f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/70">PHONARA 로딩중...</p>
        </div>
      </div>
    );
  }

  // 이미 로그인된 상태라면 Home으로 리다이렉트
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return (
    <Routes>
      {/* 기본 로그인 페이지 */}
      <Route path="/" element={<LoginPage />} />
      
      {/* 소셜 로그인 콜백 */}
      <Route path="/callback" element={<AuthCallback />} />
      
      {/* 기타 Auth 관련 페이지 (나중에 추가) */}
      {/* <Route path="/register" element={<RegisterPage />} /> */}
      {/* <Route path="/forgot-password" element={<ForgotPasswordPage />} /> */}

      {/* 잘못된 경로 처리 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
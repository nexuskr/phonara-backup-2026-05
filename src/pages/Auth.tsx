// src/pages/Auth.tsx
import { Outlet } from "react-router-dom";

export default function Auth() {
  // TODO: 나중에 Supabase 인증 상태 체크 로직 추가 예정
  // 지금은 단순히 하위 라우트(Auth 하위 페이지들)를 보여주는 레이아웃 역할만 함

  return (
    <div className="min-h-screen bg-[#03050f] text-white">
      {/* 하위 라우트(LoginPage, AuthCallback 등)가 여기서 렌더링됨 */}
      <Outlet />
    </div>
  );
}
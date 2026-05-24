// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

// 페이지 import
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import LoginPage from "./pages/auth/LoginPage";
import HomePage from "./pages/Home";
import NotFound from "./pages/NotFound";

// 필요하면 다른 페이지도 추가
// import RegisterPage from "./pages/auth/RegisterPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 랜딩 페이지 */}
        <Route path="/" element={<Landing />} />

        {/* 인증 관련 라우트 */}
        <Route path="/auth" element={<Auth />}>
          {/* /auth 접속 시 기본으로 로그인 페이지 보여주기 */}
          <Route index element={<LoginPage />} />
          {/* <Route path="register" element={<RegisterPage />} /> */}
        </Route>

        {/* 홈 (로그인 후) */}
        <Route path="/home" element={<HomePage />} />

        {/* 404 페이지 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* 전역 토스트 (친근한 한국어 알림) */}
      <Toaster 
        position="top-center" 
        richColors 
        closeButton 
        duration={3500}
      />
    </BrowserRouter>
  );
}

export default App;
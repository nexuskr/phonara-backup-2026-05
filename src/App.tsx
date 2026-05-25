// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

// 페이지들
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import LoginPage from "./pages/auth/LoginPage";
import AuthCallback from "./pages/auth/AuthCallback";
import HomePage from "./pages/Home";
import Missions from "./pages/Missions";
import Referral from "./pages/Referral";
import Wallet from "./pages/Wallet";
import Earn from "./pages/Earn";
import TradingArenaBybit from "./pages/TradingArenaBybit";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      {/* AuthProvider는 여기서 제거했습니다 */}
      <Routes>
        {/* 공개 페이지 */}
        <Route path="/" element={<Landing />} />

        {/* 인증 관련 */}
        <Route path="/auth" element={<Auth />}>
          <Route index element={<LoginPage />} />
          <Route path="callback" element={<AuthCallback />} />
        </Route>

        {/* 보호된 페이지 */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trading"
          element={
            <ProtectedRoute>
              <TradingArenaBybit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/missions"
          element={
            <ProtectedRoute>
              <Missions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/earn"
          element={
            <ProtectedRoute>
              <Earn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/referral"
          element={
            <ProtectedRoute>
              <Referral />
            </ProtectedRoute>
          }
        />

        <Route path="/games" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster 
        position="top-center" 
        richColors 
        closeButton 
        duration={2400}
        className="toaster-phonara"
      />
    </BrowserRouter>
  );
}

export default App;
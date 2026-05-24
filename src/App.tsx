import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 사용자 페이지
import Landing from './pages/Landing';
import Auth from './pages/Auth';           // 로그인/회원가입 통합 페이지 (필요시 분리 가능)
import Home from './pages/Home';
import Wallet from './pages/Wallet';
import Trade from './pages/Trade';
import Slots from './pages/casino/Olympus1000'; // 슬롯 페이지
import Refer from './pages/Refer';
import Account from './pages/Account';
import NotFound from './pages/NotFound';

// Admin 페이지 (최소 구성)
import AdminLayout from './pages/admin/_AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import Users from './pages/admin/Users';
import Balances from './pages/admin/Balances';
import Withdrawals from './pages/admin/treasury/Withdrawals';
import Reports from './pages/admin/Reports';

// 공통 컴포넌트
import MobileBottomNav from './components/nav/MobileBottomNav';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <Router>
      <Routes>
        {/* 사용자 페이지 */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth/*" element={<Auth />} />
        <Route path="/home" element={<Home />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/trade" element={<Trade />} />
        <Route path="/slots" element={<Slots />} />
        <Route path="/refer" element={<Refer />} />
        <Route path="/account" element={<Account />} />

        {/* Admin (1인 운영 최소 구성) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="balances" element={<Balances />} />
          <Route path="withdrawals" element={<Withdrawals />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* 공통 UI */}
      <MobileBottomNav />
      <Toaster />
    </Router>
  );
}

export default App;
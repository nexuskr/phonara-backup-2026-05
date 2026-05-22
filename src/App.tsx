import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login'; // assuming we move login later
// import SignUp from './pages/SignUp';
// import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* 첫 화면 = Landing (무료 부수입 포지셔닝) */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Login />} /> {/* 임시 */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

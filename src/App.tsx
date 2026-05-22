import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const Home = () => <div className="min-h-screen bg-black flex items-center justify-center text-white"><div><h1 className="text-6xl font-bold">PHONARA</h1><p className="text-xl mt-4">Auth System Rebuilding...</p><p className="text-sm text-gray-400 mt-8">Phase 1 Clean Rebuild in progress</p></div></div>;

const TestPage = () => <div className="min-h-screen bg-black flex items-center justify-center text-white"><div className="text-center"><h1 className="text-5xl">PHONARA - Phase 1</h1><p className="mt-4">Clean Auth System</p><button onClick={() => window.location.href = '/auth'} className="mt-8 px-8 py-4 bg-yellow-400 text-black font-bold rounded-xl">로그인 테스트</button></div></div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

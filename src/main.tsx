import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'   // ← 추가

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>           {/* ← 추가 */}
      <App />
    </AuthProvider>          {/* ← 추가 */}
  </React.StrictMode>,
)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,
    open: true,                    // 개발 서버 실행 시 자동으로 브라우저 열기
    hmr: {
      overlay: false,              // 에러 오버레이 끄기 (빨간 에러 화면 덜 뜨게)
    },
  },

  resolve: {
    alias: {
      "@": "/src",                 // @ 경로를 src로 매핑 (import "@/lib/..." 사용 편리)
    },
  },
})
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ============================================
// 환경변수에서 Supabase 정보 가져오기
// ============================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// ============================================
// 필수 환경변수 검증
// ============================================
if (!supabaseUrl) {
  throw new Error('[Supabase] VITE_SUPABASE_URL이 .env 파일에 설정되지 않았습니다.');
}
if (!supabaseAnonKey) {
  throw new Error('[Supabase] VITE_SUPABASE_ANON_KEY가 .env 파일에 설정되지 않았습니다.');
}

// ============================================
// Supabase Client (God-tier 설정)
// ============================================
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'phonara-web@3.0.0',
    },
  },
});

// 개발 환경에서만 로그 출력
if (import.meta.env.DEV) {
  console.log('%c[Supabase] Client initialized successfully', 'color:#22c55e');
}

export type SupabaseClient = typeof supabase;
// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      global: {
        headers: {
          'X-Client-Info': 'phonara-web@3.0.0',
        },
      },
    });

    if (import.meta.env.DEV) {
      console.log('%c[Supabase] Client initialized successfully (Singleton)', 'color:#22c55e');
    }
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();

// 타입 export 추가
export type { SupabaseClient } from '@supabase/supabase-js';

export default supabase;
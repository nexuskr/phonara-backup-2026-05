// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase 환경 변수가 없습니다. .env 파일을 확인하세요.");
}

declare global {
  var __PHONARA_SUPABASE: SupabaseClient | undefined;
}

// 더 방어적인 Singleton
const getSupabaseClient = (): SupabaseClient => {
  if (!globalThis.__PHONARA_SUPABASE) {
    globalThis.__PHONARA_SUPABASE = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    console.log("✅ Supabase Client 초기화 완료 (Singleton)");
  }
  return globalThis.__PHONARA_SUPABASE;
};

export const supabase = getSupabaseClient();
export default supabase;
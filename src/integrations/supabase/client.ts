// src/integrations/supabase/client.ts
// ============================================
// Supabase 클라이언트는 src/lib/supabase.ts에서만 생성합니다.
// 이 파일은 기존 import 경로 호환을 위한 re-export 전용입니다.
// ============================================

export { 
  supabase, 
  getSupabaseClient 
} from '../../lib/supabase';

export type { SupabaseClient } from '../../lib/supabase';

// Database 타입 호환 유지
export type { Database } from './types';
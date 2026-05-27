// =============================================
// Phase0 Foundation V2 Reset - Clean Types
// Empire, Crown, Guild 관련 레거시 완전 제거
// =============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          balance: number | null;
          wallet_address?: string | null;
          updated_at?: string;
          // empire_level, crown_score, tier, booster_* 등 제거됨
        };
        Insert: {
          id: string;
          balance?: number | null;
          wallet_address?: string | null;
        };
        Update: {
          balance?: number | null;
          wallet_address?: string | null;
        };
        Relationships: [];
      };
      // 핵심 테이블만 최소화 (필요시 점차 추가)
    };
    Functions: Record<string, never>; // 빈 객체 대신 안전한 방식
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

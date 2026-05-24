// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

// ============================================
// 타입 정의
// ============================================
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  // 인증 메서드
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  clearError: () => void;
}

// ============================================
// Context 생성
// ============================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider 컴포넌트
// ============================================
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // Supabase 인증 상태 변경 리스너 (핵심)
  // ============================================
  useEffect(() => {
    let isMounted = true;

    // 1. 초기 세션 확인
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('초기 세션 로드 실패:', sessionError);
          if (isMounted) setError('인증 정보를 불러오는데 실패했습니다.');
        } else if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('인증 초기화 중 예외 발생:', err);
        if (isMounted) setError('인증 시스템 초기화에 실패했습니다.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    // 2. 실시간 인증 상태 리스너 등록
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        console.log('🔐 Auth 이벤트 발생:', event);

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        switch (event) {
          case 'INITIAL_SESSION':
            setError(null);
            break;

          case 'SIGNED_IN':
            setError(null);
            console.log('✅ 로그인 성공:', currentSession?.user?.email);
            break;

          case 'SIGNED_OUT':
            setError(null);
            console.log('👋 로그아웃 완료');
            break;

          case 'TOKEN_REFRESHED':
            console.log('🔄 토큰 자동 갱신됨');
            break;

          case 'USER_UPDATED':
            console.log('👤 유저 정보 업데이트됨');
            break;

          default:
            break;
        }
      }
    );

    // 3. 클린업 (메모리 누수 방지)
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ============================================
  // 인증 메서드 구현
  // ============================================

  /** 이메일 + 비밀번호 로그인 */
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return { error };
    }

    setLoading(false);
    return { error: null };
  };

  /** 회원가입 */
  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return { error };
    }

    setLoading(false);
    return { error: null };
  };

  /** 로그아웃 */
  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setLoading(false);
  };

  /** Google 소셜 로그인 */
  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  // ============================================
  // Context 값 제공
  // ============================================
  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Custom Hook (useAuth)
// ============================================
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 반드시 AuthProvider 내부에서 사용해야 합니다.');
  }
  return context;
};
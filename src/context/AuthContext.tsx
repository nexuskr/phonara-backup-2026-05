// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';

// ============================================
// 타입 정의
// ============================================
interface Profile {
  id: string;
  onboarding_completed: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;

  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ error: any }>;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // 프로필 안전하게 가져오기 (에러 방지 버전)
  // ============================================
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        // 컬럼이 없거나 테이블이 없을 때 에러 방지
        console.warn('프로필 조회 경고 (컬럼이 없을 수 있음):', error.message);
        return null;
      }

      // data가 null이거나 onboarding_completed가 없으면 null 반환
      if (!data || typeof (data as any).onboarding_completed === 'undefined') {
        return null;
      }

      return {
        id: (data as any).id,
        onboarding_completed: (data as any).onboarding_completed,
      };
    } catch (err) {
      console.warn('프로필 조회 중 예외 발생:', err);
      return null;
    }
  };

  // ============================================
  // Supabase 인증 상태 변경 리스너
  // ============================================
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('초기 세션 로드 실패:', sessionError);
        } else if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            const userProfile = await fetchProfile(session.user.id);
            setProfile(userProfile);
          }
        }
      } catch (err) {
        console.error('인증 초기화 중 예외 발생:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const userProfile = await fetchProfile(currentSession.user.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ============================================
  // 인증 메서드
  // ============================================

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return { error };
    }

    setLoading(false);
    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return { data: null, error };
    }

    setLoading(false);
    return { data, error: null };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
  };

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

  const signInWithMagicLink = async (email: string) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return { error };
    }

    setLoading(false);
    return { error: null };
  };

  const clearError = () => setError(null);

  // ============================================
  // Context 값 제공
  // ============================================
  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithMagicLink,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Custom Hook
// ============================================
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 반드시 AuthProvider 내부에서 사용해야 합니다.');
  }
  return context;
};
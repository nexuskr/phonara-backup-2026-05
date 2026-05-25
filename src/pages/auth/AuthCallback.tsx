import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../integrations/supabase/client';   // ← 경로 수정됨

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('인증 처리 중입니다...');

  useEffect(() => {
    const handleMagicLink = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const error = hashParams.get('error');

        if (error) {
          setStatus('error');
          setMessage('인증 링크가 유효하지 않습니다.');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          setStatus('success');
          setMessage('로그인 성공!');
          setTimeout(() => navigate('/home', { replace: true }), 1000);
        } else {
          setTimeout(() => navigate('/auth', { replace: true }), 800);
        }
      } catch (err) {
        setStatus('error');
        setMessage('인증 처리 중 오류가 발생했습니다.');
      }
    };

    handleMagicLink();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#03050f] text-white px-6">
      <div className="text-center max-w-md w-full">
        {status === 'loading' && (
          <div>
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-fuchsia-500" />
            <p className="text-xl font-medium">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-3xl">✓</div>
            <p className="text-2xl font-bold">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-3xl">!</div>
            <p className="text-xl font-bold text-red-400">{message}</p>
            <button
              onClick={() => navigate('/auth', { replace: true })}
              className="mt-8 w-full rounded-2xl bg-white/10 py-3.5 font-semibold hover:bg-white/15 transition-colors"
            >
              로그인 페이지로 이동
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
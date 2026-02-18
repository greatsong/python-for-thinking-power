import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Code2, Brain, Users, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '853390253196-1g91cg7l90pk5p54ftn3l39sa07q97j5.apps.googleusercontent.com';

export default function Landing() {
  const navigate = useNavigate();
  const { loginWithGoogle, loginDemo, loading } = useAuthStore();
  const googleBtnRef = useRef(null);

  const [demoName, setDemoName] = useState('');

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });

    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'signin_with',
        size: 'large',
        width: 280,
        locale: 'ko',
      });
    }
  }, []);

  const handleGoogleCredential = async (response) => {
    try {
      const user = await loginWithGoogle(response.credential, 'student');
      toast.success(`${user.name}님, 환영합니다!`);
      if (user.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/join');
      }
    } catch (err) {
      toast.error(err.message || 'Google 로그인에 실패했습니다');
    }
  };

  const handleDemoLogin = async () => {
    if (!demoName.trim()) {
      toast.error('이름을 입력해 주세요');
      return;
    }
    try {
      const user = await loginDemo(demoName.trim(), 'student');
      toast.success(`[데모] ${user.name}님, 환영합니다!`);
      navigate('/join');
    } catch (err) {
      toast.error(err.message || '데모 로그인에 실패했습니다');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col overflow-y-auto">
      <main className="flex-1 flex flex-col items-center justify-start py-12 px-6">
        <div className="text-center max-w-2xl w-full">
          <div className="text-6xl mb-6">🐍</div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            사고력을 위한 파이썬
          </h1>
          <p className="text-lg text-slate-600 mb-2">
            코드를 배우는 게 아니라, <span className="font-semibold text-blue-600">생각하는 힘</span>을 키웁니다.
          </p>
          <p className="text-slate-500 mb-10">
            같은 문제, 다른 생각 — 다양한 풀이를 비교하며 성장하는 파이썬 수업
          </p>

          {/* 로그인 카드 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-sm mx-auto">
            {/* 데모 체험 */}
            <div className="mb-5">
              <div className="px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-700 mb-3">
                📋 이름만 입력하면 Google 로그인 없이 바로 체험!
              </div>
              <input
                type="text"
                placeholder="이름 입력 (예: 홍길동)"
                value={demoName}
                onChange={(e) => setDemoName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDemoLogin()}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2"
              />
              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                체험하기
              </button>
            </div>

            {/* 구분선 */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">또는 Google 로그인</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Google 로그인 버튼 */}
            <div className="flex justify-center" ref={googleBtnRef} />
          </div>

          {/* 교사 링크 */}
          <p className="mt-4 text-xs text-slate-400">
            교사이신가요?{' '}
            <Link to="/apply" className="text-blue-500 hover:text-blue-600 font-medium">
              교사 계정 신청 →
            </Link>
          </p>
        </div>

        {/* 특징 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-16 max-w-4xl w-full">
          {[
            { icon: Code2, title: '브라우저에서 바로 실행', desc: '설치 없이 파이썬 코딩' },
            { icon: Brain, title: 'AI 코치', desc: '답이 아닌 생각을 유도' },
            { icon: Users, title: '풀이 갤러리', desc: '다양한 접근법 비교' },
            { icon: BarChart3, title: '교실 라이브', desc: '실시간 학습 현황' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/80 backdrop-blur rounded-xl p-5 border border-slate-100">
              <Icon size={24} className="text-blue-500 mb-3" />
              <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
              <p className="text-xs text-slate-500 mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="p-6 text-center text-xs text-slate-400">
        사고력을 위한 파이썬 — 고등학교 정보 수업을 위한 교육 플랫폼
      </footer>
    </div>
  );
}

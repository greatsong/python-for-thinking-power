import { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Code2, Brain, Users, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore.js';

function PythinkLogo({ size = 64, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      {/* 둥근 사각형 배경 */}
      <rect x="4" y="4" width="112" height="112" rx="28" fill="url(#logoGrad)" />
      {/* 전구 외곽 */}
      <path
        d="M60 20c-16.5 0-30 13.5-30 30 0 10.5 5.4 19.8 13.5 25.2V82c0 1.8 1.2 3 3 3h27c1.8 0 3-1.2 3-1.2V75.2C84.6 69.8 90 60.5 90 50c0-16.5-13.5-30-30-30z"
        stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(255,255,255,0.1)"
      />
      {/* 코드 프롬프트 >_ (생각의 불꽃) */}
      <path d="M47 44l10.5 9-10.5 9" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="63" y1="62" x2="73.5" y2="62" stroke="white" strokeWidth="6" strokeLinecap="round" />
      {/* 전구 받침 */}
      <line x1="46" y1="92" x2="74" y2="92" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
      <line x1="50" y1="100" x2="70" y2="100" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '853390253196-1g91cg7l90pk5p54ftn3l39sa07q97j5.apps.googleusercontent.com';

export default function Landing() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuthStore();
  const googleBtnRef = useRef(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-emerald-50 flex flex-col overflow-y-auto">
      {/* 상단 네비게이션 */}
      <nav className="flex items-center justify-between px-4 md:px-6 py-4 max-w-4xl mx-auto w-full">
        <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <PythinkLogo size={22} /> 사고력을 위한 파이썬
        </span>
        <div className="flex items-center gap-3 md:gap-4">
          <Link to="/guide" className="text-xs md:text-sm text-slate-500 hover:text-emerald-600 transition-colors">서비스 안내</Link>
          <Link to="/apply" className="text-xs md:text-sm text-slate-500 hover:text-emerald-600 transition-colors">교사 신청</Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-start py-6 md:py-8 px-4 md:px-6">
        <div className="text-center max-w-2xl w-full">
          <div className="mb-4 md:mb-6 flex justify-center">
            <PythinkLogo size={80} className="drop-shadow-lg" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 md:mb-4">
            사고력을 위한 파이썬
          </h1>
          <p className="text-lg text-slate-600 mb-2">
            코드를 배우는 게 아니라, <span className="font-semibold text-emerald-600">생각하는 힘</span>을 키웁니다.
          </p>
          <p className="text-slate-500 mb-10">
            같은 문제, 다른 생각 — 다양한 풀이를 비교하며 성장하는 파이썬 수업
          </p>

          {/* 로그인 카드 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-sm mx-auto">
            <p className="text-sm text-slate-500 mb-4">Google 계정으로 로그인하세요</p>
            <div className="flex justify-center" ref={googleBtnRef} />
          </div>

          {/* 하단 링크 */}
          <p className="mt-4 text-xs text-slate-400">
            교사이신가요?{' '}
            <Link to="/apply" className="text-emerald-500 hover:text-emerald-600 font-medium">교사 계정 신청 →</Link>
          </p>
        </div>

        {/* 핵심 철학 */}
        <div className="mt-16 max-w-3xl w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 text-center mb-2">같은 문제, 다른 생각</h2>
            <p className="text-sm text-slate-500 text-center mb-6">정답은 하나가 아닙니다. 다양한 풀이를 비교하며 사고력을 키웁니다.</p>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 font-mono text-sm text-slate-700">
              <p className="text-slate-400 mb-3 text-xs"># 100만 개의 데이터에서 중복된 값을 모두 찾으세요</p>
              <div className="space-y-2">
                <p><span className="text-blue-600 font-semibold">학생A</span>: 하나씩 전부 비교하기 <span className="text-slate-400 text-xs">— 확실하지만 몇 시간...</span></p>
                <p><span className="text-violet-600 font-semibold">학생B</span>: 정렬하면 같은 값이 옆에! <span className="text-slate-400 text-xs">— "줄 세우기" 아이디어, 2초</span></p>
                <p><span className="text-amber-600 font-semibold">학생C</span>: 본 걸 기억하면 된다 (set) <span className="text-slate-400 text-xs">— "기억하기" 아이디어, 0.3초</span></p>
              </div>
              <p className="text-emerald-600 mt-3 text-xs font-bold">→ 비교? 정렬? 기억? — 같은 문제, 세 가지 아이디어. 어떤 생각을 떠올리느냐가 실력이다.</p>
            </div>
          </div>
        </div>

        {/* 기능 상세 소개 */}
        <div className="mt-10 max-w-4xl w-full">
          <h2 className="text-lg font-bold text-slate-800 text-center mb-6">어떻게 수업하나요?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Code2 size={20} className="text-blue-500" />
                </div>
                <h3 className="font-semibold text-slate-800">브라우저에서 바로 코딩</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Python 설치 없이 웹 브라우저에서 바로 코드를 작성하고 실행합니다.
                학생 PC에 아무것도 설치할 필요가 없어 수업 준비 시간이 0분입니다.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Brain size={20} className="text-violet-500" />
                </div>
                <h3 className="font-semibold text-slate-800">AI 코치</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                막힐 때 AI에게 힌트를 요청합니다. <strong>정답은 절대 알려주지 않고</strong>,
                질문과 힌트로 스스로 생각하도록 유도합니다. 교사가 도움 수준을 5단계로 조절 가능합니다.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Users size={20} className="text-emerald-500" />
                </div>
                <h3 className="font-semibold text-slate-800">풀이 갤러리</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                문제를 통과한 학생들의 풀이를 비교합니다. AI가 접근법을 자동 분류(반복문, 재귀, 수학 등)하여,
                수업 중 "이런 방법도 있구나!"라는 토론이 자연스럽게 이어집니다.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <BarChart3 size={20} className="text-amber-500" />
                </div>
                <h3 className="font-semibold text-slate-800">교실 라이브 대시보드</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                교사는 학생×문제 매트릭스로 실시간 현황을 확인합니다.
                셀 클릭으로 학생 코드와 AI 대화를 열람하고, 점수·등급·코멘트 피드백을 남깁니다.
                성적표 CSV 내보내기로 학교 시스템과도 연동 가능합니다.
              </p>
            </div>
          </div>
        </div>

        {/* 수업 흐름 */}
        <div className="mt-10 max-w-3xl w-full">
          <div className="bg-gradient-to-r from-yellow-500 to-emerald-500 rounded-2xl p-5 md:p-8 text-white">
            <h2 className="text-base md:text-lg font-bold text-center mb-4 md:mb-6">수업 흐름 (50분 기준)</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-2">
              {[
                { time: '5분', label: '접속 & 참여', desc: '사이트 접속, 교실 코드 입력' },
                { time: '35분', label: '문제 풀이', desc: 'AI 코치 활용, 코드 작성' },
                { time: '10분', label: '풀이 비교', desc: '갤러리에서 접근법 토론' },
              ].map((step, i) => (
                <div key={i} className="flex-1 text-center sm:text-center flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0 bg-white/10 sm:bg-transparent rounded-lg p-3 sm:p-0">
                  <div className="text-xl sm:text-2xl font-bold sm:mb-1">{step.time}</div>
                  <div className="text-left sm:text-center">
                    <div className="text-sm font-medium sm:mb-1">{step.label}</div>
                    <div className="text-xs text-yellow-100">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      <footer className="p-6 text-center text-xs text-slate-400">
        사고력을 위한 파이썬 — 고등학교 정보 수업을 위한 교육 플랫폼
      </footer>
    </div>
  );
}

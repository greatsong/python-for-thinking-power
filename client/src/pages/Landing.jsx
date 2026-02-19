import { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Code2, Brain, Users, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore.js';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col overflow-y-auto">
      {/* 상단 네비게이션 */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto w-full">
        <span className="text-sm font-semibold text-slate-700">🐍 사고력을 위한 파이썬</span>
        <div className="flex items-center gap-4">
          <Link to="/guide" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">서비스 안내</Link>
          <Link to="/apply" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">교사 신청</Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-start py-8 px-6">
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
            <p className="text-sm text-slate-500 mb-4">Google 계정으로 로그인하세요</p>
            <div className="flex justify-center" ref={googleBtnRef} />
          </div>

          {/* 하단 링크 */}
          <p className="mt-4 text-xs text-slate-400">
            교사이신가요?{' '}
            <Link to="/apply" className="text-blue-500 hover:text-blue-600 font-medium">교사 계정 신청 →</Link>
          </p>
        </div>

        {/* 핵심 철학 */}
        <div className="mt-16 max-w-3xl w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 text-center mb-2">같은 문제, 다른 생각</h2>
            <p className="text-sm text-slate-500 text-center mb-6">정답은 하나가 아닙니다. 다양한 풀이를 비교하며 사고력을 키웁니다.</p>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 font-mono text-sm text-slate-700">
              <p className="text-slate-400 mb-3 text-xs"># [1, 2, 4, 5, 6] — 1부터 6까지 중 빠진 숫자를 찾으세요</p>
              <div className="space-y-2">
                <p><span className="text-blue-600 font-semibold">학생A</span>: 1부터 하나씩 확인 → <span className="text-emerald-600 font-bold">"3이 없네!"</span> <span className="text-slate-400 text-xs">(하나씩 찾기)</span></p>
                <p><span className="text-violet-600 font-semibold">학생B</span>: 옆 숫자와 차이가 2인 곳 → <span className="text-emerald-600 font-bold">"2와 4 사이!"</span> <span className="text-slate-400 text-xs">(패턴 발견)</span></p>
                <p><span className="text-amber-600 font-semibold">학생C</span>: 있어야 할 합 21 − 실제 합 18 → <span className="text-emerald-600 font-bold">3!</span> <span className="text-slate-400 text-xs">(수학적 사고)</span></p>
              </div>
              <p className="text-blue-600 mt-3 text-xs font-medium">→ 같은 답. 하지만 탐색, 패턴, 수학 — 머릿속 그림이 전혀 다르다. 이 비교에서 사고력이 자랍니다.</p>
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
                교사는 학생별 문제 풀이 현황을 실시간 매트릭스로 확인합니다.
                누가 어떤 문제에서 막혔는지 한눈에 파악하고, AI 사용량과 비용도 추적할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 수업 흐름 */}
        <div className="mt-10 max-w-3xl w-full">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
            <h2 className="text-lg font-bold text-center mb-6">수업 흐름 (50분 기준)</h2>
            <div className="flex items-center justify-between gap-2">
              {[
                { time: '5분', label: '접속 & 참여', desc: '사이트 접속, 교실 코드 입력' },
                { time: '35분', label: '문제 풀이', desc: 'AI 코치 활용, 코드 작성' },
                { time: '10분', label: '풀이 비교', desc: '갤러리에서 접근법 토론' },
              ].map((step, i) => (
                <div key={i} className="flex-1 text-center">
                  <div className="text-2xl font-bold mb-1">{step.time}</div>
                  <div className="text-sm font-medium mb-1">{step.label}</div>
                  <div className="text-xs text-blue-200">{step.desc}</div>
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

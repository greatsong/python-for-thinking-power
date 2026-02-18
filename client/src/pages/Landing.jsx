import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Brain, Users, BarChart3, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore.js';

export default function Landing() {
  const navigate = useNavigate();
  const { loginDemo, joinClassroom, loading } = useAuthStore();
  const [showDemo, setShowDemo] = useState(false);
  const [demoName, setDemoName] = useState('');
  const [demoRole, setDemoRole] = useState('student');

  const handleDemoLogin = async () => {
    if (!demoName.trim()) {
      toast.error('이름을 입력하세요');
      return;
    }
    try {
      await loginDemo(demoName.trim(), demoRole);
      toast.success(`${demoName}님, 환영합니다!`);
      if (demoRole === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/join');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // 1클릭 교사 데모
  const handleQuickTeacher = async () => {
    try {
      await loginDemo('데모교사', 'teacher');
      toast.success('교사 데모 — 교실 "2학년 3반 정보" 준비됨!');
      navigate('/teacher');
    } catch (err) {
      toast.error(err.message);
    }
  };

  // 1클릭 학생 데모
  const handleQuickStudent = async () => {
    try {
      await loginDemo('데모학생', 'student');
      try {
        await joinClassroom('00000', '');
        toast.success('데모 교실에 참여했습니다!');
        navigate('/student/problems');
      } catch {
        toast.success('학생 데모 — 참여 코드: 00000');
        navigate('/join');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* 헤더 */}
      <header className="p-6 flex justify-end gap-3">
        <button
          onClick={() => setShowDemo(true)}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white rounded-lg transition-colors border border-slate-200"
        >
          직접 로그인
        </button>
      </header>

      {/* 히어로 */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-16">
        <div className="text-center max-w-2xl">
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

          {/* 1클릭 데모 버튼 */}
          <div className="flex gap-4 justify-center mb-4">
            <button
              onClick={handleQuickStudent}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles size={18} />
              학생 데모 체험
            </button>
            <button
              onClick={handleQuickTeacher}
              disabled={loading}
              className="px-8 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 transition-colors shadow-lg shadow-slate-300 disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles size={18} />
              교사 데모 체험
            </button>
          </div>
          <p className="text-xs text-slate-400">
            데모 데이터가 포함된 체험 모드입니다 (학생 5명, 제출 15건, AI 대화 3건)
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

      {/* 커스텀 로그인 모달 */}
      {showDemo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowDemo(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {demoRole === 'teacher' ? '교사 로그인' : '학생 로그인'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              이름을 입력하고 역할을 선택하세요. (데모 교실 참여 코드: <span className="font-mono font-bold text-blue-600">00000</span>)
            </p>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setDemoRole('student')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    demoRole === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  학생
                </button>
                <button
                  onClick={() => setDemoRole('teacher')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    demoRole === 'teacher' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  교사
                </button>
              </div>

              <input
                type="text"
                placeholder="이름을 입력하세요"
                value={demoName}
                onChange={e => setDemoName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleDemoLogin()}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />

              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '로그인 중...' : '시작하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="p-6 text-center text-xs text-slate-400">
        사고력을 위한 파이썬 — 고등학교 정보 수업을 위한 교육 플랫폼
      </footer>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore.js';
import { apiFetch } from '../api/client.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '853390253196-1g91cg7l90pk5p54ftn3l39sa07q97j5.apps.googleusercontent.com';

const REGIONS = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
  '대전광역시', '울산광역시', '세종특별자치시', '경기도', '강원특별자치도',
  '충청북도', '충청남도', '전북특별자치도', '전라남도', '경상북도',
  '경상남도', '제주특별자치도',
];

export default function TeacherApply() {
  const navigate = useNavigate();
  const { loginWithGoogle, loginDemo, loading } = useAuthStore();
  const googleBtnRef = useRef(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [demoName, setDemoName] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    school: '',
    region: '',
    motivation: '',
    privacyConsent: false,
  });

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
        width: 320,
        locale: 'ko',
      });
    }
  }, []);

  const handleGoogleCredential = async (response) => {
    try {
      const user = await loginWithGoogle(response.credential, 'teacher');
      toast.success(`${user.name} 선생님, 환영합니다!`);
      navigate('/teacher');
    } catch (err) {
      toast.error(err.message || 'Google 로그인에 실패했습니다');
    }
  };

  const handleDemoTeacher = async () => {
    if (!demoName.trim()) {
      toast.error('이름을 입력해 주세요');
      return;
    }
    try {
      const user = await loginDemo(demoName.trim(), 'teacher');
      toast.success(`[데모] ${user.name} 선생님, 환영합니다!`);
      navigate('/teacher');
    } catch (err) {
      toast.error(err.message || '데모 로그인에 실패했습니다');
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.school || !form.region || !form.motivation) {
      toast.error('모든 필수 항목을 입력해 주세요.');
      return;
    }
    if (!form.privacyConsent) {
      toast.error('개인정보 수집·이용에 동의해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/auth/teacher-apply', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || '신청서 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 max-w-md w-full text-center">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">신청이 접수되었습니다</h2>
          <p className="text-sm text-slate-600 mb-6">
            검토 후 입력하신 이메일로 승인 결과를 안내드리겠습니다.<br />
            보통 1~2일 이내 처리됩니다.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            메인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col overflow-y-auto">
      <main className="flex-1 flex flex-col items-center py-10 px-6">
        <div className="max-w-lg w-full">
          {/* 뒤로가기 */}
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
            <ArrowLeft size={16} />
            메인으로
          </Link>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">교사 계정</h1>
          <p className="text-sm text-slate-500 mb-8">승인된 교사 로그인 또는 새 계정을 신청하세요.</p>

          {/* 교사 데모 체험 */}
          <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-6 mb-6">
            <div className="px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-700 mb-3">
              🎓 교사 화면을 먼저 체험해 보세요! 이름만 입력하면 바로 시작됩니다.
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="이름 입력 (예: 김선생)"
                value={demoName}
                onChange={(e) => setDemoName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDemoTeacher()}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleDemoTeacher}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                교사 체험
              </button>
            </div>
          </div>

          {/* 승인된 교사 로그인 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">이미 승인된 교사</h2>
            <p className="text-xs text-slate-500 mb-4">승인된 Google 계정으로 바로 로그인하세요.</p>
            <div className="flex justify-center" ref={googleBtnRef} />
          </div>

          {/* 신청서 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-1">교사 계정 신청</h2>
            <p className="text-xs text-slate-500 mb-5">아래 양식을 작성하시면 검토 후 승인해 드립니다.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 이름 */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* 이메일 */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="teacher@school.ac.kr"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">Google 로그인에 사용할 이메일을 입력해 주세요.</p>
              </div>

              {/* 소속 학교 */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  소속 학교 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.school}
                  onChange={(e) => updateField('school', e.target.value)}
                  placeholder="OO고등학교"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* 지역 */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  지역 <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.region}
                  onChange={(e) => updateField('region', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                >
                  <option value="">시·도를 선택해 주세요</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* 신청 동기 */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  신청 동기 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.motivation}
                  onChange={(e) => updateField('motivation', e.target.value)}
                  placeholder="교사 계정을 신청하는 이유와 활용 계획을 간단히 작성해 주세요."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              {/* 개인정보 수집·이용 동의 */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <h3 className="text-xs font-semibold text-slate-700 mb-2">개인정보 수집·이용 동의</h3>
                <div className="text-[11px] text-slate-500 space-y-1 mb-3">
                  <p><span className="font-medium text-slate-600">수집 항목:</span> 이름, 이메일, 소속 학교, 지역</p>
                  <p><span className="font-medium text-slate-600">수집 목적:</span> 교사 계정 신청 접수 및 승인 처리</p>
                  <p><span className="font-medium text-slate-600">보유 기간:</span> 신청 처리 완료 후 1년 또는 동의 철회 시까지</p>
                  <p>동의를 거부할 수 있으며, 거부 시 교사 계정 신청이 제한됩니다.</p>
                </div>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.privacyConsent}
                    onChange={(e) => updateField('privacyConsent', e.target.checked)}
                    className="mt-0.5 rounded border-slate-300"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    위 개인정보 수집·이용에 동의합니다. <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 disabled:opacity-50 transition-colors"
              >
                {submitting ? '제출 중...' : '신청서 제출'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-xs text-slate-400">
        사고력을 위한 파이썬 — 고등학교 정보 수업을 위한 교육 플랫폼
      </footer>
    </div>
  );
}

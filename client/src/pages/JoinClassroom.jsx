import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore.js';

export default function JoinClassroom() {
  const navigate = useNavigate();
  const { joinClassroom, updateProfile, classroom, user } = useAuthStore();
  const [joinCode, setJoinCode] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);

  // 이미 교실에 참여했으면 바로 이동
  if (classroom) return <Navigate to="/student/problems" replace />;
  if (!user) return <Navigate to="/" replace />;

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      toast.error('참여 코드를 입력하세요');
      return;
    }
    if (!studentNumber.trim()) {
      toast.error('학번을 입력하세요 (예: 1101)');
      return;
    }
    // 학번 형식 검증: 4자리 숫자 (학년+반+번호)
    if (!/^\d{4}$/.test(studentNumber.trim())) {
      toast.error('학번은 4자리 숫자로 입력하세요 (예: 1101 = 1학년 1반 01번)');
      return;
    }
    if (!studentName.trim()) {
      toast.error('이름을 입력하세요');
      return;
    }

    setLoading(true);
    try {
      // 학번(숫자)만 student_number로 저장
      const result = await joinClassroom(joinCode.trim(), studentNumber.trim());
      // 입력된 이름으로 사용자 이름 업데이트
      if (studentName.trim() && studentName.trim() !== user?.name) {
        try { await updateProfile(studentName.trim()); } catch { /* 이름 업데이트 실패는 무시 */ }
      }
      toast.success(`${result.name} 교실에 참여했습니다!`);
      navigate('/student/problems');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🏫</div>
          <h2 className="text-xl font-bold text-slate-800">교실 참여</h2>
          <p className="text-sm text-slate-500 mt-1">
            교사가 알려준 참여 코드를 입력하세요
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">참여 코드</label>
            <input
              type="text"
              placeholder="예: 12345"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={5}
              inputMode="numeric"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              학번 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="예: 1101"
              value={studentNumber}
              onChange={e => setStudentNumber(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={4}
              inputMode="numeric"
            />
            <p className="text-xs text-slate-400 mt-1">4자리 숫자: 학년(1) + 반(1) + 번호(01) = 1101</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="예: 홍길동"
              value={studentName}
              onChange={e => setStudentName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '참여 중...' : '교실 참여하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

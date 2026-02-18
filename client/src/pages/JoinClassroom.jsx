import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore.js';

export default function JoinClassroom() {
  const navigate = useNavigate();
  const { joinClassroom, classroom, user } = useAuthStore();
  const [joinCode, setJoinCode] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [loading, setLoading] = useState(false);

  // 이미 교실에 참여했으면 바로 이동
  if (classroom) return <Navigate to="/student/problems" replace />;
  if (!user) return <Navigate to="/" replace />;

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      toast.error('참여 코드를 입력하세요');
      return;
    }
    setLoading(true);
    try {
      const result = await joinClassroom(joinCode.trim(), studentNumber.trim());
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
            {user.name}님, 교사가 알려준 참여 코드를 입력하세요
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
            <label className="block text-sm font-medium text-slate-700 mb-1">출석번호 (선택)</label>
            <input
              type="text"
              placeholder="예: 15"
              value={studentNumber}
              onChange={e => setStudentNumber(e.target.value)}
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

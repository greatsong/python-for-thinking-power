import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Route, LogOut, UserCircle, X, Menu } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore.js';

export default function StudentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, classroom, logout, updateProfile, updateStudentNumber } = useAuthStore();
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [saving, setSaving] = useState(false);

  // Workspace 페이지에서는 레이아웃 사이드바를 숨김 (자체 헤더 사용)
  const isWorkspace = location.pathname.includes('/student/problems/') && location.pathname !== '/student/problems';

  const navItems = [
    { to: '/student/problems', icon: BookOpen, label: '문제' },
    { to: '/student/journey', icon: Route, label: '나의 여정' },
  ];

  const handleOpenProfile = () => {
    setEditName(user?.name || '');
    setEditNumber('');
    setShowProfile(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editName.trim() && editName.trim() !== user?.name) {
        await updateProfile(editName.trim());
        toast.success('이름이 변경되었습니다');
      }
      if (editNumber.trim() && classroom?.id) {
        await updateStudentNumber(classroom.id, editNumber.trim());
        toast.success('출석번호가 변경되었습니다');
      }
      setShowProfile(false);
    } catch (err) {
      toast.error(err.message || '저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  // Workspace는 전체 화면 사용
  if (isWorkspace) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen">
      {/* 모바일 햄버거 헤더 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <Menu size={22} />
        </button>
        <span className="text-sm font-bold text-slate-800">🐍 사고력 파이썬</span>
        <button
          onClick={handleOpenProfile}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <UserCircle size={22} />
        </button>
      </div>

      {/* 모바일 오버레이 */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 사이드바 — 데스크톱: 항상 표시, 모바일: 슬라이드 메뉴 */}
      <nav className={`
        fixed md:static inset-y-0 left-0 z-50
        w-56 bg-white border-r border-slate-200 flex flex-col
        transform transition-transform duration-200 ease-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">🐍 사고력 파이썬</h1>
            <p className="text-xs text-slate-500 mt-1">생각하는 힘을 키우는 코딩</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1 rounded text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-2 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="p-3 border-t border-slate-200 space-y-1">
          {/* 내 정보 (클릭하면 수정 모달) */}
          <button
            onClick={() => { handleOpenProfile(); setMobileMenuOpen(false); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 w-full px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <UserCircle size={16} />
            <div className="text-left">
              <div className="font-medium text-slate-700 truncate max-w-[120px]">{user?.name}</div>
              {classroom && <div className="text-xs text-slate-400 truncate max-w-[120px]">{classroom.name}</div>}
            </div>
          </button>

          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 w-full px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <LogOut size={16} />
            나가기
          </button>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto bg-slate-50 pt-14 md:pt-0">
        <Outlet />
      </main>

      {/* 내 정보 수정 모달 */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">내 정보 수정</h2>
              <button onClick={() => setShowProfile(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="이름 입력"
                />
              </div>

              {classroom && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    출석번호 <span className="text-slate-400 font-normal">(변경할 경우만 입력)</span>
                  </label>
                  <input
                    type="text"
                    value={editNumber}
                    onChange={(e) => setEditNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="예: 15"
                  />
                </div>
              )}

              <div className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
                이메일: {user?.email}
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

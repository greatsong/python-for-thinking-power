import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wrench, ListChecks, MessageSquare, Settings, LogOut } from 'lucide-react';
import useAuthStore from '../stores/authStore.js';

export default function TeacherLayout() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const navItems = [
    { to: '/teacher/dashboard', icon: LayoutDashboard, label: '교실 라이브' },
    { to: '/teacher/workshop', icon: Wrench, label: '문제 공방' },
    { to: '/teacher/assign', icon: ListChecks, label: '문제 배정' },
    { to: '/teacher/ai-reports', icon: MessageSquare, label: 'AI 리포트' },
    { to: '/teacher/classroom', icon: Settings, label: '교실 설정' },
  ];

  return (
    <div className="flex h-screen">
      {/* 사이드바 */}
      <nav className="w-56 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-lg font-bold">🐍 사고력 파이썬</h1>
          <p className="text-xs text-slate-400 mt-1">교사 대시보드</p>
        </div>

        <div className="flex-1 p-2 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="p-3 border-t border-slate-700">
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white w-full px-3 py-2"
          >
            <LogOut size={16} />
            나가기
          </button>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}

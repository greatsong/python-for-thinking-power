import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, Code2, Images, Route, LogOut } from 'lucide-react';
import useAuthStore from '../stores/authStore.js';

export default function StudentLayout() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const navItems = [
    { to: '/student/problems', icon: BookOpen, label: '문제' },
    { to: '/student/journey', icon: Route, label: '나의 여정' },
  ];

  return (
    <div className="flex h-screen">
      {/* 사이드바 */}
      <nav className="w-56 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-lg font-bold text-slate-800">🐍 사고력 파이썬</h1>
          <p className="text-xs text-slate-500 mt-1">생각하는 힘을 키우는 코딩</p>
        </div>

        <div className="flex-1 p-2 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
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

        <div className="p-3 border-t border-slate-200">
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 w-full px-3 py-2"
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

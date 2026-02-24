import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wrench, ListChecks, MessageSquare, Settings, BookOpen, LogOut, Menu, X, Users, ShieldCheck } from 'lucide-react';
import useAuthStore from '../stores/authStore.js';

export default function TeacherLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'greatsong21@gmail.com';
  const isAdmin = user?.email === adminEmail;

  const navItems = [
    { to: '/teacher/dashboard', icon: LayoutDashboard, label: '교실 라이브' },
    { to: '/teacher/workshop', icon: Wrench, label: '문제 공방' },
    { to: '/teacher/community', icon: Users, label: '문제 나눔터' },
    { to: '/teacher/assign', icon: ListChecks, label: '문제 배정' },
    { to: '/teacher/ai-reports', icon: MessageSquare, label: 'AI 리포트' },
    { to: '/teacher/classroom', icon: Settings, label: '교실 설정' },
    { to: '/teacher/guide', icon: BookOpen, label: '사용 안내' },
    ...(isAdmin ? [{ to: '/teacher/admin', icon: ShieldCheck, label: '신청 관리' }] : []),
  ];

  return (
    <div className="flex h-screen">
      {/* 모바일 햄버거 헤더 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <Menu size={22} />
        </button>
        <span className="text-sm font-bold text-white">🐍 교사 대시보드</span>
        <div className="w-[34px]" />
      </div>

      {/* 모바일 오버레이 */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <nav className={`
        fixed md:static inset-y-0 left-0 z-50
        w-56 bg-slate-900 text-white flex flex-col
        transform transition-transform duration-200 ease-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">🐍 사고력 파이썬</h1>
            <p className="text-xs text-slate-400 mt-1">교사 대시보드</p>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1 rounded text-slate-400 hover:text-white"
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
      <main className="flex-1 overflow-auto bg-slate-50 pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}

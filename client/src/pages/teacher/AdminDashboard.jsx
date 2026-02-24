import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../api/client.js';
import useAuthStore from '../../stores/authStore.js';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';

const STATUS_LABELS = { pending: '대기', approved: '승인', rejected: '거절' };
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};
const TABS = [
  { key: 'all', label: '전체' },
  { key: 'pending', label: '대기' },
  { key: 'approved', label: '승인' },
  { key: 'rejected', label: '거절' },
];

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'greatsong21@gmail.com';
  const isAdmin = user?.email === adminEmail;

  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiFetch('/admin/stats');
      setStats(data);
    } catch { /* 무시 */ }
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: filter, search, page, limit: 20 });
      const data = await apiFetch(`/admin/applications?${params}`);
      setApplications(data.applications);
      setTotalPages(data.totalPages);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchApplications();
    }
  }, [isAdmin, fetchStats, fetchApplications]);

  useEffect(() => { setPage(1); }, [filter, search]);

  const handleApprove = async (app) => {
    if (!confirm(`${app.name} 선생님의 교사 계정을 승인할까요?`)) return;
    setProcessing(app.id);
    try {
      const result = await apiFetch(`/admin/applications/${app.id}/approve`, { method: 'PUT' });
      toast.success(result.message);
      fetchStats();
      fetchApplications();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal) return;
    setProcessing(rejectModal.id);
    try {
      const result = await apiFetch(`/admin/applications/${rejectModal.id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: rejectReason }),
      });
      toast.success(result.message);
      setRejectModal(null);
      setRejectReason('');
      fetchStats();
      fetchApplications();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <ShieldAlert size={48} className="mb-4 text-slate-400" />
        <p className="text-lg font-medium">관리자 권한이 필요합니다</p>
        <p className="text-sm mt-1">이 페이지는 관리자만 접근할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">교사 신청 관리</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Clock} label="대기" count={stats.pending} color="yellow" />
        <StatCard icon={CheckCircle} label="승인" count={stats.approved} color="green" />
        <StatCard icon={XCircle} label="거절" count={stats.rejected} color="red" />
      </div>

      {/* 필터 탭 + 검색 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                filter === tab.key
                  ? 'bg-white text-slate-800 font-medium shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="이름, 이메일, 학교 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 신청 목록 테이블 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">불러오는 중...</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">해당하는 신청서가 없습니다</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-medium text-slate-600">이름</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">이메일</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600 hidden md:table-cell">학교</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600 hidden lg:table-cell">지역</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">신청일</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">상태</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{app.name}</td>
                    <td className="px-4 py-3 text-slate-600">{app.email}</td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{app.school}</td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{app.region}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(app.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[app.status]}`}>
                        {STATUS_LABELS[app.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {app.status === 'pending' ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleApprove(app)}
                            disabled={processing === app.id}
                            className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => { setRejectModal(app); setRejectReason(''); }}
                            disabled={processing === app.id}
                            className="px-3 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            거절
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {app.reviewed_at ? formatDate(app.reviewed_at) : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 동기 표시 (확장 행) */}
        {!loading && applications.length > 0 && (
          <div className="border-t border-slate-100">
            {applications.filter((a) => a.status === 'pending').map((app) => (
              <details key={`detail-${app.id}`} className="border-b border-slate-50 last:border-b-0">
                <summary className="px-4 py-2 text-xs text-slate-500 cursor-pointer hover:bg-slate-50">
                  {app.name}의 신청 동기 보기
                </summary>
                <div className="px-4 pb-3 text-sm text-slate-600 whitespace-pre-wrap">{app.motivation}</div>
              </details>
            ))}
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-slate-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* 거절 사유 모달 */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-1">신청 거절</h3>
            <p className="text-sm text-slate-500 mb-4">{rejectModal.name} ({rejectModal.email})</p>
            <label className="block text-sm font-medium text-slate-700 mb-1">거절 사유 (선택)</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="거절 사유를 입력하세요 (이메일로 전달됩니다)"
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={processing === rejectModal.id}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                거절 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, count, color }) {
  const colors = {
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${colors[color]}`}>
      <Icon size={24} />
      <div>
        <p className="text-2xl font-bold">{count}</p>
        <p className="text-xs opacity-80">{label}</p>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'Z');
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return '방금 전';
    return `${hours}시간 전`;
  }
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}일 전`;
  }
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

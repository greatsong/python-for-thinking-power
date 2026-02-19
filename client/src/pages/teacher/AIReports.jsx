import { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import useAuthStore from '../../stores/authStore.js';
import useDashboardStore from '../../stores/dashboardStore.js';
import { MessageSquare, School, User, FileText, Hash, RefreshCw } from 'lucide-react';

export default function AIReports() {
  const { user } = useAuthStore();
  const { aiSummaries, fetchAISummaries } = useDashboardStore();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [loading, setLoading] = useState(false);
  const [classroomLoading, setClassroomLoading] = useState(true);

  // 교실 목록 불러오기
  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const data = await apiFetch('/classrooms/my');
        setClassrooms(data);
        if (data.length > 0) {
          setSelectedClassroom(data[0].id);
        }
      } catch (err) {
        console.error('교실 목록 조회 실패:', err.message);
      } finally {
        setClassroomLoading(false);
      }
    };
    fetchClassrooms();
  }, []);

  // 교실 선택 시 AI 요약 불러오기
  useEffect(() => {
    if (!selectedClassroom) return;
    const load = async () => {
      setLoading(true);
      await fetchAISummaries(selectedClassroom);
      setLoading(false);
    };
    load();
  }, [selectedClassroom, fetchAISummaries]);

  // 새로고침
  const handleRefresh = async () => {
    if (!selectedClassroom) return;
    setLoading(true);
    await fetchAISummaries(selectedClassroom);
    setLoading(false);
  };

  if (classroomLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare size={22} />
          AI 대화 리포트
        </h1>

        <div className="flex items-center gap-2 md:gap-3">
          {/* 교실 선택 */}
          <select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="flex-1 sm:flex-none px-3 md:px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">교실 선택</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={handleRefresh}
            disabled={loading || !selectedClassroom}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors shrink-0"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">새로고침</span>
          </button>
        </div>
      </div>

      {!selectedClassroom ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
          <School size={48} className="mx-auto mb-4 text-slate-300" />
          교실을 선택해주세요.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : aiSummaries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
          <MessageSquare size={48} className="mx-auto mb-4 text-slate-300" />
          아직 AI 대화 기록이 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {aiSummaries.map((summary, index) => (
            <div
              key={summary.id || index}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-4">
                  {/* 학생 정보 */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">
                      {summary.student_name?.charAt(0) || <User size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {summary.student_name || '알 수 없음'}
                      </p>
                      {summary.student_number && (
                        <p className="text-xs text-slate-400">{summary.student_number}번</p>
                      )}
                    </div>
                  </div>

                  {/* 문제 정보 */}
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <FileText size={14} className="text-slate-400" />
                    <span>{summary.problem_title || '문제'}</span>
                  </div>
                </div>

                {/* 대화 수 */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                  <Hash size={12} />
                  {summary.message_count || 0}회 대화
                </div>
              </div>

              {/* 요약 텍스트 */}
              {summary.summary ? (
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {summary.summary}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">요약이 아직 생성되지 않았습니다.</p>
              )}

              {/* 업데이트 시간 */}
              {summary.updated_at && (
                <p className="text-xs text-slate-400 mt-3">
                  마지막 대화: {new Date(summary.updated_at).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

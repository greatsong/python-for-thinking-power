import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiFetch } from '../../api/client.js';
import useAuthStore from '../../stores/authStore.js';
import useDashboardStore from '../../stores/dashboardStore.js';
import StudentDetailPanel from '../../components/StudentDetailPanel.jsx';
import {
  LayoutDashboard, Users, FileCheck, MessageSquare,
  RefreshCw, School, Clock, Activity, Grid3X3,
  ArrowUpDown, Filter, Bot, AlertTriangle, ChevronDown,
  CheckCircle, XCircle, Minus, Search, Heart, Download
} from 'lucide-react';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, CATEGORY_LABELS } from 'shared/constants.js';

export default function LiveDashboard() {
  const { user } = useAuthStore();
  const { overview, students, matrix, loading, matrixLoading, fetchOverview, fetchStudents, fetchMatrix } = useDashboardStore();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [classroomLoading, setClassroomLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'list' | 'reflections' | 'ai-usage'
  const [reflections, setReflections] = useState([]);
  const [reflectionsLoading, setReflectionsLoading] = useState(false);
  const [aiUsage, setAiUsage] = useState(null);
  const [aiUsageLoading, setAiUsageLoading] = useState(false);
  const [usagePeriod, setUsagePeriod] = useState('day');

  // 매트릭스 필터/정렬
  const [sortBy, setSortBy] = useState('number'); // 'number' | 'name' | 'progress'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'struggling' | 'cheating'
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // 학생 상세 패널
  const [selectedCell, setSelectedCell] = useState(null); // { student, problem, cell }

  // 내보내기 드롭다운
  const [showExportMenu, setShowExportMenu] = useState(false);

  // 문제 열 클릭 정렬
  const [sortByProblemId, setSortByProblemId] = useState(null);
  const [sortByProblemAsc, setSortByProblemAsc] = useState(true); // true: 자력→AI→미통과, false: 반대

  const handleProblemHeaderClick = (problemId) => {
    if (sortByProblemId === problemId) {
      if (!sortByProblemAsc) {
        // 이미 역순 → 정렬 해제
        setSortByProblemId(null);
        setSortByProblemAsc(true);
      } else {
        setSortByProblemAsc(false);
      }
    } else {
      setSortByProblemId(problemId);
      setSortByProblemAsc(true);
    }
  };

  const handleStudentHeaderClick = () => {
    setSortByProblemId(null);
    setSortBy('number');
  };

  // 매트릭스 셀 클릭 → 학생 상세 패널
  const handleCellClick = (student, problem, cell) => {
    setSelectedCell({ student, problem, cell });
  };

  // 학생 행 클릭 → 전체 요약 모드
  const handleStudentClick = (student) => {
    setSelectedCell({ student, problem: null, cell: null });
  };

  // CSV 내보내기
  const handleExport = async (type) => {
    setShowExportMenu(false);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/dashboard/export/${selectedClassroom}?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('내보내기 실패');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('내보내기 실패:', err.message);
    }
  };

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

  // 소감 데이터 불러오기
  const fetchReflections = useCallback(async () => {
    if (!selectedClassroom) return;
    setReflectionsLoading(true);
    try {
      const data = await apiFetch(`/submissions/reflections/${selectedClassroom}`);
      setReflections(data);
    } catch (err) {
      console.error('소감 조회 실패:', err.message);
    } finally {
      setReflectionsLoading(false);
    }
  }, [selectedClassroom]);

  // AI 사용량 불러오기
  const fetchAiUsage = useCallback(async (period) => {
    if (!selectedClassroom) return;
    setAiUsageLoading(true);
    try {
      const data = await apiFetch(`/dashboard/ai-usage/${selectedClassroom}?period=${period || usagePeriod}`);
      setAiUsage(data);
    } catch (err) {
      console.error('AI 사용량 조회 실패:', err.message);
    } finally {
      setAiUsageLoading(false);
    }
  }, [selectedClassroom, usagePeriod]);

  // 교실 선택 시 데이터 불러오기
  const loadDashboardData = useCallback(async () => {
    if (!selectedClassroom) return;
    await Promise.all([
      fetchOverview(selectedClassroom),
      fetchStudents(selectedClassroom),
      fetchMatrix(selectedClassroom),
      fetchReflections(),
      fetchAiUsage(),
    ]);
  }, [selectedClassroom, fetchOverview, fetchStudents, fetchMatrix, fetchReflections, fetchAiUsage]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // 자동 새로고침 (30초)
  useEffect(() => {
    if (!selectedClassroom) return;
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [selectedClassroom, loadDashboardData]);

  // 수동 새로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // 시간 포맷
  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}시간 전`;
    return date.toLocaleDateString('ko-KR');
  };

  // 매트릭스 데이터 필터링/정렬
  const filteredStudents = useMemo(() => {
    if (!matrix?.students) return [];
    let result = [...matrix.students];

    // 검색 필터
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.student_number || '').includes(q)
      );
    }

    // 상태 필터
    if (filterStatus === 'struggling') {
      result = result.filter(s => {
        const problemCount = matrix.problems?.length || 0;
        let passedCount = 0;
        for (const p of matrix.problems || []) {
          const cell = matrix.cells?.[`${s.id}:${p.id}`];
          if (cell?.status === 'passed') passedCount++;
        }
        return passedCount < problemCount * 0.3; // 30% 미만 통과
      });
    } else if (filterStatus === 'cheating') {
      result = result.filter(s => {
        for (const p of matrix.problems || []) {
          const cell = matrix.cells?.[`${s.id}:${p.id}`];
          if (cell?.cheatingFlag) return true;
        }
        return false;
      });
    }

    // 정렬: 문제 열 클릭 정렬이 우선
    if (sortByProblemId) {
      const getCellWeight = (cell) => {
        if (!cell) return 5; // 미시도
        if (cell.cheatingFlag) return 4;
        if (cell.status === 'passed' && !cell.aiUsed) return 1; // 자력
        if (cell.status === 'passed' && cell.aiUsed) return 2;  // AI 도움
        if (cell.status === 'failed') return 3;
        if (cell.status === 'in_progress') return 4;
        return 5;
      };
      result.sort((a, b) => {
        const wa = getCellWeight(matrix.cells?.[`${a.id}:${sortByProblemId}`]);
        const wb = getCellWeight(matrix.cells?.[`${b.id}:${sortByProblemId}`]);
        const diff = wa - wb;
        if (diff !== 0) return sortByProblemAsc ? diff : -diff;
        // 같으면 학번순
        return (parseInt(a.student_number) || 999) - (parseInt(b.student_number) || 999);
      });
    } else {
      result.sort((a, b) => {
        if (sortBy === 'number') {
          const numA = parseInt(a.student_number) || 999;
          const numB = parseInt(b.student_number) || 999;
          return numA - numB;
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name, 'ko');
        }
        if (sortBy === 'progress') {
          const getProgress = (s) => {
            let count = 0;
            for (const p of matrix.problems || []) {
              const cell = matrix.cells?.[`${s.id}:${p.id}`];
              if (cell?.status === 'passed') count++;
            }
            return count;
          };
          return getProgress(b) - getProgress(a);
        }
        return 0;
      });
    }

    return result;
  }, [matrix, searchQuery, filterStatus, sortBy, sortByProblemId, sortByProblemAsc]);

  // 셀 색상 및 아이콘 결정
  const getCellInfo = (cell) => {
    if (!cell) {
      return { bg: 'bg-slate-50', border: 'border-slate-200', label: '-', color: 'text-slate-300' };
    }
    if (cell.cheatingFlag) {
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-300',
        label: '⚠',
        color: 'text-rose-600',
        tooltip: '치팅 의심 (답 요구 키워드 감지)',
      };
    }
    if (cell.status === 'passed') {
      if (cell.aiUsed) {
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-300',
          label: '✓',
          color: 'text-blue-600',
          tooltip: `통과 (AI ${cell.aiMessageCount || 0}회)`,
        };
      }
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-300',
        label: '✓',
        color: 'text-emerald-600',
        tooltip: '통과 (자력)',
      };
    }
    if (cell.status === 'failed') {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        label: '✗',
        color: 'text-amber-600',
        tooltip: '미통과',
      };
    }
    if (cell.status === 'in_progress') {
      return {
        bg: 'bg-violet-50',
        border: 'border-violet-300',
        label: '…',
        color: 'text-violet-600',
        tooltip: 'AI 대화 중 (아직 미제출)',
      };
    }
    return { bg: 'bg-slate-50', border: 'border-slate-200', label: '-', color: 'text-slate-300' };
  };

  if (classroomLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
          <LayoutDashboard size={22} />
          교실 라이브
        </h1>

        <div className="flex items-center gap-2 md:gap-3">
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
            disabled={refreshing || !selectedClassroom}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors shrink-0"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">새로고침</span>
          </button>

          {/* 내보내기 */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={!selectedClassroom}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors shrink-0"
            >
              <Download size={16} />
              <span className="hidden sm:inline">내보내기</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[160px]">
                <button
                  onClick={() => handleExport('grades')}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
                >
                  성적표 CSV
                </button>
                <button
                  onClick={() => handleExport('progress')}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-b-lg border-t border-slate-100"
                >
                  진행 요약 CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!selectedClassroom ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
          <School size={48} className="mx-auto mb-4 text-slate-300" />
          교실을 선택해주세요.
        </div>
      ) : (
        <>
          {/* 전체 현황 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
            <StatCard
              icon={<Users size={20} />}
              label="총 학생"
              value={overview?.total_students ?? '-'}
              color="blue"
            />
            <StatCard
              icon={<FileCheck size={20} />}
              label="총 제출"
              value={overview?.total_submissions ?? '-'}
              color="green"
            />
            <StatCard
              icon={<Activity size={20} />}
              label="통과 제출"
              value={overview?.passed_submissions ?? '-'}
              color="emerald"
            />
            <StatCard
              icon={<MessageSquare size={20} />}
              label="AI 대화 수"
              value={overview?.total_ai_conversations ?? '-'}
              color="purple"
            />
          </div>

          {/* 탭 전환 */}
          <div className="flex items-center gap-1 mb-4 bg-slate-100 rounded-lg p-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'matrix'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Grid3X3 size={14} />
              매트릭스
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'list'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users size={14} />
              학생 목록
            </button>
            <button
              onClick={() => setActiveTab('reflections')}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'reflections'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Heart size={14} />
              소감
              {reflections.length > 0 && (
                <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-medium">
                  {reflections.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('ai-usage')}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'ai-usage'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Bot size={14} />
              AI 사용량
            </button>
          </div>

          {/* 매트릭스 뷰 */}
          {activeTab === 'matrix' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* 매트릭스 툴바 */}
              <div className="px-4 md:px-5 py-3 md:py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-sm md:text-base font-semibold text-slate-700 flex items-center gap-2">
                  <Grid3X3 size={16} />
                  학생 × 문제 진행 현황
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* 검색 */}
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="학생 검색..."
                      className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
                    />
                  </div>

                  {/* 필터 */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFilterMenu(!showFilterMenu)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs transition-colors ${
                        filterStatus !== 'all'
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Filter size={13} />
                      {filterStatus === 'all' ? '전체' : filterStatus === 'struggling' ? '도움 필요' : '치팅 의심'}
                      <ChevronDown size={13} />
                    </button>
                    {showFilterMenu && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                        {[
                          { value: 'all', label: '전체 보기' },
                          { value: 'struggling', label: '도움 필요' },
                          { value: 'cheating', label: '치팅 의심' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => { setFilterStatus(opt.value); setShowFilterMenu(false); }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${
                              filterStatus === opt.value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 정렬 */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="number">번호순</option>
                    <option value="name">이름순</option>
                    <option value="progress">진행률순</option>
                  </select>
                </div>
              </div>

              {/* 범례 */}
              <div className="px-4 md:px-5 py-2 md:py-3 border-b border-slate-100 flex items-center gap-3 md:gap-4 flex-wrap text-[11px] md:text-xs text-slate-500 overflow-x-auto">
                <span className="font-medium text-slate-600">범례:</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded border border-emerald-300 bg-emerald-50 inline-flex items-center justify-center text-emerald-600 text-[10px] font-bold">✓</span>
                  자력 통과
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded border border-blue-300 bg-blue-50 inline-flex items-center justify-center text-blue-600 text-[10px] font-bold">✓</span>
                  AI 도움 통과
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded border border-amber-300 bg-amber-50 inline-flex items-center justify-center text-amber-600 text-[10px] font-bold">✗</span>
                  미통과
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded border border-violet-300 bg-violet-50 inline-flex items-center justify-center text-violet-600 text-[10px] font-bold">…</span>
                  진행 중
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded border border-rose-300 bg-rose-50 inline-flex items-center justify-center text-rose-600 text-[10px] font-bold">⚠</span>
                  치팅 의심
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded border border-slate-200 bg-slate-50 inline-flex items-center justify-center text-slate-300 text-[10px]">-</span>
                  미시도
                </span>
              </div>

              {/* 매트릭스 테이블 */}
              {matrixLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
              ) : !matrix?.problems?.length ? (
                <div className="py-16 text-center text-slate-400 text-sm">
                  배정된 문제가 없습니다.
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm">
                  {searchQuery || filterStatus !== 'all'
                    ? '조건에 맞는 학생이 없습니다.'
                    : '아직 참여한 학생이 없습니다.'}
                </div>
              ) : (
                <div className="overflow-auto max-h-[600px]">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-50">
                        {/* 고정 열: 학생 정보 (클릭 → 학번순) */}
                        <th
                          onClick={handleStudentHeaderClick}
                          className="sticky left-0 z-20 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-600 border-b border-r border-slate-200 min-w-[140px] cursor-pointer hover:bg-slate-200 transition-colors select-none"
                        >
                          <div className="flex items-center gap-1">
                            <Users size={13} />
                            학생
                            {!sortByProblemId && sortBy === 'number' && (
                              <ArrowUpDown size={11} className="text-blue-500" />
                            )}
                          </div>
                        </th>
                        {/* 문제 열 헤더 (클릭 → 해당 문제 상태 정렬) */}
                        {matrix.problems.map((p, idx) => {
                          const isActive = sortByProblemId === p.id;
                          return (
                            <th
                              key={p.id}
                              onClick={() => handleProblemHeaderClick(p.id)}
                              className={`px-2 py-2 text-center font-medium border-b border-slate-200 min-w-[68px] max-w-[80px] cursor-pointer select-none transition-colors ${
                                isActive
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                  #{idx + 1}
                                  {isActive && (
                                    <span className="text-blue-500">{sortByProblemAsc ? '▲' : '▼'}</span>
                                  )}
                                </span>
                                <span className="text-[11px] leading-tight truncate w-full" title={p.title}>
                                  {p.title.length > 6 ? p.title.slice(0, 6) + '…' : p.title}
                                </span>
                              </div>
                            </th>
                          );
                        })}
                        {/* 요약 열 */}
                        <th className="px-3 py-2 text-center font-semibold text-slate-600 border-b border-l border-slate-200 min-w-[60px]">
                          진행률
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 통과율 행 */}
                      <tr className="bg-slate-25">
                        <td className="sticky left-0 z-10 bg-slate-50 px-3 py-1 text-[10px] text-slate-400 font-medium border-b border-r border-slate-200">
                          통과율
                        </td>
                        {matrix.problems.map(p => {
                          const total = matrix.students?.length || 0;
                          const passed = total > 0
                            ? matrix.students.filter(s => matrix.cells?.[`${s.id}:${p.id}`]?.status === 'passed').length
                            : 0;
                          const rate = total > 0 ? Math.round(passed / total * 100) : 0;
                          return (
                            <td key={p.id} className="text-center text-[10px] py-1 border-b border-slate-100 font-medium" style={{
                              color: rate >= 80 ? '#059669' : rate >= 50 ? '#d97706' : rate > 0 ? '#dc2626' : '#94a3b8'
                            }}>
                              {rate}%
                            </td>
                          );
                        })}
                        <td className="border-b border-l border-slate-200" />
                      </tr>
                      {filteredStudents.map((student) => {
                        // 통과 수 계산
                        let passedCount = 0;
                        for (const p of matrix.problems) {
                          const cell = matrix.cells?.[`${student.id}:${p.id}`];
                          if (cell?.status === 'passed') passedCount++;
                        }
                        const progressPct = matrix.problems.length > 0
                          ? Math.round((passedCount / matrix.problems.length) * 100)
                          : 0;

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/50 group">
                            {/* 학생 이름 (고정 열) — "1101 석리송" 형식 */}
                            <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-3 py-2 border-b border-r border-slate-200">
                              <span className="font-medium text-slate-800 text-xs truncate">
                                <span className="font-mono text-slate-400">{student.student_number || '-'}</span>
                                {' '}
                                {student.name}
                              </span>
                            </td>
                            {/* 문제별 셀 */}
                            {matrix.problems.map((p) => {
                              const cell = matrix.cells?.[`${student.id}:${p.id}`];
                              const info = getCellInfo(cell);
                              return (
                                <td
                                  key={p.id}
                                  className="px-1 py-1.5 border-b border-slate-100 text-center"
                                >
                                  <div
                                    className={`w-8 h-8 mx-auto rounded-md border ${info.bg} ${info.border} flex items-center justify-center ${info.color} font-bold text-xs cursor-pointer hover:ring-2 hover:ring-blue-400 relative group/cell transition-shadow`}
                                    title={info.tooltip || ''}
                                    onClick={() => handleCellClick(student, p, cell)}
                                  >
                                    {info.label}
                                    {cell?.aiUsed && info.label !== '⚠' && (
                                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-violet-500 border border-white flex items-center justify-center">
                                        <Bot size={7} className="text-white" />
                                      </span>
                                    )}
                                    {cell?.teacherGrade && (
                                      <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 border border-white text-[7px] text-white flex items-center justify-center font-bold">
                                        {cell.teacherGrade}
                                      </span>
                                    )}
                                    {!cell?.teacherGrade && cell?.hasFeedback && (
                                      <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border border-white" />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            {/* 진행률 */}
                            <td className="px-3 py-2 border-b border-l border-slate-200 text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      progressPct >= 80 ? 'bg-emerald-500' :
                                      progressPct >= 40 ? 'bg-blue-500' :
                                      progressPct > 0 ? 'bg-amber-500' : 'bg-slate-300'
                                    }`}
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-medium ${
                                  progressPct >= 80 ? 'text-emerald-600' :
                                  progressPct >= 40 ? 'text-blue-600' :
                                  'text-slate-500'
                                }`}>
                                  {passedCount}/{matrix.problems.length}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 학생 소감 뷰 */}
          {activeTab === 'reflections' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                  <Heart size={18} className="text-pink-500" />
                  학생 소감
                </h2>
              </div>

              {reflectionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600" />
                </div>
              ) : reflections.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  아직 학생 소감이 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[600px] overflow-auto">
                  {reflections.map((r) => (
                    <div key={r.id} className="px-4 md:px-5 py-3 md:py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                        <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold shrink-0">
                          {r.student_name?.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800 text-sm">
                          <span className="font-mono text-slate-400 text-xs">{r.student_number || '-'}</span>
                          {' '}{r.student_name}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white shrink-0"
                          style={{ backgroundColor: DIFFICULTY_COLORS[r.difficulty] || '#6b7280' }}
                        >
                          {DIFFICULTY_LABELS[r.difficulty]}
                        </span>
                        <span className="text-xs text-slate-500 truncate">{r.problem_title}</span>
                        <span className="sm:ml-auto text-xs text-slate-400 flex items-center gap-1 shrink-0">
                          <Clock size={12} />
                          {new Date(r.submitted_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 ml-10 bg-violet-50 px-3 py-2 rounded-lg">
                        "{r.reflection}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI 사용량 뷰 */}
          {activeTab === 'ai-usage' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                  <Bot size={18} className="text-violet-500" />
                  AI 사용량
                </h2>
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                  {[
                    { value: 'day', label: '오늘' },
                    { value: 'week', label: '이번 주' },
                    { value: 'month', label: '이번 달' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => { setUsagePeriod(value); fetchAiUsage(value); }}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        usagePeriod === value
                          ? 'bg-white text-slate-800 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {aiUsageLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600" />
                </div>
              ) : !aiUsage ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  사용량 데이터를 불러올 수 없습니다.
                </div>
              ) : (
                <>
                  {/* 요약 카드 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 p-4 md:p-5 border-b border-slate-100">
                    <div className="bg-violet-50 rounded-lg p-4 border border-violet-200">
                      <p className="text-xs text-violet-600 font-medium mb-1">총 호출 수</p>
                      <p className="text-2xl font-bold text-violet-700">{aiUsage.total_calls}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-xs text-blue-600 font-medium mb-1">예상 비용</p>
                      <p className="text-2xl font-bold text-blue-700">${aiUsage.estimated_cost}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="text-xs text-slate-600 font-medium mb-1">일일 제한</p>
                      <p className="text-2xl font-bold text-slate-700">
                        {aiUsage.daily_limit === 0 ? '무제한' : `${aiUsage.daily_limit}회`}
                      </p>
                    </div>
                  </div>

                  {/* 일별 사용량 바 차트 */}
                  {aiUsage.daily_breakdown?.length > 0 && (
                    <div className="px-5 py-4 border-b border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-600 mb-3">최근 7일 사용량</h3>
                      <div className="flex items-end gap-2 h-24">
                        {aiUsage.daily_breakdown.map((d) => {
                          const maxCount = Math.max(...aiUsage.daily_breakdown.map(x => x.call_count));
                          const height = maxCount > 0 ? (d.call_count / maxCount) * 100 : 0;
                          return (
                            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                              <span className="text-[10px] text-slate-500 font-medium">{d.call_count}</span>
                              <div
                                className="w-full bg-violet-400 rounded-t-sm min-h-[2px] transition-all"
                                style={{ height: `${height}%` }}
                              />
                              <span className="text-[10px] text-slate-400">
                                {new Date(d.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 학생별 사용량 랭킹 */}
                  <div className="px-5 py-4">
                    <h3 className="text-sm font-semibold text-slate-600 mb-3">학생별 사용량</h3>
                    {aiUsage.per_student?.length === 0 ? (
                      <p className="text-sm text-slate-400 py-4 text-center">해당 기간에 AI 사용 기록이 없습니다.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-500 border-b border-slate-200">
                            <th className="pb-2 pr-4 w-10">#</th>
                            <th className="pb-2 pr-4">번호</th>
                            <th className="pb-2 pr-4">이름</th>
                            <th className="pb-2 pr-4 text-center">호출 수</th>
                            <th className="pb-2 text-right">예상 비용</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aiUsage.per_student.map((s, i) => (
                            <tr key={s.user_id} className="border-b border-slate-50 last:border-0">
                              <td className="py-2 pr-4 text-slate-400 text-xs">{i + 1}</td>
                              <td className="py-2 pr-4 font-mono text-slate-500 text-xs">{s.student_number || '-'}</td>
                              <td className="py-2 pr-4 font-medium text-slate-800">{s.name}</td>
                              <td className="py-2 pr-4 text-center">
                                <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium text-xs">
                                  {s.call_count}
                                </span>
                              </td>
                              <td className="py-2 text-right text-slate-500 text-xs">
                                ${(s.call_count * 0.015).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 학생 목록 뷰 (기존) */}
          {activeTab === 'list' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h2 className="text-base font-semibold text-slate-700">학생별 진행 현황</h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
              ) : students.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  아직 참여한 학생이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500 bg-slate-50">
                        <th className="px-4 py-3 font-medium">이름</th>
                        <th className="px-4 py-3 font-medium">번호</th>
                        <th className="px-4 py-3 font-medium text-center">푼 문제</th>
                        <th className="px-4 py-3 font-medium text-center">총 제출</th>
                        <th className="px-4 py-3 font-medium text-center">AI 대화</th>
                        <th className="px-4 py-3 font-medium">마지막 활동</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => handleStudentClick(student)}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                {student.name?.charAt(0)}
                              </div>
                              <span className="font-medium text-slate-800">{student.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {student.student_number || '-'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium text-xs">
                              {student.solved_count ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium text-xs">
                              {student.submission_count ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium text-xs">
                              {student.ai_conversation_count ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} />
                              {formatTime(student.last_activity)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 학생 상세 슬라이드 패널 */}
      {selectedCell && (
        <StudentDetailPanel
          classroomId={selectedClassroom}
          studentId={selectedCell.student.id}
          problemId={selectedCell.problem?.id || null}
          studentName={selectedCell.student.name}
          problemTitle={selectedCell.problem?.title || null}
          onClose={() => setSelectedCell(null)}
          onFeedbackSaved={loadDashboardData}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  const iconClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    emerald: 'text-emerald-500',
    purple: 'text-purple-500',
  };

  return (
    <div className={`rounded-xl border p-3 md:p-5 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1 md:mb-2">
        <span className={iconClasses[color]}>{icon}</span>
        <span className="text-xs md:text-sm font-medium opacity-80">{label}</span>
      </div>
      <div className="text-xl md:text-2xl font-bold">{value}</div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Loader2, Route, ChevronRight, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../../api/client.js';
import useProblemStore from '../../stores/problemStore.js';
import CodeTimeline from '../../components/CodeTimeline.jsx';
import { DIFFICULTY_COLORS } from 'shared/constants.js';

export default function MyJourney() {
  const { problems, fetchProblems } = useProblemStore();
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  // 모바일: 현재 뷰 (list | timeline | code)
  const [mobileView, setMobileView] = useState('list');

  useEffect(() => {
    fetchProblems().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const subs = await apiFetch('/submissions/my');
        setSubmissions(subs);
      } catch {
        // 에러 무시
      }
    };
    loadSubmissions();
  }, []);

  const handleSelectProblem = async (problem) => {
    setSelectedProblem(problem);
    setSelectedSnapshot(null);
    setSnapshotLoading(true);
    setMobileView('timeline');
    try {
      const snaps = await apiFetch(`/submissions/snapshots?problemId=${problem.id}`);
      setSnapshots(snaps);
    } catch {
      setSnapshots([]);
    }
    setSnapshotLoading(false);
  };

  const handleSelectSnapshot = (snapshot) => {
    setSelectedSnapshot(snapshot);
    setMobileView('code');
  };

  const submissionCountByProblem = {};
  const passedByProblem = {};
  for (const sub of submissions) {
    submissionCountByProblem[sub.problem_id] = (submissionCountByProblem[sub.problem_id] || 0) + 1;
    if (sub.passed) passedByProblem[sub.problem_id] = true;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  // 문제 목록 컴포넌트
  const ProblemListPanel = ({ onSelect }) => (
    <div className="h-full overflow-auto">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <Route size={18} />
          나의 코드 여정
        </h2>
        <p className="text-xs text-slate-500 mt-1">문제를 선택하면 풀이 과정을 볼 수 있어요</p>
      </div>

      {problems.map((p) => {
        const count = submissionCountByProblem[p.id] || 0;
        const passed = passedByProblem[p.id];
        const isSelected = selectedProblem?.id === p.id;

        return (
          <button
            key={p.id}
            onClick={() => (onSelect || handleSelectProblem)(p)}
            className={`w-full px-4 py-3 flex items-center gap-3 text-left border-b border-slate-100 transition-colors ${
              isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'
            }`}
          >
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ backgroundColor: DIFFICULTY_COLORS[p.difficulty] }}
            >
              {p.difficulty}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-700 truncate">{p.title}</div>
              <div className="text-xs text-slate-400">
                {count > 0 ? `${count}회 제출` : '아직 시도 안 함'}
                {passed && ' ✅'}
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-300 shrink-0" />
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* ── 데스크톱 레이아웃 ── */}
      {/* 왼쪽: 문제 목록 (데스크톱) */}
      <div className="hidden md:block w-72 border-r border-slate-200 bg-white">
        <ProblemListPanel onSelect={handleSelectProblem} />
      </div>

      {/* 오른쪽: 타임라인 + 코드 뷰어 (데스크톱) */}
      <div className="hidden md:flex flex-1">
        {selectedProblem ? (
          <>
            <div className="w-80 border-r border-slate-200 bg-slate-50 overflow-auto p-4">
              <h3 className="font-semibold text-slate-700 text-sm mb-3">{selectedProblem.title}</h3>
              {snapshotLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-blue-500" />
                </div>
              ) : (
                <CodeTimeline
                  snapshots={snapshots}
                  onSelect={setSelectedSnapshot}
                  selectedId={selectedSnapshot?.id}
                />
              )}
            </div>

            <div className="flex-1 bg-slate-950 p-4 overflow-auto">
              {selectedSnapshot ? (
                <div>
                  <div className="text-xs text-slate-500 mb-3">
                    {new Date(selectedSnapshot.snapshot_at).toLocaleString('ko-KR')}
                  </div>
                  <pre className="text-sm text-slate-200 font-mono leading-relaxed whitespace-pre-wrap">
                    {selectedSnapshot.code}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-600 text-sm">
                  타임라인에서 스냅샷을 선택하세요
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Route size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm">왼쪽에서 문제를 선택해보세요</p>
              <p className="text-xs text-slate-500 mt-1">코드가 어떻게 발전해왔는지 볼 수 있어요</p>
            </div>
          </div>
        )}
      </div>

      {/* ── 모바일 레이아웃 ── */}
      <div className="md:hidden flex-1 flex flex-col">
        {/* 모바일: 문제 목록 */}
        {mobileView === 'list' && (
          <div className="flex-1 bg-white overflow-auto">
            <ProblemListPanel onSelect={handleSelectProblem} />
          </div>
        )}

        {/* 모바일: 타임라인 */}
        {mobileView === 'timeline' && selectedProblem && (
          <div className="flex-1 bg-slate-50 overflow-auto">
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <button
                onClick={() => { setMobileView('list'); setSelectedProblem(null); }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <ArrowLeft size={18} />
              </button>
              <h3 className="font-semibold text-slate-700 text-sm truncate">{selectedProblem.title}</h3>
            </div>
            <div className="p-4">
              {snapshotLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-blue-500" />
                </div>
              ) : (
                <CodeTimeline
                  snapshots={snapshots}
                  onSelect={handleSelectSnapshot}
                  selectedId={selectedSnapshot?.id}
                />
              )}
            </div>
          </div>
        )}

        {/* 모바일: 코드 뷰 */}
        {mobileView === 'code' && selectedSnapshot && (
          <div className="flex-1 bg-slate-950 overflow-auto flex flex-col">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3 shrink-0">
              <button
                onClick={() => setMobileView('timeline')}
                className="p-1 text-slate-400 hover:text-slate-200"
              >
                <ArrowLeft size={18} />
              </button>
              <span className="text-xs text-slate-500">
                {new Date(selectedSnapshot.snapshot_at).toLocaleString('ko-KR')}
              </span>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm text-slate-200 font-mono leading-relaxed whitespace-pre-wrap">
                {selectedSnapshot.code}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, ChevronDown, Code2, Loader2, CheckCircle2, Circle, Trophy, Lock } from 'lucide-react';
import useProblemStore from '../../stores/problemStore.js';
import useAuthStore from '../../stores/authStore.js';
import CrestBadge from '../../components/CrestBadge.jsx';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, CATEGORY_LABELS } from 'shared/constants.js';

const CATEGORY_EMOJI = {
  output: '🖨️',
  logic: '🧩',
  loop: '🔄',
  string: '📝',
  list: '📋',
  function: '⚙️',
  algorithm: '🧠',
};

export default function ProblemList() {
  const navigate = useNavigate();
  const { problemSets, setsLoading, fetchProblemSets, fetchSetProgress, currentSetProgress, clearSetProgress } = useProblemStore();
  const { user } = useAuthStore();
  const [openSetId, setOpenSetId] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [allProgress, setAllProgress] = useState({});

  useEffect(() => {
    fetchProblemSets().then(async (sets) => {
      if (!user || !sets?.length) return;
      // 모든 문제집의 진행률을 미리 로드
      const progressMap = {};
      for (const s of sets) {
        try {
          const p = await useProblemStore.getState().fetchSetProgress(s.id);
          if (p) progressMap[s.id] = p;
        } catch { /* ignore */ }
      }
      setAllProgress(progressMap);
    });
  }, []);

  const handleSetClick = async (setId) => {
    if (openSetId === setId) {
      setOpenSetId(null);
      clearSetProgress();
      return;
    }

    setOpenSetId(setId);

    // 로그인한 사용자만 진행률 조회
    if (user) {
      setProgressLoading(true);
      await fetchSetProgress(setId);
      setProgressLoading(false);
    }
  };

  if (setsLoading && problemSets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="animate-spin text-blue-400" size={32} />
        <p className="text-sm text-slate-400">문제집을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-sm">
            <Code2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">문제집</h1>
            <p className="text-sm text-slate-400">문제집을 선택하고, 나만의 방법으로 정복해보세요</p>
          </div>
        </div>
      </div>

      {/* Crest Collection */}
      {problemSets.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200 px-6 py-5">
          <h3 className="text-sm font-bold text-slate-600 mb-4">나의 문장 컬렉션</h3>
          <div className="flex items-end gap-6 justify-center">
            {problemSets.map(pSet => {
              const prog = allProgress[pSet.id];
              return (
                <CrestBadge
                  key={pSet.id}
                  setId={pSet.id}
                  solved={prog?.solved ?? 0}
                  total={prog?.total ?? pSet.problem_count}
                  size="lg"
                />
              );
            })}
          </div>
        </div>
      )}

      {problemSets.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">아직 문제집이 없습니다</p>
          <p className="text-sm text-slate-400 mt-1">문제가 준비되면 여기에 나타납니다</p>
        </div>
      ) : (
        <div className="space-y-4">
          {problemSets.map((pSet, index) => {
            const isOpen = openSetId === pSet.id;
            const progress = isOpen && currentSetProgress?.id === pSet.id ? currentSetProgress : null;
            const cachedProg = allProgress[pSet.id];
            const solved = progress?.solved ?? cachedProg?.solved ?? 0;
            const total = progress?.total ?? cachedProg?.total ?? pSet.problem_count;
            const isCompleted = progress?.completed ?? cachedProg?.completed ?? false;
            const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

            return (
              <div
                key={pSet.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-fadeIn"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Set Header (클릭 가능) */}
                <button
                  onClick={() => handleSetClick(pSet.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50/80 transition-colors text-left"
                >
                  {/* Crest Badge */}
                  <CrestBadge
                    setId={pSet.id}
                    solved={solved}
                    total={total}
                    size="sm"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-[15px]">
                        {pSet.title}
                      </h3>
                      {isCompleted && (
                        <Trophy size={16} className="text-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5 truncate">
                      {pSet.description}
                    </p>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: isCompleted ? '#f59e0b' : pSet.color,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 shrink-0 w-16 text-right">
                        {progress ? `${solved}/${total}` : `${total}문제`}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown size={18} className="text-slate-400" />
                  </div>
                </button>

                {/* Expanded: Problem List */}
                {isOpen && (
                  <div className="border-t border-slate-100 animate-fadeIn">
                    {progressLoading ? (
                      <div className="flex items-center justify-center py-6 gap-2">
                        <Loader2 size={16} className="animate-spin text-blue-400" />
                        <span className="text-sm text-slate-400">불러오는 중...</span>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {(progress?.problems || pSet.problems || []).map((problem, pi) => {
                          const diffColor = DIFFICULTY_COLORS[problem.difficulty] || '#94a3b8';
                          const emoji = CATEGORY_EMOJI[problem.category] || '📌';
                          const isSolved = problem.solved;
                          const isLocked = problem.locked;

                          return (
                            <button
                              key={problem.id}
                              onClick={() => {
                                if (!isLocked) navigate(`/student/problems/${problem.id}`);
                              }}
                              disabled={isLocked}
                              className={`w-full flex items-center gap-3 px-5 py-3 text-left group transition-colors ${
                                isLocked
                                  ? 'opacity-50 cursor-not-allowed bg-slate-50/50'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              {/* Status indicator */}
                              {isLocked ? (
                                <Lock size={16} className="text-slate-400 shrink-0" />
                              ) : isSolved ? (
                                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                              ) : (
                                <Circle size={18} className="text-slate-300 shrink-0" />
                              )}

                              {/* Number */}
                              <span className="text-xs font-mono text-slate-400 w-5 text-center shrink-0">
                                {pi + 1}
                              </span>

                              {/* Category emoji */}
                              <span className={`text-sm shrink-0 ${isLocked ? 'grayscale' : ''}`}>{emoji}</span>

                              {/* Title */}
                              <span className={`flex-1 text-sm font-medium truncate ${
                                isLocked
                                  ? 'text-slate-400'
                                  : isSolved
                                    ? 'text-slate-500 line-through decoration-slate-300'
                                    : 'text-slate-700 group-hover:text-blue-600'
                              }`}>
                                {problem.title}
                                {isLocked && (
                                  <span className="ml-2 text-[10px] text-slate-400 font-normal">
                                    (이전 레벨 클리어 필요)
                                  </span>
                                )}
                              </span>

                              {/* Difficulty badge */}
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                                  isLocked ? 'bg-slate-300 text-white' : 'text-white'
                                }`}
                                style={isLocked ? {} : { backgroundColor: diffColor }}
                              >
                                Lv.{problem.difficulty}
                              </span>

                              {!isLocked && (
                                <ChevronRight
                                  size={14}
                                  className="text-slate-300 group-hover:text-blue-400 shrink-0"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Completion Banner */}
                    {isCompleted && (
                      <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex items-center gap-2">
                        <Trophy size={16} className="text-amber-500" />
                        <span className="text-sm font-semibold text-amber-700">
                          문제집 정복 완료!
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

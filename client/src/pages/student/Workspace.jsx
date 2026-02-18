import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, FlaskConical, RotateCcw, ArrowLeft, Lightbulb, ChevronDown, ChevronUp, Loader2, Upload, Bot, Terminal, FileCode, Sparkles, PanelLeftClose, PanelLeftOpen, PartyPopper, Send, X } from 'lucide-react';
import MarkdownRenderer from '../../components/MarkdownRenderer.jsx';
import toast from 'react-hot-toast';
import useProblemStore from '../../stores/problemStore.js';
import useEditorStore from '../../stores/editorStore.js';
import useAuthStore from '../../stores/authStore.js';
import CodeEditor from '../../components/CodeEditor.jsx';
import OutputPanel from '../../components/OutputPanel.jsx';
import AICoach from '../../components/AICoach.jsx';
import { apiFetch } from '../../api/client.js';
import { loadPyodideRuntime, isPyodideReady } from '../../lib/pyodide.js';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, CATEGORY_LABELS } from 'shared/constants.js';

export default function Workspace() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const { currentProblem, fetchProblem, loading: problemLoading } = useProblemStore();
  const { code, setCode, output, error, elapsed, isRunning, testResults, run, runTests, reset, pyodideReady, setPyodideReady } = useEditorStore();
  const { classroom } = useAuthStore();
  const [showHints, setShowHints] = useState(false);
  const [revealedHints, setRevealedHints] = useState(0);
  const [rightPanel, setRightPanel] = useState('output');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastSubmissionId, setLastSubmissionId] = useState(null);
  const [reflection, setReflection] = useState('');
  const [savingReflection, setSavingReflection] = useState(false);
  const snapshotTimerRef = useRef(null);
  const lastSnapshotRef = useRef('');

  // 문제 로드
  useEffect(() => {
    fetchProblem(problemId).then(problem => {
      if (problem) {
        reset(problem.starter_code || '');
        lastSnapshotRef.current = problem.starter_code || '';
      }
    });
  }, [problemId]);

  // Pyodide 프리로드
  useEffect(() => {
    if (!isPyodideReady()) {
      loadPyodideRuntime().then(() => setPyodideReady(true));
    } else {
      setPyodideReady(true);
    }
  }, []);

  // 코드 스냅샷 자동 저장 (30초 디바운스)
  const saveSnapshot = useCallback(async (codeToSave) => {
    if (!codeToSave.trim() || codeToSave === lastSnapshotRef.current) return;
    try {
      await apiFetch('/submissions/snapshot', {
        method: 'POST',
        body: JSON.stringify({
          problemId,
          classroomId: classroom?.id || '',
          code: codeToSave,
        }),
      });
      lastSnapshotRef.current = codeToSave;
    } catch {
      // 스냅샷 실패는 무시
    }
  }, [problemId, classroom?.id]);

  useEffect(() => {
    if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
    snapshotTimerRef.current = setTimeout(() => saveSnapshot(code), 30000);
    return () => { if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current); };
  }, [code, saveSnapshot]);

  // 키보드 단축키: Ctrl+Enter(실행), Ctrl+Shift+Enter(테스트)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRunTests();
        } else {
          handleRun();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleRun = async () => {
    if (!pyodideReady) {
      toast.error('파이썬 환경 로딩 중입니다. 잠시 기다려주세요.');
      return;
    }
    setRightPanel('output');
    const firstInput = currentProblem?.test_cases?.[0]?.input || '';
    await run(firstInput);
  };

  const handleRunTests = async () => {
    if (!pyodideReady) {
      toast.error('파이썬 환경 로딩 중입니다. 잠시 기다려주세요.');
      return;
    }
    if (!currentProblem?.test_cases?.length) {
      toast('테스트케이스가 없습니다');
      return;
    }
    setRightPanel('output');
    const results = await runTests(currentProblem.test_cases);
    if (results.allPassed) {
      toast.success('모든 테스트를 통과했습니다!');
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('코드를 작성해주세요.');
      return;
    }
    setSubmitting(true);
    try {
      let passed = false;
      let results = null;
      if (currentProblem?.test_cases?.length && pyodideReady) {
        results = await runTests(currentProblem.test_cases);
        passed = results.allPassed;
      }

      const result = await apiFetch('/submissions', {
        method: 'POST',
        body: JSON.stringify({
          problemId,
          classroomId: classroom?.id || '',
          code,
          output: output || '',
          passed,
          testResults: results?.results || [],
        }),
      });

      await saveSnapshot(code);

      if (passed) {
        setLastSubmissionId(result.id);
        setReflection('');
        setShowCelebration(true);
      } else {
        toast('풀이를 제출했습니다. (일부 테스트 미통과)', { icon: '📝' });
      }
      setRightPanel('output');
    } catch (err) {
      toast.error(err.message || '제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveReflection = async () => {
    if (!reflection.trim() || !lastSubmissionId) return;
    setSavingReflection(true);
    try {
      await apiFetch(`/submissions/${lastSubmissionId}/reflection`, {
        method: 'POST',
        body: JSON.stringify({ reflection: reflection.trim() }),
      });
      toast.success('소감이 저장되었습니다!');
      setShowCelebration(false);
    } catch {
      toast.error('소감 저장에 실패했습니다.');
    } finally {
      setSavingReflection(false);
    }
  };

  if (problemLoading || !currentProblem) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="animate-spin text-blue-500" size={36} />
        <p className="text-sm text-slate-400">문제를 불러오는 중...</p>
      </div>
    );
  }

  const difficultyColor = DIFFICULTY_COLORS[currentProblem.difficulty] || '#94a3b8';
  const hints = currentProblem.hints || [];
  const testCases = currentProblem.test_cases || [];

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* ── Compact Header ── */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/student/problems')}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>

        <div
          className="h-6 px-2 rounded flex items-center justify-center text-white text-[11px] font-bold shrink-0"
          style={{ backgroundColor: difficultyColor }}
        >
          Lv.{currentProblem.difficulty}
        </div>

        <h2 className="font-bold text-slate-100 truncate text-sm">
          {currentProblem.title}
        </h2>

        <span className="text-[11px] text-slate-500">
          {CATEGORY_LABELS[currentProblem.category] || currentProblem.category}
        </span>

        <div className="ml-auto">
          {!pyodideReady ? (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-800/50">
              <Loader2 size={11} className="animate-spin" />
              <span>Python 로딩...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-800/50">
              <Sparkles size={11} />
              <span>준비 완료</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Main: Left Description | Right Code+Output ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ▌Left Panel — Problem Description (접이식) */}
        <div
          className={`bg-white flex flex-col shrink-0 border-r border-slate-200 transition-all duration-300 ${
            leftCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-[380px]'
          }`}
        >
          {/* Description Header */}
          <div className="px-5 pt-4 pb-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <div
                className="h-7 px-2.5 rounded-md flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: difficultyColor }}
              >
                {DIFFICULTY_LABELS[currentProblem.difficulty]}
              </div>
              {testCases.length > 0 && (
                <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  테스트 {testCases.length}개
                </span>
              )}
              <button
                onClick={() => setLeftCollapsed(true)}
                className="ml-auto p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="패널 접기"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
          </div>

          {/* Scrollable Description */}
          <div className="flex-1 overflow-auto px-5 py-4">
            <MarkdownRenderer className="prose prose-sm max-w-none">
              {currentProblem.description}
            </MarkdownRenderer>

            {/* Hints Section */}
            {hints.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowHints(!showHints);
                    if (!showHints && revealedHints === 0) setRevealedHints(1);
                  }}
                  className="flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <Lightbulb size={15} />
                  <span>힌트 ({revealedHints}/{hints.length})</span>
                  {showHints ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showHints && (
                  <div className="mt-3 space-y-2.5 animate-fadeIn">
                    {hints.slice(0, revealedHints).map((hint, i) => (
                      <div key={i} className="flex gap-2.5 text-sm text-amber-800 bg-amber-50 p-3 rounded-lg">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-xs font-bold mt-0.5">
                          {i + 1}
                        </span>
                        <span>{hint}</span>
                      </div>
                    ))}
                    {revealedHints < hints.length && (
                      <button
                        onClick={() => setRevealedHints(prev => prev + 1)}
                        className="ml-7 text-xs text-amber-600 hover:text-amber-800 underline underline-offset-2"
                      >
                        다음 힌트 보기
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Left Panel Expand Button (접힌 상태에서만 표시) */}
        {leftCollapsed && (
          <button
            onClick={() => setLeftCollapsed(false)}
            className="shrink-0 w-8 bg-slate-800 border-r border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            title="문제 설명 펼치기"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}

        {/* ▌Right Panel — Code Editor + Output/AI */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Code Editor Area */}
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 flex flex-col">
              {/* Editor Tab Bar */}
              <div className="bg-slate-800 px-4 py-1.5 flex items-center gap-2 text-xs text-slate-400 shrink-0 border-b border-slate-700">
                <FileCode size={12} />
                <span>solution.py</span>
              </div>
              {/* Editor */}
              <div className="flex-1 overflow-hidden">
                <CodeEditor value={code} onChange={setCode} />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-slate-800 border-t border-slate-700 px-4 py-2 flex items-center gap-2 shrink-0">
            <button
              onClick={handleRun}
              disabled={isRunning || !pyodideReady}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 text-white rounded-md text-sm font-semibold hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-40 transition-all"
            >
              {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} fill="white" />}
              실행
            </button>
            <button
              onClick={handleRunTests}
              disabled={isRunning || !pyodideReady}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-500 text-white rounded-md text-sm font-semibold hover:bg-blue-600 active:bg-blue-700 disabled:opacity-40 transition-all"
            >
              <FlaskConical size={13} />
              테스트
            </button>
            <button
              onClick={handleSubmit}
              disabled={isRunning || submitting || !code.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-500 text-white rounded-md text-sm font-semibold hover:bg-violet-600 active:bg-violet-700 disabled:opacity-40 transition-all"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              제출
            </button>

            <div className="h-4 w-px bg-slate-600 mx-1" />

            <button
              onClick={() => reset(currentProblem.starter_code || '')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-md text-sm transition-all"
            >
              <RotateCcw size={13} />
              초기화
            </button>

            <span className="ml-auto text-[10px] text-slate-600 hidden md:block">
              ⌘Enter 실행 · ⌘⇧Enter 테스트
            </span>
          </div>

          {/* Bottom: Output / AI Coach */}
          <div className="h-[240px] border-t border-slate-700 flex flex-col bg-slate-950 shrink-0">
            {/* Tabs */}
            <div className="flex shrink-0">
              <button
                onClick={() => setRightPanel('output')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all border-b-2 ${
                  rightPanel === 'output'
                    ? 'text-emerald-400 border-emerald-400 bg-slate-900/50'
                    : 'text-slate-500 border-transparent hover:text-slate-400 hover:bg-slate-900/30'
                }`}
              >
                <Terminal size={13} />
                실행 결과
              </button>
              <button
                onClick={() => setRightPanel('ai')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-all border-b-2 ${
                  rightPanel === 'ai'
                    ? 'text-violet-400 border-violet-400 bg-slate-900/50'
                    : 'text-slate-500 border-transparent hover:text-slate-400 hover:bg-slate-900/30'
                }`}
              >
                <Bot size={13} />
                AI 코치
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {rightPanel === 'output' ? (
                <div className="h-full overflow-auto dark-scroll">
                  <OutputPanel
                    output={output}
                    error={error}
                    testResults={testResults}
                    isRunning={isRunning}
                    elapsed={elapsed}
                  />
                </div>
              ) : (
                <AICoach
                  problemId={problemId}
                  classroomId={classroom?.id}
                  code={code}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 축하 모달 + 소감 입력 */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-fadeIn">
            <button
              onClick={() => setShowCelebration(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">문제를 해결했습니다!</h3>
              <p className="text-sm text-slate-500">축하해요! 어떤 느낌이 들었는지 자유롭게 적어주세요!</p>
            </div>

            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="예: 처음엔 어려웠는데 힌트 보고 방법을 찾았어요!"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none h-24 text-sm"
              autoFocus
            />

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleSaveReflection}
                disabled={savingReflection || !reflection.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors text-sm"
              >
                {savingReflection ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                소감 남기기
              </button>
              <button
                onClick={() => setShowCelebration(false)}
                className="px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                건너뛰기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

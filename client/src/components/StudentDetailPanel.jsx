import { useState, useEffect, useCallback } from 'react';
import { X, Code2, MessageSquare, Star, Clock, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, XCircle, Loader2, Save } from 'lucide-react';
import useDashboardStore from '../stores/dashboardStore.js';

const CHEATING_KEYWORDS = ['답 알려', '정답 알려', '코드 줘', '답 줘', '정답 줘', '코드 알려',
  '전체 코드', '완성 코드', '복사', '답이 뭐', '정답이 뭐', '풀이 알려'];

const GRADE_OPTIONS = ['', 'A', 'B', 'C', 'D', 'F'];

export default function StudentDetailPanel({ classroomId, studentId, problemId, studentName, problemTitle, onClose, onFeedbackSaved }) {
  const { cellDetail, cellDetailLoading, fetchCellDetail, studentDetail, studentDetailLoading, fetchStudentDetail, saveFeedback, clearCellDetail, clearStudentDetail } = useDashboardStore();

  const [activeTab, setActiveTab] = useState('code');
  const [score, setScore] = useState('');
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [expandedSnapshot, setExpandedSnapshot] = useState(null);

  // 셀 모드(학생+문제) vs 학생 모드(전체 요약) 결정
  const isCellMode = !!problemId;

  useEffect(() => {
    if (isCellMode) {
      fetchCellDetail(classroomId, studentId, problemId);
    } else {
      fetchStudentDetail(classroomId, studentId);
    }
    return () => { clearCellDetail(); clearStudentDetail(); };
  }, [classroomId, studentId, problemId]);

  // 피드백 데이터 로드 시 폼 초기화
  useEffect(() => {
    if (cellDetail?.submission) {
      setScore(cellDetail.submission.teacher_score ?? '');
      setGrade(cellDetail.submission.teacher_grade ?? '');
      setFeedback(cellDetail.submission.teacher_feedback ?? '');
    }
  }, [cellDetail]);

  const handleSaveFeedback = useCallback(async () => {
    if (!cellDetail?.submission?.id) return;
    setSaving(true);
    setSaveResult(null);

    const scoreVal = score === '' ? null : Number(score);
    const ok = await saveFeedback(cellDetail.submission.id, {
      score: scoreVal,
      grade: grade || null,
      feedback: feedback || null,
    });

    setSaving(false);
    setSaveResult(ok ? 'success' : 'error');
    if (ok) {
      onFeedbackSaved?.();
      // 셀 데이터 새로고침
      fetchCellDetail(classroomId, studentId, problemId);
    }
    setTimeout(() => setSaveResult(null), 3000);
  }, [cellDetail, score, grade, feedback]);

  const loading = isCellMode ? cellDetailLoading : studentDetailLoading;

  // 치팅 키워드 하이라이팅
  const highlightCheating = (text) => {
    if (!text) return text;
    let result = text;
    for (const kw of CHEATING_KEYWORDS) {
      result = result.replaceAll(kw, `⚠️${kw}⚠️`);
    }
    return result;
  };

  const hasCheatingKeyword = (text) => {
    if (!text) return false;
    const lower = text.toLowerCase();
    return CHEATING_KEYWORDS.some(kw => lower.includes(kw));
  };

  // 탭 정의
  const tabs = isCellMode
    ? [
        { id: 'code', label: '코드', icon: Code2 },
        { id: 'ai', label: 'AI 대화', icon: MessageSquare },
        { id: 'feedback', label: '피드백/평가', icon: Star },
        { id: 'journey', label: '코드 여정', icon: Clock },
      ]
    : [
        { id: 'overview', label: '전체 요약', icon: Code2 },
        { id: 'feedback-list', label: '평가 현황', icon: Star },
      ];

  // 탭 초기화
  useEffect(() => {
    setActiveTab(isCellMode ? 'code' : 'overview');
  }, [isCellMode, studentId, problemId]);

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* 슬라이드 패널 */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[520px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 truncate">{studentName}</h3>
            {problemTitle && (
              <p className="text-sm text-slate-500 truncate">{problemTitle}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-slate-200 bg-white px-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="ml-2 text-slate-500">불러오는 중...</span>
            </div>
          ) : isCellMode ? (
            // === 셀 모드 (학생+문제) ===
            <>
              {activeTab === 'code' && <CodeTab data={cellDetail} />}
              {activeTab === 'ai' && <AIConversationTab data={cellDetail} hasCheatingKeyword={hasCheatingKeyword} />}
              {activeTab === 'feedback' && (
                <FeedbackTab
                  data={cellDetail}
                  score={score} setScore={setScore}
                  grade={grade} setGrade={setGrade}
                  feedback={feedback} setFeedback={setFeedback}
                  saving={saving} saveResult={saveResult}
                  onSave={handleSaveFeedback}
                />
              )}
              {activeTab === 'journey' && <JourneyTab data={cellDetail} expandedSnapshot={expandedSnapshot} setExpandedSnapshot={setExpandedSnapshot} />}
            </>
          ) : (
            // === 학생 모드 (전체 요약) ===
            <>
              {activeTab === 'overview' && <StudentOverviewTab data={studentDetail} />}
              {activeTab === 'feedback-list' && <FeedbackListTab data={studentDetail} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ===== 코드 보기 탭 =====
function CodeTab({ data }) {
  if (!data?.submission) {
    return <EmptyState message="아직 제출된 코드가 없습니다" />;
  }

  const { submission, allSubmissions } = data;
  const testResults = JSON.parse(submission.test_results_json || '[]');

  return (
    <div className="p-5 space-y-4">
      {/* 상태 요약 */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
          submission.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {submission.passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {submission.passed ? '통과' : '미통과'}
        </span>
        {submission.approach_tag && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {submission.approach_tag}
          </span>
        )}
        <span className="text-xs text-slate-400">
          제출 {allSubmissions?.length || 1}회 · {formatTime(submission.submitted_at)}
        </span>
      </div>

      {/* 코드 */}
      <div className="bg-slate-900 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-slate-800 text-slate-400 text-xs flex items-center justify-between">
          <span>제출 코드</span>
          <span>{submission.code?.length || 0}자</span>
        </div>
        <pre className="p-4 text-sm text-slate-100 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
          {submission.code}
        </pre>
      </div>

      {/* 테스트 결과 */}
      {testResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700">테스트 결과</h4>
          {testResults.map((t, i) => (
            <div key={i} className={`p-3 rounded-lg text-sm ${t.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2">
                {t.passed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                <span className="font-medium">{t.description || `테스트 ${i + 1}`}</span>
              </div>
              {!t.passed && t.output && (
                <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap">{t.output}</pre>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 학생 소감 */}
      {submission.reflection && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-1">학생 소감</h4>
          <p className="text-sm text-amber-900 whitespace-pre-wrap">{submission.reflection}</p>
        </div>
      )}

      {/* 기존 교사 피드백 표시 */}
      {submission.teacher_feedback && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-1">
            교사 피드백
            {submission.teacher_score != null && ` · ${submission.teacher_score}점`}
            {submission.teacher_grade && ` · ${submission.teacher_grade}`}
          </h4>
          <p className="text-sm text-blue-900 whitespace-pre-wrap">{submission.teacher_feedback}</p>
        </div>
      )}
    </div>
  );
}

// ===== AI 대화 원문 탭 =====
function AIConversationTab({ data, hasCheatingKeyword }) {
  if (!data?.aiConversation) {
    return <EmptyState message="AI 대화 기록이 없습니다" />;
  }

  const { messages, messageCount, summary } = data.aiConversation;

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <MessageSquare className="w-4 h-4" />
        총 {messageCount}회 대화
      </div>

      {/* 요약 */}
      {summary && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <h4 className="text-xs font-medium text-slate-500 mb-1">AI 요약</h4>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{summary}</p>
        </div>
      )}

      {/* 대화 원문 */}
      <div className="space-y-3">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          const isCheating = isUser && hasCheatingKeyword(msg.content);
          return (
            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                isCheating
                  ? 'bg-red-100 border-2 border-red-300 text-red-900'
                  : isUser
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-800'
              }`}>
                {isCheating && (
                  <div className="flex items-center gap-1 text-xs text-red-600 font-medium mb-1">
                    <AlertTriangle className="w-3 h-3" />
                    치팅 의심 키워드 감지
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                {msg.timestamp && (
                  <p className={`text-[10px] mt-1 ${isUser ? 'text-blue-200' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== 피드백/평가 탭 =====
function FeedbackTab({ data, score, setScore, grade, setGrade, feedback, setFeedback, saving, saveResult, onSave }) {
  if (!data?.submission) {
    return <EmptyState message="제출물이 없어 평가할 수 없습니다" />;
  }

  return (
    <div className="p-5 space-y-5">
      {/* 점수 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">점수</label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="100"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="미채점"
            className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <span className="text-sm text-slate-400">/ 100</span>
          {score !== '' && (
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  Number(score) >= 80 ? 'bg-green-500' : Number(score) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, Number(score)))}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 등급 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">등급</label>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">미채점</option>
          {GRADE_OPTIONS.filter(g => g).map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* 코멘트 */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">코멘트</label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="학생에게 전할 피드백을 입력하세요..."
          rows={5}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
        />
      </div>

      {/* 저장 버튼 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? '저장 중...' : '저장'}
        </button>
        {saveResult === 'success' && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> 저장 완료
          </span>
        )}
        {saveResult === 'error' && (
          <span className="text-sm text-red-600">저장 실패</span>
        )}
        {data.submission.feedback_at && (
          <span className="text-xs text-slate-400 ml-auto">
            마지막 저장: {formatTime(data.submission.feedback_at)}
          </span>
        )}
      </div>
    </div>
  );
}

// ===== 코드 여정 탭 =====
function JourneyTab({ data, expandedSnapshot, setExpandedSnapshot }) {
  const snapshots = data?.snapshots || [];
  const allSubs = data?.allSubmissions || [];

  if (snapshots.length === 0 && allSubs.length === 0) {
    return <EmptyState message="코드 변경 기록이 없습니다" />;
  }

  // 스냅샷 + 제출을 시간순으로 합치기
  const timeline = [
    ...snapshots.map(s => ({ ...s, type: 'snapshot', time: s.snapshot_at })),
    ...allSubs.map(s => ({ ...s, type: 'submission', time: s.submitted_at })),
  ].sort((a, b) => new Date(a.time) - new Date(b.time));

  return (
    <div className="p-5">
      <div className="relative">
        {/* 타임라인 라인 */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

        <div className="space-y-4">
          {timeline.map((item, i) => (
            <div key={i} className="relative pl-10">
              {/* 점 */}
              <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                item.type === 'submission'
                  ? item.passed ? 'bg-green-500 border-green-500' : 'bg-red-500 border-red-500'
                  : 'bg-slate-300 border-slate-300'
              }`} />

              <div
                className="bg-slate-50 rounded-lg p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => setExpandedSnapshot(expandedSnapshot === i ? null : i)}
              >
                <div className="flex items-center gap-2 text-sm">
                  {expandedSnapshot === i ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  <span className={`font-medium ${item.type === 'submission' ? 'text-blue-600' : 'text-slate-600'}`}>
                    {item.type === 'submission' ? (item.passed ? '제출 (통과)' : '제출 (미통과)') : '자동 저장'}
                  </span>
                  <span className="text-xs text-slate-400 ml-auto">{formatTime(item.time)}</span>
                </div>

                {expandedSnapshot === i && item.code && (
                  <pre className="mt-3 p-3 bg-slate-900 text-slate-100 rounded text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                    {item.code}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== 학생 전체 요약 탭 =====
function StudentOverviewTab({ data }) {
  if (!data) return <EmptyState message="데이터를 불러올 수 없습니다" />;

  const { student, submissions, stats } = data;

  return (
    <div className="p-5 space-y-5">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="통과 문제" value={stats.solvedCount} color="green" />
        <StatCard label="총 제출" value={stats.totalSubmissions} color="blue" />
        <StatCard label="AI 사용" value={stats.aiCalls} suffix="회" color="purple" />
        <StatCard label="평균 점수" value={stats.avgScore != null ? stats.avgScore.toFixed(1) : '-'} color="amber" />
      </div>

      {/* 문제별 현황 */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">문제별 현황</h4>
        <div className="space-y-2">
          {submissions.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">아직 제출한 문제가 없습니다</p>
          ) : (
            submissions.map(sub => (
              <div key={sub.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  sub.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  {sub.passed ? 'O' : 'X'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{sub.problem_title}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Lv.{sub.difficulty}</span>
                    {sub.approach_tag && <span className="text-blue-500">· {sub.approach_tag}</span>}
                    {sub.teacher_score != null && <span className="text-amber-600">· {sub.teacher_score}점</span>}
                  </div>
                </div>
                <span className="text-xs text-slate-400">{formatTime(sub.submitted_at)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ===== 평가 현황 탭 (학생 모드) =====
function FeedbackListTab({ data }) {
  if (!data) return <EmptyState message="데이터를 불러올 수 없습니다" />;

  const { submissions } = data;
  const graded = submissions.filter(s => s.teacher_score != null || s.teacher_grade || s.teacher_feedback);
  const ungraded = submissions.filter(s => s.teacher_score == null && !s.teacher_grade && !s.teacher_feedback);

  return (
    <div className="p-5 space-y-5">
      {/* 평가 완료 */}
      {graded.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-green-700 mb-2">평가 완료 ({graded.length})</h4>
          <div className="space-y-2">
            {graded.map(sub => (
              <div key={sub.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{sub.problem_title}</span>
                  <div className="flex items-center gap-2">
                    {sub.teacher_score != null && <span className="text-sm font-bold text-amber-600">{sub.teacher_score}점</span>}
                    {sub.teacher_grade && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">{sub.teacher_grade}</span>}
                  </div>
                </div>
                {sub.teacher_feedback && (
                  <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap">{sub.teacher_feedback}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 미채점 */}
      {ungraded.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-500 mb-2">미채점 ({ungraded.length})</h4>
          <div className="space-y-1.5">
            {ungraded.map(sub => (
              <div key={sub.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg text-sm text-slate-600">
                <span className={sub.passed ? 'text-green-500' : 'text-red-400'}>{sub.passed ? 'O' : 'X'}</span>
                <span className="truncate">{sub.problem_title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {graded.length === 0 && ungraded.length === 0 && (
        <EmptyState message="제출된 문제가 없습니다" />
      )}
    </div>
  );
}

// ===== 공통 컴포넌트 =====
function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Code2 className="w-10 h-10 mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function StatCard({ label, value, suffix = '', color }) {
  const colors = {
    green: 'bg-green-50 text-green-700 border-green-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className={`p-3 rounded-lg border ${colors[color] || colors.blue}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-xl font-bold">{value}{suffix}</p>
    </div>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

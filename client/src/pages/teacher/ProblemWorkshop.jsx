import { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import useAuthStore from '../../stores/authStore.js';
import {
  Sparkles, Eye, Check, RotateCcw, Trash2, Send,
  ChevronDown, ChevronUp, Loader2, Wrench, Library, X,
  FileText, BookOpen, Globe, Lock, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, CATEGORY_LABELS } from 'shared/constants.js';

export default function ProblemWorkshop() {
  const { user } = useAuthStore();
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState(3);
  const [difficulty, setDifficulty] = useState('');
  const [category, setCategory] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedProblems, setGeneratedProblems] = useState([]);
  const [library, setLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [previewProblem, setPreviewProblem] = useState(null);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [revising, setRevising] = useState(false);
  const [referenceProblem, setReferenceProblem] = useState('');
  const [showReference, setShowReference] = useState(false);
  const [includeExplanation, setIncludeExplanation] = useState(false);

  // 내 문제 라이브러리 불러오기
  const fetchLibrary = async () => {
    setLibraryLoading(true);
    try {
      const data = await apiFetch('/problems/library/all');
      setLibrary(data);
    } catch (err) {
      console.error('라이브러리 조회 실패:', err.message);
    } finally {
      setLibraryLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  // AI 문제 생성
  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setGeneratedProblems([]);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/problems/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          count,
          difficulty: difficulty ? Number(difficulty) : undefined,
          category: category || undefined,
          referenceProblem: referenceProblem.trim() || undefined,
          includeExplanation,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || '생성 실패');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'problem') {
              setGeneratedProblems((prev) => [...prev, parsed.data]);
            }
            if (parsed.type === 'error') {
              alert('생성 오류: ' + parsed.message);
            }
          } catch {
            // JSON 파싱 실패 무시
          }
        }
      }
      // 라이브러리 새로고침
      await fetchLibrary();
    } catch (err) {
      alert('문제 생성 실패: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // 문제 상태 변경
  const handleStatusChange = async (problemId, status) => {
    try {
      await apiFetch(`/problems/${problemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      // 생성 목록 업데이트
      setGeneratedProblems((prev) =>
        prev.map((p) => (p.id === problemId ? { ...p, status } : p))
      );
      await fetchLibrary();
    } catch (err) {
      alert('상태 변경 실패: ' + err.message);
    }
  };

  // 문제 삭제 (rejected 상태로 변경)
  const handleDelete = async (problemId) => {
    if (!confirm('이 문제를 삭제하시겠습니까?')) return;
    try {
      await apiFetch(`/problems/${problemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected' }),
      });
      setGeneratedProblems((prev) => prev.filter((p) => p.id !== problemId));
      await fetchLibrary();
    } catch (err) {
      alert('삭제 실패: ' + err.message);
    }
  };

  // 수정 요청
  const handleRevise = async () => {
    if (!feedbackText.trim() || !feedbackTarget) return;
    setRevising(true);
    try {
      const revised = await apiFetch(`/problems/${feedbackTarget}/revise`, {
        method: 'POST',
        body: JSON.stringify({ feedback: feedbackText.trim() }),
      });
      // 생성 목록 업데이트
      setGeneratedProblems((prev) =>
        prev.map((p) => (p.id === feedbackTarget ? { ...revised, id: feedbackTarget } : p))
      );
      setFeedbackTarget(null);
      setFeedbackText('');
      await fetchLibrary();
    } catch (err) {
      alert('수정 요청 실패: ' + err.message);
    } finally {
      setRevising(false);
    }
  };

  // 공개/비공개 토글
  const handleShareToggle = async (problemId, currentlyShared) => {
    try {
      await apiFetch(`/problems/${problemId}/share`, {
        method: 'PATCH',
        body: JSON.stringify({ is_shared: !currentlyShared }),
      });
      await fetchLibrary();
    } catch (err) {
      alert('공개 설정 변경 실패: ' + err.message);
    }
  };

  const navigate = useNavigate();

  const statusBadge = (status) => {
    const styles = {
      draft: 'bg-slate-100 text-slate-600',
      approved: 'bg-green-100 text-green-700',
      revision: 'bg-yellow-100 text-yellow-700',
      rejected: 'bg-red-100 text-red-700',
      review: 'bg-blue-100 text-blue-700',
    };
    const labels = {
      draft: '초안',
      approved: '승인됨',
      revision: '수정 필요',
      rejected: '거부됨',
      review: '검토 중',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Wrench size={24} />
        문제 공방
      </h1>

      {/* AI 문제 생성 영역 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-purple-500" />
          AI에게 문제 생성 요청
        </h2>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="어떤 문제를 만들고 싶으신가요? (예: '별 찍기 문제인데 재미있는 패턴으로', '리스트에서 최댓값을 찾는 다양한 방법을 탐구하는 문제')"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-28 text-sm"
        />

        {/* 참고 문제 입력 (접이식) */}
        <div className="mt-3">
          <button
            onClick={() => setShowReference(!showReference)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-purple-600 transition-colors"
          >
            <FileText size={14} />
            <span>참고 문제 붙여넣기</span>
            {showReference ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {referenceProblem.trim() && !showReference && (
              <span className="ml-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">입력됨</span>
            )}
          </button>
          {showReference && (
            <textarea
              value={referenceProblem}
              onChange={(e) => setReferenceProblem(e.target.value)}
              placeholder="기존 문제를 붙여넣으면 비슷한 스타일로 새 문제를 만들어줍니다. (예: 수능 기출 문제, 교과서 문제, 코딩 테스트 문제 등)"
              className="w-full mt-2 px-4 py-3 border border-purple-200 bg-purple-50/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none h-32 text-sm"
            />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4">
          {/* 문제 수 */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">문제 수:</label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}개</option>
              ))}
            </select>
          </div>

          {/* 난이도 */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">난이도:</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">자동</option>
              {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* 카테고리 */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">카테고리:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">자동</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* 해설 포함 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeExplanation}
              onChange={(e) => setIncludeExplanation(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-slate-600 flex items-center gap-1">
              <BookOpen size={14} />
              해설 포함
            </span>
          </label>

          {/* 생성 버튼 */}
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="ml-auto px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                생성하기
              </>
            )}
          </button>
        </div>
      </div>

      {/* 생성된 문제 카드 목록 */}
      {generatedProblems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            생성된 문제 ({generatedProblems.length}개)
          </h2>
          <div className="space-y-4">
            {generatedProblems.map((problem) => (
              <div
                key={problem.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-slate-800">{problem.title}</h3>
                      {statusBadge(problem.status)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: DIFFICULTY_COLORS[problem.difficulty] || '#6b7280' }}
                      >
                        {DIFFICULTY_LABELS[problem.difficulty] || `난이도 ${problem.difficulty}`}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs font-medium">
                        {CATEGORY_LABELS[problem.category] || problem.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 예상 접근법 */}
                {problem.expected_approaches?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {problem.expected_approaches.map((approach, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs"
                        title={approach.description}
                      >
                        {approach.tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 버튼들 */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setPreviewProblem(previewProblem?.id === problem.id ? null : problem)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Eye size={15} />
                    미리보기
                  </button>
                  <button
                    onClick={() => handleStatusChange(problem.id, 'approved')}
                    disabled={problem.status === 'approved'}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Check size={15} />
                    승인
                  </button>
                  <button
                    onClick={() => {
                      setFeedbackTarget(feedbackTarget === problem.id ? null : problem.id);
                      setFeedbackText('');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                  >
                    <RotateCcw size={15} />
                    수정요청
                  </button>
                  <button
                    onClick={() => handleDelete(problem.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                  >
                    <Trash2 size={15} />
                    삭제
                  </button>
                </div>

                {/* 피드백 입력 */}
                {feedbackTarget === problem.id && (
                  <div className="mt-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="어떻게 수정하면 좋을지 알려주세요 (예: '난이도를 좀 더 쉽게', '테스트케이스 추가')"
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none h-20 bg-white"
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={handleRevise}
                        disabled={revising || !feedbackText.trim()}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                      >
                        {revising ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                        수정 요청
                      </button>
                      <button
                        onClick={() => {
                          setFeedbackTarget(null);
                          setFeedbackText('');
                        }}
                        className="px-4 py-1.5 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {/* 미리보기 */}
                {previewProblem?.id === problem.id && (
                  <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="prose prose-sm max-w-none text-slate-700 mb-4">
                      <h4 className="text-sm font-semibold text-slate-600 mb-2">문제 설명</h4>
                      <div className="whitespace-pre-wrap text-sm">{problem.description}</div>
                    </div>

                    {problem.starter_code && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-slate-600 mb-2">시작 코드</h4>
                        <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-sm overflow-x-auto">
                          {problem.starter_code}
                        </pre>
                      </div>
                    )}

                    {problem.test_cases?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-slate-600 mb-2">테스트케이스</h4>
                        <div className="space-y-2">
                          {problem.test_cases.map((tc, i) => (
                            <div key={i} className="flex gap-4 text-sm bg-white p-2 rounded border border-slate-200">
                              <div><span className="text-slate-400">입력:</span> <code className="text-blue-600">{tc.input}</code></div>
                              <div><span className="text-slate-400">출력:</span> <code className="text-green-600">{tc.expected_output}</code></div>
                              {tc.description && <div className="text-slate-400">({tc.description})</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {problem.hints?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-slate-600 mb-2">힌트</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600">
                          {problem.hints.map((hint, i) => (
                            <li key={i}>{hint}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {problem.explanation && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-1">
                          <BookOpen size={14} />
                          해설
                        </h4>
                        <div className="whitespace-pre-wrap text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                          {problem.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 내 문제 라이브러리 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <Library size={20} />
            내 문제 라이브러리
            <span className="text-sm font-normal text-slate-400">({library.length}개)</span>
          </h2>
          <button
            onClick={() => navigate('/teacher/community')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <Users size={15} />
            문제 나눔터
          </button>
        </div>

        {libraryLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : library.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
            아직 만든 문제가 없습니다. AI에게 문제를 생성해보세요.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3">제목</th>
                  <th className="px-4 py-3">난이도</th>
                  <th className="px-4 py-3">카테고리</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">공개</th>
                  <th className="px-4 py-3">생성일</th>
                </tr>
              </thead>
              <tbody>
                {library.map((problem) => (
                  <tr key={problem.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">{problem.title}</span>
                      {problem.cloned_from && (
                        <span className="ml-2 text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                          {problem.cloned_from_author ? `${problem.cloned_from_author} 원본` : '복제됨'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: DIFFICULTY_COLORS[problem.difficulty] || '#6b7280' }}
                      >
                        {DIFFICULTY_LABELS[problem.difficulty] || `${problem.difficulty}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {CATEGORY_LABELS[problem.category] || problem.category}
                    </td>
                    <td className="px-4 py-3">{statusBadge(problem.status)}</td>
                    <td className="px-4 py-3">
                      {problem.status === 'approved' ? (
                        <button
                          onClick={() => handleShareToggle(problem.id, problem.is_shared)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            problem.is_shared
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                          title={problem.is_shared ? '클릭하면 비공개로 전환' : '클릭하면 공개로 전환'}
                        >
                          {problem.is_shared ? <Globe size={12} /> : <Lock size={12} />}
                          {problem.is_shared ? '공개' : '비공개'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(problem.created_at).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

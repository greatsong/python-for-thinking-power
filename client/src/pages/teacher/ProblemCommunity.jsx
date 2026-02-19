import { useState, useEffect } from 'react';
import { apiFetch } from '../../api/client.js';
import {
  Search, Filter, Copy, Eye, X, BookOpen, Loader2, Users, Star
} from 'lucide-react';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, CATEGORY_LABELS } from 'shared/constants.js';

export default function ProblemCommunity() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('recent');
  const [previewProblem, setPreviewProblem] = useState(null);
  const [cloning, setCloning] = useState(null);

  const fetchCommunity = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (difficulty) params.set('difficulty', difficulty);
      if (category) params.set('category', category);
      if (sort === 'stars') params.set('sort', 'stars');
      const qs = params.toString();
      const data = await apiFetch(`/problems/community${qs ? '?' + qs : ''}`);
      setProblems(data);
    } catch (err) {
      console.error('나눔터 조회 실패:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunity();
  }, [difficulty, category, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCommunity();
  };

  const handleClone = async (problemId) => {
    if (cloning) return;
    setCloning(problemId);
    try {
      await apiFetch(`/problems/${problemId}/clone`, { method: 'POST' });
      alert('내 라이브러리에 복제되었습니다!');
    } catch (err) {
      alert('복제 실패: ' + err.message);
    } finally {
      setCloning(null);
    }
  };

  const handleStar = async (problemId) => {
    try {
      const result = await apiFetch(`/problems/${problemId}/star`, { method: 'POST' });
      setProblems((prev) =>
        prev.map((p) =>
          p.id === problemId
            ? { ...p, starred: result.starred, star_count: p.star_count + (result.starred ? 1 : -1) }
            : p
        )
      );
    } catch (err) {
      console.error('추천 실패:', err.message);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
        <Users size={24} />
        문제 나눔터
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        다른 선생님들이 공유한 문제를 검색하고 내 라이브러리에 복제할 수 있습니다.
      </p>

      {/* 검색/필터 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="문제 제목이나 키워드로 검색..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 난이도</option>
            {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 카테고리</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          >
            <Filter size={15} />
            검색
          </button>
        </form>
      </div>

      {/* 정렬 */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setSort('recent')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            sort === 'recent'
              ? 'bg-slate-800 text-white'
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          최신순
        </button>
        <button
          onClick={() => setSort('stars')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
            sort === 'stars'
              ? 'bg-yellow-500 text-white'
              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Star size={14} />
          추천순
        </button>
      </div>

      {/* 문제 카드 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-blue-600" />
        </div>
      ) : problems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
          {search || difficulty || category
            ? '검색 조건에 맞는 공유 문제가 없습니다.'
            : '아직 공유된 문제가 없습니다. 문제 공방에서 내 문제를 공개해보세요!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((problem) => (
            <div
              key={problem.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col"
            >
              {/* 헤더 */}
              <div className="mb-3">
                <h3 className="text-base font-semibold text-slate-800 mb-1.5 line-clamp-1">
                  {problem.title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: DIFFICULTY_COLORS[problem.difficulty] || '#6b7280' }}
                  >
                    {DIFFICULTY_LABELS[problem.difficulty] || `Lv.${problem.difficulty}`}
                  </span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs font-medium text-slate-600">
                    {CATEGORY_LABELS[problem.category] || problem.category}
                  </span>
                </div>
              </div>

              {/* 접근법 태그 */}
              {problem.expected_approaches?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {problem.expected_approaches.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">
                      {a.tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 작성자 + 스타/복제 */}
              <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>{problem.author_name || '익명'} 선생님</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleStar(problem.id)}
                    className={`flex items-center gap-0.5 transition-colors ${
                      problem.starred ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-400'
                    }`}
                  >
                    <Star size={14} fill={problem.starred ? 'currentColor' : 'none'} />
                    {problem.star_count > 0 && <span>{problem.star_count}</span>}
                  </button>
                  {problem.clone_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Copy size={11} />
                      {problem.clone_count}
                    </span>
                  )}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setPreviewProblem(problem)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Eye size={15} />
                  미리보기
                </button>
                <button
                  onClick={() => handleClone(problem.id)}
                  disabled={cloning === problem.id}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {cloning === problem.id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Copy size={15} />
                  )}
                  복제하기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 미리보기 모달 */}
      {previewProblem && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPreviewProblem(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">{previewProblem.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: DIFFICULTY_COLORS[previewProblem.difficulty] || '#6b7280' }}
                  >
                    {DIFFICULTY_LABELS[previewProblem.difficulty]}
                  </span>
                  <span className="text-xs text-slate-400">{previewProblem.author_name} 선생님</span>
                </div>
              </div>
              <button onClick={() => setPreviewProblem(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* 문제 설명 */}
              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">문제 설명</h3>
                <div className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-4 rounded-lg">
                  {previewProblem.description}
                </div>
              </div>

              {/* 시작 코드 */}
              {previewProblem.starter_code && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 mb-2">시작 코드</h3>
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg text-sm overflow-x-auto">
                    {previewProblem.starter_code}
                  </pre>
                </div>
              )}

              {/* 테스트케이스 */}
              {previewProblem.test_cases?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 mb-2">테스트케이스</h3>
                  <div className="space-y-2">
                    {previewProblem.test_cases.map((tc, i) => (
                      <div key={i} className="flex gap-4 text-sm bg-slate-50 p-2 rounded border border-slate-200">
                        <div><span className="text-slate-400">입력:</span> <code className="text-blue-600">{tc.input}</code></div>
                        <div><span className="text-slate-400">출력:</span> <code className="text-green-600">{tc.expected_output}</code></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 접근법 */}
              {previewProblem.expected_approaches?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 mb-2">예상 접근법</h3>
                  <div className="space-y-2">
                    {previewProblem.expected_approaches.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium shrink-0">{a.tag}</span>
                        <span className="text-slate-600">{a.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 힌트 */}
              {previewProblem.hints?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 mb-2">힌트</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600">
                    {previewProblem.hints.map((hint, i) => (
                      <li key={i}>{hint}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* 해설 */}
              {previewProblem.explanation && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-1">
                    <BookOpen size={14} />
                    해설
                  </h3>
                  <div className="whitespace-pre-wrap text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    {previewProblem.explanation}
                  </div>
                </div>
              )}
            </div>

            {/* 하단 복제 버튼 */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setPreviewProblem(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  handleClone(previewProblem.id);
                  setPreviewProblem(null);
                }}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
              >
                <Copy size={15} />
                내 라이브러리에 복제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

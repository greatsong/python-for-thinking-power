import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../../api/client.js';
import useAuthStore from '../../stores/authStore.js';
import {
  GitBranch, School, Loader2, Code, User, CheckCircle, XCircle,
  Sparkles, RefreshCw
} from 'lucide-react';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, CATEGORY_LABELS } from 'shared/constants.js';

export default function ApproachAnalysis() {
  const { problemId } = useParams();
  const { user } = useAuthStore();
  const [problem, setProblem] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedSubmission, setExpandedSubmission] = useState(null);

  // 초기 데이터 불러오기
  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const [problemData, classroomsData] = await Promise.all([
          apiFetch(`/problems/${problemId}`),
          apiFetch('/classrooms/my'),
        ]);
        setProblem(problemData);
        setClassrooms(classroomsData);
        if (classroomsData.length > 0) {
          setSelectedClassroom(classroomsData[0].id);
        }
      } catch (err) {
        console.error('데이터 조회 실패:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [problemId]);

  // 교실 선택 시 제출 목록 불러오기
  useEffect(() => {
    if (!selectedClassroom || !problemId) return;
    const fetchSubmissions = async () => {
      setSubmissionsLoading(true);
      setAnalysis(null);
      try {
        const data = await apiFetch(
          `/submissions/problem/${problemId}?classroomId=${selectedClassroom}`
        );
        setSubmissions(data);
      } catch (err) {
        console.error('제출 목록 조회 실패:', err.message);
        setSubmissions([]);
      } finally {
        setSubmissionsLoading(false);
      }
    };
    fetchSubmissions();
  }, [selectedClassroom, problemId]);

  // AI 분석 요청
  const handleAnalyze = async () => {
    if (submissions.length < 2) {
      alert('분석하려면 2개 이상의 풀이가 필요합니다.');
      return;
    }
    setAnalyzing(true);
    try {
      const data = await apiFetch(`/gallery/${problemId}/analyze`, {
        method: 'POST',
        body: JSON.stringify({ classroomId: selectedClassroom }),
      });
      setAnalysis(data.analysis);
      if (data.message && !data.analysis) {
        alert(data.message);
      }
    } catch (err) {
      alert('분석 실패: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="p-6 text-center text-slate-500">
        문제를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* 문제 정보 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-2">
          <GitBranch size={24} />
          풀이 분석
        </h1>
        <div className="flex items-center gap-3">
          <h2 className="text-lg text-slate-700 font-medium">{problem.title}</h2>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: DIFFICULTY_COLORS[problem.difficulty] || '#6b7280' }}
          >
            {DIFFICULTY_LABELS[problem.difficulty] || `난이도 ${problem.difficulty}`}
          </span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-full text-xs font-medium text-slate-600">
            {CATEGORY_LABELS[problem.category] || problem.category}
          </span>
        </div>
      </div>

      {/* 교실 선택 + AI 분석 버튼 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <School size={20} className="text-slate-500" />
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="">교실 선택</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="text-sm text-slate-500">
              {submissions.length}개 풀이
            </span>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || submissions.length < 2}
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {analyzing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Sparkles size={16} />
            )}
            AI 분석 요청
          </button>
        </div>
      </div>

      {/* AI 분석 결과 */}
      {analysis && (
        <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-6 mb-6">
          <h3 className="text-base font-semibold text-purple-800 mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-purple-500" />
            AI 풀이 분석 결과
          </h3>
          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
            {analysis}
          </div>
        </div>
      )}

      {/* 제출 목록 */}
      {submissionsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center text-slate-400">
          <Code size={48} className="mx-auto mb-4 text-slate-300" />
          {selectedClassroom ? '아직 제출된 풀이가 없습니다.' : '교실을 선택해주세요.'}
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-700">
            학생 풀이 목록 ({submissions.length}개)
          </h3>

          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedSubmission(
                    expandedSubmission === submission.id ? null : submission.id
                  )
                }
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* 학생 정보 (실명 표시) */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                      {submission.student_name?.charAt(0) || <User size={12} />}
                    </div>
                    <span className="text-sm font-medium text-slate-800">
                      {submission.student_name || '알 수 없음'}
                    </span>
                  </div>

                  {/* 접근법 태그 */}
                  {submission.approach_tag && (
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                      {submission.approach_tag}
                    </span>
                  )}

                  {/* 통과 여부 */}
                  {submission.passed ? (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle size={14} />
                      통과
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-500">
                      <XCircle size={14} />
                      미통과
                    </span>
                  )}
                </div>

                <span className="text-xs text-slate-400">
                  {new Date(submission.submitted_at).toLocaleString('ko-KR')}
                </span>
              </button>

              {/* 코드 펼침 */}
              {expandedSubmission === submission.id && (
                <div className="border-t border-slate-200 px-5 py-4 bg-slate-50">
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                    {submission.code}
                  </pre>
                  {submission.output && (
                    <div className="mt-3">
                      <h4 className="text-xs font-semibold text-slate-500 mb-1">실행 결과</h4>
                      <pre className="bg-white border border-slate-200 p-3 rounded-lg text-sm text-slate-700 overflow-x-auto">
                        {submission.output}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

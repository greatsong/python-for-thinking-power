import { useState } from 'react';
import { Eye, Sparkles, Loader2 } from 'lucide-react';

export default function SolutionGallery({ submissions, analysis, onRequestAnalysis, analyzing }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!submissions?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Eye size={32} className="mb-3" />
        <p className="text-sm">아직 공개된 풀이가 없어요.</p>
        <p className="text-xs text-slate-500 mt-1">친구들이 풀이를 제출하면 여기서 볼 수 있어요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI 분석 */}
      {analysis ? (
        <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
          <div className="flex items-center gap-2 text-purple-700 font-medium text-sm mb-3">
            <Sparkles size={16} />
            AI 풀이 분석
          </div>
          <div className="prose prose-sm prose-purple max-w-none text-purple-900">
            <div dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>') }} />
          </div>
        </div>
      ) : submissions.length >= 2 && (
        <button
          onClick={onRequestAnalysis}
          disabled={analyzing}
          className="w-full py-3 rounded-xl border-2 border-dashed border-purple-300 text-purple-600 text-sm font-medium hover:bg-purple-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {analyzing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              AI가 풀이를 분석하는 중...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              AI에게 풀이 분석 요청하기
            </>
          )}
        </button>
      )}

      {/* 풀이 목록 */}
      <div className="grid gap-3">
        {submissions.map((sub, i) => (
          <div
            key={sub.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-sm transition-shadow"
          >
            <button
              onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-700">풀이 #{i + 1}</div>
                {sub.approach_tag && (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    {sub.approach_tag}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                {new Date(sub.submitted_at).toLocaleDateString('ko-KR')}
              </div>
            </button>

            {expandedId === sub.id && (
              <div className="px-4 pb-4">
                <pre className="bg-slate-950 text-slate-200 rounded-lg p-4 text-sm font-mono overflow-auto max-h-80 leading-relaxed">
                  {sub.code}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400 mt-4">
        총 {submissions.length}개의 풀이 | 모든 풀이는 익명으로 표시됩니다
      </p>
    </div>
  );
}

import { CheckCircle, XCircle, Clock, Terminal, Loader2 } from 'lucide-react';

export default function OutputPanel({ output, error, testResults, isRunning, elapsed }) {
  const hasOutput = output != null || error;
  const hasTests = testResults?.results?.length > 0;

  return (
    <div className="p-4 space-y-4 text-sm font-mono">
      {/* Running */}
      {isRunning && (
        <div className="flex items-center gap-2 text-blue-400 py-12 justify-center">
          <Loader2 size={16} className="animate-spin" />
          <span>실행 중...</span>
        </div>
      )}

      {/* Empty state */}
      {!isRunning && !hasOutput && !hasTests && (
        <div className="text-center py-16 text-slate-600">
          <Terminal size={28} className="mx-auto mb-3 text-slate-700" />
          <p className="text-xs">코드를 실행하면 결과가 여기에 나타납니다</p>
        </div>
      )}

      {/* Output */}
      {!isRunning && output != null && (
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span>출력</span>
            {elapsed != null && (
              <span className="ml-auto flex items-center gap-1 text-slate-600">
                <Clock size={10} />
                {elapsed}ms
              </span>
            )}
          </div>
          <pre className="bg-slate-900/80 rounded-lg p-3 text-emerald-300 whitespace-pre-wrap max-h-48 overflow-auto border border-slate-800">
            {output || '(출력 없음)'}
          </pre>
        </div>
      )}

      {/* Error */}
      {!isRunning && error && (
        <div>
          <div className="text-xs text-red-400 mb-2">에러</div>
          <pre className="bg-red-950/40 rounded-lg p-3 text-red-300 whitespace-pre-wrap max-h-48 overflow-auto border border-red-900/40">
            {error}
          </pre>
        </div>
      )}

      {/* Test Results */}
      {hasTests && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-slate-400">테스트 결과</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              testResults.allPassed
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-slate-700 text-slate-300'
            }`}>
              {testResults.passCount}/{testResults.totalCount} 통과
              {testResults.allPassed && ' ✓'}
            </span>
          </div>

          <div className="space-y-2">
            {testResults.results.map((r, i) => (
              <div
                key={i}
                className={`rounded-lg p-3 border ${
                  r.passed
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : 'bg-red-950/20 border-red-800/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  {r.passed ? (
                    <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle size={14} className="text-red-400 shrink-0" />
                  )}
                  <span className={`text-xs font-medium ${r.passed ? 'text-emerald-300' : 'text-red-300'}`}>
                    {r.description || `테스트 ${i + 1}`}
                  </span>
                </div>
                {!r.passed && (
                  <div className="mt-2 ml-6 text-xs space-y-1">
                    <div className="text-slate-400">
                      기대: <span className="text-white font-medium">{r.expected}</span>
                    </div>
                    <div className="text-slate-400">
                      실제: <span className="text-red-300 font-medium">{r.actual || r.error || '(에러)'}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

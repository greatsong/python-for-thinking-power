import { Clock, Code2 } from 'lucide-react';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

export default function CodeTimeline({ snapshots, onSelect, selectedId }) {
  if (!snapshots?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Clock size={32} className="mb-3" />
        <p className="text-sm">아직 코드 기록이 없어요.</p>
        <p className="text-xs text-slate-500 mt-1">문제를 풀면 자동으로 기록됩니다.</p>
      </div>
    );
  }

  // 날짜별 그룹핑
  const grouped = {};
  for (const snap of snapshots) {
    const dateKey = formatDate(snap.snapshot_at);
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(snap);
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <div className="text-xs font-medium text-slate-500 mb-2 px-1">{date}</div>
          <div className="relative pl-6">
            {/* 타임라인 줄 */}
            <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200" />

            {items.map((snap, i) => {
              const isSelected = selectedId === snap.id;
              const lines = snap.code.split('\n').length;
              return (
                <button
                  key={snap.id}
                  onClick={() => onSelect?.(snap)}
                  className={`relative w-full text-left mb-3 p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* 타임라인 점 */}
                  <div className={`absolute -left-[18px] top-4 w-2.5 h-2.5 rounded-full border-2 ${
                    isSelected ? 'bg-blue-500 border-blue-300' : 'bg-white border-slate-300'
                  }`} />

                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Clock size={11} />
                    <span>{formatTime(snap.snapshot_at)}</span>
                    <span className="text-slate-300">|</span>
                    <Code2 size={11} />
                    <span>{lines}줄</span>
                  </div>
                  <pre className="text-xs text-slate-700 font-mono truncate overflow-hidden whitespace-nowrap">
                    {snap.code.split('\n').slice(0, 2).join(' / ')}
                  </pre>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

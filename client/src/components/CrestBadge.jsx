/**
 * CrestBadge — 기사 가문 문장 스타일 뱃지
 *
 * 문제집 진행도에 따라 3단계로 변화:
 * - locked:   흐릿한 실루엣 (미시작)
 * - progress: 반투명 + 진행률 링 (진행 중)
 * - complete: 풀 컬러 + 금테 + 빛남 (정복 완료)
 */

// 문제집별 문장 데이터
const CRESTS = {
  'set-lv1-beginner': {
    title: '코드 새싹단',
    icon: '🌱',
    motto: '첫 줄의 코드가 세상을 바꾼다',
    shieldColor: '#22c55e',
    accentColor: '#bbf7d0',
  },
  'set-lv2-novice': {
    title: '논리 견습기사',
    icon: '🛡️',
    motto: '조건과 반복이 나의 무기',
    shieldColor: '#3b82f6',
    accentColor: '#bfdbfe',
  },
  'set-lv3-challenger': {
    title: '알고리즘 탐험가',
    icon: '⚔️',
    motto: '미지의 코드를 정복하라',
    shieldColor: '#eab308',
    accentColor: '#fde68a',
  },
  'set-lv4-solver': {
    title: '문제해결 마법사',
    icon: '🧙‍♂️',
    motto: '상상력이 곧 코드다',
    shieldColor: '#f97316',
    accentColor: '#fed7aa',
  },
  'set-lv5-master': {
    title: '코딩대마왕',
    icon: '👑',
    motto: '모든 알고리즘을 지배하는 자',
    shieldColor: '#ef4444',
    accentColor: '#fecaca',
  },
};

const DEFAULT_CREST = {
  title: '탐험가',
  icon: '🧭',
  motto: '코드로 길을 찾다',
  shieldColor: '#6366f1',
  accentColor: '#c7d2fe',
};

export default function CrestBadge({ setId, solved = 0, total = 0, size = 'md' }) {
  const crest = CRESTS[setId] || DEFAULT_CREST;
  const pct = total > 0 ? solved / total : 0;
  const isComplete = pct === 1 && total > 0;
  const isStarted = solved > 0;

  const sizes = {
    sm: { w: 56, h: 64, icon: 'text-lg', ring: 20 },
    md: { w: 80, h: 92, icon: 'text-2xl', ring: 30 },
    lg: { w: 120, h: 138, icon: 'text-4xl', ring: 44 },
  };
  const s = sizes[size] || sizes.md;

  // 진행률 링 계산
  const ringR = s.ring;
  const ringCircumference = 2 * Math.PI * ringR;
  const ringOffset = ringCircumference * (1 - pct);

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      {/* Shield SVG */}
      <div
        className={`relative transition-all duration-500 ${
          isComplete ? 'drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]' : ''
        }`}
        style={{ width: s.w, height: s.h }}
      >
        <svg
          viewBox="0 0 80 92"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Shield shape */}
          <path
            d="M40 4L8 18V46C8 64 22 80 40 88C58 80 72 64 72 46V18L40 4Z"
            fill={isStarted ? crest.shieldColor : '#cbd5e1'}
            stroke={isComplete ? '#f59e0b' : isStarted ? crest.shieldColor : '#94a3b8'}
            strokeWidth={isComplete ? 3 : 2}
            opacity={isStarted ? 1 : 0.3}
          />

          {/* Inner shield highlight */}
          <path
            d="M40 10L14 22V46C14 61 26 75 40 82C54 75 66 61 66 46V22L40 10Z"
            fill={isStarted ? crest.accentColor : '#e2e8f0'}
            opacity={isStarted ? 0.3 : 0.2}
          />

          {/* Gold border for complete */}
          {isComplete && (
            <path
              d="M40 4L8 18V46C8 64 22 80 40 88C58 80 72 64 72 46V18L40 4Z"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="3"
              className="animate-pulse"
            />
          )}

          {/* Progress ring (진행 중일 때) */}
          {isStarted && !isComplete && (
            <circle
              cx="40"
              cy="46"
              r={ringR}
              fill="none"
              stroke={crest.shieldColor}
              strokeWidth="3"
              strokeDasharray={ringCircumference}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              transform="rotate(-90 40 46)"
              opacity="0.6"
            />
          )}
        </svg>

        {/* Icon overlay */}
        <div className={`absolute inset-0 flex items-center justify-center ${
          isStarted ? '' : 'grayscale opacity-40'
        }`}>
          <span className={s.icon} style={{ marginTop: '-4px' }}>
            {crest.icon}
          </span>
        </div>

        {/* Complete star */}
        {isComplete && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-[10px] shadow-lg border-2 border-white animate-bounce">
            ⭐
          </div>
        )}
      </div>

      {/* Title + Motto (lg size only) */}
      {size === 'lg' && (
        <div className="text-center mt-1">
          <p className={`text-xs font-bold ${isStarted ? 'text-slate-700' : 'text-slate-400'}`}>
            {crest.title}
          </p>
          <p className={`text-[10px] italic ${isStarted ? 'text-slate-500' : 'text-slate-300'}`}>
            "{crest.motto}"
          </p>
          {isStarted && (
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
              {solved}/{total}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export { CRESTS };

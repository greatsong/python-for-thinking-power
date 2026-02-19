# python-for-thinking-power 로드맵

> 이 문서는 향후 세션에서 작업을 이어갈 수 있도록 정리한 구현 계획입니다.
> 최종 업데이트: 2026-02-19 (Phase 1 구현 완료)

---

## 현재 상태 요약

- **아키텍처**: React (Vite) + Express + SQLite (sql.js) 모노레포
- **배포**: Railway (Nixpacks)
- **AI**: Anthropic Claude API (`claude-sonnet-4-20250514`)
- **인증**: Google OAuth → JWT
- **데모 모드**: 30명 가상 학생, 3개 데모 문제 (seed.js로 생성)
- **API 키 현황**: 교사별 DB 저장 (AES-256-GCM 암호화) + `process.env.ANTHROPIC_API_KEY` 폴백
- **API 키 미설정 학교**: AI 코치 기능 비활성화 (문제 풀이 기능만 사용 가능)

---

## Phase 1: 교사별 API 키 관리 ✅ 구현 완료

### 구현 내역 (2026-02-19)

#### 1-1. DB 스키마 변경 ✅
- `users` 테이블에 `anthropic_api_key TEXT` 컬럼 추가 (`schema.sql` + `database.js` 마이그레이션)

#### 1-2. API 키 저장/조회/삭제/테스트 엔드포인트 ✅
- `GET /api/ai/status` — DB에서 교사별 키 조회 (복호화 후 마스킹)
- `POST /api/ai/config` — AES-256-GCM 암호화 후 DB 저장
- `DELETE /api/ai/config` — 키 삭제
- `POST /api/ai/test-key` — 실제 API 호출로 키 유효성 확인

#### 1-3. AI 코칭 시 교사 키 조회 ✅
- `classroomId → teacher_id → users.anthropic_api_key` 흐름
- API 키 없으면 403 + 안내 메시지 반환

#### 1-4. 서비스 계층 수정 ✅
- `aiCoach.js`: `streamChat()`에 `apiKey` 매개변수 추가
- `conversationSummarizer.js`: `generateConversationSummary()`에 `apiKey` 매개변수 추가

#### 1-5. 보안 (AES-256-GCM 암호화) ✅
- `server/services/crypto.js` 신규 — `encrypt()`, `decrypt()` 유틸리티
- `ENCRYPTION_KEY` 환경변수 설정 시 암호화 활성화 (미설정 시 평문 저장)
- 기존 평문 데이터 자동 호환 (마이그레이션 불필요)

#### 1-6. 교사/학생 UI ✅
- 교사: ClassroomSetup에 키 테스트/삭제 버튼 추가, 암호화 상태 표시
- 학생: API 키 미설정 시 "선생님이 아직 API 키를 설정하지 않았어요" 안내

#### 환경변수 추가
| 변수 | 필수 | 설명 |
|------|------|------|
| `ENCRYPTION_KEY` | 권장 | API 키 암호화용 시크릿 (32자 이상 권장) |

---

## Phase 2: AI 사용량 관리

### 2-1. 학생별 일일 AI 호출 제한
- `classroom_problems` 테이블에 `daily_ai_limit INTEGER DEFAULT 10` 컬럼 추가
- 또는 `classrooms` 테이블에 교실 단위로 설정
- 학생 요청 시 당일 호출 횟수 확인 후 제한

### 2-2. 사용량 대시보드 (교사용)
- 교실별 일일/주간/월간 AI 호출 횟수
- 학생별 사용량 상위 표시
- 예상 비용 표시 (호출당 약 $0.003~0.01 기준)

### 2-3. 학생에게 남은 횟수 표시
- AI 코칭 버튼 옆에 "오늘 남은 횟수: 7/10" 표시
- 소진 시 "내일 다시 사용할 수 있어요" 메시지

---

## Phase 3: 학교/교실 관리 강화

### 3-1. 학교(조직) 개념 도입
```sql
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- users 테이블에 추가
ALTER TABLE users ADD COLUMN school_id TEXT REFERENCES schools(id);
```

### 3-2. 교사 기능
- 학급별 문제 커스터마이징 (이미 `classroom_problems.ai_level`로 일부 구현)
- 학급 간 성취도 비교
- 학생 코드 여정 열람
- 문제별 풀이 통계 (접근법 분포, 평균 제출 횟수)

### 3-3. 학생 기능
- 같은 학급 갤러리 (통과한 풀이 공유, `gallery_enabled` 플래그 이미 존재)
- 코드 여정 타임라인 (스냅샷 기반, 이미 `code_snapshots` 테이블 존재)
- 학급 내 진도율 표시

---

## Phase 4: 확장성 (1000~2000명 규모)

### 현재 스택으로 충분한 이유
- SQLite는 읽기 위주에서 수만 건까지 문제 없음
- AI API 호출이 병목이지, DB가 병목 아님
- Railway 단일 서버로 동시 접속 200~300명 처리 가능

### 주의 사항
- AI API 동시 호출 제어: rate limiter 추가 (초당 10~20건)
- 정적 파일 CDN 분리 고려 (Cloudflare 등)
- SQLite → PostgreSQL 전환 시점: 쓰기 동시성 문제 발생 시

### 10만 명 이상 규모 (장기)
- Vercel (프론트) + Supabase/PostgreSQL (DB) + Edge Functions
- 또는 Next.js + PlanetScale 조합
- 현재 단계에서는 고려하지 않아도 됨

---

## 구현 난이도 및 예상 작업량

| Phase | 난이도 | 주요 변경 파일 |
|-------|--------|----------------|
| 1 (API 키 관리) | ~~낮음~~ ✅ 완료 | `schema.sql`, `ai.js`, `aiCoach.js`, `crypto.js`, `ClassroomSetup.jsx` |
| 2 (사용량 관리) | 낮음~중간 | `ai.js`, `schema.sql`, 학생/교사 UI |
| 3 (학교 관리) | 중간 | `schema.sql`, 새 라우트, 대시보드 UI |
| 4 (확장성) | 높음 | 아키텍처 전환 (필요 시에만) |

---

## 핵심 파일 맵

```
server/
├── db/
│   ├── schema.sql          ← DB 스키마 (users, classrooms 등)
│   ├── database.js         ← sql.js 래퍼 (queryOne, execute 등)
│   └── seed.js             ← 데모 데이터 생성 (30명 학생)
├── routes/
│   ├── ai.js               ← AI 코칭 API (/api/ai/chat, /config, /status)
│   ├── auth.js             ← 인증 (Google OAuth, JWT)
│   ├── classrooms.js       ← 교실 CRUD
│   ├── problems.js         ← 문제 CRUD
│   └── submissions.js      ← 제출 관리
├── services/
│   ├── aiCoach.js          ← Anthropic SDK 호출 (streamChat, buildSystemPrompt)
│   ├── conversationSummarizer.js ← 대화 요약
│   └── crypto.js            ← AES-256-GCM 암호화/복호화 (API 키 보호)
└── middleware/
    └── auth.js             ← requireAuth, requireTeacher 미들웨어

client/src/
├── pages/                  ← 주요 페이지 컴포넌트
├── components/             ← 공통 컴포넌트
└── contexts/               ← AuthContext 등
```

---

## 메모

- ~~`POST /api/ai/config`는 `process.env`에만 저장~~ → Phase 1에서 DB 저장으로 전환 완료 (AES-256 암호화)
- Railway 배포 시 `ENCRYPTION_KEY` 환경변수를 설정해야 암호화가 활성화됨
- `classroom_problems.gallery_enabled`와 `code_snapshots` 테이블은 이미 존재하지만 UI 미구현
- `teacher_applications` 테이블로 교사 신청 관리 중 (승인 시 `role`을 `teacher`로 변경)
- 데모 모드는 seed.js로 생성되며, 2026-02-19에 코드 정확성 전면 수정 완료

# 사고력을 위한 파이썬 — Claude Code 가이드

## 핵심 교육 철학: "하나의 문제, 다양한 사고의 경로"

이 프로젝트의 목표는 **파이썬 문법 암기가 아니라, 코드로 생각하는 힘을 기르는 것**입니다.
모든 작업(문제 출제, AI 코칭, 코드 분석, UI 설계)은 이 철학에 부합해야 합니다.

## 문제 출제 시 반드시 지킬 5대 원칙

### 1. 다경로성 — 아이디어 수준의 다른 접근법

모든 문제는 최소 2가지(Lv3+는 3가지) **근본적으로 다른 사고 방식**으로 풀 수 있어야 합니다.

**"다른 생각"이란 (O):**
- 완전 탐색 vs 수학 공식
- 정렬 후 처리 vs 딕셔너리 색인
- 재귀 vs 반복 DP
- 브루트포스 O(n²) vs 세트 활용 O(n)

**"다른 문법"일 뿐인 것 (X) — 이런 접근법 차이는 금지:**
- `for` vs `while` (반복문 선택)
- `f-string` vs 문자열 연결 (출력 형식)
- `변수 저장 후 출력` vs `직접 출력` (코딩 스타일)
- `.sort()` vs `sorted()` (API 선택)
- `슬라이싱 [::-1]` vs `reversed()` (같은 아이디어)

### 2. 코드 필요성 — 손으로 풀 수 없는 규모

입력 크기가 충분히 커서 코드 없이는 풀 수 없어야 합니다.
- Lv1: 최소 반복이 필요한 규모 (n=10+)
- Lv2: n = 100~1,000
- Lv3: n = 1,000~10,000 (성능 차이 체감)
- Lv4: n = 5,000~50,000
- Lv5: n = 10,000~100,000

**나쁜 예**: "두 수의 합을 출력하세요" (암산 가능)
**좋은 예**: "N개의 수에서 합이 target인 쌍을 찾으세요" (코드 필수)

### 3. 비교 가능성 — 접근법 간 차이가 보여야 함

접근법을 나란히 놓으면 "이 방법이 왜 더 나은지"가 보여야 합니다.
Lv3+ 문제의 테스트 케이스에는 **큰 입력**을 포함하여 성능 차이를 체감하게 합니다.

### 4. 적정 난이도 — 최소 하나의 접근법으로는 풀 수 있어야 함

해당 레벨 학생이 가장 직관적인 접근법(보통 완전 탐색)으로는 풀 수 있어야 합니다.

### 5. 토론 유발성 — "왜 그렇게 풀었어?"

갤러리에서 학생들이 서로의 코드를 비교하며 토론할 수 있는 문제가 좋습니다.

## 레벨별 접근법 기준

| 레벨 | 최소 접근법 수 | 성능 차이 | 입력 규모 | 코드 길이 |
|------|---------------|-----------|-----------|-----------|
| Lv.1 | 2가지 | 불필요 | 소규모 | 5~15줄 |
| Lv.2 | 2~3가지 | 가능하면 언급 | 100~1,000 | 10~25줄 |
| Lv.3 | 3가지+ | **체감 가능** | 1,000~10,000 | 15~40줄 |
| Lv.4 | 3가지+ | **명확한 시간복잡도 차이** | 5,000~50,000 | 20~60줄 |
| Lv.5 | 2가지+ | **극대화** | 10,000~100,000 | 30줄+ |

## 피해야 할 문제 유형

1. **답이 하나뿐인 문제** — `print("Hello")` 류
2. **문법만 다른 문제** — 변수 교환, 포맷팅 차이
3. **손으로 풀 수 있는 규모** — 입력 1~3개의 단순 계산
4. **지식 의존형** — 정규표현식, 특정 라이브러리 암기
5. **디버깅 문제** — 남의 코드 고치기
6. **출력 형식 의존** — 포맷팅 노가다

## 접근법 7대 유형 (문제 설계 시 참고)

1. **완전 탐색** — 모든 경우 확인 (직관적, 느림)
2. **패턴/규칙 발견** — 반복 규칙, 주기 활용
3. **수학적 사고** — 공식, 성질 활용
4. **분할 정복** — 재귀적 분해
5. **메모이제이션/DP** — 이전 결과 재활용
6. **자료구조 활용** — dict, set, stack, queue
7. **정렬 활용** — 정렬 후 단순화

## 문제 JSON 필수 체크리스트

```
[ ] expected_approaches: 최소 2개, 아이디어 수준의 차이
[ ] test_cases: 최소 3개 (기본, 엣지, 큰 입력)
[ ] hints: 3단계 (질문 → 방향 → 구체적 접근)
[ ] description: 예시 최소 2개, 새 개념은 설명 포함
[ ] explanation: 여러 접근법의 코드와 비교 포인트 포함
[ ] Lv3+: 테스트 케이스에 n≥1000 큰 입력 포함
[ ] 접근법 tag에 시간복잡도 포함 (Lv3+)
```

## 새 문제 추가 방법 (자동 통합)

### JSON 파일만 만들면 끝!

`server/data/problems/` 디렉토리에 JSON 파일을 넣으면 **서버 시작 시 자동으로**:
1. DB에 문제가 등록됨 (INSERT 또는 UPDATE)
2. `difficulty` 값에 따라 해당 레벨의 문제집(problem set)에 자동 배정됨
3. 데모 교실에도 자동 할당됨

**`seed.js`를 직접 수정할 필요 없습니다.** 자동 발견 로직이 처리합니다.

### 새 문제 JSON 파일 작성 규칙

```
파일명: lv{레벨}-{번호}-{영문이름}.json  (예: lv1-32-multCount.json)
위치:   server/data/problems/
```

**필수 필드:**
```json
{
  "id": "lv1-32-multCount",        // 파일명과 동일하게
  "title": "배수의 합",             // 한국어 제목
  "difficulty": 1,                  // 1~5 (문제집 자동 배정에 사용)
  "category": "logic",              // output|logic|loop|string|list|function|algorithm
  "description": "...",             // 마크다운, 예시 최소 2개
  "starter_code": "...",            // 입력 처리 포함
  "test_cases": [...],              // 최소 3개 (기본, 엣지, 큰 입력)
  "hints": [...],                   // 3단계 힌트
  "expected_approaches": [...],     // 최소 2개 (아이디어 차이!)
  "explanation": "..."              // 접근법별 풀이 + 비교 포인트
}
```

### 문제집 순서

- 기존 큐레이션 목록(`seed.js`의 `curatedIds`)에 있는 문제가 먼저 표시
- 자동 발견된 새 문제는 ID 알파벳순으로 뒤에 추가됨
- 특정 순서가 필요하면 `curatedIds` 배열에 직접 추가 가능 (선택사항)

### 주의사항

- `id` 필드와 파일명이 일치해야 합니다
- `difficulty`가 1~5 범위여야 문제집에 자동 배정됩니다
- 서버를 재시작해야 새 문제가 반영됩니다 (`node server/index.js`)

## 코딩 컨벤션

- UI 텍스트와 주석: 한국어
- 코드(변수명, 함수명): 영어
- 문제 설명: 친근한 반말 톤 + 이모지 적절히 사용
- 문제 ID 형식: `lv{레벨}-{번호}-{영문이름}` (예: `lv3-13-twoSum`)

## 기술 스택

- Frontend: React 19 + Vite 6 + Tailwind CSS 4 + Zustand
- Backend: Express 5 + SQLite (sql.js)
- AI: Claude Sonnet 4 (claude-sonnet-4-20250514)
- Python Runtime: Pyodide (WebAssembly, 브라우저 실행)
- Auth: Google OAuth 2.0 + JWT

## 배포

- 프론트엔드: Vercel → https://pythink.vercel.app
- 백엔드: Railway → https://pythink.up.railway.app
- GitHub: https://github.com/greatsong/python-for-thinking-power
- 로컬 포트: 프론트 `4000`, 백엔드 `4001`

## 프로젝트 구조 (모노레포, npm workspaces)

```
python-for-thinking-power/
├── client/                  # React 프론트엔드
│   └── src/
│       ├── pages/
│       │   ├── Landing.jsx          # 랜딩 페이지
│       │   ├── TeacherApply.jsx     # 교사 계정 신청
│       │   ├── JoinClassroom.jsx    # 학생 교실 참여
│       │   ├── student/
│       │   │   ├── ProblemList.jsx   # 문제 목록
│       │   │   ├── Workspace.jsx    # 코딩 환경 (에디터+실행+AI코치)
│       │   │   ├── Gallery.jsx      # 풀이 갤러리
│       │   │   └── MyJourney.jsx    # 코드 여정 타임라인
│       │   └── teacher/
│       │       ├── LiveDashboard.jsx    # 교실 라이브 모니터링 + 학생 피드백
│       │       ├── ProblemWorkshop.jsx  # AI 문제 생성 공방
│       │       ├── ProblemCommunity.jsx # 문제 나눔터 (공유/복제/추천)
│       │       ├── ProblemAssign.jsx    # 교실별 문제 배정
│       │       ├── AIReports.jsx       # AI 대화 리포트
│       │       ├── ApproachAnalysis.jsx # 접근법 분석 상세
│       │       ├── ClassroomSetup.jsx   # 교실 설정
│       │       └── AIGuide.jsx         # 사용 안내
│       ├── components/
│       │   └── StudentDetailPanel.jsx  # 학생 상세 슬라이드 패널
│       ├── layouts/
│       │   ├── TeacherLayout.jsx   # 교사 사이드바 레이아웃
│       │   └── StudentLayout.jsx   # 학생 레이아웃
│       └── stores/
│           ├── authStore.js        # 인증 상태 (Zustand)
│           └── dashboardStore.js   # 대시보드 상태 (Zustand)
├── server/                  # Express 백엔드
│   ├── routes/
│   │   ├── auth.js          # Google 로그인, JWT
│   │   ├── classrooms.js    # 교실 CRUD, 참여 코드
│   │   ├── problems.js      # 문제 CRUD, 나눔터, 스타, 복제
│   │   ├── submissions.js   # 풀이 제출, 스냅샷
│   │   ├── ai.js            # AI 코치 대화 (SSE)
│   │   ├── dashboard.js     # 교사 대시보드, 학생 상세, 피드백
│   │   └── gallery.js       # 풀이 갤러리, AI 분석
│   ├── services/
│   │   ├── problemGenerator.js   # AI 문제 생성 프롬프트
│   │   ├── aiCoach.js            # AI 코칭 프롬프트
│   │   └── approachAnalyzer.js   # 풀이 접근법 분석
│   ├── db/
│   │   ├── schema.sql       # DB 스키마 (12개 테이블)
│   │   ├── database.js      # sql.js 초기화, 마이그레이션, 헬퍼
│   │   └── seed.js          # 문제 시딩 (자동 발견 + 큐레이션)
│   └── data/
│       └── problems/        # 177개 문제 JSON 파일
└── shared/                  # 클라이언트/서버 공유 상수
    └── constants.js         # DIFFICULTY_LABELS, CATEGORY_LABELS 등
```

## DB 테이블 (12개)

| 테이블 | 설명 | 주요 컬럼 |
|--------|------|-----------|
| `users` | 사용자 | google_id, role(student/teacher), anthropic_api_key |
| `classrooms` | 교실 | teacher_id, join_code(5자리), daily_ai_limit |
| `classroom_members` | 교실-학생 연결 | classroom_id, user_id, student_number |
| `problems` | 문제 | difficulty(1-5), category, is_shared, cloned_from |
| `classroom_problems` | 교실-문제 배정 | ai_level(0-4), gallery_enabled |
| `submissions` | 풀이 제출 | code, passed, approach_tag, teacher_score/grade/feedback |
| `code_snapshots` | 코드 스냅샷 | 자동 저장, 코드 여정용 |
| `ai_conversations` | AI 대화 | messages_json, summary |
| `problem_sets` | 문제집 | 레벨별 그룹 (Lv.1~Lv.5) |
| `problem_set_items` | 문제집-문제 연결 | sort_order |
| `teacher_applications` | 교사 신청서 | school, region, motivation |
| `ai_usage_log` | AI 사용량 | 일일 제한 추적 |
| `problem_stars` | 문제 추천 | user_id + problem_id 복합키 |

## 주요 기능별 데이터 흐름

### 문제 나눔터 (교사 간 공유)
1. 교사가 문제 공방에서 문제 생성 → `approved` 상태
2. 라이브러리에서 "공개" 토글 → `PATCH /problems/:id/share` → `is_shared=1`
3. 다른 교사가 나눔터에서 검색 → `GET /problems/community`
4. 복제 → `POST /problems/:id/clone` → 새 문제 생성 (독립 사본, `cloned_from` 추적)
5. 추천(스타) → `POST /problems/:id/star` → 추천순 정렬 가능

### 교사 피드백/평가
1. 대시보드에서 학생 클릭 → `StudentDetailPanel` 슬라이드
2. `GET /dashboard/student/:id` → 학생의 전체 문제별 현황
3. 교사가 점수/등급/피드백 작성 → `POST /submissions/:id/feedback`
4. submissions 테이블에 teacher_score, teacher_grade, teacher_feedback 저장

### AI 코치 레벨 (교사 제어)
- Lv.0: AI 비활성
- Lv.1: 질문만 ("어떻게 생각하니?")
- Lv.2: 개념 힌트 (방향 제시)
- Lv.3: 수도코드 수준 안내
- Lv.4: 코드 예시 포함

## 주요 서비스 파일 (AI 프롬프트)

| 파일 | 역할 | 핵심 내용 |
|------|------|----------|
| `server/services/problemGenerator.js` | AI 문제 생성 | 5대 원칙, 7접근법 유형, 가짜 다양성 금지, 난이도별 기준 |
| `server/services/aiCoach.js` | AI 코칭 | 다경로 사고 유도, 4단계 도움 수준, 접근법 참고 |
| `server/services/approachAnalyzer.js` | 풀이 분석 | 아이디어 차이 중심 분류, 7접근법 유형 기반 |
| `server/db/seed.js` | 문제 시딩 | 자동 발견 + 큐레이션 목록 하이브리드 |

## 교사 워크플로우 기능 (대시보드)

### 매트릭스 셀 클릭 → 슬라이드 패널

교사 라이브 대시보드에서 학생×문제 매트릭스 셀을 클릭하면 오른쪽 슬라이드 패널이 열림.

**셀 모드 (학생+문제):** 4개 탭
- 코드 보기: 제출 코드 + 테스트 결과 + 접근법 태그
- AI 대화: messages_json 원문 (치팅 키워드 하이라이팅)
- 피드백/평가: 점수(0~100) + 등급(A~F) + 코멘트 저장
- 코드 여정: 스냅샷 타임라인

**학생 모드 (학생 전체):** 2개 탭
- 전체 요약: 모든 문제 제출 현황 + 통계
- 채점 현황: 평가 완료/미완료 목록

### 데이터 내보내기

매트릭스 상단 "내보내기" 드롭다운:
- 성적표 CSV: 학생×문제 점수/등급 매트릭스
- 진행 요약 CSV: 학생별 제출수/통과율/AI사용횟수
- 한글 엑셀 호환 (UTF-8 BOM)

### 관련 파일

| 파일 | 역할 |
|------|------|
| `client/src/components/StudentDetailPanel.jsx` | 슬라이드 패널 (4탭 셀모드 + 2탭 학생모드) |
| `client/src/pages/teacher/LiveDashboard.jsx` | 매트릭스 셀 클릭 + 내보내기 + 통과율 행 |
| `client/src/stores/dashboardStore.js` | fetchCellDetail, fetchStudentDetail, saveFeedback |
| `server/routes/dashboard.js` | cell-detail, student-detail, feedback, export API |

## 상세 문서

- 출제 가이드라인: `PROBLEM_DESIGN.md`
- 로드맵: `ROADMAP.md`
- 문제 파일: `server/data/problems/*.json`

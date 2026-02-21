# 사고력을 위한 파이썬 (Python for Thinking Power)

> 파이썬 문법 암기가 아닌, **코드로 생각하는 힘**을 기르는 교육 플랫폼

**핵심 철학: "하나의 문제, 다양한 사고의 경로"** — 정답이 아니라 과정에 집중합니다.

```
[문제] 1부터 100까지 홀수의 합을 구하세요

학생A: for + if문        → 2500 ✓
학생B: range(1,101,2)    → 2500 ✓
학생C: 수학공식 50*50    → 2500 ✓
학생D: while + 누적      → 2500 ✓

→ 4명 다 정답! 하지만 생각의 경로가 다르다.
→ 이 비교 과정에서 사고력이 자란다.
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 19, Vite 6, Tailwind CSS 4, Zustand, React Router 7 |
| 코드 에디터 | CodeMirror 6 (Python 지원) |
| Python 실행 | Pyodide (WebAssembly, 브라우저에서 즉시 실행) |
| 백엔드 | Express 5, SSE 스트리밍 |
| AI | Claude API (`claude-sonnet-4-20250514`) |
| 데이터베이스 | SQLite (sql.js, WASM 기반) |
| 인증 | Google Sign-In + JWT |

---

## 주요 기능

- **코드 워크스페이스**: CodeMirror 에디터 + Pyodide 즉시 실행 (서버 부하 없음)
- **5단계 AI 코치**: 교사가 문제별로 AI 도움 수준을 제어 (0:비활성 ~ 4:코드예시)
- **AI 문제 공방**: AI가 문제를 생성하고 교사가 검토/승인/수정
- **문제 나눔터**: 교사 간 문제 공유/검색/복제/추천 커뮤니티
- **풀이 갤러리**: AI가 학생 풀이의 접근법을 자동 분류, 비교 토론 유도
- **코드 여정**: 코드 수정 이력을 타임라인으로 시각화
- **교실 라이브 대시보드**: 학생×문제 매트릭스, 셀 클릭 슬라이드 패널, 문제별 통과율
- **교사 피드백/평가**: 점수(0~100) + 등급(A~F) + 코멘트, AI 대화 원문 열람
- **데이터 내보내기**: 성적표/진행 요약 CSV (한글 엑셀 호환)
- **교실 시스템**: 5자리 참여 코드로 학생 합류

---

## 로컬 실행 (개발 모드)

### 1. 사전 요구사항

- **Node.js** 18 이상
- **npm** 9 이상
- **Google Cloud Console**에서 OAuth 2.0 클라이언트 ID 발급

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열고 실제 값으로 수정:

```env
ANTHROPIC_API_KEY=sk-ant-your-actual-key
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
JWT_SECRET=your-random-secret-key-here
PORT=4001
CLIENT_URL=http://localhost:4000
```

| 변수 | 설명 | 필수 |
|------|------|------|
| `ANTHROPIC_API_KEY` | 기본 AI API 키 (교사 미설정 시 폴백) | - |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID | O |
| `JWT_SECRET` | JWT 토큰 서명 비밀 키 (랜덤 문자열) | O |
| `ENCRYPTION_KEY` | API 키 AES-256 암호화용 시크릿 (32자 이상 권장) | 권장 |
| `PORT` | 백엔드 서버 포트 (기본 4001) | - |
| `CLIENT_URL` | 프론트엔드 URL, CORS 허용 (기본 http://localhost:4000) | - |

### 3. 설치 및 실행

```bash
# 의존성 설치 (client + server + shared 모두 설치됨)
npm install

# 초기 문제 데이터 시딩
npm run seed

# 개발 서버 실행 (프론트엔드 + 백엔드 동시 실행)
npm run dev
```

실행 후:
- 프론트엔드: http://localhost:4000
- 백엔드 API: http://localhost:4001
- 헬스체크: http://localhost:4001/api/health

### 4. 프로덕션 빌드 (로컬 테스트)

```bash
# 빌드 + 시딩 + 프로덕션 서버 실행 (한 번에)
npm run start:local
```

`NODE_ENV=production`으로 Express가 `client/dist/`를 정적 서빙합니다.
http://localhost:4001 에서 전체 앱을 확인할 수 있습니다.

---

## 교사용: AI 코치 API 키 설정 가이드

### 왜 API 키가 필요한가요?

AI 코치 기능은 Anthropic Claude API를 사용합니다. 각 학교/교사가 자체 API 키를 등록하면:
- **비용 분리**: 각 학교가 자체 API 사용량을 관리
- **독립 운영**: 다른 학교의 사용량에 영향받지 않음
- **보안**: 키가 AES-256-GCM으로 암호화되어 안전하게 저장

### 1단계: Anthropic API 키 발급

1. [console.anthropic.com](https://console.anthropic.com) 접속
2. 회원가입 또는 로그인
3. 좌측 메뉴에서 **API Keys** 클릭
4. **Create Key** 버튼 클릭
5. 키 이름 입력 (예: "우리학교 AI 코치")
6. `sk-ant-api03-...` 형태의 키를 **즉시 복사** (한 번만 표시됩니다!)

> 요금 안내: Claude Sonnet 기준 학생 1명의 AI 코칭 대화 1회당 약 $0.003~0.01 (약 4~14원)

### 2단계: 플랫폼에 API 키 등록

1. **교사 계정으로 로그인** (Google 로그인 또는 데모 체험)
2. 좌측 사이드바 > **교실 설정** 클릭
3. 상단 **AI 코치 설정** 섹션에서 **설정하기** 클릭
4. 복사해둔 API 키 붙여넣기 후 **저장** 버튼 클릭
5. "API 키 설정됨" 초록색 표시 확인
6. **키 테스트** 버튼을 눌러 정상 작동 확인

### 3단계: 학생들에게 안내

API 키가 설정되면, 해당 교사의 교실에 참여한 학생들은 자동으로 AI 코치를 사용할 수 있습니다.

### API 키 미설정 시

- API 키를 등록하지 않은 교실의 학생은 **AI 코치 기능을 사용할 수 없습니다**
- 문제 풀이, 코드 실행, 제출 등 다른 기능은 **정상 작동**합니다
- 학생에게는 "선생님이 아직 API 키를 설정하지 않았어요" 안내가 표시됩니다

### 보안 안내

- API 키는 **AES-256-GCM 암호화**되어 서버 DB에 저장됩니다
- 교사 본인만 키를 설정/삭제할 수 있습니다
- 키는 해당 교사의 교실에 속한 학생의 AI 코칭에만 사용됩니다
- 교실 설정에서 언제든 **키 삭제** 가능합니다

---

## 배포 가이드

프론트엔드는 **Vercel**, 백엔드는 **Railway**에 배포합니다.

### Step 1: GitHub 리포지토리 준비

```bash
# 리포지토리 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Initial commit"

# GitHub에 리포지토리 생성 후
git remote add origin https://github.com/greatsong/python-for-thinking-power.git
git push -u origin main
```

### Step 2: Railway 백엔드 배포

1. [Railway](https://railway.app)에 로그인
2. **New Project** → **Deploy from GitHub repo** 선택
3. `greatsong/python-for-thinking-power` 리포지토리 연결
4. **Settings** 탭에서:
   - **Root Directory**: `/` (루트)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. **Variables** 탭에서 환경 변수 설정:

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   JWT_SECRET=your-production-secret
   PORT=4001
   NODE_ENV=production
   CLIENT_URL=https://your-vercel-url.vercel.app
   ```

6. 배포가 완료되면 Railway가 생성한 URL을 복사 (예: `https://python-for-thinking-power-production.up.railway.app`)
7. 헬스체크 확인:

   ```bash
   curl https://your-railway-url.up.railway.app/api/health
   ```

   응답 예시:
   ```json
   {"status":"ok","service":"사고력을 위한 파이썬","timestamp":"2026-02-17T..."}
   ```

> **중요**: Railway URL이 확정된 후 `CLIENT_URL` 환경변수를 Vercel 배포 URL로 업데이트해야 합니다.

### Step 3: Vercel 프론트엔드 배포

1. [Vercel](https://vercel.com)에 로그인
2. **Add New** → **Project** → GitHub 리포지토리 연결
3. **Framework Preset**: `Vite` 선택
4. **Root Directory**: `client` 입력
5. **Build & Output Settings**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. 배포 실행

#### Vercel API 프록시 설정

`client/vercel.json`을 Railway URL로 업데이트:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://your-railway-url.up.railway.app/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

> `your-railway-url`을 Step 2에서 받은 실제 Railway URL로 교체하세요.

변경 후 커밋 & 푸시하면 Vercel이 자동 재배포됩니다.

### Step 4: Google OAuth 설정 업데이트

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 클라이언트에서:

- **승인된 JavaScript 원본**에 추가:
  - `https://your-vercel-url.vercel.app`
- **승인된 리디렉션 URI**에 추가:
  - `https://your-vercel-url.vercel.app`

### Step 5: CORS 설정 확인

Railway의 환경 변수 `CLIENT_URL`을 Vercel 배포 URL로 설정했는지 확인:

```
CLIENT_URL=https://your-vercel-url.vercel.app
```

### Step 6: 최종 확인 체크리스트

- [ ] Railway 헬스체크 응답 확인 (`/api/health`)
- [ ] Vercel에서 프론트엔드 로딩 확인
- [ ] Google 로그인 동작 확인
- [ ] API 호출 확인 (문제 목록 로드)
- [ ] AI 코치 대화 동작 확인

---

## 배포 후 문제 해결

### API 호출이 안 될 때

`client/vercel.json`의 Railway URL이 정확한지 확인:

```bash
# Railway URL 직접 테스트
curl https://your-railway-url.up.railway.app/api/problems
```

### CORS 에러가 날 때

Railway 환경 변수 `CLIENT_URL`이 Vercel URL과 정확히 일치하는지 확인 (끝에 `/` 없이):

```
# 올바른 예
CLIENT_URL=https://python-for-thinking-power.vercel.app

# 잘못된 예
CLIENT_URL=https://python-for-thinking-power.vercel.app/
```

### Google 로그인이 안 될 때

1. Google Cloud Console에서 승인된 원본에 배포 URL이 추가되었는지 확인
2. `GOOGLE_CLIENT_ID`가 Railway 환경변수에 설정되었는지 확인
3. 프론트엔드의 Google 클라이언트 ID가 올바른지 확인

### DB 데이터 초기화

Railway 배포 후 초기 문제 데이터가 없으면:

```bash
# Railway CLI로 시드 실행
railway run npm run seed
```

또는 Railway 대시보드에서 **Run Command** → `npm run seed`

---

## 프로젝트 구조

```
python-for-thinking-power/
├── package.json              # npm workspaces (client, server, shared)
├── .env.example              # 환경 변수 템플릿
├── railway.json              # Railway 배포 설정
│
├── client/                   # React 프론트엔드
│   ├── vercel.json           # Vercel 배포 설정
│   ├── vite.config.js        # Vite 설정 (port 4000, proxy)
│   └── src/
│       ├── pages/
│       │   ├── student/      # 학생 페이지 (문제목록, 워크스페이스, 갤러리, 코드여정)
│       │   └── teacher/      # 교사 페이지 (교실설정, 문제공방, 대시보드, AI리포트)
│       ├── components/       # 공용 컴포넌트 (CodeEditor, AICoach, StudentDetailPanel 등)
│       ├── stores/           # Zustand 상태 (auth, classroom, problem, editor, chat, dashboard)
│       └── lib/              # Pyodide 엔진, 테스트 러너
│
├── server/                   # Express 백엔드
│   ├── routes/               # API 라우트 (auth, classrooms, problems, submissions, ai, dashboard, gallery)
│   ├── services/             # AI 서비스 (코치, 문제생성, 대화요약, 접근법분석)
│   ├── db/                   # SQLite 스키마, 초기화, 시드
│   └── data/problems/        # 초기 문제 JSON
│
└── shared/                   # 공용 상수 (AI 레벨, 난이도, 카테고리)
```

---

## npm 스크립트 요약

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 모드 실행 (client:4000 + server:4001 동시) |
| `npm run dev:client` | 프론트엔드만 실행 |
| `npm run dev:server` | 백엔드만 실행 |
| `npm run build` | 프론트엔드 프로덕션 빌드 |
| `npm run seed` | 초기 문제 데이터 시딩 |
| `npm start` | 프로덕션 서버 실행 |
| `npm run start:local` | 빌드 + 시딩 + 프로덕션 실행 (한 번에) |

---

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/health` | 서버 상태 확인 |
| POST | `/api/auth/google` | Google 로그인 검증 |
| GET/POST | `/api/classrooms` | 교실 관리 |
| POST | `/api/classrooms/:id/join` | 교실 참여 |
| GET | `/api/problems` | 문제 목록 |
| GET | `/api/problems/:id` | 문제 상세 |
| GET | `/api/problems/library/all` | 교사 문제 라이브러리 |
| POST | `/api/problems/generate` | AI 문제 생성 (SSE) |
| POST | `/api/problems/:id/revise` | AI 문제 수정 |
| PATCH | `/api/problems/:id/status` | 문제 상태 변경 |
| POST | `/api/problems/:id/assign` | 교실에 문제 배정 |
| POST | `/api/submissions` | 풀이 제출 |
| GET | `/api/submissions/snapshots` | 코드 스냅샷 |
| POST | `/api/ai/chat` | AI 코치 대화 (SSE) |
| GET | `/api/ai/conversations` | AI 대화 이력 |
| GET | `/api/problems/community` | 공유 문제 나눔터 (검색/필터) |
| POST | `/api/problems/:id/clone` | 공유 문제 복제 |
| POST | `/api/problems/:id/star` | 문제 추천(스타) 토글 |
| GET | `/api/dashboard/overview/:classroomId` | 교사 대시보드 개요 |
| GET | `/api/dashboard/students/:classroomId` | 학생 현황 |
| GET | `/api/dashboard/ai-summaries/:classroomId` | AI 대화 요약 |
| GET | `/api/dashboard/matrix/:classroomId` | 학생×문제 매트릭스 (평가 상태 포함) |
| GET | `/api/dashboard/cell-detail/:classroomId/:studentId/:problemId` | 셀 상세 (코드, AI대화, 스냅샷) |
| GET | `/api/dashboard/student-detail/:classroomId/:studentId` | 학생 전체 요약 |
| PUT | `/api/dashboard/feedback/:submissionId` | 교사 피드백/점수/등급 저장 |
| GET | `/api/dashboard/export/:classroomId?type=grades\|progress` | CSV 내보내기 |
| GET | `/api/gallery/:problemId` | 풀이 갤러리 |
| POST | `/api/gallery/:problemId/analyze` | AI 접근법 분석 |

---

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

---

*Built with Claude Code*

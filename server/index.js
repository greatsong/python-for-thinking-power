import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { initDatabase, queryOne } from './db/database.js';
import { seed, seedProblemSets } from './db/seed.js';
import problemsRouter from './routes/problems.js';
import authRouter from './routes/auth.js';
import classroomsRouter from './routes/classrooms.js';
import submissionsRouter from './routes/submissions.js';
import aiRouter from './routes/ai.js';
import dashboardRouter from './routes/dashboard.js';
import galleryRouter from './routes/gallery.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 4001;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4000',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: '사고력을 위한 파이썬',
    timestamp: new Date().toISOString(),
  });
});

// API 라우트
app.use('/api/problems', problemsRouter);
app.use('/api/auth', authRouter);
app.use('/api/classrooms', classroomsRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/gallery', galleryRouter);

// 프로덕션: 클라이언트 정적 파일 서빙
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
if (isProduction) {
  app.use(express.static(clientDist));
}

app.use(errorHandler);

// SPA 폴백 (errorHandler 이후, API 404와 구분)
if (isProduction) {
  app.use((req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 서버 먼저 시작 (Railway 헬스체크가 즉시 응답하도록)
app.listen(PORT, () => {
  console.log(`[PyThink] 서버 실행 중: http://localhost:${PORT}`);
  if (isProduction) {
    console.log(`[PyThink] 프로덕션 모드 — 클라이언트 정적 파일 서빙 활성화`);
  }
});

// DB 초기화 + 시드는 백그라운드에서 비동기로 처리 (서버는 이미 실행 중)
initDatabase()
  .then(async () => {
    try {
      const problemCount = queryOne('SELECT COUNT(*) as cnt FROM problems');
      console.log('[PyThink] DB 연결 확인 — 문제 수:', problemCount?.cnt ?? 0);
      if (!problemCount?.cnt) {
        console.log('[PyThink] 빈 데이터베이스 감지 — 자동 시드 실행 중...');
        await seed(true);
        console.log('[PyThink] 자동 시드 완료');
      } else {
        seedProblemSets();
      }
    } catch (err) {
      // 시드 실패해도 서버는 계속 실행 (헬스체크 유지)
      console.error('[PyThink] 시드/쿼리 오류 (서버 계속 실행):', err.message);
      console.error(err.stack);
    }
  })
  .catch(err => {
    // DB 초기화 실패해도 서버는 계속 실행
    console.error('[PyThink] DB 초기화 실패 (서버 계속 실행):', err.message);
    console.error(err.stack);
  });

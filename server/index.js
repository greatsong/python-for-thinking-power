import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { initDatabase } from './db/database.js';
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

// DB 초기화 후 서버 시작
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`[PyThink] 서버 실행 중: http://localhost:${PORT}`);
    if (isProduction) {
      console.log(`[PyThink] 프로덕션 모드 — 클라이언트 정적 파일 서빙 활성화`);
    }
  });
}).catch(err => {
  console.error('[PyThink] DB 초기화 실패:', err);
  process.exit(1);
});

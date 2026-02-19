import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '..', 'data', 'pythink.db');
const SCHEMA_PATH = path.resolve(__dirname, 'schema.sql');

// 100명+ 규모 대응 설정
const SAVE_DEBOUNCE_MS = 2000;   // 쓰기 후 2초 뒤 파일 저장 (배치 처리)
const AUTO_SAVE_INTERVAL = 30000; // 30초마다 자동 저장

let db = null;
let saveTimer = null;
let autoSaveTimer = null;
let isDirty = false;

export async function initDatabase() {
  const SQL = await initSqlJs();

  // 기존 DB 파일이 있으면 로드, 없으면 새로 생성
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    console.log('[DB] 기존 데이터베이스 로드 완료');
  } else {
    db = new SQL.Database();
    console.log('[DB] 새 데이터베이스 생성');
  }

  // 스키마 실행 (IF NOT EXISTS이므로 기존 테이블에 안전)
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.run(schema);

  // 마이그레이션: 새 컬럼 추가 (기존 DB 호환)
  try { db.run('ALTER TABLE submissions ADD COLUMN reflection TEXT'); } catch {}
  try { db.run('ALTER TABLE problems ADD COLUMN explanation TEXT'); } catch {}
  try { db.run('ALTER TABLE users ADD COLUMN current_level INT DEFAULT 1'); } catch {}
  try { db.run('ALTER TABLE users ADD COLUMN anthropic_api_key TEXT'); } catch {}
  try { db.run('ALTER TABLE classrooms ADD COLUMN daily_ai_limit INTEGER DEFAULT 0'); } catch {}

  // 성능 최적화
  db.run('PRAGMA foreign_keys=ON');

  // 초기 저장
  saveDatabaseSync();

  // 자동 저장 타이머 시작
  autoSaveTimer = setInterval(() => {
    if (isDirty) {
      saveDatabaseSync();
      isDirty = false;
    }
  }, AUTO_SAVE_INTERVAL);

  // 서버 종료 시 안전하게 저장
  setupGracefulShutdown();

  console.log('[DB] SQLite 초기화 완료 (자동저장: 30초, 디바운스: 2초)');
  return db;
}

export function getDb() {
  if (!db) throw new Error('데이터베이스가 초기화되지 않았습니다');
  return db;
}

// 동기 저장 (즉시)
function saveDatabaseSync() {
  if (!db) return;
  try {
    const data = db.export();
    const tempPath = DB_PATH + '.tmp';
    fs.writeFileSync(tempPath, Buffer.from(data));
    fs.renameSync(tempPath, DB_PATH); // atomic write
  } catch (err) {
    console.error('[DB] 저장 실패:', err.message);
  }
}

// 디바운스 저장 (쓰기 빈도 제한)
function scheduleSave() {
  isDirty = true;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveDatabaseSync();
    isDirty = false;
  }, SAVE_DEBOUNCE_MS);
}

// 즉시 저장 (외부에서 호출 가능)
export function saveDatabase() {
  saveDatabaseSync();
  isDirty = false;
}

// 서버 종료 시 DB 안전 저장
function setupGracefulShutdown() {
  const shutdown = (signal) => {
    console.log(`[DB] ${signal} 수신 — 데이터베이스 저장 중...`);
    if (saveTimer) clearTimeout(saveTimer);
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    saveDatabaseSync();
    console.log('[DB] 저장 완료');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('uncaughtException', (err) => {
    console.error('[DB] 예기치 않은 오류 — 긴급 저장:', err.message);
    saveDatabaseSync();
  });
}

// 헬퍼: 단일 행 조회
export function queryOne(sql, params = []) {
  const stmt = getDb().prepare(sql);
  stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    result = {};
    columns.forEach((col, i) => { result[col] = values[i]; });
  }
  stmt.free();
  return result;
}

// 헬퍼: 복수 행 조회
export function queryAll(sql, params = []) {
  const stmt = getDb().prepare(sql);
  stmt.bind(params);
  const results = [];
  const columns = stmt.getColumnNames();
  while (stmt.step()) {
    const values = stmt.get();
    const row = {};
    columns.forEach((col, i) => { row[col] = values[i]; });
    results.push(row);
  }
  stmt.free();
  return results;
}

// 헬퍼: INSERT/UPDATE/DELETE 실행
export function execute(sql, params = []) {
  getDb().run(sql, params);
  scheduleSave(); // 매번 즉시 저장 대신 디바운스 저장
}

// UUID 생성
export function generateId() {
  return randomUUID();
}

// 5자리 숫자 교실 코드 생성
export function generateJoinCode() {
  const code = Math.floor(10000 + Math.random() * 90000).toString();
  return code;
}

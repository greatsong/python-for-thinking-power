-- 사용자 (구글 로그인)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'student',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 교실
CREATE TABLE IF NOT EXISTS classrooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id TEXT NOT NULL REFERENCES users(id),
  join_code TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 교실 멤버
CREATE TABLE IF NOT EXISTS classroom_members (
  classroom_id TEXT NOT NULL REFERENCES classrooms(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  student_number TEXT,
  joined_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (classroom_id, user_id)
);

-- 문제
CREATE TABLE IF NOT EXISTS problems (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty INTEGER NOT NULL,
  category TEXT NOT NULL,
  starter_code TEXT DEFAULT '',
  test_cases_json TEXT NOT NULL,
  hints_json TEXT DEFAULT '[]',
  expected_approaches_json TEXT DEFAULT '[]',
  explanation TEXT,
  status TEXT DEFAULT 'approved',
  created_by TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 교실-문제 할당
CREATE TABLE IF NOT EXISTS classroom_problems (
  classroom_id TEXT NOT NULL REFERENCES classrooms(id),
  problem_id TEXT NOT NULL REFERENCES problems(id),
  ai_level INTEGER DEFAULT 2,
  gallery_enabled INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (classroom_id, problem_id)
);

-- 풀이 제출
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  problem_id TEXT NOT NULL REFERENCES problems(id),
  classroom_id TEXT NOT NULL REFERENCES classrooms(id),
  code TEXT NOT NULL,
  output TEXT,
  passed INTEGER DEFAULT 0,
  test_results_json TEXT,
  approach_tag TEXT,
  is_final INTEGER DEFAULT 0,
  reflection TEXT,
  submitted_at TEXT DEFAULT (datetime('now'))
);

-- 코드 스냅샷 (코드 여정용)
CREATE TABLE IF NOT EXISTS code_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  problem_id TEXT NOT NULL REFERENCES problems(id),
  classroom_id TEXT NOT NULL REFERENCES classrooms(id),
  code TEXT NOT NULL,
  snapshot_at TEXT DEFAULT (datetime('now'))
);

-- AI 대화
CREATE TABLE IF NOT EXISTS ai_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  problem_id TEXT NOT NULL REFERENCES problems(id),
  classroom_id TEXT NOT NULL REFERENCES classrooms(id),
  messages_json TEXT NOT NULL DEFAULT '[]',
  summary TEXT,
  message_count INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 문제집 (문제 그룹)
CREATE TABLE IF NOT EXISTS problem_sets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  emoji TEXT DEFAULT '📚',
  color TEXT DEFAULT '#3b82f6',
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 문제집-문제 연결
CREATE TABLE IF NOT EXISTS problem_set_items (
  set_id TEXT NOT NULL REFERENCES problem_sets(id),
  problem_id TEXT NOT NULL REFERENCES problems(id),
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (set_id, problem_id)
);

-- 교사 계정 신청서
CREATE TABLE IF NOT EXISTS teacher_applications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  school TEXT NOT NULL,
  region TEXT NOT NULL,
  motivation TEXT NOT NULL,
  privacy_consent INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_submissions_problem ON submissions(problem_id, classroom_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id, problem_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_problem ON code_snapshots(user_id, problem_id);
CREATE INDEX IF NOT EXISTS idx_ai_conv_classroom ON ai_conversations(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_members ON classroom_members(classroom_id);
CREATE INDEX IF NOT EXISTS idx_problem_set_items ON problem_set_items(set_id);

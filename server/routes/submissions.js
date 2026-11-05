import { Router } from 'express';
import { requireAuth, requireTeacher } from '../middleware/auth.js';
import { queryAll, queryOne, execute, generateId } from '../db/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// 교실 구성원과 담당 교사만 그 교실에 제출·저장한다. 나간 학생이 갤러리에 코드를 넣는 경로를 막는다
function inClassroom(user, classroomId) {
  return !!queryOne('SELECT 1 FROM classrooms WHERE id = ? AND teacher_id = ?', [classroomId, user.id])
    || !!queryOne('SELECT 1 FROM classroom_members WHERE classroom_id = ? AND user_id = ?', [classroomId, user.id]);
}

const MAX_CODE_LENGTH = 50000; // 50KB

// 풀이 제출
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { problemId, classroomId, code, output, passed, testResults } = req.body;

  if (!problemId || !code) {
    return res.status(400).json({ message: '문제 ID와 코드가 필요합니다' });
  }
  if (code.length > MAX_CODE_LENGTH) {
    return res.status(400).json({ message: `코드는 ${MAX_CODE_LENGTH}자 이내로 제출하세요` });
  }
  if (!classroomId) {
    return res.status(400).json({ message: '교실 ID가 필요합니다' });
  }
  if (!inClassroom(req.user, classroomId)) {
    return res.status(403).json({ message: '이 교실에 접근 권한이 없습니다' });
  }

  const id = generateId();
  execute(
    `INSERT INTO submissions (id, user_id, problem_id, classroom_id, code, output, passed, test_results_json, is_final)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [id, req.user.id, problemId, classroomId, code, output || '', passed ? 1 : 0, JSON.stringify(testResults || [])]
  );

  res.status(201).json({ id, message: '제출 완료' });
}));

// 내 제출 목록 (문제별)
router.get('/my', requireAuth, asyncHandler(async (req, res) => {
  const { problemId } = req.query;
  const submissions = queryAll(
    `SELECT id, problem_id, code, output, passed, submitted_at, approach_tag, is_final
     FROM submissions
     WHERE user_id = ? ${problemId ? 'AND problem_id = ?' : ''}
     ORDER BY submitted_at DESC`,
    problemId ? [req.user.id, problemId] : [req.user.id]
  );
  res.json(submissions);
}));

// 코드 스냅샷 저장 (자동 저장)
router.post('/snapshot', requireAuth, asyncHandler(async (req, res) => {
  const { problemId, classroomId, code } = req.body;

  if (!problemId || !code) {
    return res.status(400).json({ message: '문제 ID와 코드가 필요합니다' });
  }
  if (!classroomId) {
    return res.status(400).json({ message: '교실 ID가 필요합니다' });
  }
  if (!inClassroom(req.user, classroomId)) {
    return res.status(403).json({ message: '이 교실에 접근 권한이 없습니다' });
  }

  const id = generateId();
  execute(
    `INSERT INTO code_snapshots (id, user_id, problem_id, classroom_id, code)
     VALUES (?, ?, ?, ?, ?)`,
    [id, req.user.id, problemId, classroomId, code]
  );

  res.status(201).json({ id });
}));

// 코드 스냅샷 조회 (코드 여정)
router.get('/snapshots', requireAuth, asyncHandler(async (req, res) => {
  const { problemId } = req.query;

  if (!problemId) {
    return res.status(400).json({ message: '문제 ID가 필요합니다' });
  }

  const snapshots = queryAll(
    `SELECT id, code, snapshot_at
     FROM code_snapshots
     WHERE user_id = ? AND problem_id = ?
     ORDER BY snapshot_at ASC`,
    [req.user.id, problemId]
  );
  res.json(snapshots);
}));

// 풀이 소감(피드백) 저장
router.post('/:id/reflection', requireAuth, asyncHandler(async (req, res) => {
  const { reflection } = req.body;

  if (!reflection?.trim()) {
    return res.status(400).json({ message: '소감 내용이 필요합니다' });
  }

  const submission = queryOne('SELECT id FROM submissions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!submission) {
    return res.status(404).json({ message: '제출을 찾을 수 없습니다' });
  }

  execute('UPDATE submissions SET reflection = ? WHERE id = ?', [reflection.trim(), req.params.id]);
  res.json({ message: '소감이 저장되었습니다' });
}));

// 교실별 학생 소감 목록 (교사용)
router.get('/reflections/:classroomId', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  // 교실 소유권 확인 — 승인된 교사라도 다른 교사 교실의 학생 소감은 볼 수 없다
  const classroom = queryOne('SELECT id FROM classrooms WHERE id = ? AND teacher_id = ?', [req.params.classroomId, req.user.id]);
  if (!classroom) {
    return res.status(403).json({ message: '해당 교실에 대한 권한이 없습니다' });
  }

  const reflections = queryAll(
    `SELECT s.id, s.reflection, s.submitted_at, s.passed,
            u.name as student_name, u.id as student_id,
            p.title as problem_title, p.difficulty, p.id as problem_id,
            cm.student_number
     FROM submissions s
     JOIN users u ON u.id = s.user_id
     JOIN problems p ON p.id = s.problem_id
     LEFT JOIN classroom_members cm ON cm.user_id = s.user_id AND cm.classroom_id = s.classroom_id
     WHERE s.classroom_id = ? AND s.reflection IS NOT NULL AND s.reflection != ''
     ORDER BY s.submitted_at DESC`,
    [req.params.classroomId]
  );
  res.json(reflections);
}));

// 문제별 모든 제출 (담당 교사 전용) — 학생 이름과 코드가 함께 나가므로 교실을 반드시 지정한다.
// 예전에는 Google 로그인만 하면 모든 교실의 이름·코드를 받을 수 있었다.
router.get('/problem/:problemId', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { classroomId } = req.query;
  const classroom = classroomId
    ? queryOne('SELECT id FROM classrooms WHERE id = ? AND teacher_id = ?', [classroomId, req.user.id])
    : null;
  if (!classroom) {
    return res.status(403).json({ message: '해당 교실에 대한 권한이 없습니다' });
  }

  const submissions = queryAll(
    `SELECT s.id, s.user_id, u.name as student_name, s.code, s.output, s.passed,
            s.approach_tag, s.is_final, s.submitted_at
     FROM submissions s
     JOIN users u ON u.id = s.user_id
     WHERE s.problem_id = ? AND s.classroom_id = ?
       AND s.is_final = 1
     ORDER BY s.submitted_at DESC`,
    [req.params.problemId, classroomId]
  );
  res.json(submissions);
}));

export default router;

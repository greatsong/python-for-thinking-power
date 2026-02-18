import { Router } from 'express';
import { requireAuth, requireTeacher } from '../middleware/auth.js';
import { queryAll, queryOne, execute, generateId } from '../db/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// 풀이 제출
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { problemId, classroomId, code, output, passed, testResults } = req.body;

  if (!problemId || !code) {
    return res.status(400).json({ message: '문제 ID와 코드가 필요합니다' });
  }

  const id = generateId();
  execute(
    `INSERT INTO submissions (id, user_id, problem_id, classroom_id, code, output, passed, test_results_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.user.id, problemId, classroomId || '', code, output || '', passed ? 1 : 0, JSON.stringify(testResults || [])]
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

  const id = generateId();
  execute(
    `INSERT INTO code_snapshots (id, user_id, problem_id, classroom_id, code)
     VALUES (?, ?, ?, ?, ?)`,
    [id, req.user.id, problemId, classroomId || '', code]
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

// 문제별 모든 제출 (교사 또는 갤러리용)
router.get('/problem/:problemId', asyncHandler(async (req, res) => {
  const { classroomId } = req.query;
  const submissions = queryAll(
    `SELECT s.id, s.user_id, u.name as student_name, s.code, s.output, s.passed,
            s.approach_tag, s.is_final, s.submitted_at
     FROM submissions s
     JOIN users u ON u.id = s.user_id
     WHERE s.problem_id = ? ${classroomId ? 'AND s.classroom_id = ?' : ''}
       AND s.is_final = 1
     ORDER BY s.submitted_at DESC`,
    classroomId ? [req.params.problemId, classroomId] : [req.params.problemId]
  );
  res.json(submissions);
}));

export default router;

import { Router } from 'express';
import { requireAuth, requireTeacher } from '../middleware/auth.js';
import { queryAll, queryOne, execute, generateId, generateJoinCode } from '../db/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// 교실 생성 (교사 전용)
router.post('/', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: '교실 이름이 필요합니다' });
  }

  const duplicate = queryOne(
    'SELECT id FROM classrooms WHERE teacher_id = ? AND name = ?',
    [req.user.id, name]
  );
  if (duplicate) {
    return res.status(409).json({ message: '같은 이름의 교실이 이미 존재합니다' });
  }

  const id = generateId();
  const joinCode = generateJoinCode();

  execute(
    `INSERT INTO classrooms (id, name, teacher_id, join_code)
     VALUES (?, ?, ?, ?)`,
    [id, name, req.user.id, joinCode]
  );

  // Lv.1 입문자 문제를 기본 배정
  const beginnerProblems = queryAll(
    `SELECT psi.problem_id, psi.sort_order
     FROM problem_set_items psi
     JOIN problems p ON p.id = psi.problem_id
     WHERE psi.set_id = 'set-lv1-beginner' AND p.status = 'approved'
     ORDER BY psi.sort_order ASC`
  );
  for (const p of beginnerProblems) {
    execute(
      `INSERT OR IGNORE INTO classroom_problems (classroom_id, problem_id, ai_level, gallery_enabled, is_active, sort_order)
       VALUES (?, ?, 2, 0, 1, ?)`,
      [id, p.problem_id, p.sort_order]
    );
  }

  const classroom = queryOne('SELECT * FROM classrooms WHERE id = ?', [id]);
  res.status(201).json(classroom);
}));

// 교사의 교실 목록
router.get('/my', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const classrooms = queryAll(
    `SELECT c.*, COUNT(cm.user_id) as student_count
     FROM classrooms c
     LEFT JOIN classroom_members cm ON cm.classroom_id = c.id
     WHERE c.teacher_id = ?
     GROUP BY c.id`,
    [req.user.id]
  );
  res.json(classrooms);
}));

// 교실 참여 (학생) - 이미 참여했으면 학번 업데이트
router.post('/join', requireAuth, asyncHandler(async (req, res) => {
  const { joinCode, studentNumber } = req.body;

  if (!joinCode) {
    return res.status(400).json({ message: '참여 코드가 필요합니다' });
  }

  const classroom = queryOne(
    'SELECT * FROM classrooms WHERE join_code = ?',
    [joinCode.trim()]
  );

  if (!classroom) {
    return res.status(404).json({ message: '유효하지 않은 참여 코드입니다' });
  }

  const existing = queryOne(
    'SELECT * FROM classroom_members WHERE classroom_id = ? AND user_id = ?',
    [classroom.id, req.user.id]
  );

  if (existing) {
    // 이미 참여 중이면 학번 업데이트
    if (studentNumber !== undefined) {
      execute(
        'UPDATE classroom_members SET student_number = ? WHERE classroom_id = ? AND user_id = ?',
        [studentNumber || null, classroom.id, req.user.id]
      );
    }
  } else {
    execute(
      `INSERT INTO classroom_members (classroom_id, user_id, student_number)
       VALUES (?, ?, ?)`,
      [classroom.id, req.user.id, studentNumber || null]
    );
  }

  res.json({
    classroom: {
      id: classroom.id,
      name: classroom.name,
      joinCode: classroom.join_code,
    },
  });
}));

// 교실 정보 조회
router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const classroom = queryOne(
    `SELECT c.*, COUNT(cm.user_id) as student_count
     FROM classrooms c
     LEFT JOIN classroom_members cm ON cm.classroom_id = c.id
     WHERE c.id = ?
     GROUP BY c.id`,
    [req.params.id]
  );

  if (!classroom) {
    return res.status(404).json({ message: '교실을 찾을 수 없습니다' });
  }
  res.json(classroom);
}));

// 교실 삭제 (해당 교실의 교사만)
router.delete('/:id', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const classroom = queryOne(
    'SELECT * FROM classrooms WHERE id = ? AND teacher_id = ?',
    [req.params.id, req.user.id]
  );
  if (!classroom) {
    return res.status(404).json({ message: '교실을 찾을 수 없습니다' });
  }

  execute('DELETE FROM classroom_members WHERE classroom_id = ?', [req.params.id]);
  execute('DELETE FROM classroom_problems WHERE classroom_id = ?', [req.params.id]);
  execute('DELETE FROM classrooms WHERE id = ?', [req.params.id]);

  res.json({ message: '교실이 삭제되었습니다' });
}));

// 교실 학생 목록 (교사 전용)
router.get('/:id/students', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const students = queryAll(
    `SELECT u.id, u.name, u.email, u.avatar_url, cm.student_number, cm.joined_at
     FROM classroom_members cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.classroom_id = ?
     ORDER BY CAST(cm.student_number AS INTEGER) ASC, u.name ASC`,
    [req.params.id]
  );
  res.json(students);
}));

// 학번 수정 (교사 또는 본인)
router.put('/:id/members/:userId', requireAuth, asyncHandler(async (req, res) => {
  const { studentNumber } = req.body;

  if (req.user.role !== 'teacher' && req.user.id !== req.params.userId) {
    return res.status(403).json({ message: '권한이 없습니다' });
  }

  const member = queryOne(
    'SELECT * FROM classroom_members WHERE classroom_id = ? AND user_id = ?',
    [req.params.id, req.params.userId]
  );
  if (!member) {
    return res.status(404).json({ message: '학생을 찾을 수 없습니다' });
  }

  execute(
    'UPDATE classroom_members SET student_number = ? WHERE classroom_id = ? AND user_id = ?',
    [studentNumber || null, req.params.id, req.params.userId]
  );

  res.json({ message: '학번이 수정되었습니다' });
}));

// 학생 내보내기 (교사 전용)
router.delete('/:id/members/:userId', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  execute(
    'DELETE FROM classroom_members WHERE classroom_id = ? AND user_id = ?',
    [req.params.id, req.params.userId]
  );
  res.json({ message: '학생이 교실에서 제거되었습니다' });
}));

export default router;

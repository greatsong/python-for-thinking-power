import { Router } from 'express';
import { queryAll, queryOne, execute, generateId } from '../db/database.js';
import { requireAuth, requireTeacher, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { generateProblems, reviseProblem } from '../services/problemGenerator.js';

const router = Router();

// 문제집 목록 (학생용 - 레벨 잠금 포함)
router.get('/sets', optionalAuth, asyncHandler(async (req, res) => {
  const sets = queryAll(
    `SELECT * FROM problem_sets ORDER BY sort_order ASC`
  );

  // 로그인한 사용자의 현재 레벨 조회
  let userLevel = 1;
  if (req.user) {
    const user = queryOne('SELECT current_level FROM users WHERE id = ?', [req.user.id]);
    userLevel = user?.current_level || 1;
  }

  const result = sets.map(s => {
    const items = queryAll(
      `SELECT psi.problem_id, p.title, p.difficulty, p.category
       FROM problem_set_items psi
       JOIN problems p ON p.id = psi.problem_id
       WHERE psi.set_id = ? AND p.status = 'approved'
       ORDER BY psi.sort_order ASC`,
      [s.id]
    );

    // sort_order 0 = Lv1, sort_order 1 = Lv2, ...
    const setLevel = s.sort_order + 1;
    const isLocked = userLevel < setLevel;

    return {
      ...s,
      problem_count: items.length,
      set_level: setLevel,
      locked: isLocked,
      problems: items.map(i => ({
        id: i.problem_id,
        title: i.title,
        difficulty: i.difficulty,
        category: i.category,
      })),
    };
  });

  res.json(result);
}));

// 문제집 상세 + 사용자별 진행률
router.get('/sets/:setId/progress', requireAuth, asyncHandler(async (req, res) => {
  const { setId } = req.params;

  const problemSet = queryOne('SELECT * FROM problem_sets WHERE id = ?', [setId]);
  if (!problemSet) {
    return res.status(404).json({ message: '문제집을 찾을 수 없습니다' });
  }

  // 문제집 문제 목록
  const items = queryAll(
    `SELECT psi.problem_id, p.title, p.difficulty, p.category
     FROM problem_set_items psi
     JOIN problems p ON p.id = psi.problem_id
     WHERE psi.set_id = ? AND p.status = 'approved'
     ORDER BY psi.sort_order ASC`,
    [setId]
  );

  // 사용자의 통과 여부 확인
  const problemsWithProgress = items.map(item => {
    const submission = queryOne(
      `SELECT id, passed FROM submissions
       WHERE user_id = ? AND problem_id = ? AND passed = 1
       ORDER BY submitted_at DESC LIMIT 1`,
      [req.user.id, item.problem_id]
    );

    return {
      id: item.problem_id,
      title: item.title,
      difficulty: item.difficulty,
      category: item.category,
      solved: !!submission,
    };
  });

  // 레벨 잠금: 이전 난이도를 최소 1개 풀어야 다음 난이도 해금
  const solvedByDiff = {};
  for (const p of problemsWithProgress) {
    if (p.solved) {
      solvedByDiff[p.difficulty] = (solvedByDiff[p.difficulty] || 0) + 1;
    }
  }

  const difficulties = [...new Set(problemsWithProgress.map(p => p.difficulty))].sort((a, b) => a - b);

  for (const p of problemsWithProgress) {
    const diffIdx = difficulties.indexOf(p.difficulty);
    if (diffIdx === 0) {
      p.locked = false; // 첫 번째 난이도는 항상 열림
    } else {
      const prevDiff = difficulties[diffIdx - 1];
      p.locked = !(solvedByDiff[prevDiff] > 0); // 이전 난이도 1개 이상 풀었으면 해금
    }
  }

  const solved = problemsWithProgress.filter(p => p.solved).length;

  res.json({
    ...problemSet,
    problems: problemsWithProgress,
    total: problemsWithProgress.length,
    solved,
    completed: solved === problemsWithProgress.length && problemsWithProgress.length > 0,
  });
}));

// 전체 문제 목록 (승인된 것만)
router.get('/', asyncHandler(async (req, res) => {
  const problems = queryAll(
    `SELECT id, title, difficulty, category, status, sort_order, created_at
     FROM problems
     WHERE status = 'approved'
     ORDER BY sort_order ASC, difficulty ASC`
  );
  res.json(problems);
}));

// 교사의 모든 문제 (status 무관) — 주의: /library/all은 /:id 보다 위에 있어야 함
router.get('/library/all', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const problems = queryAll(
    `SELECT p.id, p.title, p.description, p.difficulty, p.category, p.status, p.sort_order, p.created_at,
            p.test_cases_json, p.hints_json, p.expected_approaches_json, p.starter_code,
            p.is_shared, p.cloned_from,
            orig_author.name AS cloned_from_author
     FROM problems p
     LEFT JOIN problems orig ON orig.id = p.cloned_from
     LEFT JOIN users orig_author ON orig_author.id = orig.created_by
     WHERE p.created_by = ?
     ORDER BY p.created_at DESC`,
    [req.user.id]
  );

  // JSON 필드 파싱
  const parsed = problems.map(p => ({
    ...p,
    test_cases: JSON.parse(p.test_cases_json || '[]'),
    hints: JSON.parse(p.hints_json || '[]'),
    expected_approaches: JSON.parse(p.expected_approaches_json || '[]'),
  }));

  res.json(parsed);
}));

// ── 문제 나눔터: 공개된 문제 목록 (교사 전용) ──
router.get('/community', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { difficulty, category, search } = req.query;

  let sql = `
    SELECT p.id, p.title, p.description, p.difficulty, p.category, p.status,
           p.shared_at, p.created_by, p.starter_code,
           p.test_cases_json, p.hints_json, p.expected_approaches_json, p.explanation,
           u.name AS author_name,
           (SELECT COUNT(*) FROM problems c WHERE c.cloned_from = p.id) AS clone_count,
           (SELECT COUNT(*) FROM problem_stars s WHERE s.problem_id = p.id) AS star_count,
           (SELECT COUNT(*) FROM problem_stars s2 WHERE s2.problem_id = p.id AND s2.user_id = ?) AS starred
    FROM problems p
    LEFT JOIN users u ON u.id = p.created_by
    WHERE p.is_shared = 1 AND p.status = 'approved' AND p.created_by != ?
  `;
  const params = [req.user.id, req.user.id];

  if (difficulty) {
    sql += ' AND p.difficulty = ?';
    params.push(Number(difficulty));
  }
  if (category) {
    sql += ' AND p.category = ?';
    params.push(category);
  }
  if (search) {
    sql += ' AND (p.title LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const { sort } = req.query;
  if (sort === 'stars') {
    sql += ' ORDER BY star_count DESC, p.shared_at DESC';
  } else {
    sql += ' ORDER BY p.shared_at DESC';
  }

  const problems = queryAll(sql, params);

  const parsed = problems.map(p => ({
    ...p,
    starred: !!p.starred,
    test_cases: JSON.parse(p.test_cases_json || '[]'),
    hints: JSON.parse(p.hints_json || '[]'),
    expected_approaches: JSON.parse(p.expected_approaches_json || '[]'),
  }));

  res.json(parsed);
}));

// 문제 공개/비공개 토글 (교사 전용)
router.patch('/:id/share', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const problem = queryOne('SELECT id, created_by, status FROM problems WHERE id = ?', [req.params.id]);
  if (!problem) {
    return res.status(404).json({ message: '문제를 찾을 수 없습니다' });
  }
  if (problem.created_by !== req.user.id) {
    return res.status(403).json({ message: '본인이 만든 문제만 공개할 수 있습니다' });
  }
  if (problem.status !== 'approved') {
    return res.status(400).json({ message: '승인된 문제만 공개할 수 있습니다' });
  }

  const { is_shared } = req.body;
  const shared = is_shared ? 1 : 0;
  const sharedAt = is_shared ? new Date().toISOString() : null;

  execute('UPDATE problems SET is_shared = ?, shared_at = ? WHERE id = ?', [shared, sharedAt, req.params.id]);

  res.json({ id: req.params.id, is_shared: shared, shared_at: sharedAt });
}));

// 문제 추천(스타) 토글 (교사 전용)
router.post('/:id/star', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const problem = queryOne('SELECT id, is_shared FROM problems WHERE id = ?', [id]);
  if (!problem) {
    return res.status(404).json({ message: '문제를 찾을 수 없습니다' });
  }

  const existing = queryOne(
    'SELECT user_id FROM problem_stars WHERE user_id = ? AND problem_id = ?',
    [req.user.id, id]
  );

  if (existing) {
    // 이미 스타 → 해제
    execute('DELETE FROM problem_stars WHERE user_id = ? AND problem_id = ?', [req.user.id, id]);
    res.json({ starred: false });
  } else {
    // 스타 추가
    execute(
      'INSERT INTO problem_stars (user_id, problem_id) VALUES (?, ?)',
      [req.user.id, id]
    );
    res.json({ starred: true });
  }
}));

// 문제 복제 (교사 전용)
router.post('/:id/clone', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const original = queryOne('SELECT * FROM problems WHERE id = ?', [req.params.id]);
  if (!original) {
    return res.status(404).json({ message: '문제를 찾을 수 없습니다' });
  }
  if (!original.is_shared) {
    return res.status(403).json({ message: '공개된 문제만 복제할 수 있습니다' });
  }

  const newId = generateId();
  execute(
    `INSERT INTO problems (id, title, description, difficulty, category, starter_code,
     test_cases_json, hints_json, expected_approaches_json, explanation,
     status, created_by, cloned_from, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, 0)`,
    [
      newId,
      original.title,
      original.description,
      original.difficulty,
      original.category,
      original.starter_code || '',
      original.test_cases_json,
      original.hints_json,
      original.expected_approaches_json,
      original.explanation,
      req.user.id,
      original.id,
    ]
  );

  const cloned = queryOne('SELECT * FROM problems WHERE id = ?', [newId]);
  cloned.test_cases = JSON.parse(cloned.test_cases_json || '[]');
  cloned.hints = JSON.parse(cloned.hints_json || '[]');
  cloned.expected_approaches = JSON.parse(cloned.expected_approaches_json || '[]');

  res.json(cloned);
}));

// 교실에 할당된 문제 목록 — 주의: /:id 보다 위에 있어야 함
router.get('/classroom/:classroomId', requireAuth, asyncHandler(async (req, res) => {
  const problems = queryAll(
    `SELECT p.id, p.title, p.difficulty, p.category, p.description,
            cp.ai_level, cp.gallery_enabled, cp.is_active, cp.sort_order
     FROM classroom_problems cp
     JOIN problems p ON p.id = cp.problem_id
     WHERE cp.classroom_id = ? AND cp.is_active = 1
     ORDER BY cp.sort_order ASC`,
    [req.params.classroomId]
  );
  res.json(problems);
}));

// 문제 상세
router.get('/:id', asyncHandler(async (req, res) => {
  const problem = queryOne(
    `SELECT * FROM problems WHERE id = ?`,
    [req.params.id]
  );

  if (!problem) {
    return res.status(404).json({ message: '문제를 찾을 수 없습니다' });
  }

  // JSON 문자열 파싱
  problem.test_cases = JSON.parse(problem.test_cases_json || '[]');
  problem.hints = JSON.parse(problem.hints_json || '[]');
  problem.expected_approaches = JSON.parse(problem.expected_approaches_json || '[]');
  delete problem.test_cases_json;
  delete problem.hints_json;
  delete problem.expected_approaches_json;

  res.json(problem);
}));

// AI로 문제 생성 (교사 전용)
router.post('/generate', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { prompt, count = 3, difficulty, category, referenceProblem, includeExplanation } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: '문제 생성 요청 내용이 필요합니다' });
  }

  // SSE 설정
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const generatedProblems = [];

  await generateProblems(
    { prompt, count, difficulty, category, referenceProblem, includeExplanation },
    {
      onProblem: (problem) => {
        // DB에 draft 상태로 저장
        const id = generateId();
        execute(
          `INSERT INTO problems (id, title, description, difficulty, category, starter_code, test_cases_json, hints_json, expected_approaches_json, explanation, status, created_by, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, 0)`,
          [
            id,
            problem.title,
            problem.description,
            problem.difficulty,
            problem.category,
            problem.starter_code || '',
            JSON.stringify(problem.test_cases || []),
            JSON.stringify(problem.hints || []),
            JSON.stringify(problem.expected_approaches || []),
            problem.explanation || null,
            req.user.id,
          ]
        );

        const saved = { ...problem, id, status: 'draft' };
        generatedProblems.push(saved);
        res.write(`data: ${JSON.stringify({ type: 'problem', data: saved })}\n\n`);
      },
      onDone: () => {
        res.write(`data: ${JSON.stringify({ type: 'done', data: generatedProblems })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      },
      onError: (message) => {
        res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
        res.end();
      },
    }
  );
}));

// 기존 문제 수정 요청 (교사 전용)
router.post('/:id/revise', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { feedback } = req.body;

  if (!feedback) {
    return res.status(400).json({ message: '피드백 내용이 필요합니다' });
  }

  const problem = queryOne('SELECT * FROM problems WHERE id = ?', [req.params.id]);
  if (!problem) {
    return res.status(404).json({ message: '문제를 찾을 수 없습니다' });
  }
  if (problem.created_by && problem.created_by !== req.user.id) {
    return res.status(403).json({ message: '본인이 만든 문제만 수정할 수 있습니다' });
  }

  // 기존 문제 데이터 복원
  const originalProblem = {
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    category: problem.category,
    starter_code: problem.starter_code,
    test_cases: JSON.parse(problem.test_cases_json || '[]'),
    hints: JSON.parse(problem.hints_json || '[]'),
    expected_approaches: JSON.parse(problem.expected_approaches_json || '[]'),
  };

  const revised = await reviseProblem({ problem: originalProblem, feedback });

  // DB 업데이트
  execute(
    `UPDATE problems SET title = ?, description = ?, difficulty = ?, category = ?,
     starter_code = ?, test_cases_json = ?, hints_json = ?, expected_approaches_json = ?,
     status = 'draft'
     WHERE id = ?`,
    [
      revised.title,
      revised.description,
      revised.difficulty,
      revised.category,
      revised.starter_code || '',
      JSON.stringify(revised.test_cases || []),
      JSON.stringify(revised.hints || []),
      JSON.stringify(revised.expected_approaches || []),
      req.params.id,
    ]
  );

  res.json({ ...revised, id: req.params.id, status: 'draft' });
}));

// 문제 상태 변경 (교사 전용)
router.patch('/:id/status', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['draft', 'review', 'approved', 'revision', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: `유효하지 않은 상태입니다. 가능한 값: ${validStatuses.join(', ')}` });
  }

  const problem = queryOne('SELECT id, created_by FROM problems WHERE id = ?', [req.params.id]);
  if (!problem) {
    return res.status(404).json({ message: '문제를 찾을 수 없습니다' });
  }
  if (problem.created_by && problem.created_by !== req.user.id) {
    return res.status(403).json({ message: '본인이 만든 문제만 상태를 변경할 수 있습니다' });
  }

  execute('UPDATE problems SET status = ? WHERE id = ?', [status, req.params.id]);

  res.json({ id: req.params.id, status });
}));

// 문제를 교실에 배정 (교사 전용)
router.post('/:problemId/assign', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { classroomId, aiLevel = 2, galleryEnabled = false } = req.body;
  const { problemId } = req.params;

  if (!classroomId) {
    return res.status(400).json({ message: '교실 ID가 필요합니다' });
  }

  // 교실 소유권 확인
  const classroom = queryOne(
    'SELECT id FROM classrooms WHERE id = ? AND teacher_id = ?',
    [classroomId, req.user.id]
  );
  if (!classroom) {
    return res.status(403).json({ message: '해당 교실에 대한 권한이 없습니다' });
  }

  // 문제 존재 확인
  const problem = queryOne('SELECT id FROM problems WHERE id = ?', [problemId]);
  if (!problem) {
    return res.status(404).json({ message: '문제를 찾을 수 없습니다' });
  }

  // 이미 배정되어 있으면 업데이트, 아니면 삽입
  const existing = queryOne(
    'SELECT * FROM classroom_problems WHERE classroom_id = ? AND problem_id = ?',
    [classroomId, problemId]
  );

  if (existing) {
    execute(
      `UPDATE classroom_problems SET ai_level = ?, gallery_enabled = ?, is_active = 1
       WHERE classroom_id = ? AND problem_id = ?`,
      [aiLevel, galleryEnabled ? 1 : 0, classroomId, problemId]
    );
  } else {
    // 현재 최대 sort_order 조회
    const maxOrder = queryOne(
      'SELECT MAX(sort_order) as max_order FROM classroom_problems WHERE classroom_id = ?',
      [classroomId]
    );
    const sortOrder = (maxOrder?.max_order || 0) + 1;

    execute(
      `INSERT INTO classroom_problems (classroom_id, problem_id, ai_level, gallery_enabled, is_active, sort_order)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [classroomId, problemId, aiLevel, galleryEnabled ? 1 : 0, sortOrder]
    );
  }

  res.json({ message: '문제가 교실에 배정되었습니다', problemId, classroomId });
}));

export default router;

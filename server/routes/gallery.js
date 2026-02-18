import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { queryAll, queryOne } from '../db/database.js';
import { analyzeSolutions } from '../services/approachAnalyzer.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// 문제별 풀이 갤러리 (익명화)
router.get('/:problemId', requireAuth, asyncHandler(async (req, res) => {
  const { classroomId } = req.query;
  const { problemId } = req.params;

  const submissions = queryAll(
    `SELECT s.id, s.code, s.approach_tag, s.submitted_at
     FROM submissions s
     WHERE s.problem_id = ? ${classroomId ? 'AND s.classroom_id = ?' : ''}
       AND s.is_final = 1 AND s.passed = 1
     ORDER BY s.submitted_at ASC`,
    classroomId ? [problemId, classroomId] : [problemId]
  );

  res.json(submissions);
}));

// AI 풀이 분석 요청
router.post('/:problemId/analyze', requireAuth, asyncHandler(async (req, res) => {
  const { classroomId } = req.body;
  const { problemId } = req.params;

  const submissions = queryAll(
    `SELECT s.code FROM submissions s
     WHERE s.problem_id = ? ${classroomId ? 'AND s.classroom_id = ?' : ''}
       AND s.is_final = 1 AND s.passed = 1`,
    classroomId ? [problemId, classroomId] : [problemId]
  );

  if (submissions.length < 2) {
    return res.json({ analysis: null, message: '분석하려면 2개 이상의 풀이가 필요합니다' });
  }

  const problem = queryOne('SELECT title FROM problems WHERE id = ?', [problemId]);
  const analysis = await analyzeSolutions(submissions, problem?.title || problemId);

  res.json({ analysis });
}));

export default router;

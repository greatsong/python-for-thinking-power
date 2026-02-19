import { Router } from 'express';
import { requireAuth, requireTeacher } from '../middleware/auth.js';
import { queryAll, queryOne } from '../db/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// 교실 전체 현황
router.get('/overview/:classroomId', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { classroomId } = req.params;

  // 교실 소유권 확인
  const classroom = queryOne('SELECT id FROM classrooms WHERE id = ? AND teacher_id = ?', [classroomId, req.user.id]);
  if (!classroom) {
    return res.status(403).json({ message: '해당 교실에 대한 권한이 없습니다' });
  }

  const totalStudents = queryOne(
    'SELECT COUNT(*) as count FROM classroom_members WHERE classroom_id = ?',
    [classroomId]
  )?.count || 0;

  const totalSubmissions = queryOne(
    'SELECT COUNT(*) as count FROM submissions WHERE classroom_id = ?',
    [classroomId]
  )?.count || 0;

  const passedSubmissions = queryOne(
    'SELECT COUNT(*) as count FROM submissions WHERE classroom_id = ? AND passed = 1',
    [classroomId]
  )?.count || 0;

  const aiConversations = queryOne(
    'SELECT COUNT(*) as count FROM ai_conversations WHERE classroom_id = ?',
    [classroomId]
  )?.count || 0;

  res.json({
    total_students: totalStudents,
    total_submissions: totalSubmissions,
    passed_submissions: passedSubmissions,
    total_ai_conversations: aiConversations,
  });
}));

// 학생별 진행 상태
router.get('/students/:classroomId', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { classroomId } = req.params;

  const classroom = queryOne('SELECT id FROM classrooms WHERE id = ? AND teacher_id = ?', [classroomId, req.user.id]);
  if (!classroom) {
    return res.status(403).json({ message: '해당 교실에 대한 권한이 없습니다' });
  }

  const students = queryAll(
    `SELECT u.id, u.name, u.email, cm.student_number,
            (SELECT COUNT(DISTINCT s.problem_id) FROM submissions s WHERE s.user_id = u.id AND s.classroom_id = ? AND s.passed = 1) as solved_count,
            (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id AND s.classroom_id = ?) as submission_count,
            (SELECT COUNT(*) FROM ai_conversations ac WHERE ac.user_id = u.id AND ac.classroom_id = ?) as ai_conversation_count,
            (SELECT MAX(s.submitted_at) FROM submissions s WHERE s.user_id = u.id AND s.classroom_id = ?) as last_activity
     FROM classroom_members cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.classroom_id = ?
     ORDER BY cm.student_number ASC, u.name ASC`,
    [classroomId, classroomId, classroomId, classroomId, classroomId]
  );

  res.json(students);
}));

// AI 대화 요약 목록 (교사용)
router.get('/ai-summaries/:classroomId', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { classroomId } = req.params;

  const classroom = queryOne('SELECT id FROM classrooms WHERE id = ? AND teacher_id = ?', [classroomId, req.user.id]);
  if (!classroom) {
    return res.status(403).json({ message: '해당 교실에 대한 권한이 없습니다' });
  }

  const conversations = queryAll(
    `SELECT ac.id, ac.user_id, u.name as student_name, ac.problem_id, p.title as problem_title,
            ac.summary, ac.message_count, ac.updated_at
     FROM ai_conversations ac
     JOIN users u ON u.id = ac.user_id
     JOIN problems p ON p.id = ac.problem_id
     WHERE ac.classroom_id = ?
     ORDER BY ac.updated_at DESC
     LIMIT 50`,
    [classroomId]
  );

  res.json(conversations);
}));

// 학생 × 문제 매트릭스 데이터
router.get('/matrix/:classroomId', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { classroomId } = req.params;

  const classroom = queryOne('SELECT id FROM classrooms WHERE id = ? AND teacher_id = ?', [classroomId, req.user.id]);
  if (!classroom) {
    return res.status(403).json({ message: '해당 교실에 대한 권한이 없습니다' });
  }

  // 1) 교실에 배정된 문제 목록
  const problems = queryAll(
    `SELECT p.id, p.title, p.difficulty, p.category, cp.sort_order
     FROM classroom_problems cp
     JOIN problems p ON p.id = cp.problem_id
     WHERE cp.classroom_id = ? AND cp.is_active = 1
     ORDER BY cp.sort_order ASC`,
    [classroomId]
  );

  // 2) 교실 소속 학생 목록
  const students = queryAll(
    `SELECT u.id, u.name, u.email, cm.student_number
     FROM classroom_members cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.classroom_id = ?
     ORDER BY cm.student_number ASC, u.name ASC`,
    [classroomId]
  );

  // 3) 모든 제출 (학생별 문제별 최종 제출)
  const submissions = queryAll(
    `SELECT s.user_id, s.problem_id, s.passed, s.approach_tag, s.submitted_at,
            s.code
     FROM submissions s
     WHERE s.classroom_id = ? AND s.is_final = 1`,
    [classroomId]
  );

  // 4) AI 대화 정보 (학생별 문제별)
  const aiConvs = queryAll(
    `SELECT ac.user_id, ac.problem_id, ac.message_count, ac.messages_json
     FROM ai_conversations ac
     WHERE ac.classroom_id = ?`,
    [classroomId]
  );

  // 매트릭스 셀 데이터 구축
  const cellMap = {};

  // 제출 데이터 매핑
  for (const sub of submissions) {
    const key = `${sub.user_id}:${sub.problem_id}`;
    cellMap[key] = {
      status: sub.passed ? 'passed' : 'failed',
      approach: sub.approach_tag || null,
      submittedAt: sub.submitted_at,
      codeLength: sub.code?.length || 0,
    };
  }

  // AI 대화 데이터 매핑 + 치팅 키워드 검사
  const cheatingKeywords = ['답 알려', '정답 알려', '코드 줘', '답 줘', '정답 줘', '코드 알려',
    '전체 코드', '완성 코드', '복사', '답이 뭐', '정답이 뭐', '풀이 알려'];

  for (const conv of aiConvs) {
    const key = `${conv.user_id}:${conv.problem_id}`;
    if (!cellMap[key]) {
      cellMap[key] = { status: 'in_progress' };
    }
    cellMap[key].aiUsed = true;
    cellMap[key].aiMessageCount = conv.message_count;

    // 치팅 키워드 검사 (토큰 비용 없이 로컬에서)
    try {
      const messages = JSON.parse(conv.messages_json || '[]');
      const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
      const allText = userMessages.join(' ').toLowerCase();
      cellMap[key].cheatingFlag = cheatingKeywords.some(kw => allText.includes(kw));
    } catch {
      cellMap[key].cheatingFlag = false;
    }
  }

  res.json({ problems, students, cells: cellMap });
}));

// AI 사용량 통계 (교사용)
router.get('/ai-usage/:classroomId', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { classroomId } = req.params;
  const { period } = req.query; // 'day' | 'week' | 'month'

  const classroom = queryOne(
    'SELECT id, daily_ai_limit FROM classrooms WHERE id = ? AND teacher_id = ?',
    [classroomId, req.user.id]
  );
  if (!classroom) {
    return res.status(403).json({ message: '해당 교실에 대한 권한이 없습니다' });
  }

  // 기간 필터
  let dateFilter;
  if (period === 'week') {
    dateFilter = "AND al.created_at >= date('now', '-7 days')";
  } else if (period === 'month') {
    dateFilter = "AND al.created_at >= date('now', '-30 days')";
  } else {
    dateFilter = "AND al.created_at >= date('now')";
  }

  // 전체 사용량
  const totalUsage = queryOne(
    `SELECT COUNT(*) as total_calls FROM ai_usage_log al
     WHERE al.classroom_id = ? ${dateFilter}`,
    [classroomId]
  );

  // 학생별 사용량 (상위 정렬)
  const perStudent = queryAll(
    `SELECT al.user_id, u.name, cm.student_number, COUNT(*) as call_count
     FROM ai_usage_log al
     JOIN users u ON u.id = al.user_id
     LEFT JOIN classroom_members cm ON cm.classroom_id = al.classroom_id AND cm.user_id = al.user_id
     WHERE al.classroom_id = ? ${dateFilter}
     GROUP BY al.user_id
     ORDER BY call_count DESC`,
    [classroomId]
  );

  // 일자별 사용량 (최근 7일)
  const dailyBreakdown = queryAll(
    `SELECT date(al.created_at) as date, COUNT(*) as call_count
     FROM ai_usage_log al
     WHERE al.classroom_id = ? AND al.created_at >= date('now', '-7 days')
     GROUP BY date(al.created_at)
     ORDER BY date ASC`,
    [classroomId]
  );

  res.json({
    daily_limit: classroom.daily_ai_limit,
    total_calls: totalUsage?.total_calls || 0,
    estimated_cost: ((totalUsage?.total_calls || 0) * 0.015).toFixed(2),
    per_student: perStudent,
    daily_breakdown: dailyBreakdown,
  });
}));

export default router;

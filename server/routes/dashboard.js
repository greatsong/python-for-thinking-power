import { Router } from 'express';
import { requireAuth, requireTeacher } from '../middleware/auth.js';
import { queryAll, queryOne, execute, generateId } from '../db/database.js';
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

  // 3) 모든 제출 (학생별 문제별 최종 제출) — 교사 평가 데이터 포함
  const submissions = queryAll(
    `SELECT s.user_id, s.problem_id, s.passed, s.approach_tag, s.submitted_at,
            s.code, s.teacher_score, s.teacher_grade, s.teacher_feedback
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
      teacherScore: sub.teacher_score,
      teacherGrade: sub.teacher_grade,
      hasFeedback: !!sub.teacher_feedback,
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

// ===== 학생+문제 셀 상세 (매트릭스 셀 클릭) =====
router.get('/cell-detail/:classroomId/:studentId/:problemId', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { classroomId, studentId, problemId } = req.params;

  const classroom = queryOne('SELECT id FROM classrooms WHERE id = ? AND teacher_id = ?', [classroomId, req.user.id]);
  if (!classroom) {
    return res.status(403).json({ message: '해당 교실에 대한 권한이 없습니다' });
  }

  // 최종 제출
  const submission = queryOne(
    `SELECT s.id, s.code, s.output, s.passed, s.test_results_json, s.approach_tag,
            s.submitted_at, s.reflection, s.teacher_score, s.teacher_grade,
            s.teacher_feedback, s.feedback_at
     FROM submissions s
     WHERE s.user_id = ? AND s.problem_id = ? AND s.classroom_id = ? AND s.is_final = 1
     ORDER BY s.submitted_at DESC LIMIT 1`,
    [studentId, problemId, classroomId]
  );

  // 전체 제출 이력
  const allSubmissions = queryAll(
    `SELECT s.id, s.passed, s.approach_tag, s.submitted_at
     FROM submissions s
     WHERE s.user_id = ? AND s.problem_id = ? AND s.classroom_id = ?
     ORDER BY s.submitted_at ASC`,
    [studentId, problemId, classroomId]
  );

  // AI 대화 원문
  const aiConversation = queryOne(
    `SELECT ac.messages_json, ac.message_count, ac.summary
     FROM ai_conversations ac
     WHERE ac.user_id = ? AND ac.problem_id = ? AND ac.classroom_id = ?`,
    [studentId, problemId, classroomId]
  );

  // 코드 스냅샷 (코드 여정)
  const snapshots = queryAll(
    `SELECT cs.code, cs.snapshot_at
     FROM code_snapshots cs
     WHERE cs.user_id = ? AND cs.problem_id = ? AND cs.classroom_id = ?
     ORDER BY cs.snapshot_at ASC`,
    [studentId, problemId, classroomId]
  );

  res.json({
    submission,
    allSubmissions,
    aiConversation: aiConversation ? {
      messages: JSON.parse(aiConversation.messages_json || '[]'),
      messageCount: aiConversation.message_count,
      summary: aiConversation.summary,
    } : null,
    snapshots,
  });
}));

// ===== 학생 전체 요약 (학생 행 클릭) =====
router.get('/student-detail/:classroomId/:studentId', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { classroomId, studentId } = req.params;

  const classroom = queryOne('SELECT id FROM classrooms WHERE id = ? AND teacher_id = ?', [classroomId, req.user.id]);
  if (!classroom) {
    return res.status(403).json({ message: '해당 교실에 대한 권한이 없습니다' });
  }

  const student = queryOne(
    `SELECT u.id, u.name, u.email, u.avatar_url, COALESCE(u.current_level, 1) as current_level,
            cm.student_number, cm.joined_at
     FROM classroom_members cm
     JOIN users u ON u.id = cm.user_id
     WHERE cm.classroom_id = ? AND cm.user_id = ?`,
    [classroomId, studentId]
  );

  if (!student) {
    return res.status(404).json({ message: '학생을 찾을 수 없습니다' });
  }

  // 문제별 제출 요약
  const submissions = queryAll(
    `SELECT s.id, s.problem_id, p.title as problem_title, p.difficulty,
            s.code, s.passed, s.approach_tag, s.submitted_at,
            s.teacher_score, s.teacher_grade, s.teacher_feedback, s.reflection
     FROM submissions s
     JOIN problems p ON p.id = s.problem_id
     WHERE s.user_id = ? AND s.classroom_id = ? AND s.is_final = 1
     ORDER BY s.submitted_at DESC`,
    [studentId, classroomId]
  );

  // 통계
  const stats = {
    totalSubmissions: queryOne(
      'SELECT COUNT(*) as count FROM submissions WHERE user_id = ? AND classroom_id = ?',
      [studentId, classroomId]
    )?.count || 0,
    solvedCount: queryOne(
      'SELECT COUNT(DISTINCT problem_id) as count FROM submissions WHERE user_id = ? AND classroom_id = ? AND passed = 1',
      [studentId, classroomId]
    )?.count || 0,
    aiCalls: queryOne(
      'SELECT COUNT(*) as count FROM ai_usage_log WHERE user_id = ? AND classroom_id = ?',
      [studentId, classroomId]
    )?.count || 0,
    avgScore: queryOne(
      'SELECT AVG(teacher_score) as avg FROM submissions WHERE user_id = ? AND classroom_id = ? AND is_final = 1 AND teacher_score IS NOT NULL',
      [studentId, classroomId]
    )?.avg,
  };

  res.json({ student, submissions, stats });
}));

// ===== 교사 피드백/평가 저장 =====
router.put('/feedback/:submissionId', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const { score, grade, feedback } = req.body;

  // 제출물이 교사의 교실에 속하는지 확인
  const submission = queryOne(
    `SELECT s.id, s.classroom_id FROM submissions s
     JOIN classrooms c ON c.id = s.classroom_id
     WHERE s.id = ? AND c.teacher_id = ?`,
    [submissionId, req.user.id]
  );

  if (!submission) {
    return res.status(404).json({ message: '제출물을 찾을 수 없거나 권한이 없습니다' });
  }

  // 점수 유효성 검사
  if (score !== null && score !== undefined) {
    if (typeof score !== 'number' || score < 0 || score > 100) {
      return res.status(400).json({ message: '점수는 0~100 사이여야 합니다' });
    }
  }

  execute(
    `UPDATE submissions
     SET teacher_score = ?, teacher_grade = ?, teacher_feedback = ?,
         feedback_at = datetime('now'), feedback_by = ?
     WHERE id = ?`,
    [score ?? null, grade || null, feedback || null, req.user.id, submissionId]
  );

  res.json({ message: '평가가 저장되었습니다' });
}));

// ===== 데이터 내보내기 (CSV) =====
router.get('/export/:classroomId', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { classroomId } = req.params;
  const { type = 'grades' } = req.query;

  const classroom = queryOne('SELECT id, name FROM classrooms WHERE id = ? AND teacher_id = ?', [classroomId, req.user.id]);
  if (!classroom) {
    return res.status(403).json({ message: '해당 교실에 대한 권한이 없습니다' });
  }

  const BOM = '\uFEFF'; // 엑셀 한글 호환

  if (type === 'grades') {
    // 성적표 CSV: 학생 × 문제 매트릭스
    const problems = queryAll(
      `SELECT p.id, p.title FROM classroom_problems cp
       JOIN problems p ON p.id = cp.problem_id
       WHERE cp.classroom_id = ? AND cp.is_active = 1
       ORDER BY cp.sort_order ASC`,
      [classroomId]
    );

    const students = queryAll(
      `SELECT u.id, u.name, cm.student_number
       FROM classroom_members cm JOIN users u ON u.id = cm.user_id
       WHERE cm.classroom_id = ?
       ORDER BY cm.student_number ASC, u.name ASC`,
      [classroomId]
    );

    const submissions = queryAll(
      `SELECT s.user_id, s.problem_id, s.passed, s.teacher_score, s.teacher_grade
       FROM submissions s
       WHERE s.classroom_id = ? AND s.is_final = 1`,
      [classroomId]
    );

    const subMap = {};
    for (const s of submissions) {
      subMap[`${s.user_id}:${s.problem_id}`] = s;
    }

    // 헤더
    const headers = ['번호', '이름'];
    for (const p of problems) {
      headers.push(`${p.title}_통과`, `${p.title}_점수`, `${p.title}_등급`);
    }
    headers.push('평균점수', '통과율');

    const rows = [headers.join(',')];
    for (const st of students) {
      const cols = [st.student_number || '-', `"${st.name}"`];
      let scoreSum = 0, scoreCount = 0, passCount = 0;

      for (const p of problems) {
        const sub = subMap[`${st.id}:${p.id}`];
        if (sub) {
          cols.push(sub.passed ? 'O' : 'X');
          cols.push(sub.teacher_score ?? '');
          cols.push(sub.teacher_grade ?? '');
          if (sub.passed) passCount++;
          if (sub.teacher_score != null) { scoreSum += sub.teacher_score; scoreCount++; }
        } else {
          cols.push('', '', '');
        }
      }

      cols.push(scoreCount > 0 ? (scoreSum / scoreCount).toFixed(1) : '');
      cols.push(problems.length > 0 ? `${Math.round(passCount / problems.length * 100)}%` : '0%');
      rows.push(cols.join(','));
    }

    const csv = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="grades_${Date.now()}.csv"`);
    res.send(BOM + csv);

  } else if (type === 'progress') {
    // 진행 요약 CSV
    const students = queryAll(
      `SELECT u.id, u.name, cm.student_number,
              (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id AND s.classroom_id = ?) as submission_count,
              (SELECT COUNT(DISTINCT s.problem_id) FROM submissions s WHERE s.user_id = u.id AND s.classroom_id = ? AND s.passed = 1) as solved_count,
              (SELECT COUNT(*) FROM ai_usage_log al WHERE al.user_id = u.id AND al.classroom_id = ?) as ai_calls,
              (SELECT MAX(s.submitted_at) FROM submissions s WHERE s.user_id = u.id AND s.classroom_id = ?) as last_activity,
              (SELECT AVG(s.teacher_score) FROM submissions s WHERE s.user_id = u.id AND s.classroom_id = ? AND s.is_final = 1 AND s.teacher_score IS NOT NULL) as avg_score
       FROM classroom_members cm JOIN users u ON u.id = cm.user_id
       WHERE cm.classroom_id = ?
       ORDER BY cm.student_number ASC, u.name ASC`,
      [classroomId, classroomId, classroomId, classroomId, classroomId, classroomId]
    );

    const totalProblems = queryOne(
      'SELECT COUNT(*) as count FROM classroom_problems WHERE classroom_id = ? AND is_active = 1',
      [classroomId]
    )?.count || 0;

    const headers = ['번호', '이름', '총제출수', '통과문제수', '통과율', '평균점수', 'AI사용횟수', '마지막활동'];
    const rows = [headers.join(',')];

    for (const st of students) {
      const passRate = totalProblems > 0 ? `${Math.round(st.solved_count / totalProblems * 100)}%` : '0%';
      rows.push([
        st.student_number || '-',
        `"${st.name}"`,
        st.submission_count,
        st.solved_count,
        passRate,
        st.avg_score != null ? st.avg_score.toFixed(1) : '',
        st.ai_calls,
        st.last_activity || '',
      ].join(','));
    }

    const csv = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="progress_${Date.now()}.csv"`);
    res.send(BOM + csv);

  } else {
    res.status(400).json({ message: '지원하지 않는 내보내기 타입입니다 (grades, progress)' });
  }
}));

export default router;

import { Router } from 'express';
import { requireAuth, requireTeacher } from '../middleware/auth.js';
import { buildSystemPrompt, streamChat } from '../services/aiCoach.js';
import { generateConversationSummary } from '../services/conversationSummarizer.js';
import { queryOne, queryAll, execute, generateId } from '../db/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { encrypt, decrypt } from '../services/crypto.js';

const router = Router();

// API 키 상태 확인 (교사별 DB 저장)
router.get('/status', requireAuth, requireTeacher, (req, res) => {
  const teacher = queryOne('SELECT anthropic_api_key FROM users WHERE id = ?', [req.user.id]);
  const decryptedKey = teacher?.anthropic_api_key ? decrypt(teacher.anthropic_api_key) : null;
  const key = decryptedKey || process.env.ANTHROPIC_API_KEY || '';
  res.json({
    configured: !!key && key.length > 10,
    masked: key ? key.slice(0, 10) + '...' + key.slice(-4) : '',
    source: decryptedKey ? 'db' : (process.env.ANTHROPIC_API_KEY ? 'env' : 'none'),
  });
});

// API 키 설정 (교사별 DB 저장)
router.post('/config', requireAuth, requireTeacher, (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return res.status(400).json({ message: 'sk-ant- 로 시작하는 유효한 API 키를 입력하세요' });
  }
  execute('UPDATE users SET anthropic_api_key = ? WHERE id = ?', [encrypt(apiKey), req.user.id]);
  res.json({ success: true, masked: apiKey.slice(0, 10) + '...' + apiKey.slice(-4) });
});

// API 키 삭제
router.delete('/config', requireAuth, requireTeacher, (req, res) => {
  execute('UPDATE users SET anthropic_api_key = NULL WHERE id = ?', [req.user.id]);
  const fallback = process.env.ANTHROPIC_API_KEY || '';
  res.json({
    success: true,
    configured: !!fallback && fallback.length > 10,
    masked: fallback ? fallback.slice(0, 10) + '...' + fallback.slice(-4) : '',
  });
});

// API 키 테스트 (간단한 API 호출로 유효성 확인)
router.post('/test-key', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const { apiKey } = req.body;
  const teacher = queryOne('SELECT anthropic_api_key FROM users WHERE id = ?', [req.user.id]);
  const decryptedTeacherKey = teacher?.anthropic_api_key ? decrypt(teacher.anthropic_api_key) : null;
  const key = apiKey || decryptedTeacherKey || process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return res.status(400).json({ valid: false, message: 'API 키가 없습니다' });
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: key });
    await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }],
    });
    res.json({ valid: true, message: 'API 키가 유효합니다' });
  } catch (err) {
    res.json({ valid: false, message: err.message || 'API 키가 유효하지 않습니다' });
  }
}));

// AI 코치 대화 (SSE 스트리밍)
router.post('/chat', requireAuth, asyncHandler(async (req, res) => {
  const { problemId, classroomId, message, code, conversationId } = req.body;

  if (!problemId || !message) {
    return res.status(400).json({ message: '문제 ID와 메시지가 필요합니다' });
  }

  // 문제 정보 가져오기
  const problem = queryOne('SELECT * FROM problems WHERE id = ?', [problemId]);
  if (!problem) {
    return res.status(404).json({ message: '문제를 찾을 수 없습니다' });
  }

  // AI 레벨 가져오기 (교실 설정, 기본 2)
  let aiLevel = 2;
  if (classroomId) {
    const cp = queryOne(
      'SELECT ai_level FROM classroom_problems WHERE classroom_id = ? AND problem_id = ?',
      [classroomId, problemId]
    );
    if (cp) aiLevel = cp.ai_level;
  }

  if (aiLevel === 0) {
    return res.status(403).json({ message: '이 문제에서는 AI 코치가 비활성화되어 있습니다' });
  }

  // 교사별 API 키 조회: classroomId → teacher_id → anthropic_api_key (복호화)
  let apiKey = process.env.ANTHROPIC_API_KEY;
  if (classroomId) {
    const classroom = queryOne('SELECT teacher_id FROM classrooms WHERE id = ?', [classroomId]);
    if (classroom) {
      const teacher = queryOne('SELECT anthropic_api_key FROM users WHERE id = ?', [classroom.teacher_id]);
      if (teacher?.anthropic_api_key) {
        apiKey = decrypt(teacher.anthropic_api_key);
      }
    }
  }

  if (!apiKey) {
    return res.status(403).json({ message: 'AI 코치를 사용하려면 교사가 API 키를 설정해야 합니다' });
  }

  // 일일 AI 사용량 제한 확인
  if (classroomId) {
    const classroomSettings = queryOne(
      'SELECT daily_ai_limit FROM classrooms WHERE id = ?',
      [classroomId]
    );
    const dailyLimit = classroomSettings?.daily_ai_limit || 0;

    if (dailyLimit > 0) {
      const todayCount = queryOne(
        `SELECT COUNT(*) as cnt FROM ai_usage_log
         WHERE user_id = ? AND classroom_id = ? AND created_at >= date('now')`,
        [req.user.id, classroomId]
      )?.cnt || 0;

      if (todayCount >= dailyLimit) {
        return res.status(429).json({
          message: '오늘의 AI 코치 사용 횟수를 모두 사용했어요. 내일 다시 시도해주세요!',
          remaining: 0,
          limit: dailyLimit,
        });
      }
    }
  }

  // 기존 대화 로드 또는 새 대화 생성
  let conversation;
  if (conversationId) {
    conversation = queryOne('SELECT * FROM ai_conversations WHERE id = ?', [conversationId]);
  }

  let messages = [];
  if (conversation) {
    messages = JSON.parse(conversation.messages_json || '[]');
  }

  // 새 메시지 추가
  messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

  // 시스템 프롬프트 빌드
  const systemPrompt = buildSystemPrompt({
    problem,
    studentCode: code,
    aiLevel,
    messageCount: messages.filter(m => m.role === 'user').length,
  });

  // SSE 설정
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let fullResponse = '';

  await streamChat({
    systemPrompt,
    messages: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
    apiKey,
    onText: (text) => {
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
    },
    onDone: () => {
      // AI 응답 저장
      messages.push({ role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() });

      const convId = conversationId || generateId();
      if (conversation) {
        execute(
          `UPDATE ai_conversations SET messages_json = ?, message_count = ?, updated_at = datetime('now') WHERE id = ?`,
          [JSON.stringify(messages), messages.length, convId]
        );
      } else {
        execute(
          `INSERT INTO ai_conversations (id, user_id, problem_id, classroom_id, messages_json, message_count)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [convId, req.user.id, problemId, classroomId || '', JSON.stringify(messages), messages.length]
        );
      }

      // AI 사용량 로그 기록
      if (classroomId) {
        execute(
          'INSERT INTO ai_usage_log (id, user_id, classroom_id, problem_id) VALUES (?, ?, ?, ?)',
          [generateId(), req.user.id, classroomId, problemId]
        );
      }

      res.write(`data: ${JSON.stringify({ type: 'done', conversationId: convId })}\n\n`);
      res.end();
    },
    onError: (errMsg) => {
      res.write(`data: ${JSON.stringify({ type: 'error', message: errMsg })}\n\n`);
      res.end();
    },
  });
}));

// 학생 일일 AI 사용량 조회
router.get('/usage-status', requireAuth, asyncHandler(async (req, res) => {
  const { classroomId } = req.query;

  if (!classroomId) {
    return res.json({ limit: 0, used: 0, remaining: null });
  }

  const classroom = queryOne(
    'SELECT daily_ai_limit FROM classrooms WHERE id = ?',
    [classroomId]
  );
  const dailyLimit = classroom?.daily_ai_limit || 0;

  if (dailyLimit === 0) {
    return res.json({ limit: 0, used: 0, remaining: null });
  }

  const todayCount = queryOne(
    `SELECT COUNT(*) as cnt FROM ai_usage_log
     WHERE user_id = ? AND classroom_id = ? AND created_at >= date('now')`,
    [req.user.id, classroomId]
  )?.cnt || 0;

  res.json({
    limit: dailyLimit,
    used: todayCount,
    remaining: Math.max(0, dailyLimit - todayCount),
  });
}));

// 대화 기록 조회
router.get('/conversations', requireAuth, asyncHandler(async (req, res) => {
  const { problemId, classroomId } = req.query;

  let sql = 'SELECT * FROM ai_conversations WHERE user_id = ?';
  const params = [req.user.id];

  if (problemId) {
    sql += ' AND problem_id = ?';
    params.push(problemId);
  }
  if (classroomId) {
    sql += ' AND classroom_id = ?';
    params.push(classroomId);
  }

  sql += ' ORDER BY updated_at DESC';

  const conversations = queryAll(sql, params);
  res.json(conversations.map(c => ({
    ...c,
    messages: JSON.parse(c.messages_json || '[]'),
  })));
}));

// 대화 요약 생성 (교사용)
router.post('/summarize/:conversationId', requireAuth, requireTeacher, asyncHandler(async (req, res) => {
  const conv = queryOne('SELECT * FROM ai_conversations WHERE id = ?', [req.params.conversationId]);
  if (!conv) {
    return res.status(404).json({ message: '대화를 찾을 수 없습니다' });
  }

  const problem = queryOne('SELECT title FROM problems WHERE id = ?', [conv.problem_id]);
  const teacher = queryOne('SELECT anthropic_api_key FROM users WHERE id = ?', [req.user.id]);
  const summaryApiKey = (teacher?.anthropic_api_key ? decrypt(teacher.anthropic_api_key) : null) || process.env.ANTHROPIC_API_KEY;
  const messages = JSON.parse(conv.messages_json || '[]');
  const summary = await generateConversationSummary(messages, problem?.title || '알 수 없음', summaryApiKey);

  if (summary) {
    execute('UPDATE ai_conversations SET summary = ? WHERE id = ?', [summary, conv.id]);
  }

  res.json({ summary });
}));

export default router;

import { Router } from 'express';
import { verifyGoogleToken } from '../services/googleAuth.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import { queryOne, execute, generateId } from '../db/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// 교사 이메일 화이트리스트 + DB 승인 상태 확인
function isTeacherAllowed(email) {
  const adminEmail = process.env.ADMIN_EMAIL || 'greatsong21@gmail.com';
  const allowedEmails = (process.env.TEACHER_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  if (adminEmail && !allowedEmails.includes(adminEmail)) {
    allowedEmails.push(adminEmail);
  }
  if (allowedEmails.includes(email)) return true;

  // DB에서 승인된 신청서 확인
  const approved = queryOne(
    "SELECT id FROM teacher_applications WHERE email = ? AND status = 'approved'",
    [email]
  );
  return !!approved;
}

// Google 로그인 / 회원가입
router.post('/google', asyncHandler(async (req, res) => {
  const { credential, role } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'credential이 필요합니다' });
  }

  const googleUser = await verifyGoogleToken(credential);

  // 기존 사용자 확인
  let user = queryOne('SELECT * FROM users WHERE google_id = ?', [googleUser.googleId]);

  // 기존 사용자가 화이트리스트에 있는데 student로 등록되어 있으면 자동 승격
  if (user && user.role === 'student' && isTeacherAllowed(googleUser.email)) {
    execute('UPDATE users SET role = ? WHERE id = ?', ['teacher', user.id]);
    user = queryOne('SELECT * FROM users WHERE id = ?', [user.id]);
  }

  if (!user) {
    // 새 사용자: 화이트리스트에 있으면 자동 교사 부여
    let userRole = 'student';
    if (isTeacherAllowed(googleUser.email)) {
      userRole = 'teacher';
    } else if (role === 'teacher') {
      return res.status(403).json({
        message: '아직 승인되지 않은 이메일입니다. 아래 신청서를 먼저 제출해 주세요.',
      });
    }
    const id = generateId();
    execute(
      `INSERT INTO users (id, google_id, email, name, avatar_url, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, googleUser.googleId, googleUser.email, googleUser.name, googleUser.avatarUrl, userRole]
    );
    user = queryOne('SELECT * FROM users WHERE id = ?', [id]);
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatar_url,
      currentLevel: user.current_level || 1,
    },
  });
}));

// 현재 사용자 조회 (새로고침 시 user 상태 복원)
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) {
    return res.status(401).json({ message: '사용자를 찾을 수 없습니다' });
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatar_url,
    currentLevel: user.current_level || 1,
  });
}));

// 프로필 수정 (이름 변경)
router.put('/profile', requireAuth, asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ message: '이름이 필요합니다' });
  }
  if (name.trim().length > 100) {
    return res.status(400).json({ message: '이름은 100자 이내로 입력하세요' });
  }
  execute('UPDATE users SET name = ? WHERE id = ?', [name.trim(), req.user.id]);
  const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatar_url,
    currentLevel: user.current_level || 1,
  });
}));

// 레벨업 (학생이 현재 레벨을 모두 완료했을 때)
router.post('/level-up', requireAuth, asyncHandler(async (req, res) => {
  const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });

  const currentLevel = user.current_level || 1;
  const MAX_LEVEL = 5;

  if (currentLevel >= MAX_LEVEL) {
    return res.status(400).json({ message: '이미 최고 레벨입니다!' });
  }

  // 현재 레벨의 문제집을 모두 풀었는지 확인
  const currentSet = queryOne(
    'SELECT * FROM problem_sets WHERE sort_order = ?',
    [currentLevel - 1]
  );

  if (currentSet) {
    const totalProblems = queryOne(
      `SELECT COUNT(*) as cnt FROM problem_set_items psi
       JOIN problems p ON p.id = psi.problem_id
       WHERE psi.set_id = ? AND p.status = 'approved'`,
      [currentSet.id]
    );
    const solvedProblems = queryOne(
      `SELECT COUNT(DISTINCT s.problem_id) as cnt
       FROM submissions s
       JOIN problem_set_items psi ON psi.problem_id = s.problem_id
       WHERE psi.set_id = ? AND s.user_id = ? AND s.passed = 1`,
      [currentSet.id, req.user.id]
    );
    if (solvedProblems.cnt < totalProblems.cnt) {
      return res.status(400).json({
        message: `현재 레벨 문제를 모두 풀어야 레벨업할 수 있어요! (${solvedProblems.cnt}/${totalProblems.cnt})`,
      });
    }
  }

  const newLevel = currentLevel + 1;
  execute('UPDATE users SET current_level = ? WHERE id = ?', [newLevel, req.user.id]);

  res.json({ currentLevel: newLevel, message: `레벨 ${newLevel}로 올라갔어요! 🎉` });
}));

// 교사 계정 신청
router.post('/teacher-apply', asyncHandler(async (req, res) => {
  const { name, email, school, region, motivation, privacyConsent } = req.body;

  if (!name || !email || !school || !region || !motivation) {
    return res.status(400).json({ message: '모든 필수 항목을 입력해 주세요.' });
  }
  if (!privacyConsent) {
    return res.status(400).json({ message: '개인정보 수집·이용에 동의해 주세요.' });
  }
  // 입력 길이 제한
  if (name.length > 100 || email.length > 200 || school.length > 200 || region.length > 100) {
    return res.status(400).json({ message: '입력이 너무 깁니다.' });
  }
  if (motivation.length > 2000) {
    return res.status(400).json({ message: '지원 동기는 2000자 이내로 작성해 주세요.' });
  }

  const existing = queryOne('SELECT id FROM teacher_applications WHERE email = ? AND status = ?', [email, 'pending']);
  if (existing) {
    return res.status(409).json({ message: '이미 접수된 신청서가 있습니다. 승인을 기다려 주세요.' });
  }

  const id = generateId();
  execute(
    `INSERT INTO teacher_applications (id, name, email, school, region, motivation, privacy_consent)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [id, name.trim(), email.trim(), school.trim(), region, motivation.trim()]
  );

  res.json({ message: '교사 계정 신청이 접수되었습니다. 검토 후 이메일로 안내드리겠습니다.' });
}));

// 데모 로그인 (체험용) — 프로덕션에서는 차단, role은 student 고정
router.post('/demo', asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: '프로덕션에서는 데모 로그인을 사용할 수 없습니다' });
  }

  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: '이름이 필요합니다' });
  }
  if (name.length > 100) {
    return res.status(400).json({ message: '이름은 100자 이내로 입력하세요' });
  }

  const safeName = name.trim().slice(0, 100);
  const demoRole = 'student'; // 보안: 데모 로그인은 학생만 허용
  const demoId = `demo-${safeName}-${Date.now()}`;
  let user = queryOne('SELECT * FROM users WHERE google_id = ?', [`demo-${safeName}-student`]);

  if (!user) {
    const id = generateId();
    execute(
      `INSERT INTO users (id, google_id, email, name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [id, `demo-${safeName}-student`, `${safeName}@demo.local`, safeName, demoRole]
    );
    user = queryOne('SELECT * FROM users WHERE id = ?', [id]);
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatar_url,
      currentLevel: user.current_level || 1,
    },
  });
}));

export default router;

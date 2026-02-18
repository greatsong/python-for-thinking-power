import { Router } from 'express';
import { verifyGoogleToken } from '../services/googleAuth.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import { queryOne, execute, generateId } from '../db/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// 교사 이메일 화이트리스트 확인
function isTeacherAllowed(email) {
  const allowedEmails = (process.env.TEACHER_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  return allowedEmails.includes(email);
}

// Google 로그인 / 회원가입
router.post('/google', asyncHandler(async (req, res) => {
  const { credential, role } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'credential이 필요합니다' });
  }

  const googleUser = await verifyGoogleToken(credential);

  // 기존 사용자 확인 (기존 사용자는 역할 유지)
  let user = queryOne('SELECT * FROM users WHERE google_id = ?', [googleUser.googleId]);

  if (!user) {
    // 새 사용자: 교사는 이메일 화이트리스트 확인
    let userRole = 'student';
    if (role === 'teacher') {
      if (isTeacherAllowed(googleUser.email)) {
        userRole = 'teacher';
      } else {
        const adminEmail = process.env.ADMIN_EMAIL || 'greatsong21@gmail.com';
        return res.status(403).json({
          message: `교사 계정 신청은 ${adminEmail} 으로 이메일을 보내주세요.`,
        });
      }
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
  });
}));

// 프로필 수정 (이름 변경)
router.put('/profile', requireAuth, asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ message: '이름이 필요합니다' });
  }
  execute('UPDATE users SET name = ? WHERE id = ?', [name.trim(), req.user.id]);
  const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatar_url,
  });
}));

// 데모 로그인 (체험용)
router.post('/demo', asyncHandler(async (req, res) => {
  const { name, role } = req.body;

  if (!name) {
    return res.status(400).json({ message: '이름이 필요합니다' });
  }

  const demoId = `demo-${name}-${role}`;
  let user = queryOne('SELECT * FROM users WHERE google_id = ?', [demoId]);

  if (!user) {
    const id = generateId();
    execute(
      `INSERT INTO users (id, google_id, email, name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [id, demoId, `${name}@demo.local`, name, role || 'student']
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
    },
  });
}));

export default router;

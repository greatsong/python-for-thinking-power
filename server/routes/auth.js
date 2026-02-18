import { Router } from 'express';
import { verifyGoogleToken } from '../services/googleAuth.js';
import { generateToken } from '../middleware/auth.js';
import { queryOne, execute, generateId } from '../db/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Google 로그인 / 회원가입
router.post('/google', asyncHandler(async (req, res) => {
  const { credential, role } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'credential이 필요합니다' });
  }

  const googleUser = await verifyGoogleToken(credential);

  // 기존 사용자 확인
  let user = queryOne(
    'SELECT * FROM users WHERE google_id = ?',
    [googleUser.googleId]
  );

  if (!user) {
    // 새 사용자 생성
    const id = generateId();
    const userRole = role || 'student';
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

// 데모 로그인 (개발용)
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

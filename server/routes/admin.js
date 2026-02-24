import { Router } from 'express';
import { requireAuth, requireTeacher, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { queryOne, queryAll, execute } from '../db/database.js';
import { sendApprovalEmail, sendRejectionEmail } from '../services/emailService.js';

const router = Router();

// 신청 통계
router.get('/stats', requireAuth, requireTeacher, requireAdmin, asyncHandler(async (req, res) => {
  const pending = queryOne("SELECT COUNT(*) as cnt FROM teacher_applications WHERE status = 'pending'");
  const approved = queryOne("SELECT COUNT(*) as cnt FROM teacher_applications WHERE status = 'approved'");
  const rejected = queryOne("SELECT COUNT(*) as cnt FROM teacher_applications WHERE status = 'rejected'");

  res.json({
    pending: pending.cnt,
    approved: approved.cnt,
    rejected: rejected.cnt,
    total: pending.cnt + approved.cnt + rejected.cnt,
  });
}));

// 신청 목록
router.get('/applications', requireAuth, requireTeacher, requireAdmin, asyncHandler(async (req, res) => {
  const { status = 'all', search = '', page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  let where = '1=1';
  const params = [];

  if (status !== 'all') {
    where += ' AND status = ?';
    params.push(status);
  }

  if (search.trim()) {
    where += ' AND (name LIKE ? OR email LIKE ? OR school LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  const total = queryOne(`SELECT COUNT(*) as cnt FROM teacher_applications WHERE ${where}`, params);
  const applications = queryAll(
    `SELECT * FROM teacher_applications WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  res.json({
    applications,
    total: total.cnt,
    page: pageNum,
    totalPages: Math.ceil(total.cnt / limitNum),
  });
}));

// 승인 처리
router.put('/applications/:id/approve', requireAuth, requireTeacher, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const app = queryOne('SELECT * FROM teacher_applications WHERE id = ?', [id]);

  if (!app) {
    return res.status(404).json({ message: '신청서를 찾을 수 없습니다' });
  }
  if (app.status !== 'pending') {
    return res.status(400).json({ message: '이미 처리된 신청서입니다' });
  }

  // 신청 상태 업데이트
  execute(
    `UPDATE teacher_applications SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?`,
    [req.user.id, id]
  );

  // 이미 가입된 사용자가 있으면 교사로 승격
  const existingUser = queryOne('SELECT id FROM users WHERE email = ?', [app.email]);
  if (existingUser) {
    execute('UPDATE users SET role = ? WHERE id = ?', ['teacher', existingUser.id]);
  }

  // 이메일 발송 (실패해도 승인은 유지)
  await sendApprovalEmail(app);

  res.json({ message: `${app.name} 선생님의 교사 계정이 승인되었습니다` });
}));

// 거절 처리
router.put('/applications/:id/reject', requireAuth, requireTeacher, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};
  const app = queryOne('SELECT * FROM teacher_applications WHERE id = ?', [id]);

  if (!app) {
    return res.status(404).json({ message: '신청서를 찾을 수 없습니다' });
  }
  if (app.status !== 'pending') {
    return res.status(400).json({ message: '이미 처리된 신청서입니다' });
  }

  const trimmedReason = (reason || '').trim().slice(0, 500);

  execute(
    `UPDATE teacher_applications SET status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?`,
    [trimmedReason || null, req.user.id, id]
  );

  // 이메일 발송용 데이터
  const updatedApp = { ...app, rejection_reason: trimmedReason };
  await sendRejectionEmail(updatedApp);

  res.json({ message: `${app.name} 선생님의 신청이 거절 처리되었습니다` });
}));

export default router;

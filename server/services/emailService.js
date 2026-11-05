import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const APP_URL = process.env.CLIENT_URL || 'https://pythink.vercel.app';

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function approvalTemplate(application) {
  const name = escapeHtml(application.name);
  const email = escapeHtml(application.email);
  return `
<div style="max-width:480px;margin:0 auto;font-family:system-ui,-apple-system,sans-serif;color:#1e293b;">
  <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;font-size:20px;margin:0;">🐍 사고력을 위한 파이썬</h1>
  </div>
  <div style="padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:18px;margin:0 0 12px;">교사 계정이 승인되었습니다 ✅</h2>
    <p style="font-size:14px;line-height:1.6;color:#475569;">
      ${name} 선생님, 안녕하세요!<br><br>
      신청하신 교사 계정이 승인되었습니다.<br>
      아래 버튼을 클릭하여 교사 대시보드에 접속해 보세요.
    </p>
    <a href="${APP_URL}/apply"
       style="display:inline-block;margin:24px 0;padding:12px 28px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
      교사 로그인
    </a>
    <p style="font-size:12px;color:#94a3b8;margin-top:24px;">
      신청 시 입력하신 Google 계정(${email})으로 로그인해 주세요.
    </p>
  </div>
</div>`;
}

function rejectionTemplate(application) {
  const name = escapeHtml(application.name);
  const reason = escapeHtml(application.rejection_reason);
  return `
<div style="max-width:480px;margin:0 auto;font-family:system-ui,-apple-system,sans-serif;color:#1e293b;">
  <div style="background:linear-gradient(135deg,#64748b,#475569);padding:32px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;font-size:20px;margin:0;">🐍 사고력을 위한 파이썬</h1>
  </div>
  <div style="padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="font-size:18px;margin:0 0 12px;">교사 계정 신청 결과 안내</h2>
    <p style="font-size:14px;line-height:1.6;color:#475569;">
      ${name} 선생님, 안녕하세요.<br><br>
      검토 결과, 현재 교사 계정 발급이 어려운 상황입니다.
    </p>
    ${reason ? `
    <div style="margin:16px 0;padding:16px;background:#f8fafc;border-left:3px solid #94a3b8;border-radius:4px;">
      <p style="font-size:13px;color:#64748b;margin:0;">
        <strong>사유:</strong> ${reason}
      </p>
    </div>` : ''}
    <p style="font-size:14px;line-height:1.6;color:#475569;">
      궁금한 점이 있으시면 관리자에게 문의해 주세요.<br>
      재신청은 언제든지 가능합니다.
    </p>
  </div>
</div>`;
}

export async function sendApprovalEmail(application) {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY 미설정 — 승인 이메일 발송 건너뜀');
    return;
  }
  try {
    await resend.emails.send({
      from: `사고력 파이썬 <${FROM_EMAIL}>`,
      to: application.email,
      subject: '[사고력 파이썬] 교사 계정이 승인되었습니다',
      html: approvalTemplate(application),
    });
    console.log(`[Email] 승인 이메일 발송 완료: 신청 ${application.id}`);
  } catch (err) {
    console.error(`[Email] 승인 이메일 발송 실패: 신청 ${application.id}`, err.message);
  }
}

export async function sendRejectionEmail(application) {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY 미설정 — 거절 이메일 발송 건너뜀');
    return;
  }
  try {
    await resend.emails.send({
      from: `사고력 파이썬 <${FROM_EMAIL}>`,
      to: application.email,
      subject: '[사고력 파이썬] 교사 계정 신청 결과 안내',
      html: rejectionTemplate(application),
    });
    console.log(`[Email] 거절 이메일 발송 완료: 신청 ${application.id}`);
  } catch (err) {
    console.error(`[Email] 거절 이메일 발송 실패: 신청 ${application.id}`, err.message);
  }
}

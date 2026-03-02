import { OAuth2Client } from 'google-auth-library';

let client = null;

function getClient() {
  if (!client) {
    client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return client;
}

export async function verifyGoogleToken(idToken) {
  try {
    const ticket = await getClient().verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture,
    };
  } catch (err) {
    // 프로덕션에서는 데모 모드 차단
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Google 인증 실패');
    }
    // 개발 환경에서만 GOOGLE_CLIENT_ID가 없거나 유효하지 않은 값이면 데모 모드
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const isDemoMode = !clientId || clientId === 'demo-mode' || !clientId.endsWith('.apps.googleusercontent.com');
    if (isDemoMode) {
      return parseDemoToken(idToken);
    }
    throw new Error('Google 토큰 검증 실패');
  }
}

// 개발/데모용: 구글 로그인 없이 사용 가능
function parseDemoToken(token) {
  try {
    const data = JSON.parse(atob(token));
    return {
      googleId: data.id || `demo-${Date.now()}`,
      email: data.email || `demo@test.com`,
      name: data.name || '데모 사용자',
      avatarUrl: null,
    };
  } catch {
    return {
      googleId: `demo-${Date.now()}`,
      email: 'demo@test.com',
      name: '데모 사용자',
      avatarUrl: null,
    };
  }
}

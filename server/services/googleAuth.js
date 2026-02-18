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
    // 개발 환경에서 GOOGLE_CLIENT_ID가 없으면 데모 모드
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your-google-client-id.apps.googleusercontent.com') {
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

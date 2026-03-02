import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // NIST SP 800-38D 권장값
const SALT_LENGTH = 16;

// 시작 시 경고
if (!process.env.ENCRYPTION_KEY) {
  console.warn('[보안 경고] ENCRYPTION_KEY 환경변수가 설정되지 않았습니다. API 키가 평문으로 저장됩니다.');
}

function deriveKey(salt) {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) return null;
  return scryptSync(secret, salt, 32);
}

// 레거시 호환: 고정 salt 키 (기존 암호문 복호화용)
function getLegacyKey() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) return null;
  return scryptSync(secret, 'pythink-salt', 32);
}

/**
 * 평문을 AES-256-GCM으로 암호화 (랜덤 salt 사용)
 * ENCRYPTION_KEY 환경변수가 없으면 평문 그대로 반환 (개발용)
 */
export function encrypt(plaintext) {
  if (!plaintext) return null;
  if (!process.env.ENCRYPTION_KEY) return plaintext;

  const salt = randomBytes(SALT_LENGTH);
  const key = deriveKey(salt);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // enc2:salt:iv:tag:encrypted (hex) — v2 형식 (랜덤 salt)
  return `enc2:${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * 암호문을 복호화
 * enc2: → 랜덤 salt (신규), enc: → 고정 salt (레거시), 그 외 → 평문
 */
export function decrypt(ciphertext) {
  if (!ciphertext) return null;

  // v2 형식 (랜덤 salt)
  if (ciphertext.startsWith('enc2:')) {
    if (!process.env.ENCRYPTION_KEY) throw new Error('ENCRYPTION_KEY가 설정되지 않았습니다');
    const parts = ciphertext.split(':');
    const salt = Buffer.from(parts[1], 'hex');
    const iv = Buffer.from(parts[2], 'hex');
    const tag = Buffer.from(parts[3], 'hex');
    const encrypted = Buffer.from(parts[4], 'hex');
    const key = deriveKey(salt);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
  }

  // 레거시 형식 (고정 salt)
  if (ciphertext.startsWith('enc:')) {
    const key = getLegacyKey();
    if (!key) throw new Error('ENCRYPTION_KEY가 설정되지 않았습니다');
    const parts = ciphertext.split(':');
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = Buffer.from(parts[3], 'hex');
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
  }

  // 평문 그대로
  return ciphertext;
}

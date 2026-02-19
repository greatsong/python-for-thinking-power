import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) return null;
  // scrypt로 32바이트 키 파생
  return scryptSync(secret, 'pythink-salt', 32);
}

/**
 * 평문을 AES-256-GCM으로 암호화
 * ENCRYPTION_KEY 환경변수가 없으면 평문 그대로 반환 (개발용)
 */
export function encrypt(plaintext) {
  if (!plaintext) return null;
  const key = getKey();
  if (!key) return plaintext; // 암호화 키 미설정 시 평문 저장

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // iv:tag:encrypted (hex)
  return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * 암호문을 복호화
 * enc: 접두사가 없으면 평문으로 간주 (마이그레이션 호환)
 */
export function decrypt(ciphertext) {
  if (!ciphertext) return null;
  if (!ciphertext.startsWith('enc:')) return ciphertext; // 평문 그대로

  const key = getKey();
  if (!key) throw new Error('ENCRYPTION_KEY가 설정되지 않았습니다');

  const parts = ciphertext.split(':');
  const iv = Buffer.from(parts[1], 'hex');
  const tag = Buffer.from(parts[2], 'hex');
  const encrypted = Buffer.from(parts[3], 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

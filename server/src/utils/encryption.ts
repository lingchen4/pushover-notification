import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT = 'pushover-dashboard-salt'; // static salt; key is secret

function getKey(): Buffer {
  const secret = process.env['ENCRYPTION_KEY'];
  if (!secret) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return scryptSync(secret, SALT, 32) as Buffer;
}

/** Returns a prefixed ciphertext string, or the original value if empty/already encrypted. */
export function encrypt(plaintext: string): string {
  if (!plaintext || plaintext.startsWith('enc:')) return plaintext;
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // format: enc:<iv_hex>:<tag_hex>:<ciphertext_hex>
  return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/** Decrypts a previously encrypted string, or returns it as-is if not encrypted. */
export function decrypt(value: string): string {
  if (!value || !value.startsWith('enc:')) return value;
  const key = getKey();
  const parts = value.split(':');
  if (parts.length !== 4) return value;
  const ivHex = parts[1] as string;
  const tagHex = parts[2] as string;
  const dataHex = parts[3] as string;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final('utf8');
}

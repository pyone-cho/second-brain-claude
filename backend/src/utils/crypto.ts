import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Derive a 256-bit key from the ENCRYPTION_KEY env variable.
 * Falls back to a random key in dev (logs a warning).
 */
function getKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey) {
    // Use a fixed salt derived from the key itself for deterministic derivation
    const salt = Buffer.alloc(SALT_LENGTH, 0);
    return scryptSync(envKey, salt, KEY_LENGTH);
  }

  // Dev fallback: generate a random key (not persistent across restarts)
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[CRYPTO] No ENCRYPTION_KEY set — using random key (passwords will not survive restart)');
    return randomBytes(KEY_LENGTH);
  }

  throw new Error('ENCRYPTION_KEY environment variable is required in production');
}

const key = getKey();

/**
 * Encrypt a plaintext string. Returns a base64-encoded string containing
 * salt + IV + auth tag + ciphertext.
 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Pack: IV (16) + tag (16) + ciphertext
  const packed = Buffer.concat([iv, tag, encrypted]);
  return packed.toString('base64');
}

/**
 * Decrypt a base64-encoded string produced by `encrypt()`.
 */
export function decrypt(encoded: string): string {
  const packed = Buffer.from(encoded, 'base64');

  const iv = packed.subarray(0, IV_LENGTH);
  const tag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Check if a string looks like an encrypted value (base64, minimum length).
 * Used to avoid double-encrypting already-encrypted values.
 */
export function isEncrypted(value: string): boolean {
  if (value.length < 44) return false; // min: 16+16+1 = 33 bytes = 44 base64 chars
  try {
    const buf = Buffer.from(value, 'base64');
    return buf.length >= IV_LENGTH + TAG_LENGTH + 1 && buf.toString('base64') === value;
  } catch {
    return false;
  }
}

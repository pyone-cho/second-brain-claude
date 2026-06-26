import { createHmac } from 'node:crypto';

// ---------------------------------------------------------------------------
// JWT helpers — pure Node.js, no external dependencies
// Uses HS256 (HMAC-SHA256) for signing.
// ---------------------------------------------------------------------------

function base64urlEncode(data: string | Buffer): string {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(str: string): Buffer {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64');
}

export interface JwtPayload {
  sub: string;   // user ID
  iat: number;   // issued at (seconds)
  exp: number;   // expiry (seconds)
}

/**
 * Sign a JWT token.
 * @param payload — claims to include (sub is required)
 * @param secret — HMAC secret key
 * @param expiresInSec — token lifetime in seconds (default 7 days)
 */
export function signToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  secret: string,
  expiresInSec: number = 7 * 24 * 60 * 60,
): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSec,
  };

  const header = base64urlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64urlEncode(JSON.stringify(fullPayload));
  const signatureInput = `${header}.${body}`;
  const signature = createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64url');

  return `${signatureInput}.${signature}`;
}

/**
 * Verify and decode a JWT token.
 * Returns the payload if valid, or null if expired/invalid.
 */
export function verifyToken(token: string, secret: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;

    // Verify signature
    const signatureInput = `${header}.${body}`;
    const expectedSig = createHmac('sha256', secret)
      .update(signatureInput)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    // Decode payload
    const payload = JSON.parse(base64urlDecode(body).toString('utf8')) as JwtPayload;

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

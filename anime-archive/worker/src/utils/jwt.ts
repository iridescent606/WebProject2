import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

export interface JwtPayload {
  userId: string;
  role: string;
}

function getSecret(secretName: string): Uint8Array {
  // In Cloudflare Workers, secrets are injected as env vars
  // We'll pass them from the context
  return new TextEncoder().encode(secretName);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signAccessToken(
  payload: JwtPayload,
  secret: string
): Promise<string> {
  const encoded = new TextEncoder().encode(secret);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .sign(encoded);
}

export async function signRefreshToken(
  payload: JwtPayload & { tokenId: string },
  secret: string
): Promise<string> {
  const encoded = new TextEncoder().encode(secret);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(encoded);
}

export async function verifyAccessToken(
  token: string,
  secret: string
): Promise<JwtPayload> {
  const encoded = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, encoded);
  return payload as any as JwtPayload;
}

export async function verifyRefreshToken(
  token: string,
  secret: string
): Promise<JwtPayload & { tokenId: string }> {
  const encoded = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, encoded);
  return payload as any;
}

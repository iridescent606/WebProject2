import { Context, Next } from 'hono';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthContext {
  userId?: string;
  userRole?: string;
}

export async function authenticate(c: Context, next: Next): Promise<Response | void> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'No token provided' }, 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = (c.env as any).JWT_ACCESS_SECRET as string;
    const payload = await verifyAccessToken(token, secret);
    c.set('userId', payload.userId);
    c.set('userRole', payload.role);
    await next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}

export async function optionalAuth(c: Context, next: Next): Promise<void> {
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const secret = (c.env as any).JWT_ACCESS_SECRET as string;
      const payload = await verifyAccessToken(token, secret);
      c.set('userId', payload.userId);
      c.set('userRole', payload.role);
    } catch {
      // Token invalid, continue without auth
    }
  }
  await next();
}

export async function requireAdmin(c: Context, next: Next): Promise<Response | void> {
  const role = c.get('userRole');
  if (role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  await next();
}

import { Hono } from 'hono';
import { eq, or } from 'drizzle-orm';
import { users, refreshTokens } from '../db/schema';
import { getDB } from '../db';
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';

export function authRoutes() {
  const router = new Hono<{ Bindings: { DB: D1Database; JWT_ACCESS_SECRET: string; JWT_REFRESH_SECRET: string } }>();

  async function generateAndStoreTokens(c: any, userId: string, role: string) {
    const db = getDB(c.env.DB);
    const accessSecret = c.env.JWT_ACCESS_SECRET;
    const refreshSecret = c.env.JWT_REFRESH_SECRET;

    const tokenId = crypto.randomUUID();
    const accessToken = await signAccessToken({ userId, role }, accessSecret);
    const refreshToken = await signRefreshToken({ userId, role, tokenId }, refreshSecret);

    await db.insert(refreshTokens).values({
      token: refreshToken,
      userId,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    return { accessToken, refreshToken };
  }

  // POST /api/auth/register
  router.post('/register', async (c) => {
    try {
      const db = getDB(c.env.DB);
      const { email, username, password } = await c.req.json();

      if (!email || !username || !password) {
        return c.json({ error: 'Email, username and password are required' }, 400);
      }
      if (password.length < 6) {
        return c.json({ error: 'Password must be at least 6 characters' }, 400);
      }

      const existingUser = await db.query.users.findFirst({
        where: or(eq(users.email, email), eq(users.username, username)),
      });

      if (existingUser) {
        return c.json({ error: 'User with this email or username already exists' }, 409);
      }

      const hashedPassword = await hashPassword(password);
      const id = crypto.randomUUID();
      const now = Date.now();

      await db.insert(users).values({
        id,
        email,
        username,
        password: hashedPassword,
        role: 'user',
        createdAt: now,
        updatedAt: now,
      });

      const tokens = await generateAndStoreTokens(c, id, 'user');

      return c.json({ user: { id, email, username, role: 'user', createdAt: now }, ...tokens }, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // POST /api/auth/login
  router.post('/login', async (c) => {
    try {
      const db = getDB(c.env.DB);
      const { login, password } = await c.req.json();

      if (!login || !password) {
        return c.json({ error: 'Email/username and password are required' }, 400);
      }

      const user = await db.query.users.findFirst({
        where: or(eq(users.email, login), eq(users.username, login)),
      });

      if (!user) return c.json({ error: 'Invalid credentials' }, 401);

      const valid = await verifyPassword(password, user.password);
      if (!valid) return c.json({ error: 'Invalid credentials' }, 401);

      const tokens = await generateAndStoreTokens(c, user.id, user.role);

      return c.json({
        user: { id: user.id, email: user.email, username: user.username, role: user.role, avatar: user.avatar },
        ...tokens,
      });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // POST /api/auth/refresh
  router.post('/refresh', async (c) => {
    try {
      const db = getDB(c.env.DB);
      const { refreshToken } = await c.req.json();
      if (!refreshToken) return c.json({ error: 'Refresh token is required' }, 400);

      const refreshSecret = c.env.JWT_REFRESH_SECRET;
      const decoded = await verifyRefreshToken(refreshToken, refreshSecret);

      const storedToken = await db.query.refreshTokens.findFirst({
        where: eq(refreshTokens.token, refreshToken),
      });

      if (!storedToken || storedToken.expiresAt < Date.now()) {
        if (storedToken) await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));
        return c.json({ error: 'Invalid or expired refresh token' }, 401);
      }

      await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));

      const user = await db.query.users.findFirst({ where: eq(users.id, decoded.userId) });
      if (!user) return c.json({ error: 'User not found' }, 401);

      const tokens = await generateAndStoreTokens(c, user.id, user.role);
      return c.json(tokens);
    } catch {
      return c.json({ error: 'Invalid token' }, 401);
    }
  });

  // POST /api/auth/logout
  router.post('/logout', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const body = await c.req.json().catch(() => ({}));
      const { refreshToken } = body;
      const userId = c.get('userId') as string;

      if (refreshToken) await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
      await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));

      return c.json({ message: 'Logged out successfully' });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // GET /api/auth/me
  router.get('/me', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const userId = c.get('userId') as string;
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { id: true, email: true, username: true, role: true, avatar: true, bio: true, createdAt: true },
      });
      if (!user) return c.json({ error: 'User not found' }, 404);
      return c.json(user);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  return router;
}

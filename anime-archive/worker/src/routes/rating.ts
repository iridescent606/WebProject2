import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { ratings } from '../db/schema';
import { getDB } from '../db';
import { authenticate } from '../middleware/auth';

export function ratingRoutes() {
  const router = new Hono<{ Bindings: { DB: D1Database } }>();

  router.post('/:characterId', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const characterId = c.req.param('characterId');
      const userId = c.get('userId') as string;
      const { score } = await c.req.json();

      if (!score || score < 1 || score > 5) return c.json({ error: 'Score must be 1-5' }, 400);

      const existing = await db.query.ratings.findFirst({
        where: and(eq(ratings.userId, userId), eq(ratings.characterId, characterId)),
      });

      if (existing) {
        await db.update(ratings).set({ score }).where(eq(ratings.id, existing.id));
      } else {
        await db.insert(ratings).values({
          id: crypto.randomUUID(), userId, characterId, score, createdAt: Date.now(),
        });
      }

      const allRatings = await db.query.ratings.findMany({ where: eq(ratings.characterId, characterId) });
      const avg = allRatings.length ? allRatings.reduce((s, r) => s + r.score, 0) / allRatings.length : 0;

      return c.json({ rating: { userId, characterId, score }, avgRating: avg });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  router.get('/:characterId', async (c) => {
    try {
      const db = getDB(c.env.DB);
      const characterId = c.req.param('characterId');
      const all = await db.query.ratings.findMany({ where: eq(ratings.characterId, characterId) });
      const avg = all.length ? all.reduce((s, r) => s + r.score, 0) / all.length : 0;
      const dist = [1, 2, 3, 4, 5].map(score => ({ score, count: all.filter(r => r.score === score).length }));

      return c.json({ avgRating: avg, totalRatings: all.length, distribution: dist });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  return router;
}

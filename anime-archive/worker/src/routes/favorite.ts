import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { favorites, characters, characterImages } from '../db/schema';
import { getDB } from '../db';
import { authenticate } from '../middleware/auth';

export function favoriteRoutes() {
  const router = new Hono<{ Bindings: { DB: D1Database } }>();

  router.post('/:characterId', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const characterId = c.req.param('characterId');
      const userId = c.get('userId') as string;
      const { collection = 'default' } = await c.req.json().catch(() => ({}));

      const existing = await db.query.favorites.findFirst({
        where: and(eq(favorites.userId, userId), eq(favorites.characterId, characterId)),
      });

      if (existing) {
        await db.delete(favorites).where(eq(favorites.id, existing.id));
        return c.json({ favorited: false });
      }

      await db.insert(favorites).values({
        id: crypto.randomUUID(), userId, characterId, collection, createdAt: Date.now(),
      });
      return c.json({ favorited: true });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  router.get('/', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const page = Number(c.req.query('page') || '1');
      const limit = Number(c.req.query('limit') || '20');
      const collection = c.req.query('collection');
      const userId = c.get('userId') as string;
      const offset = (page - 1) * limit;

      let query = db.select().from(favorites).where(eq(favorites.userId, userId)).$dynamic();
      if (collection) query = query.where(eq(favorites.collection, collection));

      const data = await query.orderBy(sql`${favorites.createdAt} DESC`).limit(limit).offset(offset);
      const total = await db.$count(favorites, eq(favorites.userId, userId));

      const enriched = await Promise.all(
        data.map(async (fav) => {
          const character = await db.query.characters.findFirst({
            where: eq(characters.id, fav.characterId),
            with: {
              images: { limit: 1, orderBy: sql`${characterImages.sortOrder} ASC` },
              tags: { with: { tag: true } },
            },
          });
          return { ...fav, character };
        })
      );

      return c.json({ data: enriched, total, page, limit });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  router.get('/collections/list', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const userId = c.get('userId') as string;
      const allFavs = await db.query.favorites.findMany({
        where: eq(favorites.userId, userId), columns: { collection: true },
      });
      return c.json([...new Set(allFavs.map(f => f.collection))]);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  return router;
}

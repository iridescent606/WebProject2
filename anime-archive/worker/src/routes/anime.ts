import { Hono } from 'hono';
import { eq, like, sql } from 'drizzle-orm';
import { animeSeries, characters, characterImages } from '../db/schema';
import { getDB } from '../db';
import { authenticate } from '../middleware/auth';

export function animeRoutes() {
  const router = new Hono<{ Bindings: { DB: D1Database } }>();

  // GET /api/anime
  router.get('/', async (c) => {
    try {
      const db = getDB(c.env.DB);
      const page = Number(c.req.query('page') || '1');
      const limit = Number(c.req.query('limit') || '20');
      const search = c.req.query('search');
      const genre = c.req.query('genre');
      const offset = (page - 1) * limit;

      let query = db.select().from(animeSeries).$dynamic();
      if (search) query = query.where(like(animeSeries.title, `%${search}%`));
      if (genre) query = query.where(like(animeSeries.genre, `%${genre}%`));

      const data = await query.orderBy(sql`${animeSeries.updatedAt} DESC`).limit(limit).offset(offset);
      const total = await db.$count(animeSeries);

      const result = await Promise.all(
        data.map(async (anime) => {
          const charCount = await db.$count(characters, eq(characters.animeId, anime.id));
          return { ...anime, _count: { characters: charCount } };
        })
      );

      return c.json({ data: result, total, page, limit });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // POST /api/anime
  router.post('/', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const body = await c.req.json();
      if (!body.title) return c.json({ error: 'Title is required' }, 400);

      const id = crypto.randomUUID();
      const now = Date.now();
      const data = {
        id, title: body.title,
        titleJp: body.titleJp || null, description: body.description || null,
        coverImage: body.coverImage || null, genre: body.genre || null,
        episodeCount: body.episodeCount || null, studio: body.studio || null,
        releaseDate: body.releaseDate ? new Date(body.releaseDate).getTime() : null,
        createdAt: now, updatedAt: now,
      };
      await db.insert(animeSeries).values(data);
      return c.json(data, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // GET /api/anime/:id
  router.get('/:id', async (c) => {
    try {
      const db = getDB(c.env.DB);
      const id = c.req.param('id');
      const anime = await db.query.animeSeries.findFirst({ where: eq(animeSeries.id, id) });
      if (!anime) return c.json({ error: 'Not found' }, 404);

      const charList = await db.query.characters.findMany({
        where: eq(characters.animeId, id),
        orderBy: sql`${characters.name} ASC`,
        with: {
          images: { limit: 1, orderBy: sql`${characterImages.sortOrder} ASC` },
          tags: { with: { tag: true } },
        },
      });

      return c.json({ ...anime, characters: charList });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // PUT /api/anime/:id
  router.put('/:id', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const id = c.req.param('id');
      const body = await c.req.json();
      const updateData: any = { updatedAt: Date.now() };
      for (const key of ['title', 'titleJp', 'description', 'coverImage', 'genre', 'studio']) {
        if (body[key] !== undefined) updateData[key] = body[key];
      }
      if (body.episodeCount !== undefined) updateData.episodeCount = body.episodeCount;
      if (body.releaseDate !== undefined) updateData.releaseDate = new Date(body.releaseDate).getTime();
      const updated = await db.update(animeSeries).set(updateData).where(eq(animeSeries.id, id)).returning();
      if (!updated.length) return c.json({ error: 'Not found' }, 404);
      return c.json(updated[0]);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // DELETE /api/anime/:id
  router.delete('/:id', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      await db.delete(animeSeries).where(eq(animeSeries.id, c.req.param('id')));
      return c.json({ message: 'Deleted' });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  return router;
}

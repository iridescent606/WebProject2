import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { tags } from '../db/schema';
import { getDB } from '../db';
import { authenticate } from '../middleware/auth';

export function tagRoutes() {
  const router = new Hono<{ Bindings: { DB: D1Database } }>();

  router.get('/', async (c) => {
    try {
      const db = getDB(c.env.DB);
      const allTags = await db.select().from(tags).orderBy(tags.name);
      return c.json(allTags);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  router.post('/', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const body = await c.req.json();
      if (!body.name) return c.json({ error: 'Tag name is required' }, 400);

      const existing = await db.query.tags.findFirst({ where: eq(tags.name, body.name) });
      if (existing) return c.json({ error: 'Tag already exists' }, 409);

      const id = crypto.randomUUID();
      const now = Date.now();
      const tag = { id, name: body.name, color: body.color || '#1890ff', createdAt: now };
      await db.insert(tags).values(tag);
      return c.json(tag, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  router.put('/:id', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const id = c.req.param('id');
      const body = await c.req.json();
      const updated = await db.update(tags).set(body).where(eq(tags.id, id)).returning();
      if (!updated.length) return c.json({ error: 'Not found' }, 404);
      return c.json(updated[0]);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  router.delete('/:id', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      await db.delete(tags).where(eq(tags.id, c.req.param('id')));
      return c.json({ message: 'Deleted' });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  return router;
}

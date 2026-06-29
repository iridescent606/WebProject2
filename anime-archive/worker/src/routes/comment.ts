import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { comments, users } from '../db/schema';
import { getDB } from '../db';
import { authenticate, optionalAuth } from '../middleware/auth';

export function commentRoutes() {
  const router = new Hono<{ Bindings: { DB: D1Database } }>();

  // GET /api/comments/:characterId
  router.get('/:characterId', optionalAuth, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const characterId = c.req.param('characterId');
      const page = Number(c.req.query('page') || '1');
      const limit = Number(c.req.query('limit') || '20');
      const offset = (page - 1) * limit;

      const topComments = await db.query.comments.findMany({
        where: sql`${comments.characterId} = ${characterId} AND ${comments.parentId} IS NULL`,
        orderBy: sql`${comments.createdAt} DESC`,
        limit, offset,
      });

      const total = await db.$count(comments, sql`${comments.characterId} = ${characterId} AND ${comments.parentId} IS NULL`);

      const data = await Promise.all(
        topComments.map(async (comment) => {
          const user = await db.query.users.findFirst({
            where: eq(users.id, comment.userId),
            columns: { id: true, username: true, avatar: true },
          });
          const replies = await db.query.comments.findMany({
            where: eq(comments.parentId, comment.id),
            orderBy: sql`${comments.createdAt} ASC`,
          });
          const repliesWithUser = await Promise.all(
            replies.map(async (r) => {
              const ru = await db.query.users.findFirst({
                where: eq(users.id, r.userId),
                columns: { id: true, username: true, avatar: true },
              });
              return { ...r, user: ru };
            })
          );
          return { ...comment, user, replies: repliesWithUser };
        })
      );

      return c.json({ data, total, page, limit });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // POST /api/comments/:characterId
  router.post('/:characterId', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const characterId = c.req.param('characterId');
      const userId = c.get('userId') as string;
      const { content, parentId } = await c.req.json();

      if (!content) return c.json({ error: 'Comment content is required' }, 400);

      if (parentId) {
        const parent = await db.query.comments.findFirst({ where: eq(comments.id, parentId) });
        if (!parent || parent.characterId !== characterId) return c.json({ error: 'Invalid parent comment' }, 400);
      }

      const id = crypto.randomUUID();
      const now = Date.now();
      await db.insert(comments).values({ id, content, userId, characterId, parentId: parentId || null, createdAt: now, updatedAt: now });

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId), columns: { id: true, username: true, avatar: true },
      });

      return c.json({ id, content, userId, characterId, parentId: parentId || null, createdAt: now, updatedAt: now, user }, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // DELETE /api/comments/detail/:id
  router.delete('/detail/:id', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const commentId = c.req.param('id');
      const userId = c.get('userId') as string;
      const userRole = c.get('userRole') as string;

      const comment = await db.query.comments.findFirst({ where: eq(comments.id, commentId) });
      if (!comment) return c.json({ error: 'Not found' }, 404);
      if (comment.userId !== userId && userRole !== 'admin') return c.json({ error: 'Not authorized' }, 403);

      await db.delete(comments).where(eq(comments.id, commentId));
      return c.json({ message: 'Deleted' });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  return router;
}

import { Hono } from 'hono';
import { eq, and, sql, inArray } from 'drizzle-orm';
import {
  characters, characterImages, characterTags, tags, animeSeries,
  characterRelationships, characterHistories, ratings, favorites, comments,
} from '../db/schema';
import { getDB } from '../db';
import { authenticate, optionalAuth } from '../middleware/auth';

export function characterRoutes() {
  const router = new Hono<{ Bindings: { DB: D1Database; IMAGES: R2Bucket } }>();

  // GET /api/characters
  router.get('/', optionalAuth, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const page = Number(c.req.query('page') || '1');
      const limit = Number(c.req.query('limit') || '20');
      const search = c.req.query('search');
      const type = c.req.query('type');
      const gender = c.req.query('gender');
      const animeId = c.req.query('animeId');
      const tagFilter = c.req.query('tags');
      const sort = c.req.query('sort') || 'updatedAt';
      const offset = (page - 1) * limit;

      let query = db.select().from(characters).$dynamic();

      if (search) {
        query = query.where(
          sql`(${characters.name} LIKE ${'%' + search + '%'} OR ${characters.nameJp} LIKE ${'%' + search + '%'} OR ${characters.personality} LIKE ${'%' + search + '%'} OR ${characters.voiceActor} LIKE ${'%' + search + '%'})`
        );
      }
      if (type) query = query.where(eq(characters.characterType, type));
      if (gender) query = query.where(eq(characters.gender, gender));
      if (animeId) query = query.where(eq(characters.animeId, animeId));

      let charIds: string[] | null = null;
      if (tagFilter) {
        const tagNames = tagFilter.split(',');
        const matchedTags = await db.query.tags.findMany({ where: inArray(tags.name, tagNames) });
        const tagIds = matchedTags.map(t => t.id);
        if (tagIds.length) {
          const matched = await db.query.characterTags.findMany({ where: inArray(characterTags.tagId, tagIds) });
          charIds = [...new Set(matched.map(ct => ct.characterId))];
          if (!charIds.length) return c.json({ data: [], total: 0, page, limit });
          query = query.where(inArray(characters.id, charIds));
        } else {
          return c.json({ data: [], total: 0, page, limit });
        }
      }

      const sortField = sort === 'name' ? characters.name : characters.updatedAt;
      query = query.orderBy(sql`${sortField} DESC`);

      const allChars = await query;
      const total = allChars.length;
      const sliced = allChars.slice(offset, offset + limit);

      const data = await Promise.all(
        sliced.map(async (ch) => {
          const imgs = await db.query.characterImages.findMany({
            where: eq(characterImages.characterId, ch.id),
            orderBy: sql`${characterImages.sortOrder} ASC`, limit: 3,
          });
          const chrTags = await db.query.characterTags.findMany({
            where: eq(characterTags.characterId, ch.id), with: { tag: true },
          });
          const anime = ch.animeId ? await db.query.animeSeries.findFirst({
            where: eq(animeSeries.id, ch.animeId), columns: { id: true, title: true },
          }) : null;
          const rc = await db.$count(ratings, eq(ratings.characterId, ch.id));
          const fc = await db.$count(favorites, eq(favorites.characterId, ch.id));
          const cc = await db.$count(comments, eq(comments.characterId, ch.id));
          return { ...ch, images: imgs, tags: chrTags, anime, _count: { ratings: rc, favorites: fc, comments: cc } };
        })
      );

      return c.json({ data, total, page, limit });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // GET /api/characters/compare
  router.get('/compare', async (c) => {
    try {
      const db = getDB(c.env.DB);
      const idsParam = c.req.query('ids') || '';
      const ids = idsParam.split(',').filter(Boolean);
      if (ids.length < 2 || ids.length > 4) return c.json({ error: 'Please provide 2-4 character IDs' }, 400);

      const result = await Promise.all(
        ids.map(async (id) => {
          const ch = await db.query.characters.findFirst({
            where: eq(characters.id, id),
            with: {
              images: { orderBy: sql`${characterImages.sortOrder} ASC` },
              tags: { with: { tag: true } },
              anime: { columns: { id: true, title: true } },
            },
          });
          if (!ch) return null;
          const rc = await db.$count(ratings, eq(ratings.characterId, ch.id));
          const fc = await db.$count(favorites, eq(favorites.characterId, ch.id));
          return { ...ch, _count: { ratings: rc, favorites: fc } };
        })
      );

      return c.json(result.filter(Boolean));
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // GET /api/characters/:id
  router.get('/:id', optionalAuth, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const id = c.req.param('id');
      const userId = c.get('userId') as string | undefined;

      const character = await db.query.characters.findFirst({
        where: eq(characters.id, id),
        with: {
          images: { orderBy: sql`${characterImages.sortOrder} ASC` },
          tags: { with: { tag: true } },
          anime: true,
          createdBy: { columns: { id: true, username: true, avatar: true } },
        },
      });

      if (!character) return c.json({ error: 'Not found' }, 404);

      const rels = await db.query.characterRelationships.findMany({
        where: eq(characterRelationships.fromCharacterId, id),
        with: { toCharacter: { columns: { id: true, name: true }, with: { images: { limit: 1 } } } },
      });
      const relatedTo = await db.query.characterRelationships.findMany({
        where: eq(characterRelationships.toCharacterId, id),
        with: { fromCharacter: { columns: { id: true, name: true }, with: { images: { limit: 1 } } } },
      });

      const allRatings = await db.query.ratings.findMany({ where: eq(ratings.characterId, id) });
      const avgRating = allRatings.length ? allRatings.reduce((s, r) => s + r.score, 0) / allRatings.length : 0;

      let isFavorited = false;
      let userRating = 0;
      if (userId) {
        const fav = await db.query.favorites.findFirst({
          where: and(eq(favorites.userId, userId), eq(favorites.characterId, id)),
        });
        const rate = await db.query.ratings.findFirst({
          where: and(eq(ratings.userId, userId), eq(ratings.characterId, id)),
        });
        isFavorited = !!fav;
        userRating = rate?.score || 0;
      }

      const rc = await db.$count(ratings, eq(ratings.characterId, id));
      const fc = await db.$count(favorites, eq(favorites.characterId, id));
      const cc = await db.$count(comments, eq(comments.characterId, id));

      return c.json({ ...character, relationships: rels, relatedTo, avgRating, isFavorited, userRating, _count: { ratings: rc, favorites: fc, comments: cc } });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // POST /api/characters
  router.post('/', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const body = await c.req.json();
      if (!body.name) return c.json({ error: 'Character name is required' }, 400);

      const userId = c.get('userId') as string;
      const id = crypto.randomUUID();
      const now = Date.now();
      const { tags: tagIds = [], ...charData } = body;

      await db.insert(characters).values({
        id, name: charData.name, nameJp: charData.nameJp || null,
        animeId: charData.animeId || null, characterType: charData.characterType || 'OTHER',
        gender: charData.gender || 'UNKNOWN', age: charData.age || null,
        birthday: charData.birthday ? new Date(charData.birthday).getTime() : null,
        height: charData.height || null, bloodType: charData.bloodType || 'UNKNOWN',
        personality: charData.personality || null, background: charData.background || null,
        abilities: charData.abilities || null, voiceActor: charData.voiceActor || null,
        voiceActorJp: charData.voiceActorJp || null, mainImageIndex: 0,
        createdById: userId, createdAt: now, updatedAt: now,
      });

      if (tagIds.length) {
        await Promise.all(tagIds.map((tagId: string) =>
          db.insert(characterTags).values({ id: crypto.randomUUID(), characterId: id, tagId })
        ));
      }

      const created = await db.query.characters.findFirst({
        where: eq(characters.id, id), with: { tags: { with: { tag: true } }, images: true },
      });

      return c.json(created, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // PUT /api/characters/:id
  router.put('/:id', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const id = c.req.param('id');
      const userId = c.get('userId') as string;
      const userRole = c.get('userRole') as string;

      const ch = await db.query.characters.findFirst({ where: eq(characters.id, id) });
      if (!ch) return c.json({ error: 'Not found' }, 404);
      if (ch.createdById !== userId && userRole !== 'admin') return c.json({ error: 'Not authorized' }, 403);

      const body = await c.req.json();
      const { tags: tagIds, ...charData } = body;

      const historyEntries: any[] = [];
      for (const [field, newValue] of Object.entries(charData)) {
        const oldValue = (ch as any)[field];
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          historyEntries.push({
            id: crypto.randomUUID(), characterId: id, userId, field,
            oldValue: oldValue?.toString() || null, newValue: (newValue as any)?.toString() || null, createdAt: Date.now(),
          });
        }
      }
      if (historyEntries.length) {
        await Promise.all(historyEntries.map(e => db.insert(characterHistories).values(e)));
      }

      const updateData: any = { updatedAt: Date.now() };
      for (const key of ['name', 'nameJp', 'animeId', 'characterType', 'gender', 'height', 'bloodType', 'personality', 'background', 'abilities', 'voiceActor', 'voiceActorJp', 'mainImageIndex']) {
        if (charData[key] !== undefined) updateData[key] = charData[key];
      }
      if (charData.age !== undefined) updateData.age = charData.age;
      if (charData.birthday !== undefined) updateData.birthday = new Date(charData.birthday).getTime();

      await db.update(characters).set(updateData).where(eq(characters.id, id));

      if (tagIds) {
        await db.delete(characterTags).where(eq(characterTags.characterId, id));
        await Promise.all(tagIds.map((tagId: string) =>
          db.insert(characterTags).values({ id: crypto.randomUUID(), characterId: id, tagId })
        ));
      }

      const updated = await db.query.characters.findFirst({
        where: eq(characters.id, id), with: { tags: { with: { tag: true } }, images: true },
      });
      return c.json(updated);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // DELETE /api/characters/:id
  router.delete('/:id', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const id = c.req.param('id');
      const userId = c.get('userId') as string;
      const userRole = c.get('userRole') as string;

      const ch = await db.query.characters.findFirst({ where: eq(characters.id, id), with: { images: true } });
      if (!ch) return c.json({ error: 'Not found' }, 404);
      if (ch.createdById !== userId && userRole !== 'admin') return c.json({ error: 'Not authorized' }, 403);

      // Delete images from R2
      try {
        for (const img of ch.images) {
          await c.env.IMAGES.delete(img.url.replace('/images/', ''));
        }
      } catch {}

      await db.delete(characters).where(eq(characters.id, id));
      return c.json({ message: 'Deleted' });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // POST /api/characters/:id/images
  router.post('/:id/images', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const id = c.req.param('id');

      const ch = await db.query.characters.findFirst({ where: eq(characters.id, id) });
      if (!ch) return c.json({ error: 'Not found' }, 404);

      const formData = await c.req.formData();
      const files = formData.getAll('images') as File[];
      if (!files.length) return c.json({ error: 'No images provided' }, 400);

      const bucket = c.env.IMAGES;
      const currentCount = await db.$count(characterImages, eq(characterImages.characterId, id));

      const uploaded = await Promise.all(
        files.map(async (file, i) => {
          const ext = file.name.split('.').pop() || 'jpg';
          const key = `characters/${id}/${crypto.randomUUID()}.${ext}`;
          await bucket.put(key, file.stream(), { httpMetadata: { contentType: file.type } });

          const imgId = crypto.randomUUID();
          const url = `/api/images/${key}`;
          const now = Date.now();
          await db.insert(characterImages).values({ id: imgId, characterId: id, url, sortOrder: currentCount + i, createdAt: now });
          return { id: imgId, characterId: id, url, sortOrder: currentCount + i, createdAt: now };
        })
      );

      return c.json(uploaded, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // DELETE /api/characters/:id/images/:imageId
  router.delete('/:id/images/:imageId', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const imageId = c.req.param('imageId');
      const image = await db.query.characterImages.findFirst({ where: eq(characterImages.id, imageId) });
      if (!image) return c.json({ error: 'Not found' }, 404);

      try { await c.env.IMAGES.delete(image.url.replace('/api/images/', '')); } catch {}

      await db.delete(characterImages).where(eq(characterImages.id, imageId));
      return c.json({ message: 'Deleted' });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // PUT /api/characters/:id/images/sort
  router.put('/:id/images/sort', authenticate, async (c) => {
    try {
      const db = getDB(c.env.DB);
      const { imageIds } = await c.req.json();
      if (!imageIds || !Array.isArray(imageIds)) return c.json({ error: 'imageIds array required' }, 400);

      await Promise.all(imageIds.map((imgId: string, i: number) =>
        db.update(characterImages).set({ sortOrder: i }).where(eq(characterImages.id, imgId))
      ));

      const imgs = await db.query.characterImages.findMany({
        where: eq(characterImages.characterId, c.req.param('id')),
        orderBy: sql`${characterImages.sortOrder} ASC`,
      });
      return c.json(imgs);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // GET /api/characters/:id/history
  router.get('/:id/history', async (c) => {
    try {
      const db = getDB(c.env.DB);
      const history = await db.query.characterHistories.findMany({
        where: eq(characterHistories.characterId, c.req.param('id')),
        orderBy: sql`${characterHistories.createdAt} DESC`, limit: 50,
      });
      return c.json(history);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  // GET /api/characters/:id/export
  router.get('/:id/export', async (c) => {
    try {
      const db = getDB(c.env.DB);
      const id = c.req.param('id');
      const ch = await db.query.characters.findFirst({
        where: eq(characters.id, id),
        with: {
          images: { orderBy: sql`${characterImages.sortOrder} ASC` },
          tags: { with: { tag: true } },
          anime: true,
        },
      });
      if (!ch) return c.json({ error: 'Not found' }, 404);

      const rels = await db.query.characterRelationships.findMany({
        where: eq(characterRelationships.fromCharacterId, id),
        with: { toCharacter: { columns: { id: true, name: true } } },
      });
      const relatedTo = await db.query.characterRelationships.findMany({
        where: eq(characterRelationships.toCharacterId, id),
        with: { fromCharacter: { columns: { id: true, name: true } } },
      });

      return c.json({ ...ch, relationships: rels, relatedTo });
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  return router;
}

import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';

export function uploadRoutes() {
  const router = new Hono<{ Bindings: { IMAGES: R2Bucket } }>();

  // POST /api/upload/image — direct upload to R2
  router.post('/image', authenticate, async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get('file') as File | null;

      if (!file) return c.json({ error: 'No file provided' }, 400);

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return c.json({ error: 'File type not allowed. Use JPEG, PNG, GIF or WebP' }, 400);
      }
      if (file.size > 10 * 1024 * 1024) {
        return c.json({ error: 'File too large. Maximum 10MB' }, 400);
      }

      const bucket = c.env.IMAGES;
      const ext = file.name.split('.').pop() || 'jpg';
      const key = `uploads/${crypto.randomUUID()}.${ext}`;

      await bucket.put(key, file.stream(), { httpMetadata: { contentType: file.type } });

      return c.json({ url: `/api/images/${key}`, key }, 201);
    } catch (err: any) {
      return c.json({ error: err.message }, 500);
    }
  });

  return router;
}

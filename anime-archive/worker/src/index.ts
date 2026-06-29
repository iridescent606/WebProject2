import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth';
import { animeRoutes } from './routes/anime';
import { characterRoutes } from './routes/character';
import { tagRoutes } from './routes/tag';
import { favoriteRoutes } from './routes/favorite';
import { ratingRoutes } from './routes/rating';
import { commentRoutes } from './routes/comment';
import { uploadRoutes } from './routes/upload';

export type Bindings = {
  DB: D1Database;
  IMAGES: R2Bucket;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  FRONTEND_URL?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use('*', async (c, next) => {
  const frontendUrl = c.env.FRONTEND_URL || '*';
  return cors({ origin: frontendUrl, credentials: true })(c, next);
});

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
const api = new Hono<{ Bindings: Bindings }>();

api.route('/auth', authRoutes());
api.route('/anime', animeRoutes());
api.route('/characters', characterRoutes());
api.route('/tags', tagRoutes());
api.route('/favorites', favoriteRoutes());
api.route('/ratings', ratingRoutes());
api.route('/comments', commentRoutes());
api.route('/upload', uploadRoutes());

// R2 image proxy
api.get('/images/*', async (c) => {
  const path = c.req.path.replace('/api/images/', '');
  const object = await c.env.IMAGES.get(path);
  if (!object) return c.notFound();
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
});

app.route('/api', api);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;

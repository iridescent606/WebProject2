import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ─── Users ───────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  avatar: text('avatar'),
  bio: text('bio'),
  role: text('role').notNull().default('user'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
});

export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
  favorites: many(favorites),
  ratings: many(ratings),
  comments: many(comments),
  refreshTokens: many(refreshTokens),
}));

// ─── Refresh Tokens ─────────────────────────────────────────────
export const refreshTokens = sqliteTable('refresh_tokens', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  token: text('token').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
});

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

// ─── Anime Series ────────────────────────────────────────────────
export const animeSeries = sqliteTable('anime_series', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  titleJp: text('title_jp'),
  description: text('description'),
  coverImage: text('cover_image'),
  genre: text('genre'),
  episodeCount: integer('episode_count'),
  studio: text('studio'),
  releaseDate: integer('release_date'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
});

export const animeSeriesRelations = relations(animeSeries, ({ many }) => ({
  characters: many(characters),
}));

// ─── Characters ──────────────────────────────────────────────────
export const characters = sqliteTable('characters', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  nameJp: text('name_jp'),
  animeId: text('anime_id').references(() => animeSeries.id, { onDelete: 'set null' }),
  characterType: text('character_type').notNull().default('OTHER'),
  gender: text('gender').notNull().default('UNKNOWN'),
  age: integer('age'),
  birthday: integer('birthday'),
  height: text('height'),
  bloodType: text('blood_type').notNull().default('UNKNOWN'),
  personality: text('personality'),
  background: text('background'),
  abilities: text('abilities'),
  voiceActor: text('voice_actor'),
  voiceActorJp: text('voice_actor_jp'),
  mainImageIndex: integer('main_image_index').notNull().default(0),
  createdById: text('created_by_id').notNull().references(() => users.id),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
});

export const charactersRelations = relations(characters, ({ one, many }) => ({
  anime: one(animeSeries, { fields: [characters.animeId], references: [animeSeries.id] }),
  createdBy: one(users, { fields: [characters.createdById], references: [users.id] }),
  images: many(characterImages),
  tags: many(characterTags),
  relationships: many(characterRelationships, { relationName: 'fromCharacter' }),
  relatedTo: many(characterRelationships, { relationName: 'toCharacter' }),
  favorites: many(favorites),
  ratings: many(ratings),
  comments: many(comments),
  histories: many(characterHistories),
}));

// ─── Character Images ────────────────────────────────────────────
export const characterImages = sqliteTable('character_images', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
}, (table) => ({
  cidIdx: index('idx_character_images_cid').on(table.characterId),
}));

export const characterImagesRelations = relations(characterImages, ({ one }) => ({
  character: one(characters, { fields: [characterImages.characterId], references: [characters.id] }),
}));

// ─── Tags ────────────────────────────────────────────────────────
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('#1890ff'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  characters: many(characterTags),
}));

// ─── Character Tags (Junction) ───────────────────────────────────
export const characterTags = sqliteTable('character_tags', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  uq: uniqueIndex('uq_character_tag').on(table.characterId, table.tagId),
}));

export const characterTagsRelations = relations(characterTags, ({ one }) => ({
  character: one(characters, { fields: [characterTags.characterId], references: [characters.id] }),
  tag: one(tags, { fields: [characterTags.tagId], references: [tags.id] }),
}));

// ─── Character Relationships ─────────────────────────────────────
export const characterRelationships = sqliteTable('character_relationships', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  fromCharacterId: text('from_character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  toCharacterId: text('to_character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  relationshipType: text('relationship_type').notNull(),
  description: text('description'),
}, (table) => ({
  uq: uniqueIndex('uq_character_relationship').on(table.fromCharacterId, table.toCharacterId, table.relationshipType),
}));

export const characterRelationshipsRelations = relations(characterRelationships, ({ one }) => ({
  fromCharacter: one(characters, { fields: [characterRelationships.fromCharacterId], references: [characters.id], relationName: 'fromCharacter' }),
  toCharacter: one(characters, { fields: [characterRelationships.toCharacterId], references: [characters.id], relationName: 'toCharacter' }),
}));

// ─── Favorites ───────────────────────────────────────────────────
export const favorites = sqliteTable('favorites', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  collection: text('collection').notNull().default('default'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
}, (table) => ({
  uq: uniqueIndex('uq_favorite').on(table.userId, table.characterId),
  userIdx: index('idx_favorite_user').on(table.userId),
  charIdx: index('idx_favorite_character').on(table.characterId),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  character: one(characters, { fields: [favorites.characterId], references: [characters.id] }),
}));

// ─── Ratings ─────────────────────────────────────────────────────
export const ratings = sqliteTable('ratings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  score: integer('score').notNull(),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
}, (table) => ({
  uq: uniqueIndex('uq_rating').on(table.userId, table.characterId),
  charIdx: index('idx_rating_character').on(table.characterId),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, { fields: [ratings.userId], references: [users.id] }),
  character: one(characters, { fields: [ratings.characterId], references: [characters.id] }),
}));

// ─── Comments ────────────────────────────────────────────────────
export const comments = sqliteTable('comments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  content: text('content').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
}, (table) => ({
  charIdx: index('idx_comment_character').on(table.characterId),
  parentIdx: index('idx_comment_parent').on(table.parentId),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  character: one(characters, { fields: [comments.characterId], references: [characters.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id], relationName: 'commentReplies' }),
  replies: many(comments, { relationName: 'commentReplies' }),
}));

// ─── Character History ───────────────────────────────────────────
export const characterHistories = sqliteTable('character_histories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  characterId: text('character_id').notNull().references(() => characters.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  field: text('field').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: integer('created_at').notNull().$defaultFn(() => Date.now()),
}, (table) => ({
  cidIdx: index('idx_char_history_cid').on(table.characterId),
}));

export const characterHistoriesRelations = relations(characterHistories, ({ one }) => ({
  character: one(characters, { fields: [characterHistories.characterId], references: [characters.id] }),
}));

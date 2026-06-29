-- Seed data: admin user, tags, anime series, characters
-- Run via: wrangler d1 execute anime-archive-db --file=./migrations/seed.sql

-- Admin user (password: admin123, bcrypt hash)
INSERT INTO users (id, email, username, password, role, bio, created_at, updated_at)
VALUES ('user-admin', 'admin@anime-archive.com', 'admin', '$2a$12$LJ3m4ys3GZfG0PFsFqaL2OGkxJVHWNs.WB4qG.vLWxhGCHzYwxhAa', 'admin', 'Site administrator', 1700000000000, 1700000000000);

-- Demo tags
INSERT INTO tags (id, name, color, created_at) VALUES
('tag-a', '傲娇', '#f5222d', 1700000000000),
('tag-b', '热血', '#fa8c16', 1700000000000),
('tag-c', '萝莉', '#eb2f96', 1700000000000),
('tag-d', '御姐', '#722ed1', 1700000000000),
('tag-e', '反派', '#fa541c', 1700000000000),
('tag-f', '天然呆', '#13c2c2', 1700000000000),
('tag-g', '中二病', '#2f54eb', 1700000000000),
('tag-h', '腹黑', '#a0d911', 1700000000000),
('tag-i', '温柔', '#52c41a', 1700000000000),
('tag-j', '元气', '#fadb14', 1700000000000),
('tag-k', '神秘', '#722ed1', 1700000000000),
('tag-l', '冷酷', '#1890ff', 1700000000000);

-- Anime series
INSERT INTO anime_series (id, title, title_jp, description, genre, episode_count, studio, release_date, created_at, updated_at) VALUES
('anime-1', '鬼灭之刃', '鬼滅の刃', '大正时代的日本，少年灶门炭治郎一家被鬼杀害，仅存的妹妹祢豆子却变成了鬼。为了让妹妹变回人类，炭治郎踏上了成为鬼杀队剑士的道路。', '少年/战斗/奇幻', 44, 'ufotable', 1554508800000, 1700000000000, 1700000000000),
('anime-2', '刀剑神域', 'ソードアート・オンライン', '2022年，完全沉浸式VR游戏"刀剑神域"正式上线。玩家们发现无法登出游戏，游戏死亡将导致现实世界死亡。', '科幻/冒险/恋爱', 96, 'A-1 Pictures', 1341705600000, 1700000000000, 1700000000000);

-- Characters
INSERT INTO characters (id, name, name_jp, anime_id, character_type, gender, age, height, blood_type, personality, background, abilities, voice_actor, voice_actor_jp, created_by_id, created_at, updated_at) VALUES
('char-1', '灶门炭治郎', '竈門 炭治郎', 'anime-1', 'PROTAGONIST', 'MALE', 15, '165cm', 'O', '温柔善良，拥有强烈的责任感和保护他人的决心。对自己的妹妹无比爱护，但也非常固执和坚韧不拔。', '家庭被鬼杀害，唯一存活的妹妹变成了鬼。为了寻找让妹妹变回人类的方法，加入了鬼杀队。', '水之呼吸、火之神乐（日之呼吸）、嗅觉超群', '花江夏树', '花江 夏樹', 'user-admin', 1700000000000, 1700000000000),
('char-2', '灶门祢豆子', '竈門 禰豆子', 'anime-1', 'DEUTERAGONIST', 'FEMALE', 14, '153cm', 'O', '温柔体贴，保护欲强。变成鬼后仍保留着人类的情感和对哥哥的依赖。', '被鬼袭击后变成了鬼，是唯一不吃人的鬼。为了保护炭治郎和其他人类而战斗。', '血鬼术·爆血、强大的身体能力、竹筒封印', '鬼头明里', '鬼頭 明里', 'user-admin', 1700000000000, 1700000000000),
('char-3', '桐谷和人', '桐ヶ谷 和人', 'anime-2', 'PROTAGONIST', 'MALE', 16, '172cm', 'A', '内向的网游废人，在VR游戏中展现出惊人的战斗天赋。非常重视同伴，有时会逞强独自承担一切。', 'SAO封测玩家，被困在死亡游戏中。在攻略艾恩葛朗特的过程中遇到了恋人亚丝娜。', '二刀流剑技、反应速度超群、黑客能力、VRMMO游戏天才', '松冈祯丞', '松岡 禎丞', 'user-admin', 1700000000000, 1700000000000);

-- Character tags
INSERT INTO character_tags (id, character_id, tag_id) VALUES
('ct-1', 'char-1', 'tag-b'), ('ct-2', 'char-1', 'tag-i'),
('ct-3', 'char-2', 'tag-c'), ('ct-4', 'char-2', 'tag-k'),
('ct-5', 'char-3', 'tag-l'), ('ct-6', 'char-3', 'tag-b');

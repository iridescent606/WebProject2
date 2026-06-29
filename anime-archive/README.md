# 🎬 动漫人物档案 — Anime Character Archive

一个支持多用户的动漫角色档案管理系统。可以创建、管理、分享动漫角色信息，支持图片上传、收藏、评分和评论功能。

## 技术栈

- **前端**: React + Vite + Ant Design 5 + Zustand
- **后端**: Cloudflare Workers (Hono)
- **ORM**: Drizzle ORM
- **数据库**: Cloudflare D1 (SQLite)
- **图片存储**: Cloudflare R2
- **部署**: GitHub Actions → Cloudflare Workers + Pages

## 功能列表

### 核心功能
- ✅ 角色档案 CRUD（名称、日文名、类型、性别、年龄、生日、身高、血型、性格、背景、能力、声优等）
- ✅ 多图片上传与排序
- ✅ 用户注册/登录（JWT + refresh token）
- ✅ 动漫系列管理

### 增值功能
- ✅ 标签系统（自定义颜色、多标签筛选）
- ✅ 收藏 & 图鉴（自定义收藏夹）
- ✅ 评分系统（1-5星）
- ✅ 评论系统（支持回复）
- ✅ 角色搜索 & 多维度筛选
- ✅ 角色对比（2-4个角色并排对比）
- ✅ 角色关系图
- ✅ 暗色模式
- ✅ 数据导出（JSON）
- ✅ 响应式设计

## 项目结构

```
anime-archive/
├── worker/                    # Cloudflare Worker 后端 (Hono + Drizzle)
│   ├── src/
│   │   ├── index.ts           # 主入口
│   │   ├── db/                # Drizzle Schema + DB 连接
│   │   ├── middleware/        # JWT 认证中间件
│   │   ├── routes/            # API 路由
│   │   └── utils/             # 工具函数 (JWT, bcrypt)
│   ├── migrations/            # D1 数据库迁移
│   └── package.json
├── client/                    # React 前端
│   ├── src/                   # 源码
│   └── package.json
├── wrangler.toml              # Cloudflare 配置
├── drizzle.config.ts          # Drizzle Kit 配置
└── .github/workflows/deploy.yml  # GitHub Actions 自动部署
```

## 快速开始

### 前置要求
- Node.js >= 18
- Cloudflare 账号
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### 本地开发

```bash
cd anime-archive

# 1. 安装 Worker 依赖
cd worker
npm install

# 2. 配置 wrangler.toml
# 创建 D1 数据库: wrangler d1 create anime-archive-db
# 创建 R2 桶: wrangler r2 bucket create anime-archive-images
# 将 database_id 和 bucket_name 填入 wrangler.toml

# 3. 执行数据库迁移
wrangler d1 migrations apply anime-archive-db --local
wrangler d1 execute anime-archive-db --local --file=./migrations/seed.sql

# 4. 设置 JWT secrets
wrangler secret put JWT_ACCESS_SECRET
wrangler secret put JWT_REFRESH_SECRET

# 5. 启动 Worker (终端 1)
npm run dev    # 默认 http://localhost:8787

# 6. 启动前端 (终端 2)
cd ../client
npm install
npm run dev    # http://localhost:5173
```

### 部署到 Cloudflare

**方式一：GitHub Actions 自动部署（推荐）**

1. Fork/推送项目到 GitHub
2. 在 GitHub Actions Secrets 中设置：
   - `CLOUDFLARE_API_TOKEN` — Cloudflare API Token
   - `CLOUDFLARE_ACCOUNT_ID` — Cloudflare 账户 ID
3. 在 GitHub Actions Variables 中设置：
   - `VITE_API_URL` — Worker 的 URL（如 `https://anime-archive-api.你的用户名.workers.dev`）
4. Push 到 `main` 分支 → 自动部署

**方式二：手动部署**

```bash
# 部署 Worker
cd worker
wrangler deploy

# 构建并部署前端
cd ../client
npm run build
npx wrangler pages deploy dist --project-name=anime-archive
```

### 配置 Cloudflare 资源

```bash
# 创建 D1 数据库
wrangler d1 create anime-archive-db

# 创建 R2 图片桶
wrangler r2 bucket create anime-archive-images

# 设置 JWT secrets
wrangler secret put JWT_ACCESS_SECRET
wrangler secret put JWT_REFRESH_SECRET

# 应用数据库迁移
wrangler d1 migrations apply anime-archive-db

# 导入种子数据
wrangler d1 execute anime-archive-db --file=./worker/migrations/seed.sql
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| POST | /api/auth/refresh | 刷新 token |
| GET | /api/auth/me | 当前用户信息 |
| GET | /api/anime | 动漫系列列表 |
| POST | /api/anime | 创建动漫系列 |
| GET | /api/characters | 角色列表 |
| POST | /api/characters | 创建角色 |
| GET | /api/characters/:id | 角色详情 |
| PUT | /api/characters/:id | 更新角色 |
| DELETE | /api/characters/:id | 删除角色 |
| POST | /api/characters/:id/images | 上传图片 |
| GET | /api/tags | 标签列表 |
| POST | /api/favorites/:id | 收藏/取消 |
| POST | /api/ratings/:id | 评分 |
| GET | /api/comments/:id | 评论列表 |
| POST | /api/comments/:id | 发表评论 |
| POST | /api/upload/image | 上传图片(R2) |

## License

MIT

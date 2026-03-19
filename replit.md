# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: JWT (jsonwebtoken + bcryptjs)

## Project: Layer

Layer is a SaaS platform for YouTubers and video editors to collaborate on uploads. Editors submit videos for creator approval before publishing to YouTube.

### Features
- Creator and Editor roles
- Video submission workflow (Pending → Approved/Rejected → Uploaded)
- In-app notifications
- Landing page with pricing

### Key Routes
- `/` — Landing page
- `/login`, `/register` — Auth pages
- `/dashboard/creator` — Creator review dashboard
- `/dashboard/editor` — Editor submission dashboard

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (auth, videos, notifications)
│   └── layer/              # React + Vite frontend (Layer SaaS app)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `users` — id, email, password_hash, name, role (creator|editor), created_at
- `videos` — id, title, description, tags, video_url, thumbnail_url, status, creator_id, editor_id, rejection_feedback, file_size, duration, created_at, updated_at
- `notifications` — id, user_id, title, message, type, read, video_id, created_at

## API Endpoints

All under `/api`:
- `POST /auth/register` — register with role
- `POST /auth/login` — login
- `GET /auth/me` — get current user
- `GET /videos` — list videos (role-filtered)
- `POST /videos` — submit video (editor only)
- `GET /videos/:id` — video detail
- `POST /videos/:id/approve` — approve (creator only)
- `POST /videos/:id/reject` — reject with feedback (creator only)
- `GET /users/creators` — list all creators
- `GET /notifications` — list notifications
- `POST /notifications/:id/read` — mark as read

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Auth: `src/lib/auth.ts` — JWT signing/verifying, requireAuth middleware
- Routes: auth, videos, users, notifications
- Depends on: `@workspace/db`, `@workspace/api-zod`

### `artifacts/layer` (`@workspace/layer`)

React + Vite frontend for the Layer SaaS platform.

- Landing page, auth pages, creator/editor dashboards
- JWT stored in localStorage as `layer_token`
- Uses generated React Query hooks from `@workspace/api-client-react`

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

- `pnpm --filter @workspace/db run push` — push schema changes

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval codegen config.

- `pnpm --filter @workspace/api-spec run codegen` — regenerate client hooks and Zod schemas

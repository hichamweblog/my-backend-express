# Agent Instructions

## Project Overview

Prisma 7 (Next) Express backend with TypeScript and PostgreSQL.

## Key Commands

```bash
npm run dev          # start dev server with tsx watch
npm run build        # compile TypeScript
npm run test         # run vitest tests
npx prisma generate  # regenerate Prisma client after schema changes
```

## Prisma Client Location

Generated to `src/generated/prisma/` (NOT `node_modules/.prisma/client`). Import from `src/generated/prisma/client` for driver-adapter setup.

## Database

- Requires PostgreSQL >= 15
- `.env` file required with `DATABASE_URL`
- Driver adapter: `@prisma/adapter-pg` (configured in `src/config/db.ts`)

## Architecture

```
src/
├── app.ts              # Express app setup
├── index.ts            # Entry point
├── config/             # env.ts (zod-validated), db.ts (Prisma client)
├── controllers/        # Route handlers
├── routes/             # Express routers
├── services/           # Business logic
├── schemas/            # Zod validation schemas
├── middlewares/         # Error handling, auth, validation
├── types/              # TypeScript type definitions
├── utils/              # Helpers (jwt, password, AppError)
└── generated/          # Prisma generated client (DO NOT EDIT)
```

## Testing

- Tests use Vitest with `supertest` for HTTP assertions
- Test files: `*.test.ts` colocated with source
- Services are mocked in route tests (see `src/routes/auth.routes.test.ts`)

## Environment Variables

Validated at startup via Zod (`src/schemas/env.schema.ts`). Invalid config causes immediate exit.

## Prisma Skills

Available Prisma skills in `.agents/skills/` for ORM operations. Use when writing Prisma queries or migrations.

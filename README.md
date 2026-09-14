# Production-ready API design with Express, TypeScript, and Prisma

This repository is a small but realistic authentication API built with
Express 5, TypeScript, PostgreSQL, Prisma 7, Zod, JWTs, and Vitest. It is
also an educational guide: each section explains **why** a production API
uses a particular boundary, pattern, or defensive check.

The goal is not to make every possible feature fit into one project. The goal
is to show a repeatable way to turn a request into a maintainable, testable,
secure API.

> **Status of this guide:** commands and code in the “implemented here”
> sections describe this repository. The “production hardening” section lists
> important work that a real deployment should add before going live.

## What you will learn

By working through this project you will learn how to:

1. Bootstrap a strict TypeScript API.
2. Separate the HTTP, business, persistence, and database concerns.
3. Validate configuration and untrusted request data at runtime.
4. Model relational data and use Prisma 7 with a PostgreSQL driver adapter.
5. Hash passwords and implement access/refresh-token authentication.
6. Distinguish authentication from authorization.
7. Return consistent errors without leaking implementation details.
8. Test services and HTTP routes without starting a real server.
9. Identify the additional controls required for production operations.

## Table of contents

- [Architecture at a glance](#architecture-at-a-glance)
- [1. Prerequisites](#1-prerequisites)
- [2. Run the project](#2-run-the-project)
- [3. Build the application step by step](#3-build-the-application-step-by-step)
  - [Step 1: configure strict TypeScript](#step-1-configure-strict-typescript)
  - [Step 2: create a testable Express app](#step-2-create-a-testable-express-app)
  - [Step 3: validate environment variables](#step-3-validate-environment-variables)
  - [Step 4: organize code by responsibility](#step-4-organize-code-by-responsibility)
  - [Step 5: validate every request](#step-5-validate-every-request)
  - [Step 6: add PostgreSQL with Prisma 7](#step-6-add-postgresql-with-prisma-7)
  - [Step 7: centralize errors](#step-7-centralize-errors)
  - [Step 8: implement authentication](#step-8-implement-authentication)
  - [Step 9: implement authorization](#step-9-implement-authorization)
  - [Step 10: test behavior at the right boundary](#step-10-test-behavior-at-the-right-boundary)
- [4. API reference](#4-api-reference)
- [5. Production hardening](#5-production-hardening)
- [6. Deployment checklist](#6-deployment-checklist)
- [7. Suggested next improvements](#7-suggested-next-improvements)

---

## Architecture at a glance

The request path is intentionally boring:

```text
HTTP request
    ↓
Express middleware (JSON, cookies, logging, validation, auth)
    ↓
Route
    ↓
Controller       HTTP concerns: read req, write res
    ↓
Service          Business rules and use cases
    ↓
Repository       Database queries and persistence details
    ↓
Prisma adapter → PostgreSQL
```

Each layer has one reason to change:

| Layer | Responsibility | Should not do |
| --- | --- | --- |
| Route | Map method and path to middleware/controller | Contain business logic |
| Middleware | Cross-cutting request concerns | Know how a user is stored |
| Controller | Translate HTTP to a service call | Build SQL or hash passwords |
| Service | Apply business rules | Depend on `req` or `res` |
| Repository | Read/write persistent data | Decide HTTP status codes |
| Schema | Runtime input validation | Perform database side effects |

This separation is educational, but it is also practical. A service can be
unit tested without an HTTP server, and a repository can change without
rewriting controllers.

## 1. Prerequisites

Install:

- Node.js 20 or newer
- npm
- PostgreSQL 15 or newer
- Git

The project uses ESM and TypeScript. Check your versions:

```bash
node --version
npm --version
psql --version
```

The database must exist before migrations run. For local PostgreSQL:

```sql
CREATE DATABASE my_backend;
```

You can use a hosted PostgreSQL provider instead. Keep the connection string
private; it grants access to your database.

## 2. Run the project

Clone and install dependencies:

```bash
git clone https://github.com/hichamweblog/my-backend-express.git
cd my-backend-express
npm install
```

Create `.env` in the repository root. `.env` is ignored by Git and must not
be committed:

```dotenv
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/my_backend
ACCESS_TOKEN_SECRET=replace-with-at-least-64-random-characters
REFRESH_TOKEN_SECRET=replace-with-a-different-64-character-secret
```

Generate strong secrets instead of using the example values:

```bash
openssl rand -base64 48
```

The current environment schema requires both token secrets to be at least 64
characters. It also rejects an invalid database URL or an unsupported
`NODE_ENV`. The application fails fast rather than starting with unsafe
configuration.

Create the database tables and generated Prisma client:

```bash
npm run prisma:migrate -- --name init
npm run prisma:generate
```

Start development mode:

```bash
npm run dev
```

The server listens on `http://localhost:3000`. Build and run the compiled
application with:

```bash
npm run build
npm start
```

Run the test suite:

```bash
npm test
```

Useful scripts from `package.json`:

| Script | Purpose |
| --- | --- |
| `npm run dev` | Run `src/index.ts` with `tsx` watch mode |
| `npm run build` | Type-check and compile `src/` to `dist/` |
| `npm start` | Run the compiled `dist/index.js` |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Create/apply a development migration |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm test` | Run Vitest |

## 3. Build the application step by step

### Step 1: configure strict TypeScript

TypeScript catches mistakes before the program runs, but only when the
compiler is configured to be strict. This project enables:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "rootDir": "src",
    "outDir": "dist"
  }
}
```

Important distinction:

- TypeScript types protect code written by developers.
- Zod protects the application from data arriving at runtime.

An HTTP client can send any JSON it wants, regardless of your TypeScript
interfaces. That is why this project validates requests with Zod.

### Step 2: create a testable Express app

Keep application construction separate from process startup:

```ts
// src/app.ts
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
```

```ts
// src/index.ts
const server = app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});
```

This distinction matters because tests can import `app` and use Supertest
without opening a TCP port. `index.ts` is the process boundary; `app.ts` is
the reusable HTTP application.

Middleware runs in registration order. For example, JSON parsing must happen
before a controller reads `req.body`, and the error handler must be last so
it can receive errors from every earlier layer.

### Step 3: validate environment variables

`process.env` contains optional strings. Convert it once at startup:

```ts
import { z } from "zod";

export const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.url(),
  ACCESS_TOKEN_SECRET: z.string().min(64),
  REFRESH_TOKEN_SECRET: z.string().min(64),
});
```

`safeParse` lets the application print all configuration problems and exit
before serving traffic. Exporting the parsed result gives the rest of the
application a typed configuration object:

```ts
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.issues);
  process.exit(1);
}

export default parsed.data;
```

Failing fast is safer than discovering a missing secret during a login request
or silently connecting to the wrong database.

### Step 4: organize code by responsibility

The implemented source tree is:

```text
src/
├── app.ts
├── index.ts
├── config/
│   ├── db.ts
│   └── env.ts
├── controllers/
├── generated/prisma/       # generated; do not edit
├── middlewares/
├── repositories/
├── routes/
├── schemas/
├── services/
├── types/
└── utils/
```

For example, creating a user follows this path:

1. `auth.routes.ts` maps `POST /auth/register`.
2. `validate(registerSchema)` rejects malformed input.
3. `authController.register` reads validated fields.
4. `authService.register` checks the email and hashes the password.
5. `authRepository.createUser` persists the record.
6. The controller returns a deliberately limited public response.

Do not return the database user object blindly from authentication code:
the `password` column contains a bcrypt hash and should never leave the
server.

### Step 5: validate every request

Validation belongs at the boundary. The project validates body and path
parameters with one reusable middleware:

```ts
function validate(schema: ZodType, part: RequestPart = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }

    req[part] = result.data;
    next();
  };
}
```

Register and login schemas demonstrate the contract:

```ts
export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email(),
  password: z.string().min(6),
});
```

Validation provides shape and format checks; it does not replace business
rules. “Email is syntactically valid” is validation. “Email is not already
registered” is a service rule backed by the repository.

### Step 6: add PostgreSQL with Prisma 7

The Prisma schema defines the durable data model:

```prisma
model User {
  id            String         @id @default(uuid())
  name          String
  email         String         @unique
  password      String
  role          Role           @default(USER)
  createdAt     DateTime       @default(now())
  refreshTokens RefreshToken[]
}

enum Role {
  USER
  ADMIN
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

Prisma migrations make schema changes reviewable and repeatable:

```bash
npm run prisma:migrate -- --name add-user-table
npm run prisma:generate
```

This project uses Prisma 7 with `@prisma/adapter-pg`, so the client is
created with a PostgreSQL adapter:

```ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });
```

The repository hides Prisma from the service:

```ts
const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

export const usersRepository = {
  findById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    }),
};
```

The explicit `select` is a security boundary. It makes it difficult to
accidentally return password hashes and also avoids fetching unused columns.
The repository also uses a transaction when deleting a user so dependent
refresh tokens are removed consistently.

### Step 7: centralize errors

Services should signal expected failures with an application error rather
than constructing HTTP responses:

```ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
```

Examples:

- `400` — malformed or conflicting input
- `401` — no valid identity
- `403` — identity exists but lacks permission
- `404` — resource or route does not exist
- `500` — unexpected programming or infrastructure failure

The final error middleware returns safe operational messages and hides stack
traces outside development:

```ts
app.use(notFoundHandler);
app.use(errorHandler); // four parameters; registered last
```

Express 5 forwards rejected promises from async handlers to error middleware.
The project therefore does not need the older `catchAsync` wrapper, but the
central handler is still necessary for consistent responses and logging.

### Step 8: implement authentication

Authentication answers “who is this?”. This project uses:

1. bcrypt to store a one-way password hash.
2. A short-lived access JWT (`15m`).
3. A longer-lived refresh JWT (`7d`).
4. `httpOnly` cookies so browser JavaScript cannot read the tokens.
5. A database row for each refresh token so it can be revoked and rotated.

```ts
const SALT_ROUNDS = 12;
const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
const valid = await bcrypt.compare(password, passwordHash);
```

JWTs are signed, not encrypted. Anyone who obtains one can read its payload,
so only put identifiers and authorization claims in it:

```ts
const payload = { userId: user.id, role: user.role };
const accessToken = jwt.sign(payload, env.ACCESS_TOKEN_SECRET, {
  expiresIn: "15m",
});
```

Use separate secrets for access and refresh tokens. During refresh, the
service verifies the token, confirms it exists in the database, confirms its
owner matches the JWT, loads the current user role, deletes the old token,
and creates a replacement. This is **refresh-token rotation** and limits the
useful lifetime of a stolen refresh token.

Cookies are configured as:

```ts
{
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict"
}
```

`secure` is disabled only for local HTTP development. Production must use
HTTPS. If a frontend is hosted on a different site, revisit the `sameSite`
and CSRF design deliberately rather than weakening it accidentally.

### Step 9: implement authorization

Authorization answers “is this identity allowed to do this?”. The request
pipeline makes the distinction explicit:

```ts
router.get("/me", requireAuth, usersController.getMe);
router.get("/", requireAuth, requireRole("ADMIN"), usersController.getAll);
```

`requireAuth` verifies the access cookie and attaches a small typed identity
to the request. `requireRole` checks that identity. Never accept a role from
`req.body`; clients can change request bodies.

Use the status codes consistently:

```text
401 Unauthorized  → missing, expired, or invalid credentials
403 Forbidden     → valid credentials, insufficient permissions
```

The service reloads the user during refresh, so role changes take effect when
new access tokens are issued instead of trusting stale client data.

### Step 10: test behavior at the right boundary

The repository contains both service and route tests:

```text
src/services/*.test.ts
src/routes/*.test.ts
src/utils/*.test.ts
```

Unit tests isolate business rules with Vitest mocks:

```ts
it("rejects a duplicate email", async () => {
  vi.mocked(authRepository.findUserByEmail).mockResolvedValue(existingUser);

  await expect(
    authService.register("Ada", "ada@example.com", "password"),
  ).rejects.toThrow("Email already in use");
});
```

Route tests exercise the HTTP contract with Supertest:

```ts
const response = await request(app)
  .post("/auth/register")
  .send({ name: "Ada", email: "ada@example.com", password: "password" });

expect(response.status).toBe(201);
expect(response.body).not.toHaveProperty("password");
```

Test outcomes, not implementation details:

- invalid input returns `400`;
- invalid credentials return `401`;
- non-admin users cannot access admin routes;
- successful login sets cookies;
- logout revokes the refresh token;
- public responses never contain password hashes.

## 4. API reference

All successful responses are JSON unless noted otherwise. Authentication
tokens are set as cookies; clients should send cookies on subsequent requests.

### `POST /auth/register`

Request:

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "password": "correct horse battery staple"
}
```

Response `201`:

```json
{
  "id": "uuid",
  "name": "Ada Lovelace",
  "email": "ada@example.com"
}
```

### `POST /auth/login`

Request:

```json
{
  "email": "ada@example.com",
  "password": "correct horse battery staple"
}
```

Response `200`:

```json
{
  "id": "uuid",
  "name": "Ada Lovelace",
  "role": "USER"
}
```

The response also sets `accessToken` and `refreshToken` cookies.

### `POST /auth/refresh`

Reads the refresh cookie, rotates it, and sets replacement cookies.

Response `200`:

```json
{ "message": "Token refreshed" }
```

### `POST /auth/logout`

Deletes the stored refresh token and clears both cookies.

Response `200`:

```json
{ "message": "Logged out" }
```

### `GET /users/me`

Requires a valid access cookie. Returns the current public user.

### `PATCH /users/me`

Requires authentication. At least one field is required:

```json
{ "name": "Ada Byron Lovelace" }
```

### `GET /users`

Requires the `ADMIN` role. Returns public user records ordered newest first.

### `DELETE /users/:id`

Requires the `ADMIN` role. Deletes the user and their refresh tokens.
Successful deletion returns `204 No Content`.

## 5. Production hardening

This repository demonstrates the core API design, but “production-ready”
also includes operational controls. Before deploying, add and verify the
following.

### Security controls

- Add `helmet` for security headers.
- Add an allow-list CORS policy; never use `origin: "*"` with credentials.
- Add global and per-route rate limits, especially for login and refresh.
- Add CSRF protection if cookies are used across sites.
- Enforce HTTPS and configure a trusted reverse proxy.
- Set request body size limits, for example `express.json({ limit: "100kb" })`.
- Use a secret manager in production rather than committing environment files.
- Consider storing a hash of refresh tokens in the database so a database
  leak does not reveal immediately usable bearer tokens.
- Normalize emails consistently before uniqueness checks.
- Add password reset, email verification, account lockout, and audit events
  according to the product’s threat model.

### Reliability and operations

- Add `/health/live` for process health and `/health/ready` for database
  readiness. A process that cannot reach its database should not receive
  traffic.
- Implement graceful shutdown: stop accepting requests, finish in-flight
  work, disconnect Prisma, then exit.
- Use structured logs with request IDs. Never log passwords, cookies, JWTs, or
  full authorization headers.
- Add metrics and distributed tracing for latency, errors, database calls,
  and authentication failures.
- Configure database connection pooling, backups, migrations, and restore
  drills.
- Pin Node and dependency versions and audit dependencies in CI.
- Run migrations with `prisma migrate deploy` during deployment, not
  `prisma migrate dev`.

### Example graceful shutdown

The listener returned by `app.listen` is what must be closed:

```ts
const server = app.listen(env.PORT);

async function shutdown(signal: string) {
  console.log(`${signal}: shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
```

In a real service, also add a timeout so a stuck connection cannot prevent
the process from terminating forever.

## 6. Deployment checklist

### Application

- [ ] `npm ci` installs from the lockfile.
- [ ] `npm run build` succeeds in a clean environment.
- [ ] `npm test` succeeds against a dedicated test database.
- [ ] `NODE_ENV=production` is set.
- [ ] Secrets are injected by the platform or secret manager.
- [ ] `npm run prisma:generate` runs during the build.
- [ ] `npx prisma migrate deploy` runs against the release database.
- [ ] The process binds to the platform-provided port.

### Database

- [ ] Production uses a separate database and credentials.
- [ ] Backups and point-in-time recovery are enabled.
- [ ] Migrations are reviewed before release.
- [ ] Connection limits and pooling are configured.
- [ ] Restore procedures have been tested.

### HTTP and security

- [ ] TLS terminates at a trusted load balancer or reverse proxy.
- [ ] CORS origins are explicit.
- [ ] Cookies are `httpOnly`, `secure`, and have an intentional `sameSite`.
- [ ] Rate limits and body limits are enabled.
- [ ] Logs exclude credentials and tokens.
- [ ] Liveness/readiness checks are monitored.

## 7. Suggested next improvements

These are natural extensions once the core is understood:

1. Add pagination, filtering, and sorting with a validated query schema.
2. Add OpenAPI documentation generated from the same schemas.
3. Add integration tests that run against an isolated PostgreSQL container.
4. Add a CI workflow for install, type-check, test, migration validation, and
   build.
5. Add structured logging, request correlation IDs, metrics, and tracing.
6. Add a refresh-token reuse detector and revoke a token family after reuse.
7. Add feature-specific modules when the application grows beyond users and
   authentication.

The important design principle is to add each feature through the same path:

```text
schema → route → controller → service → repository → test
```

That consistency keeps a growing API understandable and makes security and
business rules visible at the boundaries where they belong.

# Conventions

## Language & framework versions
- TypeScript (`strict: true`), Node.js LTS, Next.js (App Router), React.
- SQLite + Prisma ORM (schema-first, migrations checked in).
- Auth.js (NextAuth) for authentication/session management.
- Zod for request/input validation at the API boundary.
- Vitest for tests.

## Naming
- `camelCase` for variables/functions; `PascalCase` for React components, types, and Prisma models.
- `kebab-case` for file names and route segments (`app/rooms/[room-id]/page.tsx`).
- All entity IDs are UUIDv4 — never expose auto-increment integer IDs over the API.

## Error handling
Service-layer functions throw typed domain error classes (e.g. `BookingConflictError`,
`RoomNotFoundError`, `UnauthorizedError`). A single error-mapping function in the route layer
maps each error type to its HTTP status and a safe, generic message. Raw exceptions, stack
traces, and database error details never serialize to the client.

## Data rules
- All timestamps are stored and transmitted in UTC as ISO 8601; the UI converts to the viewer's
  local timezone for display only (see `docs/domain.md`).
- All entity IDs are UUIDv4.

## Enforced by tooling
- TypeScript strict mode + ESLint (wired as `lint` and `typecheck` steps in `scripts/check.conf`
  once the project scaffold exists).
- Prisma schema is the single source of truth for the database shape; schema drift fails review.

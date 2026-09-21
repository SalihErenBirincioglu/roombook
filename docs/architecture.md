# Architecture

## System overview
roombook is a single-org internal tool for booking meeting/conference rooms. It ships as one
deployable Next.js (App Router) application — no separate frontend/backend services. Internally
it is a **layered monolith**: route/API layer → service layer → data-access layer (Prisma) →
PostgreSQL. Layers, not domain modules, are the structuring device — the domain (rooms, bookings,
users) is small enough that layering gives sufficient separation without module-boundary overhead.

## Modules / components and ownership

| Layer | Single responsibility | Owns |
|---|---|---|
| Route/API layer (Next.js route handlers, server actions, pages) | HTTP/session handling, input validation (Zod), mapping domain errors → HTTP responses | No persisted state |
| Service layer (`lib/services/*`) | Business rules: booking conflict detection, role authorization, room lifecycle | Business logic only — no SQL, no `NextRequest` |
| Data-access layer (Prisma client + schema) | Persistence | PostgreSQL schema: `User`, `Room`, `Booking` |

## Communication rules
- Route/API layer may only call service-layer functions — never the Prisma client directly.
- Service-layer functions never read `NextRequest`/`NextResponse` or format HTTP status codes —
  they throw typed domain errors and return plain data; the route layer maps errors to responses.
- All client (React component) → server communication goes through Next.js route handlers or
  server actions — no direct database access from client code (enforced by the Next.js
  client/server boundary itself).

## Forbidden dependencies (make them testable)
- Route handlers, pages, and React components never `import` the Prisma client — only files under
  `lib/services/` may import it.
- Service-layer files never import anything from `next/server` or format HTTP responses.

## Deliberately out of scope
- Multi-tenancy (single organization only).
- Payments/billing.
- Native mobile app (web-only, responsive).
- Recurring bookings, calendar/email sync, and approval workflows for conflicting requests —
  conflicts are rejected outright, not queued for admin approval (see `docs/domain.md` BR-1).

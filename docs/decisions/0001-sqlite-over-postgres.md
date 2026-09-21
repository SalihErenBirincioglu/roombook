# ADR 0001 — Use SQLite instead of PostgreSQL

- Status: Accepted
- Date: 2026-09-21

## Context
The original design (`specs/plans/0001-plan.md`) used PostgreSQL, with BR-1 ("a Room has at most
one active Booking per overlapping time range") enforced both at the app level (overlap query
before insert) and at the DB level via a `btree_gist` exclusion constraint on
`tstzrange(startTime, endTime)`. That DB-level backstop requires a reachable Postgres server.
Local development and this environment have no Postgres server available, which blocked local
migration generation and local test execution against a real database. The app has a single
deployment target (one Next.js process, no horizontal scaling — see `docs/architecture.md`), so a
process-local concurrency guarantee is sufficient for the deployment shape that actually exists
today.

## Decision
Switch the datasource from PostgreSQL to SQLite everywhere (dev, CI, and prod), using
`@prisma/adapter-better-sqlite3`. Replace the Postgres exclusion-constraint backstop with an
in-process async mutex keyed by `roomId` (`lib/services/room-lock.ts`) that serializes the
overlap-check-then-insert sequence in `createBooking`.

## Consequences
- Gains: no external DB server to provision for dev/CI/prod; local migrations and local test runs
  against a real database are now possible; fewer moving parts overall.
- Costs: BR-1's uniqueness guarantee is now enforced only within a single Node process, not by the
  database itself. If the app is ever run as more than one process/instance, two instances could
  each pass the app-level check for an overlapping range and both insert — the guarantee would
  silently weaken. This risk does not exist today because the app runs as a single process.

## Alternatives considered
- **Keep PostgreSQL everywhere**: rejected — the environment has no reachable Postgres, so this
  blocks local dev/test entirely.
- **PostgreSQL in CI only, SQLite (or in-memory) locally**: rejected — a dual-engine setup means
  the schema/constraints that are actually tested in CI (Postgres-specific exclusion constraint)
  diverge from what's exercised locally, and Prisma's SQLite/Postgres provider is a schema-level
  choice, not swappable per-environment without maintaining two schemas.

## Revisit triggers
- The app is horizontally scaled to more than one instance/process (e.g. serverless, multiple
  container replicas) — the in-process lock would no longer provide mutual exclusion across
  instances, and BR-1 would need a DB-level or distributed-lock mechanism again.
- Data volume or concurrent-write load outgrows what SQLite's single-writer model can handle.

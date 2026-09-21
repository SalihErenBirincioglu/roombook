# Testing

> **Template — filled during bootstrap.**

## The contract
- Every acceptance criterion maps to at least one test (criterion ↔ test map lives in the plan).
- Tests assert **behavior**, not implementation details or mere status codes.
- The whole suite runs inside `scripts/check` — one command, everywhere.

## Frameworks & layout
Vitest for unit/integration tests. Tests live next to the code they cover as `*.test.ts`, focused
on the service layer (business rules, conflict detection, authorization). No browser-level E2E for
v1 — explicit decision; revisit before launch if broader coverage is wanted (record as an ADR if
reversed).

## What must be tested
- Every business rule in `docs/domain.md` (BR-1…BR-5) has at least one service-layer test.
- Every admin-only service function has a test asserting non-admins are rejected (default-deny).
- Forbidden dependencies (route layer never imports Prisma directly) are checked in review, not
  automated, since there is no E2E/lint rule for it yet.

## Protected-tests rule
Weakening asserts, deleting, or skipping tests to reach green is forbidden. A red test triggers
`prompts/recovery/red-test.md` (R-02) — first decide what is wrong: code, test, or spec.

## Determinism
Flaky tests are fixed, not retried or skipped — see R-03. Evidence of a fix: 5 consecutive green runs.

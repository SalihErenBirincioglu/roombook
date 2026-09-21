# AGENTS.md — Project Rules

## Project
**roombook** — internal web app for booking meeting/conference rooms, single org. Employees
manage their own Bookings; Admins manage Rooms and any Booking. Core rule: a Room has at most one
active Booking per time range, first to book wins (`docs/domain.md` BR-1). Stack: Next.js +
TypeScript, layered monolith (route → service → Prisma/SQLite), Auth.js sessions, Vitest.

## Operating mode
**Mode: strict** — Intent→Clarify→Spec→**[GATE]**→Plan→**[GATE]**→Build→Independent Review→
**[GATE: triage]**→Verify→**[GATE: ship]**. See `workflows/README.md`.

## Invariant rules (these survive bootstrap — never delete or weaken them)

1. **No spec, no code.** Every piece of work starts as a spec in `specs/active/` (from `specs/TEMPLATE.md`).
2. **Plan before build.** A human approves the plan before any code is written.
3. **The producer never verifies its own work.** Review and QA run in a separate session or a read-only subagent, working from files (diff + spec), never from the builder's chat.
4. **Evidence over claims.** "Done" requires `scripts/check` green and every acceptance criterion mapped to proof. Never claim completion without showing evidence.
5. **Tests are protected.** Weakening asserts, deleting or skipping tests to get to green is forbidden — always.
6. **Proposal rule.** Every question, option, or finding comes with your own recommendation and rationale. The human decides; nothing is applied without approval.
7. **Shipped specs are immutable.** Files under `specs/done/` are never edited.
8. **Uncertainty is surfaced, not assumed.** On ambiguity or a docs/code conflict: stop and use the matching recovery ramp (`prompts/recovery/`).

## Where things live

| What | Where |
|---|---|
| Architecture & boundaries | `docs/architecture.md` |
| Domain language & business rules | `docs/domain.md` |
| Coding conventions | `docs/conventions.md` |
| Testing rules | `docs/testing.md` |
| Security rules | `docs/security.md` |
| Git & branching rules | `docs/git.md` |
| Decisions with rationale (ADRs) | `docs/decisions/` |
| Roles (who may do what) | `docs/roles/` |
| Specs & plans | `specs/active/` · `specs/plans/` · shipped → `specs/done/` |
| Processes & gates | `workflows/` |
| Reusable prompts & recovery ramps | `prompts/` |
| The single verification command | `scripts/check` |

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Security

> **Template — filled during bootstrap.** Baseline rules agents must honor in every plan and review.

## Secrets
- Secrets never enter the repo, specs, prompts, or chat. `.env` is gitignored; provide `.env.example`.
- Agents never print secret values, even when debugging.

## Input & output
All request bodies/params are validated with Zod schemas at the route layer before reaching the
service layer; validation failures return 400 with field-level messages, never a raw stack trace.
Responses never include password hashes or session tokens.

## AuthN / AuthZ
- AuthN: Auth.js (NextAuth), email/password credentials provider, secure session cookies.
- AuthZ: every admin-only route/service function performs a server-side check
  (`session.user.role === 'admin'`) — default-deny. UI hiding of admin controls is cosmetic only
  and never the actual authorization boundary (see `docs/architecture.md`).
- Employees may mutate a Booking only where `booking.userId === session.user.id`; Admins may
  mutate any Booking (BR-2, BR-3 in `docs/domain.md`).

## Dependencies
New dependencies require a one-line justification in the PR description. Prefer actively
maintained packages (commits/releases within the last 12 months). Run `npm audit` as part of
`scripts/check.conf` once the project scaffold exists.

## Review lens
Security is a mandatory dimension of every independent review (see `prompts/review.md`), not a
separate afterthought phase.

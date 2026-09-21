# Spec 0001 — Book a room

- Status: Approved
- Mode: strict (from AGENTS.md at creation time)
- Plan: `specs/plans/0001-plan.md`

## Intent
Employees have no reliable way to see which meeting rooms are free or to reserve one without
risking a double-booking that causes conflict at meeting time. This feature lets an Employee view
a Room's existing active Bookings for a date range and create a new Booking, with the system
refusing any request that overlaps an existing active Booking for that Room (BR-1). It lets an
Admin add the Rooms that exist in the office so there is something to book. Since real
authentication is not built yet, "who is acting" is represented by a seeded test user selected in
the UI, not a login. Success looks like: a Room can be created, its schedule is visible, a Booking
can be made and cancelled, and a conflicting Booking attempt is always rejected.

## Requirements
- An Admin can create a Room with a name and a capacity (a positive integer).
- Any user can list all Rooms.
- Any user can request a Room's active (non-cancelled) Bookings that overlap a given date range.
- Any user can create a Booking for a Room, specifying a start time and an end time. The Booking
  is owned by whichever seeded test user is currently "acting" in the session.
- A Booking's start time must be strictly before its end time, and its time range must not be
  entirely in the past (BR-5).
- Two Bookings for the same Room "overlap" when their time ranges share any span of time other
  than a single touching instant — a Booking ending at 15:00 and another starting at 15:00 for the
  same Room do **not** overlap.
- Creating a Booking that overlaps an existing active Booking for the same Room is rejected; no
  Booking is created (BR-1).
- The owner of an active Booking can cancel it. Cancelling sets its status to cancelled rather
  than deleting the record; a cancelled Booking no longer counts toward overlap checks.
- A user who does not own a Booking cannot cancel it, regardless of role. *(BR-3's "Admin may
  cancel any Booking" is intentionally not implemented yet — see Constraints.)*
- Room capacity is informational only in this spec — nothing enforces attendee counts against it.

## Constraints & out of scope
- No real authentication/login: a fixed set of seeded test users (at least one Employee, one
  Admin) is selectable as "acting user" in the UI. Building real sign-in is a separate spec.
- Admins cancelling other users' Bookings (part of BR-3) is deferred to a later spec — for now,
  only the owner of a Booking may cancel it.
- Room editing/deactivation, capacity-based attendee limits, notifications/calendar sync,
  recurring bookings, and pagination of Room/Booking lists are all out of scope for this spec.
- Availability is shown as a plain list of a Room's Bookings in a date range — no calendar/grid UI.

## Acceptance criteria
- [ ] AC-1 — Given a valid name and positive capacity, an Admin can create a Room; it then appears
      in the Room list.
- [ ] AC-2 — Creating a Room with an empty name or a non-positive capacity is rejected; no Room is
      created.
- [ ] AC-3 — Listing Rooms returns every created Room, or an empty list if none exist yet.
- [ ] AC-4 — Requesting a Room's Bookings for a date range returns only its active Bookings whose
      time range overlaps that date range (per the overlap definition above), or an empty list if
      none exist; cancelled Bookings are never included.
- [ ] AC-5 — A Booking can be created for an existing Room with a start time strictly before its
      end time, where the range is not entirely in the past; it is created as active and owned by
      the current acting user.
- [ ] AC-6 — Creating a Booking whose time range overlaps an existing active Booking for the same
      Room is rejected; no new Booking is created and the existing Booking is unchanged.
- [ ] AC-7 — Creating a Booking that starts exactly when another active Booking for the same Room
      ends (or ends exactly when another starts) is accepted — touching, not overlapping.
- [ ] AC-8 — Creating a Booking with a start time not strictly before its end time, or with a time
      range entirely in the past, is rejected.
- [ ] AC-9 — Creating a Booking for a Room that doesn't exist is rejected.
- [ ] AC-10 — The owner of an active Booking can cancel it; its status becomes cancelled and it no
      longer blocks new overlapping Bookings for that Room.
- [ ] AC-11 — A user who is not the owner of a Booking cannot cancel it, including an Admin acting
      user (deferred per Constraints).
- [ ] AC-12 — Cancelling a Booking that doesn't exist, or that is already cancelled, is rejected.

## Definition of Done
- [ ] Every acceptance criterion mapped to proof (test or reproducible observation)
- [ ] `scripts/check` green
- [ ] Independent review done; real findings fixed, noise rejected with written rationale
- [ ] Docs / ADRs updated if behavior or architecture changed
- [ ] Spec moved to `specs/done/` (it becomes immutable there)

## Scorecard (fill at ship — honest numbers make the process improvable)
| Metric | Value |
|---|---|
| Spec revisions | |
| Fix rounds | |
| Review findings: real / noise | |
| Regressions introduced | |
| Bugs escaped to production | |

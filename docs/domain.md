# Domain

## Ubiquitous language

| Term | Meaning | Notes / not to be confused with |
|---|---|---|
| Room | A bookable physical meeting/conference room, managed by Admins | Not a "Booking" |
| Booking | A reservation of one Room for one continuous time range, owned by one User | Not a "Room" |
| Employee | Authenticated user who can browse Rooms and manage their own Bookings | Default role |
| Admin | Authenticated user who additionally manages Rooms and any Booking | Superset of Employee |
| Booking conflict | Two Bookings for the same Room whose time ranges overlap | Rejected outright, no approval queue |
| Active booking | A Booking that has not been cancelled and whose end time has not necessarily passed | Cancelled bookings don't count toward conflicts |

## Business rules
- **BR-1:** A Room may have at most one active Booking overlapping any given time range
  (strict no-overlap, first to book wins; conflicting requests are rejected, not queued).
- **BR-2:** An Employee may create and cancel only their own Bookings.
- **BR-3:** An Admin may create, cancel, or reassign any Booking, and create/edit/deactivate Rooms.
- **BR-4:** A deactivated Room cannot receive new Bookings; its past/existing Bookings are preserved.
- **BR-5:** A Booking's start time must be strictly before its end time and cannot be created for a
  time range that has already fully passed. *(Assumption — confirm before first booking-related spec.)*

## Key domain invariants
- No two active Bookings for the same Room ever overlap in time (BR-1).
- All stored and transmitted timestamps are UTC; conversion to local time happens only in the UI.
- Every Booking references exactly one existing Room and exactly one existing User (its owner).

# LASERTAG-26 — Complete Implementation & Remediation Plan

> **Purpose:** This document is a practical implementation playbook for fixing the issues identified in the September 2026 code audit of `CSIVITU/LASERTAG-26`.
>
> **Target stack from the audit:** Turborepo · Bun · Express + Drizzle + Neon · Next.js ×2 · Expo · better-auth.
>
> **How to use this with Gemini:** Give this file to Gemini 3.8 High together with the repository. Ask it to inspect the actual source before editing, preserve existing architecture where possible, and implement the plan incrementally with tests after each security-sensitive change.

---

## 0. Ground Rules for the Implementation Agent

Before changing code:

1. **Read the repository first.**
   - Inspect the actual directory tree.
   - Locate the current auth middleware, route registration, schema, services, controllers, frontend API clients, admin console, mobile app, and tests.
   - Do not assume that the audit's paths are unchanged.
2. **Treat the audit as the issue inventory, not as permission to blindly rewrite the app.**
3. **Prefer the already-tested System A registration/service architecture** over patching the unauthenticated System B.
4. **Do not delete code until all callers are searched.**
5. **Do not silently change product requirements.**
6. **Keep payment out-of-band**, as confirmed by the audit. Implement the reconciliation interface/workflow, not a new payment provider.
7. **Use database constraints and transactions for invariants.** Application checks alone are not enough for concurrent requests.
8. **Never trust identity from request bodies or client storage.**
9. **Run tests/typechecks/lint after each logical group.**
10. **Do not expose internal exception messages to clients.**
11. **Do not log secrets, session cookies, QR tokens, passwords, or unnecessary PII.**
12. **Before production deployment, verify the final routes against the actual running application.**

---

# 1. Executive Summary

The audit found **two parallel booking systems**:

- **System A — `/registrations/*`**
  - Authenticated.
  - Uses signed session identity.
  - Checks ownership.
  - Uses cryptographically random QR tokens.
  - Has approximately 141 unit tests.
  - Is not used by the current frontend.

- **System B — `/slots/*`, `/teams/*`**
  - No authentication.
  - Trusts `user_id` / `leader_id` from request bodies.
  - Uses predictable QR tokens.
  - Is used by the frontend.
  - Has zero test coverage.

The recommended architectural direction is:

> **Make System A the canonical booking implementation, migrate frontend consumers to it, then remove/decommission System B after proving there are no remaining callers.**

This is preferable to fixing the insecure system one vulnerability at a time because the audit explicitly identifies System A as the more complete and tested design.

---

# 2. Priority Model

## P0 — Must be fixed before launch

1. CORS accepts every origin with credentials.
2. Public slot/team routes permit unauthenticated mutations.
3. Request-body identity allows acting as another user.
4. Predictable QR tokens.
5. Lax check-in route can bypass status/payment requirements.
6. Admin authentication is broken.
7. Frontend uses the unauthenticated booking system.
8. Session secret has a production fallback.
9. Slot deletion can cascade-delete bookings through the public route.

## P1 — Correctness / integrity

10. Conflicting capacity models.
11. Race condition in capacity updates.
12. Cancellation does not restore capacity under counter model.
13. One-active-registration invariant is not DB-enforced.
14. Check-in can update historical bookings.
15. Team member counter can drift.
16. Typo'd team code creates a team.
17. Past slots can be booked.
18. Duplicate QR/user token sources of truth.
19. LocalStorage is incorrectly treated as source of truth.

## P2 — Operational / UX

20. Admin endpoint mismatches.
21. Mobile endpoint mismatches.
22. Team non-leader booking dead-end.
23. Team code validation/collision handling.
24. Overlapping-slot errors surface as opaque 500s.
25. Maintenance script can cascade-delete bookings.
26. Migration drift.
27. Email failures have no retry.
28. Team email tracking is incorrect.
29. Registration number / phone are not persisted.
30. Wrong "REG. No." value shown on pass.
31. Date parsing is fragile.
32. Dead/unreachable code and stale README.

---

# 3. Canonical Architecture After Remediation

Recommended high-level flow:

```text
                         ┌─────────────────────┐
                         │      Frontend       │
                         │ Web / Admin / Expo  │
                         └──────────┬──────────┘
                                    │
                         signed session cookie
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Express API       │
                         │                     │
                         │ requireAuth         │
                         │ requireAdmin        │
                         │ ownership checks    │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Registration        │
                         │ Service             │
                         │                     │
                         │ transaction        │
                         │ invariants          │
                         │ QR generation       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Drizzle + Neon      │
                         │ PostgreSQL          │
                         └─────────────────────┘
```

For check-in:

```text
Attendee QR
    │
    ▼
Admin/mobile scanner
    │
    ▼
Authenticated admin endpoint
    │
    ▼
Find ONE active booking by exact QR token
    │
    ├── cancelled? ──> reject
    ├── confirmed? ──> reject
    ├── paid? ───────> reject
    ├── already in? ─> return alreadyCheckedIn
    │
    ▼
Mark that booking checked in
    │
    ▼
Audit/check-in response
```

---

# 4. Phase 1 — CORS Fix

## Problem

The audit reports that both branches of the CORS origin callback effectively return:

```ts
callback(null, true)
```

while credentials are enabled.

That means an arbitrary website can potentially make authenticated cross-origin requests with a user's cookies.

## Desired behavior

Only explicitly configured frontend origins should be accepted.

## Implementation

Locate the actual CORS setup, reported as:

```text
apps/api/src/app.ts
```

Use a strict allowlist.

Example:

```ts
const allowedOrigins = new Set(
  env.CORS_ORIGINS
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server / same-origin requests where no Origin exists.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed"));
    },
    credentials: true,
  }),
);
```

Do not use:

```ts
origin: true
```

or:

```ts
callback(null, true)
```

for every origin.

## Environment

Example:

```env
CORS_ORIGINS=https://your-production-domain.example,https://admin-production-domain.example
```

For development:

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Tests

Add tests for:

- Allowed origin → success.
- Disallowed origin → rejected.
- Request with credentials from allowed origin → succeeds.
- Request with credentials from disallowed origin → rejected.
- No `Origin` header → handled according to the API's server-to-server policy.

---

# 5. Phase 2 — Authentication and Identity

## Core rule

**Never accept authenticated identity from `req.body.user_id`, `req.body.leader_id`, query parameters, or client localStorage.**

Identity must come from the authenticated session.

Bad:

```ts
const userId = req.body.user_id;
```

Good:

```ts
const userId = req.user.id;
```

where `req.user` was established by `requireAuth`.

## Middleware

If the repository already has `requireAuth`, use it consistently rather than creating a second authentication mechanism.

Conceptually:

```ts
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const session = await getSessionFromRequest(req);

  if (!session) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  req.user = session.user;
  req.session = session;

  return next();
}
```

Do not allow the middleware to trust:

```http
x-user-id
```

as the authentication source.

---

# 6. Route Protection Matrix

Build an explicit route matrix from the actual Express route registration.

Recommended policy:

| Route category | Auth | Admin |
|---|---:|---:|
| Public landing/content | No | No |
| `/users/me/*` | Yes | No |
| User registration/booking | Yes | No |
| Team create/join/read private data | Yes | No |
| Slot listing | Yes or intentionally public | No |
| Slot create/delete/update | Yes | Yes |
| Admin analytics | Yes | Yes |
| Admin payments | Yes | Yes |
| Admin check-in | Yes | Yes |
| API docs | Prefer protected in production | Usually Yes |
| Auth endpoints | No | No |

The exact policy should follow the product's intended access model, but **every mutation must have an explicit authorization decision**.

---

# 7. Phase 3 — Production Session Secret

## Problem

The audit reports a hardcoded fallback for:

```text
BETTER_AUTH_SECRET
```

A production deployment missing the environment variable can therefore start with a publicly known signing key.

## Desired implementation

Production must fail fast.

Example:

```ts
const betterAuthSecret =
  process.env.BETTER_AUTH_SECRET?.trim();

if (process.env.NODE_ENV === "production" && !betterAuthSecret) {
  throw new Error(
    "BETTER_AUTH_SECRET is required in production",
  );
}
```

If a development fallback is retained:

```ts
const betterAuthSecret =
  process.env.BETTER_AUTH_SECRET ??
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error("BETTER_AUTH_SECRET is required");
      })()
    : "development-only-secret");
```

Prefer the repository's existing environment-validation style if it already has one.

## Also verify

- Production secrets are injected by the deployment platform.
- Secrets are not committed to Git.
- CI does not print them.
- `.env` files containing real secrets are ignored.
- Rotating the secret has a documented session invalidation consequence.

---

# 8. Phase 4 — Make System A Canonical

## Objective

Migrate the frontend away from:

```text
/slots/*
/teams/*
```

and onto the authenticated registration/service implementation.

## Before editing

Search the repository for:

```text
/slots
/teams
reserveSlot
createTeam
joinTeam
convert-to-solo
user_id
leader_id
```

Create a caller inventory.

Do not delete System B until:

```text
rg "/slots|/teams|reserveSlot|createTeam|joinTeam" .
```

(or equivalent repository search) shows no production caller that still depends on it.

## Migration strategy

### Step A

Document current System B frontend operations:

```text
Create team
Join team
Select mode
Load slots
Reserve slot
Profile
Check-in
Admin
Mobile
```

### Step B

Map each operation to System A.

### Step C

Change frontend API functions.

### Step D

Add integration tests against the new route.

### Step E

Deploy/test.

### Step F

Remove/deprecate System B.

## Important

Do not maintain two implementations after the migration.

Two booking systems means two sets of:

- capacity rules
- auth rules
- check-in rules
- cancellation behavior
- QR generation
- tests

That is exactly how the current divergence happened.

---

# 9. Phase 5 — Secure QR Tokens

## Problem

Current live-path tokens reportedly look like:

```text
QR-BKG-${Date.now()}-<4 random digits>
```

The timestamp is predictable and the random portion has a very small search space.

## Required design

Use cryptographically secure random bytes.

Example:

```ts
import { randomBytes } from "node:crypto";

function generateQrToken(): string {
  return `QR-${randomBytes(32).toString("hex")}`;
}
```

That produces 256 bits of randomness.

Do not append user IDs, timestamps, registration IDs, or other predictable identifiers to the secret token.

## Database

Ensure the token has a unique constraint/index:

```text
bookings.qr_token UNIQUE
```

if compatible with the existing schema.

## Token lifecycle

A booking should have one canonical QR token.

Avoid:

```text
booking.qrToken
user.qrToken
```

as two independently meaningful sources.

Prefer:

```text
booking.qrToken
```

as the source of truth.

If `user.qrToken` is retained for legacy compatibility, it must not become another authority.

## Rotation

Define behavior for:

- booking cancellation
- rebooking
- admin regeneration
- compromised token
- team member changes

---

# 10. Phase 6 — Real QR Code in the Frontend

## Current problem

The audit reports that `QrCode.tsx` is a hand-built static SVG that encodes nothing.

Meanwhile:

```text
profile.activeRegistration.qrToken
```

is fetched but not used.

## Fix

Use the existing real QR library if present. Otherwise add a maintained QR-code package compatible with the actual Next.js/Expo target.

Conceptual React API:

```tsx
<QrCode
  value={profile.activeRegistration.qrToken}
  size={220}
/>
```

Do not use the decorative fixed `<rect>` grid.

## Acceptance criteria

Two different attendees must render different QR codes.

A QR scanner must decode the actual token.

The token decoded from the UI must equal:

```text
activeRegistration.qrToken
```

The emailed PNG and frontend QR must represent the same canonical token.

---

# 11. Phase 7 — Reservation State Machine

The audit notes that the live path currently self-confirms:

```text
reserve -> confirmed
```

and generates a QR immediately.

The intended stricter model is:

```text
reserved -> payment -> confirmed
```

However, payment is intentionally out-of-band.

Therefore use a state model consistent with the actual business process.

Recommended conceptual states:

```text
reserved
confirmed
cancelled
```

and a separate:

```text
paid: boolean
```

if that is the existing data model.

Do not invent a fake in-app payment state.

## Reservation rules

At minimum:

1. User must be authenticated.
2. User can only act for themselves.
3. Slot must exist.
4. Slot must not be in the past.
5. Slot must have capacity.
6. User must not already have another active registration if the product requires one.
7. Team booking must verify team membership and leader authorization.
8. Team code must exist.
9. Reservation must be atomic.
10. QR must be generated securely.
11. Confirmation email must not determine whether the booking exists.

---

# 12. Phase 8 — One Active Registration Per User

## Problem

Application logic checks the rule, but the database does not enforce it.

Two simultaneous requests can both pass the application-level check.

## Database-level solution

Use a PostgreSQL partial unique index over the user's active registrations.

Conceptually:

```sql
CREATE UNIQUE INDEX bookings_one_active_registration_per_user
ON bookings (user_id)
WHERE status IN ('reserved', 'confirmed');
```

The exact status predicate must match the real schema.

If only one active booking is allowed regardless of status, use the exact business definition of "active."

Also retain a unique index preventing duplicate booking for the same user/slot if required.

## Migration safety

Before adding the index:

1. Find duplicates.
2. Decide which booking survives.
3. Cancel/archive/delete invalid duplicates according to product rules.
4. Add the unique index.
5. Test concurrent booking attempts.

---

# 13. Phase 9 — Transactional Reservation

## Required invariant

A reservation must not overbook a slot.

Do not use:

```ts
const slot = await getSlot(id);

if (slot.capacity > bookings) {
  await insertBooking();
}
```

without transaction/locking/atomic DB enforcement.

## Preferred approach

Because System A treats `capacity` as a fixed ceiling, use:

```text
capacity = fixed maximum
active bookings = count of active registrations
```

Then reserve inside a transaction with appropriate locking.

Conceptual PostgreSQL approach:

```sql
SELECT *
FROM slots
WHERE id = $1
FOR UPDATE;
```

Then:

```sql
SELECT COUNT(*)
FROM bookings
WHERE slot_id = $1
  AND status IN ('reserved', 'confirmed');
```

If count >= capacity:

```text
409 SLOT_FULL
```

Otherwise insert the booking.

## Alternative

If a counter is retained, use an atomic database update:

```sql
UPDATE slots
SET remaining_capacity = remaining_capacity - 1
WHERE id = $1
  AND remaining_capacity > 0
RETURNING *;
```

But **do not combine a mutable counter with a fixed-capacity interpretation of the same column.**

---

# 14. Phase 10 — Pick One Capacity Model

The audit identifies two contradictory models:

### Model A — fixed ceiling

```text
capacity = 10
active bookings = 4
remaining = 6
```

### Model B — decrementing counter

```text
capacity = 10
book -> 9
book -> 8
```

Both currently write the same column.

## Recommended

Use **fixed ceiling**:

```text
slots.capacity = maximum seats
```

Calculate:

```text
remaining = capacity - activeBookingCount
```

This matches the newer service design described in the audit.

## Required refactor

Search for:

```text
capacity - 1
capacity + 1
Math.max(0, ...)
```

and remove counter semantics from booking/cancellation code.

Use a helper:

```ts
async function getSlotAvailability(slotId: string) {
  const slot = await getSlot(slotId);
  const activeBookings =
    await countActiveBookingsForSlot(slotId);

  return {
    capacity: slot.capacity,
    booked: activeBookings,
    remaining: Math.max(0, slot.capacity - activeBookings),
  };
}
```

---

# 15. Phase 11 — Cancellation

## Current issue

Cancellation marks:

```text
status = cancelled
```

but under the decrement model never restores the seat.

With the fixed-ceiling model, this problem largely disappears.

## Correct behavior

Cancellation:

```text
confirmed/reserved
        ↓
    cancelled
```

The booking remains historical.

Availability is automatically recalculated because cancelled bookings are excluded.

Do not delete the booking just to free capacity.

---

# 16. Phase 12 — Consistent Counting

The audit identifies:

```text
countBookings
countActiveBookingsForSlot
```

with different definitions.

## Canonical definition

Define:

```ts
const ACTIVE_BOOKING_STATUSES = [
  "reserved",
  "confirmed",
] as const;
```

Use the same predicate everywhere that asks:

> "How many seats are occupied?"

Conceptually:

```ts
where(
  and(
    eq(bookings.slotId, slotId),
    inArray(bookings.status, ACTIVE_BOOKING_STATUSES),
  ),
)
```

Cancelled bookings must not consume capacity.

## Create shared query

```ts
countActiveBookingsForSlot(slotId)
```

and use it in:

- slot availability
- admin slot editing
- slot deletion checks
- analytics
- reservation logic
- tests

---

# 17. Phase 13 — Prevent Past-Slot Booking

The audit says there is currently no protection against booking a finished slot.

## Service validation

Before reservation:

```ts
if (slot.endTime <= new Date()) {
  throw new AppError(
    "Cannot book a slot that has already ended",
    409,
  );
}
```

Use the actual event semantics.

Possible policy:

```text
startTime < now < endTime
```

or:

```text
now < startTime
```

depending on whether late booking is allowed.

The important point is that the rule must be explicit and server-enforced.

## Frontend

Hide/disable past slots for UX.

But frontend checks are supplementary; the API must reject them too.

---

# 18. Phase 14 — Check-In: One Canonical Path

The audit identifies two paths:

```text
/admin/checkin/scan
/verification/check-in
```

The second is lax and is currently used by mobile/admin flows.

## Desired design

Keep one authoritative check-in service.

Example:

```ts
async function scanRegistration(
  identifier: string,
  adminUserId: string,
) {
  // 1. Resolve exact active registration.
  // 2. Validate booking state.
  // 3. Validate payment.
  // 4. Validate not already checked in.
  // 5. Mark exactly one booking checked in.
  // 6. Return attendee/check-in data.
}
```

Both web admin and mobile should call the same service.

---

# 19. Phase 15 — Check-In Authorization

Every check-in mutation must require an admin/staff session.

Example route:

```ts
router.post(
  "/admin/checkin/scan",
  requireAuth,
  requireAdmin,
  scanHandler,
);
```

Do not trust:

```text
x-user-id
```

from the client.

Do not expose an unauthenticated check-in route.

---

# 20. Phase 16 — Check-In Exact Booking Matching

## Current problem

The audit reports a query equivalent to:

```ts
or(
  eq(bookings.id, identifier),
  eq(bookings.qrToken, identifier),
  eq(bookings.userId, targetUser.id),
)
```

The `userId` branch can update every booking that user has ever had.

## Fix

Do not use user ID as a QR-token fallback.

Use exact identifiers.

Example:

```ts
const booking = await db.query.bookings.findFirst({
  where: eq(bookings.qrToken, identifier),
});
```

If booking IDs are intentionally scannable, explicitly distinguish identifier types:

```ts
const booking =
  isBookingId(identifier)
    ? await findBookingById(identifier)
    : await findBookingByQrToken(identifier);
```

Never broaden a token lookup into:

```text
any booking belonging to this user
```

---

# 21. Phase 17 — Check-In Validation Order

Recommended:

```text
1. Authenticated admin?
2. Booking exists?
3. Booking cancelled?
4. Booking status confirmed?
5. Paid?
6. Already checked in?
7. Event/slot valid?
8. Mark exactly this booking checked in.
```

Example:

```ts
if (!booking) {
  throw new AppError("Pass not found", 404);
}

if (booking.status === "cancelled") {
  throw new AppError("Booking is cancelled", 409);
}

if (booking.status !== "confirmed") {
  throw new AppError("Booking is not confirmed", 409);
}

if (!booking.paid) {
  throw new AppError("Payment not verified", 409);
}

if (booking.isCheckedIn) {
  return {
    alreadyCheckedIn: true,
    booking,
  };
}
```

The exact payment location must match the actual schema.

---

# 22. Phase 18 — Booking vs User Check-In Source of Truth

The audit says:

- one path updates `bookings.isCheckedIn`
- another updates `user.isCheckedIn`

This creates disagreement.

## Recommended

Attendance is a **booking/event-level fact**.

Therefore:

```text
bookings.isCheckedIn
```

should be authoritative.

If `user.isCheckedIn` is retained, treat it as derived/cache data only.

Better:

```text
booking.isCheckedIn = true
booking.checkedInAt = timestamp
booking.checkedInBy = adminUserId
```

This provides a better audit trail.

---

# 23. Phase 19 — Team Data Integrity

## Current problem

The audit says team member count is denormalized and can be seeded incorrectly.

Example:

```text
actual members = 1
stored members = 5
```

which makes the team permanently appear full.

## Preferred design

Treat the junction table as source of truth:

```text
team_members
```

Then:

```ts
const memberCount = await countTeamMembers(teamId);
```

Do not accept a client-supplied count as authoritative.

## Create-team input

The client should send:

```json
{
  "name": "ABC",
  "code": "..."
}
```

not:

```json
{
  "members": 5
}
```

unless `members` has a very specific product meaning.

---

# 24. Phase 20 — Team Creation

## Server-generated team codes

The audit says codes are currently generated client-side using `Math.random()`.

Move code generation to the server.

Example:

```ts
import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function generateTeamCode(length = 6): string {
  let code = "";

  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(0, ALPHABET.length)];
  }

  return code;
}
```

## Collision retry

Because the code is a database key:

```ts
for (let attempt = 0; attempt < 5; attempt++) {
  const code = generateTeamCode();

  try {
    return await createTeamWithCode(code);
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }
}

throw new AppError(
  "Could not generate a unique team code",
  503,
);
```

Use the database's unique constraint as the final authority.

---

# 25. Phase 21 — Team Code Validation

Server-side schema:

```ts
const teamCodeSchema = z
  .string()
  .regex(/^[A-Z]{6}$/);
```

Normalize if the UX allows lowercase input:

```ts
const normalizedCode = input.trim().toUpperCase();
```

Then validate.

Do not rely on the frontend regex alone.

---

# 26. Phase 22 — Typo'd Team Code Must Not Create a Team

Current bad behavior:

```text
team code not found
        ↓
create a new team
```

Correct:

```text
team code not found
        ↓
404 / 400
"Team not found"
```

A reservation endpoint should never silently mutate unrelated domain state because a lookup failed.

---

# 27. Phase 23 — Team Authorization

For team reservation:

```text
authenticated user
      │
      ▼
member of requested team?
      │
      ├── no → 403
      │
      ▼
leader?
      │
      ├── no → 403
      │
      ▼
reserve team slot
```

If only leaders are allowed to reserve, the API must enforce it.

The frontend should detect non-leaders before walking them through the entire booking flow.

---

# 28. Phase 24 — Team Convert-to-Solo

Current issue:

```text
all bookings with teamCode
        ↓
type = individual
```

This can rewrite bookings belonging to members who are no longer valid members.

## Safer algorithm

Inside a transaction:

1. Authenticate.
2. Verify current user is team leader.
3. Load actual team members from `team_members`.
4. Determine exactly which bookings belong to the team.
5. Apply the intended conversion only to eligible records.
6. Delete/retire team membership according to product semantics.
7. Commit.

Never update rows merely because they share a string value if that string can outlive the relationship.

---

# 29. Phase 25 — LocalStorage Is a Cache, Not Authority

## Current issue

The audit reports:

```text
lasertag_selected_mode
lasertag_active_team
lasertag_confirmed_slot
```

are being used as the source of truth.

That means:

```text
clear localStorage
    ↓
real booking exists
    ↓
frontend behaves as if no booking exists
```

## Correct architecture

Server response:

```text
/users/me/profile
```

is authoritative.

Use localStorage only to improve UX.

Example:

```ts
const profile = await getMyProfile();

const mode = profile.activeTeam
  ? "team"
  : profile.activeRegistration
    ? "solo"
    : null;
```

Then optionally cache:

```ts
localStorage.setItem(
  "lasertag_selected_mode",
  mode,
);
```

but never trust it for authorization or existence checks.

---

# 30. Phase 26 — Dynamic Slot Capacity in Frontend

The audit reports:

```text
maxCapacity: 10
```

hardcoded in `useSlots`.

## Fix

Use API data:

```ts
slot.capacity
```

and preferably:

```ts
slot.booked
slot.remaining
```

returned by the server.

Do not hardcode:

```ts
const maxCapacity = 10;
```

unless 10 is a genuine global business constant.

---

# 31. Phase 27 — Admin Authentication

The audit says an existing:

```text
/admin-auth/login
```

exists, but the admin console has no login page and API requests do not send credentials.

## Implement

Admin flow:

```text
/admin
  ↓
check current session
  ↓
not admin → login page
  ↓
admin login
  ↓
session cookie
  ↓
API calls with credentials
```

For browser `fetch`:

```ts
fetch(url, {
  credentials: "include",
  ...options,
});
```

Remove:

```ts
"x-user-id": "111111..."
```

entirely.

Do not replace one insecure client-supplied identity header with another.

---

# 32. Phase 28 — Admin Endpoint Audit

The audit reports mismatches including:

```text
GET /admin/payments
POST /slots/bulk
POST /teams/:id/checkin
```

where the expected actual routes differ or do not exist.

## Fix method

Generate a route inventory from the actual Express application.

Example table:

| Frontend call | Actual API route | Action |
|---|---|---|
| admin payments list | verify actual route | change client |
| slot bulk create | `/admin/slots` according to audit | change client |
| team check-in | no route | remove or map to canonical check-in |

Do not create duplicate endpoints just to preserve a stale client unless there is a product reason.

---

# 33. Phase 29 — Mobile API Wiring

Audit findings:

```text
/verification/checkin
```

is called, while actual route is:

```text
/verification/check-in
```

and:

```text
/teams/:id/checkin
```

does not exist.

## Fix

Centralize API paths:

```ts
export const API_ROUTES = {
  checkIn: "/admin/checkin/scan",
  // ...
} as const;
```

Then import these constants rather than repeating strings across apps.

Also ensure mobile authentication is actually compatible with the backend's session model.

---

# 34. Phase 30 — Error Handling

## Problem

The audit says arbitrary errors with numeric `status` values can be treated as domain errors and their messages returned verbatim.

## Fix

Only expose known application errors.

Example:

```ts
if (err instanceof AppError) {
  return res.status(err.statusCode).json({
    error: err.message,
    code: err.code,
  });
}

logger.error(err);

return res.status(500).json({
  error: "Internal server error",
  code: "INTERNAL_ERROR",
});
```

Do not do:

```ts
if (typeof err.status === "number") {
  return res.status(err.status).json({
    error: err.message,
  });
}
```

## Client-facing error model

Prefer stable codes:

```json
{
  "error": "Slot is full",
  "code": "SLOT_FULL"
}
```

Frontend can map:

```text
SLOT_FULL → "This slot is full. Please choose another one."
```

rather than depending on exact backend prose.

---

# 35. Phase 31 — Email Reliability

## Current problem

Confirmation email is sent via floating async work:

```ts
(async () => {
  await sendEmail();
})();
```

Failures can disappear after the request finishes.

## Correct model

The booking transaction should commit independently of email delivery.

Then enqueue email work.

Conceptual:

```text
DB transaction
    ↓
booking committed
    ↓
email job created
    ↓
worker sends email
    ↓
success → mark sent
failure → retry
```

If a queue is not appropriate for this project yet, implement a reliable retryable service.

At minimum:

```ts
try {
  await sendConfirmationEmail(...);

  await markConfirmationEmailSent(bookingId);
} catch (error) {
  await recordEmailFailure(bookingId, error);
  throw error;
}
```

Do not roll back a valid booking merely because SMTP is temporarily unavailable unless that is explicitly desired.

---

# 36. Phase 32 — Per-Member Email Tracking

For team bookings, do not use:

```ts
members.some(...)
```

to decide whether the entire booking was successfully emailed.

Track per recipient.

Example:

```text
booking
 ├── member A → sent
 ├── member B → sent
 ├── member C → failed
 └── member D → pending
```

Possible schema:

```text
booking_email_deliveries
------------------------
id
booking_id
user_id
email
status
attempt_count
last_error
sent_at
created_at
updated_at
```

This makes resend operations possible.

---

# 37. Phase 33 — Payment Reconciliation

The audit explicitly confirms:

> Payment is intentionally out-of-band.

Do not build an unnecessary payment provider into the registration flow.

Instead create a reconciliation process.

Input could be:

```csv
registration_number,email,paid
VIT12345,user@example.com,true
...
```

or whatever the actual external payment system exports.

## Reconciliation rules

1. Validate CSV.
2. Normalize email/registration number.
3. Find matching user/booking.
4. Update `paid`.
5. Record when/by whom/source it changed.
6. Report unmatched records.
7. Make the process idempotent.
8. Produce a summary.

Example result:

```text
Processed: 1,000
Marked paid: 942
Already paid: 41
Unmatched: 17
Invalid: 0
```

Do not silently update users based on ambiguous matches.

---

# 38. Phase 34 — Registration Number and Phone

The audit confirms these fields are intentionally reference-only and not part of booking logic.

Still, if admins need them later, they need server-side persistence.

## Recommended

Add fields to the appropriate user/profile table:

```text
registrationNumber nullable
phoneNumber nullable
```

or a dedicated profile table if that better matches the schema.

Do not use them for authorization unless product requirements explicitly change.

## API

Allow authenticated users to update their own profile:

```text
PATCH /users/me/profile
```

with appropriate validation.

Admin can read them where operationally necessary.

---

# 39. Phase 35 — Fix "REG. No." Display

The audit reports that the pass currently displays:

```text
activeRegistration.id
```

which looks like:

```text
BKG-1757...-4821
```

under:

```text
REG. No.
```

## Fix

Display the actual stored registration number:

```tsx
profile.user.registrationNumber
```

or the actual field defined after schema implementation.

If no registration number exists, display:

```text
Not provided
```

rather than a booking ID.

---

# 40. Phase 36 — Date Handling

## Current problem

The frontend parses a display string such as:

```text
19th September, 2026
```

using:

```regex
/\b(18|19|20)\b/
```

which fails on ordinal forms like `19th`.

## Correct design

Do not parse human-readable UI strings.

API should return machine-readable values:

```json
{
  "date": "2026-09-19",
  "startTime": "14:00",
  "endTime": "15:00"
}
```

Frontend formats them for display.

Example:

```ts
formatSlotDate(slot.startTime)
```

The source of truth should remain the database timestamp.

---

# 41. Phase 37 — Overlapping Slots

The audit says the GiST exclusion constraint currently prevents overlapping slots globally, not per arena.

## First decide the product rule

If parallel sessions in different arenas are allowed:

```text
Arena A — 10:00–11:00
Arena B — 10:00–11:00
```

must be valid.

Then the exclusion constraint should include the arena/resource identity.

Conceptual PostgreSQL:

```sql
EXCLUDE USING gist (
  arena_id WITH =,
  time_range WITH &&
)
```

The exact Drizzle representation must match the actual schema.

## API behavior

Before insertion, either:

- proactively check for conflicts, or
- catch the exclusion violation and translate it to:

```text
409 SLOT_OVERLAP
```

Never expose a raw driver exception as a generic 500 for a normal business conflict.

---

# 42. Phase 38 — Maintenance Script Safety

The audit reports:

```text
apply-slot-constraint.ts
```

can delete slots to resolve overlap, which cascades into bookings.

## Required changes

Do not allow a maintenance script to silently delete live data.

At minimum:

```text
--dry-run
```

should be the default.

Example:

```bash
bun run apply-slot-constraint --dry-run
```

Then:

```bash
bun run apply-slot-constraint --confirm
```

for destructive execution.

Before deleting anything:

1. Detect affected slots.
2. Detect attached bookings.
3. Print affected IDs/counts.
4. Require explicit confirmation.
5. Prefer migration/manual reconciliation over destructive cleanup.
6. Never run automatically after registrations open.

Better yet, redesign the migration so it does not delete slots at all.

---

# 43. Phase 39 — Migration Drift

The audit reports that:

```text
drizzle/0000_icy_sage.sql
```

does not contain constraints now represented in:

```text
packages/database/schema.ts
```

Specifically:

```text
bookings_active_user_slot_idx
slots_positive_capacity
```

## Fix

Regenerate/reconcile migrations using the project's actual Drizzle workflow.

Then verify from a clean database:

```text
schema.ts
       ↓
migration files
       ↓
fresh database
       ↓
constraints/indexes present
```

Do not rely on:

```text
db:push
```

as the only way to initialize production.

## CI test

Create a clean ephemeral database and run migrations.

Then assert:

```text
expected tables exist
expected indexes exist
expected constraints exist
```

---

# 44. Phase 40 — Team Leader / Member UX

Current flow:

```text
member joins team
  ↓
profile
  ↓
no booking
  ↓
slot booking
  ↓
403 only leader can reserve
```

This is a UX dead end.

## Better behavior

If:

```text
user is team member
AND
user is not leader
AND
team has no booking
```

show:

```text
Your team leader needs to reserve the slot.
```

with:

```text
Team code: ABCDEF
Leader: ...
Status: Waiting for leader
```

Do not send the member to a form that the API will inevitably reject.

---

# 45. Phase 41 — ProfileTeam1

The audit reports `ProfileTeam1` is built but unreachable.

Search all profile routing.

If this screen is still product-relevant:

```text
/profile-team1
```

should render the leader view.

If it is obsolete:

- delete it,
- remove imports,
- remove route references,
- update tests.

Do not keep dead screens around indefinitely.

---

# 46. Phase 42 — Dead Controllers and Stale Files

Audit reports:

```text
controllers/slots.controller.ts
controllers/teams.controller.ts
```

are byte-identical copies of admin counterparts and imported by nothing.

Before deleting:

```bash
rg "slots.controller|teams.controller" .
```

If no production/test import remains:

- delete them,
- remove exports,
- run TypeScript build,
- run tests.

Also resolve:

```text
app/global.css
```

if genuinely unused.

---

# 47. Phase 43 — Role Schema

Audit reports:

```text
userRoleEnum
```

exists but:

```text
user.role
```

is plain text.

## Preferred

Use the enum in the database schema if supported by the project's conventions:

```text
user.role ∈ { user, admin, ... }
```

Do not make authorization depend on arbitrary strings with no validation.

If PostgreSQL enum migration complexity is undesirable, use a constrained text column plus application validation and tests.

The important property is:

> Invalid roles should not be silently accepted.

---

# 48. Phase 44 — API Documentation

The audit says:

```text
/api-docs
/api-docs.json
```

are public.

## Decide

If public API documentation is not required:

```text
protect it in production
```

If documentation must remain public:

- do not include sensitive endpoints without authentication descriptions,
- ensure examples do not expose secrets,
- do not expose internal admin routes unnecessarily.

For an event registration platform, protecting internal operational route maps is generally reasonable.

---

# 49. Phase 45 — Signup Policy

The audit reports:

```text
email/password enabled
no verification
no domain allowlist
```

For a campus event, the product may require institutional accounts.

If the requirement is:

```text
only VIT users
```

then enforce it server-side.

Example:

```ts
const allowedDomains = [
  "vit.ac.in",
  // actual approved domains only
];

function isAllowedEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();

  return domain !== undefined &&
    allowedDomains.includes(domain);
}
```

If email verification is required:

```text
signup
 ↓
verification email
 ↓
verified
 ↓
registration allowed
```

Do not consider an unverified email address proof of ownership.

The exact allowed domain(s) must come from the product requirements; do not invent them.

---

# 50. Phase 46 — API Response DTOs

Avoid leaking complete database rows.

For public/user/admin APIs define DTOs.

Example attendee-facing:

```ts
type RegistrationDto = {
  id: string;
  status: "reserved" | "confirmed" | "cancelled";
  slot: {
    id: string;
    startTime: string;
    endTime: string;
  };
  qrToken: string;
};
```

Admin DTO can contain operational fields.

Public team list should not expose:

```text
emails
phone numbers
payment status
check-in status
```

unless explicitly required and authorized.

---

# 51. Phase 47 — PII Access Rules

Based on the audit, current public team endpoints expose:

- names
- emails
- phone numbers
- roles
- payment status
- check-in status

## Recommended access model

### Public

Only minimal information required to join a team:

```text
team code
team display name
member count
capacity
```

### Authenticated team member

Their own information plus team information required by the workflow.

### Admin

Operational PII required for event management.

Every response should be intentionally shaped.

---

# 52. Phase 48 — Atomic Team Join

Joining a team must be transactional.

Pseudo-flow:

```ts
await db.transaction(async (tx) => {
  const team = await lockTeam(tx, teamCode);

  if (!team) {
    throw new AppError("Team not found", 404);
  }

  const existingMembership = await findMembership(
    tx,
    team.id,
    req.user.id,
  );

  if (existingMembership) {
    throw new AppError("Already a member", 409);
  }

  const count = await countMembers(tx, team.id);

  if (count >= MAX_TEAM_SIZE) {
    throw new AppError("Team is full", 409);
  }

  await insertMembership(tx, {
    teamId: team.id,
    userId: req.user.id,
  });
});
```

If a unique constraint exists on:

```text
(team_id, user_id)
```

keep it.

Application validation + DB constraint is stronger than either alone.

---

# 53. Phase 49 — Reservation Idempotency

The audit expects a double-click to be idempotent.

Current behavior rewrites the booking and sends email again.

## Desired

If the same authenticated user confirms the same reservation twice:

```text
first request → creates booking
second request → returns existing booking
```

No duplicate email.

Possible strategy:

```text
client request ID / idempotency key
```

or database uniqueness + transaction.

For simple confirmation flows:

```ts
if (existingActiveRegistration) {
  return existingActiveRegistration;
}
```

but ensure concurrent requests are also protected by DB constraints.

---

# 54. Phase 50 — Delete Slot Semantics

Public route deletion currently can cascade bookings.

## Recommended policy

A slot with bookings should not be hard-deleted.

Options:

### Option A — reject

```text
409 SLOT_HAS_BOOKINGS
```

### Option B — soft-delete

```text
slots.deletedAt
```

and preserve bookings.

For event operations, soft deletion is often safer because historical bookings and audit records matter.

If the existing business rule is "cannot delete once booked", enforce it consistently on every route.

---

# 55. Phase 51 — Slot Creation Validation

Validate:

```text
start < end
capacity > 0
capacity <= configured maximum if one exists
date is valid
arena exists
no prohibited overlap
slot is not in the past
```

Do not trust client-calculated remaining capacity.

---

# 56. Phase 52 — Service Layer Boundaries

Prefer:

```text
route
  ↓
controller
  ↓
service
  ↓
repository/query
  ↓
database
```

Avoid controllers directly performing complex multi-step mutations.

For example:

```ts
// controller
const result = await registrationService.reserve({
  userId: req.user.id,
  slotId,
  teamCode,
});
```

The service owns:

- authorization-relevant business rules
- transactions
- invariants
- state transitions

The controller owns:

- request parsing
- response formatting
- HTTP status

---

# 57. Phase 53 — Validation

Use the project's existing validation library.

All user-controlled input must be validated:

```text
slot ID
team code
email
phone
registration number
booking ID
QR token
capacity
timestamps
```

Never rely on frontend validation.

Example:

```ts
const reserveSchema = z.object({
  slotId: z.string().min(1),
  type: z.enum(["individual", "team"]),
  teamCode: z.string().regex(/^[A-Z]{6}$/).optional(),
});
```

Notice there is deliberately no:

```text
userId
```

in the request schema.

---

# 58. Phase 54 — Logging and Audit Trail

For sensitive operations record:

```text
who
what
when
target
result
```

Useful operations:

- booking created
- booking cancelled
- booking confirmed
- team created
- team joined
- team converted
- slot created
- slot modified
- check-in
- payment reconciliation
- QR regenerated

Example:

```text
actorUserId
action
entityType
entityId
metadata
createdAt
```

Never put raw QR tokens or passwords into audit logs.

---

# 59. Phase 55 — Check-In Audit Records

A robust check-in record:

```text
bookingId
attendeeUserId
checkedInAt
checkedInBy
source
```

where source might be:

```text
admin_web
admin_mobile
```

This helps resolve event-day disputes.

---

# 60. Phase 56 — Integration Tests

The audit explicitly says route-level integration coverage is missing.

This is one of the most important improvements.

## Minimum test suite

### Auth

```text
protected GET → 401 without session
protected POST → 401 without session
admin route → 401 without session
admin route → 403 normal user
admin route → success admin
```

### Identity

```text
body user_id ignored
body leader_id ignored
cannot reserve for another user
cannot join another user's identity
```

### CORS

```text
allowed origin
disallowed origin
credentials
```

### QR

```text
two bookings get different tokens
token has sufficient entropy format
predictable legacy token rejected if legacy support is removed
```

### Capacity

```text
last seat → one succeeds
simultaneous final-seat attempts → one succeeds
cancel → capacity becomes available
cancelled booking not counted
```

### Booking

```text
double click → idempotent
past slot → rejected
duplicate active registration → rejected
same user different slot → rejected if one-active rule is global
```

### Teams

```text
invalid code → not found
duplicate join → rejected
5th member behavior
6th member → rejected
team code collision → retry
non-leader reservation → 403
```

### Check-in

```text
cancelled QR → rejected
unpaid QR → rejected
unconfirmed booking → rejected
valid QR → checked in
second scan → already checked in
exact booking only updated
```

### Admin

```text
unauthenticated → 401
normal user → 403
admin → success
```

---

# 61. Phase 57 — Concurrency Tests

Normal unit tests are not enough.

At least one integration test should issue concurrent requests.

Conceptually:

```ts
const attempts = Array.from(
  { length: 20 },
  () => reserveSlotAsUser(),
);

const results = await Promise.allSettled(attempts);

const successful =
  results.filter(isSuccessful).length;
```

For a slot with one remaining seat:

```text
successful = 1
```

not:

```text
successful > 1
```

Also verify:

```text
active bookings <= capacity
```

after every test.

---

# 62. Phase 58 — Test Database Constraints

CI should test migrations on a fresh database.

Validate:

```text
unique team code
unique team membership
unique QR token
one active registration
positive slot capacity
overlap constraint
foreign keys
cascade behavior
```

Do not assume schema.ts means the production DB has the same constraints.

---

# 63. Phase 59 — Security Regression Suite

Create a dedicated suite:

```text
security/
  auth.test.ts
  cors.test.ts
  authorization.test.ts
  pii.test.ts
  qr.test.ts
  checkin.test.ts
  booking-race.test.ts
```

Every critical vulnerability found in this audit should become a permanent regression test.

---

# 64. Phase 60 — API Contract Tests

Frontend/backend drift caused several issues.

Generate or maintain a contract source.

Possible approach:

```text
OpenAPI schema
     ↓
generated TypeScript client
```

or a shared package:

```text
packages/api-contracts
```

Example:

```ts
export const routes = {
  checkIn: "/admin/checkin/scan",
  myProfile: "/users/me/profile",
} as const;
```

The exact implementation should follow the repository's current tooling.

---

# 65. Phase 61 — Admin Console Requirements

Admin console should have:

```text
Login
Dashboard
Slots
Teams
Payments
Check-in
```

All API requests:

```ts
credentials: "include"
```

All admin routes:

```text
requireAuth
+
requireAdmin
```

Do not put authorization logic only in the frontend.

---

# 66. Phase 62 — Admin Slot Operations

Admin can:

```text
create
bulk-create
edit
delete/soft-delete
view availability
```

Every mutation must be authorized.

Bulk create must:

1. Validate every slot.
2. Detect overlaps.
3. Report which rows fail.
4. Avoid partial destructive behavior unless transaction semantics are intentional.
5. Return useful 4xx errors for business conflicts.

---

# 67. Phase 63 — Bulk Operations

For bulk slot creation, decide between:

### All-or-nothing

```text
10 rows submitted
1 invalid
→ none created
```

### Partial success

```text
10 submitted
8 created
2 rejected
```

Whichever product behavior is selected, make it explicit and return structured results.

Do not leave this to accidental transaction behavior.

---

# 68. Phase 64 — Error Codes

Define stable codes.

Suggested examples:

```text
AUTH_REQUIRED
FORBIDDEN
SLOT_NOT_FOUND
SLOT_FULL
SLOT_IN_PAST
SLOT_OVERLAP
BOOKING_ALREADY_EXISTS
BOOKING_NOT_FOUND
BOOKING_CANCELLED
TEAM_NOT_FOUND
TEAM_FULL
ALREADY_TEAM_MEMBER
TEAM_LEADER_REQUIRED
INVALID_TEAM_CODE
ALREADY_CHECKED_IN
PAYMENT_REQUIRED
INVALID_QR
```

The actual naming can follow project conventions.

---

# 69. Phase 65 — Frontend State Model

Replace localStorage-driven state with server-derived state.

Recommended:

```text
Auth session
    ↓
GET /users/me/profile
    ↓
Profile state
    ├── no registration
    ├── solo registration
    └── team registration
```

Use React Query/SWR/etc. if already installed.

Invalidate after mutations:

```text
reserve
 ↓
invalidate profile
 ↓
invalidate slots
```

This keeps UI synchronized.

---

# 70. Phase 66 — Profile Loading

Profile page should work after:

```text
clear localStorage
clear cache
new browser
mobile device
```

as long as the user is authenticated.

Acceptance test:

```text
1. Book a slot.
2. Close browser.
3. Clear site localStorage.
4. Reopen.
5. Sign in.
6. Profile still shows booking.
```

---

# 71. Phase 67 — Booking Flow UX

Recommended:

```text
Register
  ↓
Choose Solo / Team
  ↓
Profile/server state saved
  ↓
Choose slot
  ↓
Confirm reservation
  ↓
Booking created
  ↓
Payment instructions
  ↓
Payment reconciliation
  ↓
Confirmed pass
```

If payment is external, the copy must clearly say so.

Remove misleading copy such as:

```text
STEP 3 OF 4
```

if there is no fourth in-app step.

---

# 72. Phase 68 — Payment Copy

Based on the audit's confirmed product behavior:

```text
Payment happens on a separate site.
```

Therefore confirmation UI should say something like:

```text
Your slot has been reserved.

Complete payment on the official payment portal.
Your pass will be valid for check-in once payment is verified.
```

Do not imply that payment happens inside the booking application.

---

# 73. Phase 69 — QR Email

Email should contain:

```text
attendee name
slot
event date
QR
booking/reference number
payment/check-in instructions
```

Do not expose unnecessary PII.

For team registrations, each member should receive their own canonical QR token if that is the intended product model.

Do not accidentally send the leader's token to every member.

---

# 74. Phase 70 — Team QR Semantics

Decide explicitly:

### Individual QR per team member

Preferred if each attendee checks in individually.

```text
team
 ├── member A → QR A
 ├── member B → QR B
 └── member C → QR C
```

Then each member has a booking/attendance identity.

Do not derive member tokens by appending user ID fragments to a leader's QR.

---

# 75. Phase 71 — QR Database Lookup

Index:

```text
bookings.qr_token
```

so scanning remains fast during event load.

Expected query:

```sql
SELECT ...
FROM bookings
WHERE qr_token = $1
LIMIT 1;
```

Then load required attendee/team/slot data.

Do not scan the entire user table.

---

# 76. Phase 72 — Event-Day Check-In Performance

Before the event:

1. Warm/test database connection.
2. Verify QR index.
3. Verify admin authentication.
4. Verify payment reconciliation.
5. Verify all attendees have valid QR tokens.
6. Verify cancelled attendees cannot check in.
7. Verify duplicate scan handling.
8. Test poor-network behavior if mobile scanning is used.

---

# 77. Phase 73 — Idempotent Check-In

If the same QR is scanned twice:

First:

```json
{
  "status": "checked_in"
}
```

Second:

```json
{
  "status": "already_checked_in",
  "checkedInAt": "..."
}
```

Do not toggle:

```text
true → false
```

on repeated scans.

---

# 78. Phase 74 — Check-In Race

Two scanners could scan the same person simultaneously.

Use an atomic update.

Conceptual:

```sql
UPDATE bookings
SET
  is_checked_in = TRUE,
  checked_in_at = NOW(),
  checked_in_by = $adminId
WHERE id = $bookingId
  AND is_checked_in = FALSE
RETURNING *;
```

If no row returns:

```text
already checked in
```

This avoids duplicate check-in writes.

---

# 79. Phase 75 — Security Headers

Inspect the actual API and frontend security middleware.

Consider appropriate headers:

```text
Content-Security-Policy
X-Content-Type-Options
Referrer-Policy
Strict-Transport-Security (production HTTPS)
```

Do not introduce an aggressive CSP blindly; verify Next.js/Expo requirements.

---

# 80. Phase 76 — Rate Limiting

Especially consider rate limiting:

```text
login
signup
team join
QR/check-in
reservation
```

QR endpoints should not allow unlimited token guessing.

Even with a cryptographically random token, rate limiting is a useful defense-in-depth control.

---

# 81. Phase 77 — QR Abuse Protection

For check-in:

```text
require admin
rate limit
exact token lookup
audit scan
```

For public attendee endpoints:

```text
never expose token in URLs unnecessarily
```

Do not log QR values.

---

# 82. Phase 78 — Session Cookie Security

Verify production cookies use:

```text
HttpOnly
Secure
SameSite
```

with values appropriate for the actual frontend/API deployment topology.

If cross-site cookie behavior is needed, configure CORS and SameSite deliberately rather than enabling all origins.

---

# 83. Phase 79 — Secrets Audit

Search:

```bash
rg "SECRET|TOKEN|PASSWORD|API_KEY|x-user-id" .
```

Review all results.

Check:

```text
BETTER_AUTH_SECRET
SMTP credentials
Google OAuth secrets
Gemini/API keys
database URL
any admin seed credentials
```

No production secret should have a committed fallback.

---

# 84. Phase 80 — Seed/Admin Account Review

The audit references a seed user UUID hardcoded in the admin API client.

Remove that pattern.

If an admin seed is required:

- seed it server-side,
- authenticate normally,
- do not hardcode the identity into frontend code.

---

# 85. Phase 81 — Data Cleanup Before Constraints

Before adding constraints, run diagnostics.

## Duplicate active registrations

```sql
SELECT user_id, COUNT(*)
FROM bookings
WHERE status IN ('reserved', 'confirmed')
GROUP BY user_id
HAVING COUNT(*) > 1;
```

## Duplicate user-slot registrations

```sql
SELECT user_id, slot_id, COUNT(*)
FROM bookings
GROUP BY user_id, slot_id
HAVING COUNT(*) > 1;
```

## Duplicate team memberships

```sql
SELECT team_id, user_id, COUNT(*)
FROM team_members
GROUP BY team_id, user_id
HAVING COUNT(*) > 1;
```

## Invalid capacity

```sql
SELECT id, capacity
FROM slots
WHERE capacity <= 0;
```

Adapt table/column names to the real schema before execution.

---

# 86. Phase 82 — Production Data Migration Strategy

Do not apply schema changes directly to production without checking existing rows.

Recommended:

```text
backup
 ↓
diagnostic query
 ↓
cleanup migration
 ↓
constraint migration
 ↓
verification
```

For critical changes:

```text
staging database
 ↓
production-like dataset
 ↓
migration
 ↓
tests
 ↓
production
```

---

# 87. Phase 83 — Observability

Track metrics:

```text
reservations_created
reservations_cancelled
slot_full_rejections
reservation_conflicts
checkins_successful
checkins_rejected
email_failures
payment_reconciliation_unmatched
team_join_failures
5xx_count
401_count
403_count
```

Do not record raw sensitive tokens.

---

# 88. Phase 84 — Deployment Checklist

Before production:

### API

- [ ] CORS allowlist configured.
- [ ] `BETTER_AUTH_SECRET` present.
- [ ] Database migrations applied.
- [ ] Auth middleware on protected routes.
- [ ] Admin middleware on admin routes.
- [ ] No request-body identity.
- [ ] No hardcoded `x-user-id`.
- [ ] Error handler sanitized.
- [ ] QR tokens cryptographically random.
- [ ] QR unique index present.
- [ ] Slot capacity semantics unified.
- [ ] Past slot protection active.
- [ ] Check-in path unified.
- [ ] Payment reconciliation completed.
- [ ] Email retry mechanism verified.

### Web

- [ ] Uses canonical registration API.
- [ ] No System B production calls.
- [ ] Real QR generator.
- [ ] Uses server profile as source of truth.
- [ ] Dynamic slot capacity.
- [ ] Correct admin auth.
- [ ] Correct endpoint paths.
- [ ] Team member UX fixed.
- [ ] Registration number displays correctly.

### Mobile

- [ ] Correct API paths.
- [ ] Auth/session works.
- [ ] Admin/staff authorization works.
- [ ] Check-in uses canonical service.
- [ ] Error states handled.

---

# 89. Phase 85 — Required Tests From the Audit

Implement the following table as a regression suite.

| Scenario | Required result |
|---|---|
| Two users book last seat simultaneously | Exactly one succeeds |
| Same user double-clicks confirm | Idempotent |
| Cancel then rebook | Seat available again |
| Lower capacity below active bookings | Reject |
| Delete slot with bookings | Reject or soft-delete, never cascade silently |
| Join full team | Reject |
| Duplicate team join | Reject |
| Leader deletion | Explicitly defined outcome |
| Non-leader team reservation | 403 with clear UI |
| Team code collision | Server retries |
| Cancelled QR scan | Reject |
| Same QR twice | `alreadyCheckedIn` |
| Unpaid attendee | Reject |
| Forged QR | Reject |
| Clear localStorage | Recover from server |
| Past slot | Reject |
| Overlap conflict | 409 |
| Email failure | Booking remains valid; retry available |
| One team email fails | Only that member is marked failed |
| Unauthenticated protected route | 401 |
| Authenticated non-admin admin route | 403 |
| Disallowed CORS origin | Rejected |

---

# 90. Implementation Order

The audit recommends a launch-oriented order. A refined implementation sequence is:

## Step 1 — Stop unauthorized cross-origin access

Fix CORS.

## Step 2 — Lock down identity

Add/verify authentication and authorization on:

```text
/slots
/teams
/registrations
/admin/*
```

and remove body-based identity.

## Step 3 — Fix production secret

Make:

```text
BETTER_AUTH_SECRET
```

mandatory in production.

## Step 4 — Fix QR

Use:

```text
randomBytes(32)
```

and real QR rendering.

## Step 5 — Fix admin

Implement admin login and:

```text
credentials: "include"
```

Remove:

```text
x-user-id
```

## Step 6 — Fix check-in

One route/service, strict status/payment rules.

## Step 7 — Migrate frontend to System A

Only after authentication is reliable.

## Step 8 — Unify capacity

Fixed ceiling + active booking count.

## Step 9 — Add DB constraints and transactions

Prevent races.

## Step 10 — Fix teams

Server code generation, membership integrity, leader authorization.

## Step 11 — Fix localStorage/profile state

Server becomes source of truth.

## Step 12 — Fix operational gaps

Payment reconciliation, email retry, PII fields, admin UX.

## Step 13 — Remove dead code

Only after callers are gone.

## Step 14 — Add integration/security tests

Make the audit findings impossible to regress silently.

---

# 91. Suggested Repository Work Breakdown

A practical branch structure:

```text
fix/security-cors
fix/security-authz
fix/security-qr
fix/security-admin
fix/security-checkin
fix/booking-capacity
fix/booking-invariants
fix/team-integrity
fix/frontend-server-state
fix/email-reliability
fix/payment-reconciliation
fix/migrations
test/security-regressions
cleanup/remove-system-b
```

If the team prefers fewer branches, group them by milestone.

---

# 92. Suggested Commit Sequence

Keep commits small and reversible.

```text
fix(api): restrict CORS origins
fix(api): enforce authenticated booking identity
fix(api): protect team routes
fix(api): require production auth secret
fix(api): generate cryptographically random QR tokens
fix(web): render real booking QR token
fix(admin): add authenticated admin session
fix(api): unify check-in service
fix(api): use fixed slot capacity model
fix(api): enforce booking concurrency
fix(api): enforce one active registration
fix(api): secure team creation and join
fix(web): derive registration state from server
fix(mobile): correct check-in API routes
fix(api): sanitize unexpected errors
fix(api): reject past slots
fix(api): fix overlap conflict handling
fix(api): add email retry state
fix(api): persist registration number and phone
test(api): add protected-route integration coverage
cleanup(api): remove unused System B
```

---

# 93. What Gemini Should NOT Do

Do **not** allow an implementation agent to:

- rewrite the entire repository unnecessarily;
- replace better-auth without reason;
- introduce a new ORM;
- introduce a new database;
- invent a payment provider;
- trust `user_id` from the frontend;
- keep both booking systems indefinitely;
- solve concurrency using frontend state;
- make QR tokens based on timestamps;
- make QR tokens contain user IDs;
- expose all team data publicly;
- fix only frontend validation;
- rely on localStorage for authorization;
- silently delete production bookings;
- swallow errors;
- return raw database/driver errors;
- add random compatibility routes without understanding callers.

---

# 94. Definition of Done

The implementation is complete only when all of the following are true.

## Security

```text
[ ] No unauthenticated booking mutation
[ ] No body-supplied identity
[ ] No hardcoded user ID
[ ] Strict CORS
[ ] Production secret required
[ ] Secure QR tokens
[ ] Admin auth works
[ ] Admin authorization enforced
[ ] PII protected
[ ] Check-in authenticated
```

## Booking

```text
[ ] One canonical booking system
[ ] Atomic capacity handling
[ ] One active registration enforced
[ ] Cancellation works
[ ] Past slots rejected
[ ] Double confirmation idempotent
[ ] Capacity count excludes cancelled bookings
```

## Teams

```text
[ ] Server-generated code
[ ] Code collision retry
[ ] Server-side format validation
[ ] Membership uniqueness
[ ] Capacity derived from membership
[ ] Leader authorization
[ ] Invalid code never creates team
```

## Check-in

```text
[ ] One canonical route/service
[ ] Cancelled rejected
[ ] Unconfirmed rejected
[ ] Unpaid rejected
[ ] Duplicate scan handled
[ ] Exactly one booking updated
[ ] QR is real
```

## Frontend

```text
[ ] Server profile is source of truth
[ ] LocalStorage is cache only
[ ] Real QR displayed
[ ] Dynamic capacity
[ ] Correct endpoint paths
[ ] Admin login
[ ] Team member UX fixed
```

## Operations

```text
[ ] Payment reconciliation process exists
[ ] Email retry exists
[ ] Per-member email status
[ ] Registration number persisted if required
[ ] Phone persisted if required
[ ] Correct REG. No. displayed
[ ] Migration matches schema
[ ] Destructive scripts protected
```

## Testing

```text
[ ] Unit tests
[ ] Route integration tests
[ ] Auth 401/403 tests
[ ] CORS tests
[ ] QR tests
[ ] Capacity concurrency tests
[ ] Team concurrency/integrity tests
[ ] Check-in tests
[ ] Migration tests
[ ] Frontend flow tests
```

---

# 95. Final Verification Commands

Adapt package scripts to the repository.

Typical checks:

```bash
bun install

bun run lint
bun run typecheck
bun run test
bun run build
```

Search for known insecure patterns:

```bash
rg "req\.body\.user_id|req\.body\.leader_id|x-user-id" apps packages
```

Search for predictable QR generation:

```bash
rg "Date\.now|Math\.random|QR-BKG" apps packages
```

Search for localStorage authority:

```bash
rg "lasertag_selected_mode|lasertag_active_team|lasertag_confirmed_slot" apps
```

Search for stale routes:

```bash
rg "/verification/checkin|/teams/.*/checkin|/slots/bulk|/admin/payments" apps
```

Search for direct capacity mutation:

```bash
rg "capacity\s*[-+]=|capacity\s*:" apps packages
```

Search for floating async:

```bash
rg "\(async.*=>|void\s+\(async|fire.and.forget" apps packages
```

Search for dangerous deletes:

```bash
rg "db\.delete|DELETE FROM slots|onDelete.*cascade" apps packages
```

Search for hardcoded secrets:

```bash
rg "BETTER_AUTH_SECRET|SECRET|API_KEY|PASSWORD|TOKEN" .
```

Then manually inspect every result. Not every match is a vulnerability.

---

# 96. Manual End-to-End Smoke Test

Perform this against a staging environment.

## User A

1. Sign up.
2. Verify email if enabled.
3. Sign in.
4. Select Solo.
5. View slots.
6. Attempt past slot → rejected.
7. Reserve valid slot.
8. Refresh browser.
9. Clear localStorage.
10. Refresh again.
11. Profile still shows booking.
12. QR renders.
13. Scan QR.
14. Unpaid → rejected if payment gate applies.
15. Reconcile payment.
16. Scan → success.
17. Scan again → already checked in.

## User B

1. Try to reserve User A's booking using a modified request body.
2. Must fail.
3. Try to use User A's team identity.
4. Must fail.

## Team

1. User A creates team.
2. Server returns 6-character code.
3. User B joins.
4. Member count changes.
5. Fill team to max.
6. Next join rejected.
7. Non-leader attempts team reservation.
8. UI explains leader requirement.
9. Leader reserves.
10. Each member receives the correct pass/QR semantics.

## Admin

1. Open admin console while logged out.
2. Login required.
3. Login as normal user → forbidden.
4. Login as admin → access.
5. View slots.
6. Create slot.
7. Try overlapping slot.
8. Receive structured 409.
9. Check in attendee.
10. Verify audit/check-in record.

---

# 97. Launch Gate

The audit's final note states that the review was source-based and did not execute endpoints. Therefore the implementation team should not treat static findings as runtime verification.

Before launch:

```text
SOURCE REVIEW
      ↓
IMPLEMENTATION
      ↓
UNIT TESTS
      ↓
INTEGRATION TESTS
      ↓
CONCURRENCY TESTS
      ↓
STAGING DEPLOYMENT
      ↓
MANUAL END-TO-END TEST
      ↓
SECURITY REGRESSION
      ↓
PRODUCTION
```

Especially verify:

- concurrent last-seat booking,
- database constraints,
- CORS behavior,
- authentication cookies,
- admin authorization,
- QR scanning,
- payment reconciliation,
- email failure/retry,
- mobile check-in.

---

# 98. Gemini Execution Prompt

Use the following as the implementation prompt after attaching this Markdown file and the repository:

```text
You are the senior engineer responsible for remediating this repository.

Read the repository completely enough to understand:
- the Turborepo structure,
- Express API,
- Drizzle schema/migrations,
- better-auth configuration,
- Next.js apps,
- Expo app,
- registration services,
- slot/team controllers,
- admin console,
- current tests.

I have provided an audit/remediation document. Treat it as the authoritative issue inventory, but verify every implementation detail against the actual current source before modifying anything.

Primary architectural objective:
1. Make the authenticated System A registration/service implementation canonical.
2. Migrate all production frontend consumers away from the unauthenticated System B.
3. Remove/decommission System B only after proving there are no remaining callers.
4. Preserve intended out-of-band payment behavior.
5. Preserve existing product behavior unless it directly conflicts with a security/data-integrity requirement.

Implementation requirements:
- Never trust user_id/leader_id from the request body.
- Derive identity from the authenticated session.
- Enforce admin authorization server-side.
- Fix CORS to an explicit allowlist.
- Make BETTER_AUTH_SECRET mandatory in production.
- Generate QR tokens with cryptographically secure randomness.
- Render the actual QR token in the frontend.
- Use one canonical check-in service/path.
- Enforce cancelled/confirmed/paid/check-in rules server-side.
- Make booking capacity concurrency-safe.
- Use a fixed-capacity model rather than decrementing the capacity ceiling.
- Enforce one-active-registration invariants at the DB level where possible.
- Fix team membership integrity and server-side team code generation.
- Never create a team because a requested team code does not exist.
- Make localStorage a cache, not the source of truth.
- Fix stale admin/mobile endpoints.
- Sanitize unexpected errors.
- Reject past slots.
- Fix migration drift.
- Protect destructive maintenance operations.
- Implement reliable email delivery/retry semantics where practical.
- Preserve payment as an external reconciliation process.
- Persist registration number/phone if the product still needs them for admin reference.
- Fix the pass's REG. No. field.
- Add route-level security/integration tests.
- Add concurrency tests for booking/check-in.
- Do not introduce unnecessary new infrastructure.

Process:
A. First inspect and report the actual relevant files and dependencies.
B. Produce a concise implementation map.
C. Implement in small logical phases.
D. After each phase run the relevant tests/typecheck/lint.
E. If an audit recommendation conflicts with the actual source or product behavior, explain the conflict before choosing an implementation.
F. Never silently delete data.
G. Never invent APIs/routes/packages.
H. Before finalizing, search for all known insecure patterns from the audit and confirm they are gone or intentionally retained with justification.
I. Produce a final change summary containing:
   - files changed,
   - migrations added,
   - routes changed,
   - security fixes,
   - data-integrity fixes,
   - frontend fixes,
   - tests added,
   - commands run and results,
   - remaining risks.

Do not stop after fixing only the first few issues. Work through the complete remediation plan, but keep changes incremental and testable.
```

---

# 99. Audit Traceability

This implementation plan is derived from the supplied code audit.

Key findings covered include:

- parallel authenticated/unauthenticated booking systems;
- broken authentication usage;
- unrestricted CORS;
- public destructive slot routes;
- request-body identity;
- PII disclosure;
- predictable QR tokens;
- reservation self-confirmation;
- hardcoded session secret;
- unsafe error handling;
- open signup;
- conflicting capacity models;
- cancellation/capacity issues;
- concurrency races;
- inconsistent booking counts;
- missing DB invariant for one active registration;
- lax check-in path;
- historical booking check-in corruption;
- team capacity drift;
- invalid team-code behavior;
- client-generated team codes;
- convert-to-solo data corruption;
- fragile date parsing;
- global overlap constraint;
- destructive maintenance script;
- migration drift;
- fake frontend QR;
- out-of-band payment reconciliation gap;
- missing phone/registration persistence;
- broken admin/mobile wiring;
- localStorage source-of-truth issue;
- hardcoded frontend capacity;
- duplicate QR sources;
- missing route integration tests;
- past-slot booking;
- email retry/tracking problems.

The audit itself states that its findings were based on source review and that endpoints were not executed, so final verification against a running/staging instance is mandatory.

---

# 100. Practical "Do This First" Checklist

If implementation time is extremely limited, execute this sequence first:

```text
[1] Fix CORS
[2] Put auth + admin authorization on every sensitive route
[3] Remove body-based identity
[4] Remove hardcoded x-user-id
[5] Require BETTER_AUTH_SECRET in production
[6] Make System A the only booking implementation
[7] Generate secure QR tokens
[8] Render real QR codes
[9] Unify check-in
[10] Enforce payment/status/check-in gates
[11] Make reservation capacity atomic
[12] Add one-active-registration DB constraint
[13] Fix team authorization and team code generation
[14] Make server profile authoritative
[15] Add 401/403 integration tests
[16] Run concurrency tests
[17] Verify migrations on a clean database
[18] Perform staging end-to-end test
```

The first four items are security-critical. The QR/check-in work is event-day critical. The concurrency/database work is correctness-critical. The remaining work should follow before production or immediately after according to the project's launch constraints.

---

## Source Note

This document is based on the supplied **"CODE AUDIT · CSIVITU/LASERTAG-26 — Flow trace, edge cases, and loopholes"**, dated September 2026. The source notes that the review was performed from source and that no endpoints were executed/probed, so implementation must include runtime verification before relying on concurrency/constraint behavior.

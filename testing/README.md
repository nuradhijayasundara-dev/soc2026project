# Backhaul-Match — Integration & Error Testing (30–31 July)

Plain bash + `curl` + `jq` scripts that exercise the **real running system** through the
API Gateway — the same path every frontend uses — rather than testing any one service in
isolation. This is what "Test Courier System ↔ API Gateway ↔ Backhaul-Match Platform ↔ Fleet
System ↔ GPS App" means in practice: one client, hitting `/api/**` on the Gateway, walking
through the whole chain of services behind it.

## Prerequisites

1. All backend services running, in the order in the main README (discovery-server through
   api-gateway last).
2. `curl` and [`jq`](https://jqlang.github.io/jq/) installed.
3. A clean-ish database. These scripts register fresh users every run (timestamp-suffixed
   usernames), but they **don't** reset `fleet_db`'s truck/availability data — if you run them
   repeatedly against the same dev database, old test trucks/availability rows accumulate. That's
   usually harmless, but the "no available truck" check in `error-test.sh` assumes there's no
   pre-existing availability on the Jaffna↔Batticaloa lane; if a previous run (or manual testing)
   happens to have posted one, that specific check may not behave as documented. For a clean run,
   either use a fresh MySQL instance/schema, or manually clear `fleet_db.truck_availability`
   between runs.

## Running

```bash
cd testing
BASE_URL=http://localhost:18080/api bash integration-test.sh
BASE_URL=http://localhost:18080/api bash error-test.sh
```

`BASE_URL` defaults to `http://localhost:18080/api` if omitted (the Gateway's host port — the
container-internal port is 8085). Each script prints `PASS`/`FAIL` for every check, a summary
count at the end, and exits non-zero if anything failed — safe to wire into CI
(`integration-test.sh || exit 1`).

## `integration-test.sh` — 30 July, Full Integration

One end-to-end walk from a courier creating a shipment through to GPS tracking on the resulting
trip, checking every item from the brief:

| Brief item | What the script does |
|---|---|
| Login | Registers + logs in a courier, a fleet manager, and a driver |
| Shipment creation | Courier posts a shipment, Colombo → Kandy, 2 ton |
| Truck availability | Fleet manager posts a backhaul availability for that exact lane |
| Matching | Courier requests a match; asserts at least one candidate comes back |
| Booking | Courier "Accept Match" → fleet manager sees it under pending bookings → accepts |
| Capacity reservation | Asserts the truck's availability row actually flips to `BOOKED` the moment the courier accepts — *before* the fleet manager has even decided |
| GPS location | After the fleet manager assigns a driver and the driver starts the trip, the script posts a GPS ping and asserts the Fleet Portal's live-location read matches it |

It also checks the invoice and notifications (`MATCH_FOUND`, `BOOKING_ACCEPTED`) that Sprints 5–7
wired up, since "full integration" should mean the side effects fired too, not just the primary
happy path.

## `error-test.sh` — 31 July, Error Testing

Runs independently (registers its own accounts) so you can run it without `integration-test.sh`
first.

| Brief item | How it's triggered | Expected result |
|---|---|---|
| No available truck | Shipment on a lane (Jaffna↔Batticaloa) nothing was ever posted for | Match request resolves to `NO_MATCH`, zero results |
| Insufficient capacity | 50-ton shipment against a 3-ton truck | Excluded from results; direct `GET /fleet/availability/{id}/verify` also reports `valid: false` |
| Invalid login | Nonexistent username, and a real username with the wrong password | Both `401` |
| GPS unavailable | `GET /gps/live/{truckId}` for a truck that's never sent a location | `404` |
| Duplicate booking | `accept-match` called twice on the same match result | Second call `409 Conflict` |
| Truck already reserved | Directly calling fleet-service's `reserve` endpoint on a slot that's already `BOOKED` | `409 Conflict` |
| Shipment cancellation | `PATCH /courier/shipments/{id}/status` with `CANCELLED` | Status updates; a `SHIPMENT_STATUS` notification fires |

## Files

- `common.sh` — shared `req()`/`check()`/`register_and_login()` helpers, sourced by both scripts.
- `integration-test.sh` — 30 July.
- `error-test.sh` — 31 July.

## What this deliberately doesn't cover

These are black-box HTTP tests against a fully running system — they catch integration and
contract bugs (wrong status code, a field renamed in one service but not its caller, a broken
service-to-service call) but not unit-level logic bugs inside a single method, and they don't spin
services up or down themselves. For unit tests per service, add `spring-boot-starter-test` (already
transitively available via `spring-boot-starter-parent`) and write `@SpringBootTest`/`@WebMvcTest`
classes per service — not included here since that's a different, much larger effort than a
same-day integration/error-testing pass.

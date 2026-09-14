# Backhaul-Match — Sprint 1 Starter Code

Matches your "All Members" task list + Member 1/2/3 assignments. See `docs/architecture-notes.md`
for the full write-up (microservices, DB relationships, API flow, roles, repo structure, stack).

## What's included
```
backend/
  discovery-server/   Eureka registry (port 8761)                 — Member 1
  api-gateway/         Spring Cloud Gateway + JWT filter (internal 8085, host 18080) — Member 1
  auth-service/        Register/Login, JWT issuing, roles (8081)  — Member 1
  user-service/        User profile CRUD, reads X-User-Id (8082)  — Member 1
frontend/
  courier-portal/      React + MUI: Login, Dashboard, Shipments   — Member 2
  fleet-portal/        React + MUI: Login, Fleet Dashboard, Trucks — Member 3
driver-app/             Flutter: Login screen + app shell          — Member 3
database/               .sql schema per service (auth/courier/fleet)
docs/                   Architecture notes for the whole team
```

## Running the backend (Member 1)
Requires: Java 17, Maven, MySQL running locally (user `root` / pass `root`, or edit `application.yml`).

```bash
# 1. Create schemas (or let Hibernate ddl-auto=update create them)
mysql -u root -p < database/auth_db.sql

# 2. Start in this order (each in its own terminal)
cd backend/discovery-server && mvn spring-boot:run   # wait until http://localhost:8761 is up
cd backend/auth-service      && mvn spring-boot:run
cd backend/user-service      && mvn spring-boot:run
cd backend/api-gateway       && mvn spring-boot:run
```

Test with Postman (everything goes through the API Gateway — host port `18080` → container `8085`):
```
POST http://localhost:18080/api/auth/register
{ "username":"courier1", "email":"c1@test.com", "password":"pass123", "role":"COURIER_OPERATOR" }

POST http://localhost:18080/api/auth/login
{ "username":"courier1", "password":"pass123" }
# copy the returned "token"

GET http://localhost:18080/api/users/me
Header: Authorization: Bearer <token>
```

## Running the Courier Portal (Member 2)
```bash
cd frontend/courier-portal
npm install
npm run dev       # http://localhost:3000  (or `docker compose build courier-portal`)
```
Note: `getShipments`/`getDashboardSummary` in `src/api/shipmentApi.js` call `/api/courier/**`,
which is routed by the gateway to `courier-service` — build that service next (same pattern as
`user-service`) using `database/courier_db.sql` as the schema, register it with Eureka as
`COURIER-SERVICE`, and the frontend will work as-is.

## Running the Fleet Portal (Member 3)
```bash
cd frontend/fleet-portal
npm install
npm run dev        # http://localhost:3001  (or `docker compose build fleet-portal`)
```
Same pattern: build `fleet-service` (register as `FLEET-SERVICE`) using `database/fleet_db.sql`,
and the live GPS + route screens run on OpenStreetMap/Leaflet (via the local OSRM engine) — no API
key needed.

## Running the Driver App (Member 3)
```bash
cd driver-app
flutter pub get
flutter run
```
`lib/services/api_service.dart` points at `10.0.2.2:18080` (Android emulator's alias for your
machine's gateway — host port 18080) — change to your machine's LAN IP when testing on a real device.

## Sprint 2 additions (now included)

**Member 1 — backend/courier-service (8083) and backend/fleet-service (8084):**
Full Company / Customer / Receiver / Shipment APIs (courier-service) and Company / Truck / Driver /
Availability / Trip APIs (fleet-service), registered with Eureka as `COURIER-SERVICE` and
`FLEET-SERVICE` so the Gateway's existing routes now resolve. Service-to-service communication is
demonstrated in `fleet-service/.../client/CourierServiceClient.java`: creating a Trip against a real
shipment calls `courier-service` directly (via a `@LoadBalanced RestTemplate` and its Eureka name),
not through the Gateway.

**Member 2 — frontend/courier-portal:** `ShipmentCreate.jsx` (New Shipment Request form, with
inline "register new customer" support), `ShipmentDetails.jsx` (status stepper, status-update
control, tracking history), and `Customers.jsx` (list + register). All wired into routes/nav.

**Member 3 — frontend/fleet-portal:** `TruckDetails.jsx` (truck info, availability list, and the
"available capacity input" form), `Drivers.jsx` (list + register), `TripCreate.jsx` (pick truck +
driver + optional shipment id), `DriverAssignment.jsx` (trip list with inline driver reassignment).
All wired into routes/nav.

Run order is unchanged — just add `courier-service` and `fleet-service` to the startup list:
```bash
cd backend/discovery-server && mvn spring-boot:run
cd backend/auth-service      && mvn spring-boot:run
cd backend/user-service      && mvn spring-boot:run
cd backend/courier-service   && mvn spring-boot:run
cd backend/fleet-service     && mvn spring-boot:run
cd backend/api-gateway       && mvn spring-boot:run
```

## Sprint 3 additions (now included)

**Member 1 — backend/gps-service (8085) + Driver App:**
New `gps-service` microservice: `POST /api/gps/location` (Driver App → backend, called every ~20m
of movement), `GET /api/gps/live` (all trucks' current positions, used by the Fleet Portal map),
`GET /api/gps/history/truck/{id}` and `/history/trip/{id}` (full route history). Registered with
Eureka as `GPS-SERVICE`; the Gateway now routes `/api/gps/**` to it (JWT-protected, same as every
other service). `fleet-service`'s `Driver` entity gained a `userId` link so a Driver App login maps
to a driver record (`GET /api/fleet/drivers/me`, `PATCH /api/fleet/drivers/{id}/link-account`), and
`Trip` gained `GET /api/fleet/trips/my` + `PATCH /api/fleet/trips/{id}/start`.

The Driver App (`driver-app/`) now has: `TripSelectionScreen` (lists trips assigned to the logged-in
driver — the "truck selection" screen), `ActiveTripScreen` (Start Trip button, then live GPS status),
`services/trip_service.dart` (my-trips / start-trip calls), and `services/gps_service.dart`
(`geolocator` position stream → posts to `gps-service` on every ~20m of movement). Note: this demo
only transmits while `ActiveTripScreen` is open — for real background tracking you'd add a foreground
service (e.g. the `flutter_background_geolocation` or `background_locator_2` package) and the
corresponding Android/iOS location permission entries, which aren't included here since this repo
only ships `lib/` + `pubspec.yaml`, not a full native Flutter project scaffold.

**Member 2 — frontend/courier-portal:** `Tracking.jsx` — a dedicated "search by shipment ID" tracking
page with a progress stepper and full history, matching the interface map's Shipment Tracking screen.
Courier Frontend → Courier Backend → Shipment Database was already wired in Sprint 2
(`shipmentApi.js` → `courier-service` → `courier_db`); this just adds the standalone tracking UI on
top of it.

**Member 3 — frontend/fleet-portal:** `GpsTracking.jsx` — a real-time map (OpenStreetMap +
Leaflet via react-leaflet, no API key needed) plotting every truck's live position from
`gps-service`, polling every 10s, with click-to-popup (truck no., status, speed, last update).
This completes Fleet Frontend → Fleet Backend (truck list for markers) + GPS Tracking Service
(live coordinates) → OpenStreetMap.

Run order — add `gps-service` to the startup list:
```bash
cd backend/discovery-server && mvn spring-boot:run
cd backend/auth-service      && mvn spring-boot:run
cd backend/user-service      && mvn spring-boot:run
cd backend/courier-service   && mvn spring-boot:run
cd backend/fleet-service     && mvn spring-boot:run
cd backend/gps-service       && mvn spring-boot:run
cd backend/api-gateway       && mvn spring-boot:run
```
Also apply `database/gps_db.sql` and re-run `database/fleet_db.sql` (the `drivers` table gained a
`user_id` column).

## Sprint 4 additions (now included)

**Member 1 — backend/matching-service (8086):** the Matching Engine. `POST /api/matching/requests`
(Match Request Service — snapshots the shipment from courier-service), then runs the **capacity
matching logic**: calls `fleet-service`'s new cross-company `GET /api/fleet/availability/search`
for exact-route backhaul availability with enough spare capacity, scores each candidate by
*wasted capacity* (least-wasted-first — a truck with 2.5 ton free beats one with 4.5 ton free for
a 2 ton shipment), and persists the ranked list as `MatchResult` rows. `POST
/api/matching/results/{id}/select` lets the courier operator pick one, marking the rest rejected.
Both `CourierServiceClient` and `FleetServiceClient` call those services directly via their Eureka
names, bypassing the Gateway — the same service-to-service pattern from Sprint 2/3. Registered as
`MATCHING-SERVICE`; the Gateway now routes `/api/matching/**` to it.

**Member 2 — frontend/courier-portal:** a "Request Backhaul Transport" button on `ShipmentDetails`
(shown while a shipment is `PENDING`), which opens `RequestBackhaulDialog` — the shipment matching
request form, pre-filled from the shipment's own route/weight — and on confirm calls
matching-service and lands on the new `MatchResults.jsx` page: ranked truck cards (truck no.,
route, capacity, estimated cost) with a "Select" button, mirroring the interface map's Match
Results screen.

**Member 3 — frontend/fleet-portal:** the `/availability` page is no longer a placeholder — it
lists every availability posting across the fleet manager's trucks and adds a **"Post Backhaul
Availability"** dialog (pick a truck, current location, **return destination**, **available
capacity**, and available-from time — this is exactly what matching-service searches against).
Backing it: `fleet-service` gained a `tripType` (`OUTBOUND`/`BACKHAUL`, defaults to `BACKHAUL`) on
`TruckAvailability`, plus `GET /api/fleet/availability/mine` (company-wide list), `POST
/api/fleet/availability` (the quick-add used by the dialog), and the cross-company `search`
endpoint matching-service depends on.

Run order — add `matching-service`:
```bash
cd backend/discovery-server && mvn spring-boot:run
cd backend/auth-service      && mvn spring-boot:run
cd backend/user-service      && mvn spring-boot:run
cd backend/courier-service   && mvn spring-boot:run
cd backend/fleet-service     && mvn spring-boot:run
cd backend/gps-service       && mvn spring-boot:run
cd backend/matching-service  && mvn spring-boot:run
cd backend/api-gateway       && mvn spring-boot:run
```
Also apply `database/matching_db.sql`, and re-run `database/fleet_db.sql` (`truck_availability`
gained a `trip_type` column).

## Sprint 5 additions (now included)

**New backend/notification-service (8087):** in-app notifications with an optional email bonus.
`POST /api/notifications/internal` is called directly by other services (their Eureka name, not
through the Gateway) whenever something notification-worthy happens; `GET /mine`, `/unread-count`,
`PATCH /{id}/read`, `PATCH /read-all` power the bell icon in both portals (Gateway-routed,
JWT-protected). Email is wired but **off by default** (`notification.email.enabled: false` in
`application.yml`) — flip it on and fill in `spring.mail.*` (e.g. a Gmail app password) to actually
send mail; it looks up the recipient's email via a new internal, unauthenticated endpoint on
auth-service (`GET /api/auth/internal/users/{id}`). Firebase push wasn't built — it needs a mobile
SDK + service account setup that's out of scope for this pass; the entity's `type` field is
generic enough to add an FCM channel later the same way email was added.

**Booking became a real two-step flow** (needed so there's something to accept/reject):
courier clicks **Request Booking** on a match result → `matching-service` sets it to
`PENDING_CONFIRMATION` → the fleet manager sees it on the Fleet Portal's new **Bookings** page →
**Accept** (`MatchResult.ACCEPTED`, siblings auto-rejected, "Booking accepted" notification) or
**Decline** (`REJECTED`, "Booking declined" notification, courier can try another candidate).

Four notification triggers, all firing from the service that owns the event:
- **Match found** — `matching-service`, right after `runMatching()` produces at least one result.
- **Booking accepted** / **Booking rejected** — `matching-service`, in `acceptBooking()` /
  `rejectBooking()`.
- **Shipment status** — `courier-service`, at the end of `ShipmentService.updateStatus()`, notifying
  the courier company's owner.

**Frontend:** `NotificationBell.jsx` (polls unread count every 15s, dropdown list, mark-read /
mark-all-read, click-through to the relevant shipment/match/booking) added to both portals'
toolbars. `MatchResults.jsx`'s button is now "Request Booking" instead of an immediate "Select",
and shows `PENDING_CONFIRMATION` / accepted / declined states. New `BookingRequests.jsx` on the
Fleet Portal for the accept/decline actions.

Run order — add `notification-service`:
```bash
cd backend/discovery-server    && mvn spring-boot:run
cd backend/auth-service        && mvn spring-boot:run
cd backend/user-service        && mvn spring-boot:run
cd backend/courier-service     && mvn spring-boot:run
cd backend/fleet-service       && mvn spring-boot:run
cd backend/gps-service         && mvn spring-boot:run
cd backend/matching-service    && mvn spring-boot:run
cd backend/notification-service && mvn spring-boot:run
cd backend/api-gateway         && mvn spring-boot:run
```
Apply `database/notification_db.sql`. `database/matching_db.sql`'s `match_results.status` enum
gained `PENDING_CONFIRMATION`/`ACCEPTED` in place of the old single `SELECTED` value — re-run it
(or `ALTER TABLE` if you already have data you care about keeping).

## Sprint 6 additions (now included) — Match Results, Distance, Capacity Verification & Reservation

**Member 1 — Match Results API, Match Score, Distance Calculation, Capacity Verification:**
the Match Results API existed from Sprint 4; this pass adds real distance-awareness and a genuine
capacity check at the moment it matters, not just at search time.
- **Distance Calculation**: `matching-service/util/DistanceCalculator.java` — a Haversine
  great-circle formula over a fixed table of ~20 Sri Lankan cities. `MatchingService` now asks
  fleet-service for *every* available slot with enough capacity (no server-side route filter
  anymore), computes each candidate's route deviation itself, drops anything more than 80km off
  the shipment's actual route, and folds the distance into both **Match Score**
  (`distance × weight + wastedCapacity × weight`) and `estimatedCost` (base fare + LKR/km on the
  shipment's own route, falling back to a flat per-ton rate if a city isn't in the table).
- **Capacity Verification**: this is now a real fleet-service capability, not just a matching-service
  read: `AvailabilityService.verify()` checks the slot still exists, is still `AVAILABLE`, and still
  has enough capacity — exposed as `GET /api/fleet/availability/{id}/verify`. `reserve()` calls
  `verify()` and, if it passes, atomically flips the slot to `BOOKED` (`PATCH .../reserve`);
  `release()` flips it back (`PATCH .../release`). Verification is checked *again* here — not
  just trusted from search time — because time has passed and another courier could have taken it.

**Member 2 — available match list, truck details, estimated cost, Accept Match button:**
`MatchResults.jsx` shows the ranked list with truck no., type, capacity, computed distance, and
estimated cost, and the button is **"Accept Match"** — calling the new
`POST /api/matching/results/{id}/accept-match`. Clicking it is no longer just a status flip: it's
the whole "Courier Accepts → Booking Created → Truck Capacity Reserved" chain in one call (see
below), so a failed reservation (someone else took the slot first) surfaces immediately as
"pick a different candidate" instead of silently going stale.

**Member 3 — booking request notification, Accept/Reject interface:** `BookingRequests.jsx`
(Accept/Reject) already existed from Sprint 5; the new piece is the **`BOOKING_REQUESTED`**
notification, fired the moment a courier accepts a match — `MatchingService.acceptMatch()`
resolves the fleet company's owning user via `GET /api/fleet/company/{id}` (called directly,
Eureka name) and notifies them that capacity is already reserved and awaiting their decision.

### Booking & Reservation — the full chain
`Shipment Request → Match Found → Courier Accepts → Booking Created → Truck Capacity Reserved`
is now implemented end to end in `MatchingService.acceptMatch()`:
1. Courier clicks **Accept Match** on a `RECOMMENDED` result.
2. Matching-service re-verifies and reserves capacity via fleet-service's `/reserve` endpoint —
   this is the "Truck Capacity Reserved" step, and it happens *before* anyone on the fleet side
   has even seen the request, so the slot can't be double-booked while they decide.
3. A `CapacityReservation` row is written (`RESERVED`) and the `MatchResult` becomes
   `PENDING_CONFIRMATION` — this is "Booking Created."
4. The fleet manager's **Accept** confirms it (`MatchResult.ACCEPTED`, reservation → `CONFIRMED`,
   sibling candidates auto-rejected, "Booking accepted" notification) or **Reject** releases the
   capacity back to `AVAILABLE` (reservation → `RELEASED`, "Booking declined" notification, and the
   courier can accept a different candidate).

One fixed bug worth flagging: `RestTemplate`'s default request factory can't send `PATCH` requests
(`ProtocolException: Invalid HTTP method: PATCH` — a well-known Spring gotcha) and the reserve/release
calls above are PATCH. `matching-service`'s `RestTemplateConfig` now builds the bean with
`JdkClientHttpRequestFactory`, which does support it.

No new services or ports this pass — same run order as Sprint 5. Apply the updated
`database/matching_db.sql` (`match_results` gained `truck_type`/`distance_km`, and
`capacity_reservations` gained a real `status` enum and is now actually written to) and
`database/notification_db.sql` (`notifications.type` gained `BOOKING_REQUESTED`).

## Sprint 7 additions (now included) — Complete Main Workflow + Pricing & Payment

**26 July — Complete Main Workflow.** The chain `Shipment Request → Match Found → Courier
Accepts → Booking Created → Truck Capacity Reserved → Fleet Receives Booking` was missing its
last link: accepting a booking didn't produce anything the fleet side could actually act on.
`MatchingService.acceptBooking()` now also calls `fleet-service`'s new
`POST /api/fleet/trips/internal` (Eureka name, not through the Gateway) to create a real `Trip`
for the truck + shipment — no driver yet, since that's still a separate step on the existing
Trip list / Driver Assignment screen. This closes the loop into work that already existed:
fleet manager assigns a driver → driver starts the trip from the Driver App → GPS tracking
begins (Sprint 3), exactly as the 27 July note describes.

Fixed along the way: `CreateTripRequest.driverId` is now optional (a booking-created trip has no
driver yet), and a real bug in `TripService.assignDriver()` — it tried to free a "previous driver"
that didn't exist on a driver-less trip — is fixed with a null check. `trips.driver_id` is now
nullable in `fleet_db.sql`.

**27 July — Pricing & Payment: new `payment-service` (port 8088).**

- **Member 1 — Pricing Service, cost calculation, Payment API**: `PricingService.calculateCost()`
  is the authoritative cost (base fare + LKR/km + LKR/ton) — separate from matching-service's
  earlier at-match-time estimate, since a final invoice shouldn't depend on a service whose whole
  job is ranking candidates, not billing. `InvoiceService` + `InvoiceController` implement the
  Payment API: invoice creation (fired automatically by `MatchingService.acceptBooking()` via a new
  `PaymentServiceClient`), listing, and a **simulated** `POST /invoices/{id}/pay` (no real gateway
  wired up — swap `InvoiceService.payInvoice()`'s body for a real one like Stripe/PayHere later;
  everything downstream of "invoice is PAID" doesn't need to change).
- **Member 2 — cost display, invoice page, payment status**: `Invoices.jsx` (list, replacing the
  old placeholder route) and `InvoiceDetails.jsx` (full cost breakdown, a Pay button with a method
  selector, payment history, and a status chip) in the Courier Portal.
- **Member 3 — fleet revenue display, booking revenue dashboard**: new `RevenueDashboard.jsx` in
  the Fleet Portal — summary cards (total bookings, paid, total revenue, pending revenue) plus a
  full table of every invoice earned by that fleet company, via `GET /api/payment/revenue/summary`
  and `GET /api/payment/invoices/fleet/mine`.

Run order — add `payment-service`:
```bash
cd backend/discovery-server     && mvn spring-boot:run
cd backend/auth-service         && mvn spring-boot:run
cd backend/user-service         && mvn spring-boot:run
cd backend/courier-service      && mvn spring-boot:run
cd backend/fleet-service        && mvn spring-boot:run
cd backend/gps-service          && mvn spring-boot:run
cd backend/matching-service     && mvn spring-boot:run
cd backend/notification-service && mvn spring-boot:run
cd backend/payment-service      && mvn spring-boot:run
cd backend/api-gateway          && mvn spring-boot:run
```
Apply the new `database/payment_db.sql`, and re-run `database/fleet_db.sql` (`trips.driver_id` is
now nullable).

## Sprint 8 (28–29 July) — Notifications (confirmed) & Reports

**28 July — Notifications.** All four required types (`MATCH_FOUND`, `BOOKING_ACCEPTED`,
`BOOKING_REJECTED`, `SHIPMENT_STATUS`) were already implemented in Sprint 5 — in-app via the bell
icon in both portals, with an optional email channel wired but off by default. Nothing new to
build here; see the Sprint 5 section above for how each one fires.

**29 July — Reports.** Every figure comes from a SQL aggregate query (`COUNT`/`SUM`) run against
existing tables at request time — no new report tables, per the brief.

- **Courier Reports** (total shipments, successful matches, cost savings): `courier-service`'s
  new `GET /api/courier/reports/summary` combines its own `COUNT` queries (shipments) with two
  cross-service calls — `matching-service`'s `GET /reports/courier-summary` (successful matches,
  `COUNT` on `match_requests.status = MATCHED`) and `payment-service`'s
  `GET /reports/courier-summary` (paid total + an estimated cost-savings figure). That savings
  number is a clearly-flagged placeholder — `paidTotal × (1.4 - 1)`, i.e. "what a dedicated
  forward-haul truck would have cost instead" — since there's no real market rate to compare
  against yet. Rendered in the Courier Portal's new `Reports.jsx`.
- **Fleet Reports** (total trips, used capacity, backhaul revenue): `fleet-service`'s new
  `GET /api/fleet/reports/summary` (`COUNT` on trips, `SUM` on booked `truck_availability`
  capacity) alongside `payment-service`'s existing `/revenue/summary`. Rendered in the Fleet
  Portal's new `Reports.jsx`, alongside the existing `RevenueDashboard.jsx` (invoice-level detail).
- **Platform Reports** (total matches, successful bookings, total capacity utilized):
  `matching-service`'s `GET /api/matching/reports/platform-summary` — system-wide, so it's
  restricted to `ADMIN` accounts using the `X-User-Role` header the Gateway's `JwtAuthFilter`
  already forwards. There's no dedicated Admin Portal in this project, so `PlatformReports.jsx`
  lives in the Courier Portal as a demo/reference view — its nav link only appears when
  `localStorage.role === 'ADMIN'` (register an account with that role to see it render instead of
  a 403). A real deployment would split this into its own Admin Portal.

No new services, ports, or schema changes this pass — every report query runs against tables that
already existed. Same run order as Sprint 7.

## Sprint 9 (30–31 July) — Full Integration & Error Testing

`testing/` — black-box bash + `curl`/`jq` scripts that exercise the whole system through the real
API Gateway, the same path every frontend uses.

- **`testing/integration-test.sh`** (30 July): one end-to-end walk — login (courier, fleet manager,
  driver) → shipment creation → truck availability → matching → courier accepts (capacity reserved
  — asserts the availability row actually flips to `BOOKED`) → fleet manager accepts → driver
  assigned → trip started → GPS location posted and read back → invoice + notifications checked.
- **`testing/error-test.sh`** (31 July): no available truck, insufficient capacity, invalid login,
  GPS unavailable, duplicate booking, truck already reserved, shipment cancellation — each
  asserting the specific HTTP status / field the failure should produce (mostly `409`/`401`/`404`).

Run either with `bash testing/integration-test.sh` (services must already be running — see
`testing/README.md` for the full run order and prerequisites, plus a note on why running the
scripts repeatedly against the same dev database can eventually affect the "no available truck"
check).

## Sprint 10 (1–2 August) — Final Testing & Presentation Prep, Demo Version

**1 August — bug fixing, UI improvements, DB cleanup, Postman, Docker, GitHub merge prep.**
- Ran the same duplicate-field/duplicate-method sanity sweep used throughout this project one more
  time across every service — came back clean.
- Added `frontend/*/src/theme.js` (a shared, branded MUI theme — dark navy matching the original
  login mockups, consistent button/typography styling) wired into both portals via `ThemeProvider`.
- `database/README.md` + `database/reset-databases.sh` — documents the schema layout and gives a
  one-command way to drop/recreate all eight databases before a demo or a fresh run (each service
  recreates its own schema automatically on next startup, no manual `.sql` re-run needed).
- `testing/postman/` — a full Postman collection + environment covering the same flow as
  `integration-test.sh`/`error-test.sh`, for anyone who prefers Postman's Runner over bash.
- **Docker**: `docker-compose.yml` at the repo root plus a `Dockerfile` in every backend service
  and both frontends — `docker compose up --build` brings up MySQL, Eureka, the Gateway, all 9
  microservices, and both portals. See `docs/DOCKER.md` for how service discovery and the database
  connection work inside the container network (env var overrides, no code changes needed).
- A root `.gitignore` (there wasn't one before this pass — needed before any real `git add`).
  `docs/github-merge-checklist.md` — the actual merge steps for landing every feature branch into
  `develop` then `main` ahead of the deadline.
- `docs/diagrams/` — system architecture, ER diagram, microservice map, and the 11-step user flow,
  all as plain SVG (openable in a browser, embeddable in a slide deck, editable as text).

**2 August — Final Demo Version.** `docs/demo-script.md` walks through the exact 11-step flow
click-by-click (which screen, which button, which API call), and `testing/demo-seed.sh` pre-creates
the courier/fleet/driver accounts and a backhaul truck availability so the live demo starts at "log
in," not "type out a truck registration form on stage." The 11-step flow itself required no new
code — it's the same Shipment Request → Match Found → Courier Accepts → Booking Created → Truck
Capacity Reserved → Fleet Receives Booking → Driver Starts Trip → GPS Updates Live → Courier Tracks
chain built across Sprints 4–7, exercised end to end.

## Next sprint
Analytics & Audit per the architecture doc — activity/audit logging across services (who did what,
when), distinct from the business reports above. Also worth doing: a real payment gateway
integration (replacing the simulated one), letting the fleet manager mark a Trip complete (still
manual), and a proper Admin Portal instead of the demo placement of Platform Reports.

## Sprint 11 (12 September) — Vite + Leaflet/OSRM map overhaul, OSRM routing, local engine
Both portals were converted from Create-React-App to **Vite** and the GPS/route screens were
rebuilt onto **OpenStreetMap + Leaflet (react-leaflet)** with no API key required:

- **Vite build**: each portal now has `vite.config.js` + root `index.html` + `src/main.jsx`;
  `apiClient.js` reads `import.meta.env.VITE_API_BASE_URL` (default `http://localhost:18080/api`)
  and `VITE_OSRM_BASE_URL` (default `http://localhost:5000`). Dockerfiles use `vite build` and bake
  the same build args.
- **Reusable map components** (`frontend/shared/map`, mirrored into both portals'
  `src/components/map`): `LocationSearch.jsx` (Nominatim autocomplete), `LocationPicker.jsx`
  (search + click-to-drop real OSM coordinates), `RouteMap.jsx` (OSRM driving polyline +
  distance/duration), `LiveTrackingMap.jsx` (planned route dashed + live GPS pin). Helpers in
  `frontend/shared/lib/geo.js`.
- **OSRM routing engine** (docker-compose `osrm` service, image `osrm/osrm-backend:latest`, bind
  mount `infrastructure/osrm`): pre-seeded with a Sri Lanka extract. matching/courier/fleet route
  through it for real road distances; browsers prefer `http://localhost:5000` and fall back to
  `https://router.project-osrm.org` then a straight line.
- **Backend**: `MatchResult` now denormalizes the truck's `routeFromLat/Lng/routeToLat/Lng` so the
  Courier Portal can draw each candidate's posted lane next to the shipment's route.
- **Screens**: courier `ShipmentCreate` (map pickers → pickup/destination coordinates, live route
  preview, required-vehicle-type), `MatchResults` (5-facet score bars + per-truck route map),
  `Tracking`/`ShipmentDetails` (shipment route map); fleet `BackhaulAvailabilityDialog` (map pickers
  → coords on the availability record) + GPS Tracking (all-trucks live map) + per-row availability
  route maps.
- **Gateway/auth**: gateway app port is `8085` (host-mapped to `18080`); auth-service rebuilt on
  BCrypt with no admin-approval gate. Also fixed the shipment-code generator (DB `MAX()` instead of
  an in-memory counter) and the shipment `coordsLng` bug.
- **Ports (`docker-compose.yml`)**: MySQL host `3307`, API Gateway host `18080`, courier portal
  `3000`, fleet portal `3001`, OSRM `5000`. Backend ports inside the container network are the
  conventional ones (8081–8088, gateway 8085).

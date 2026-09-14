# Backhaul-Match — Demo Script (2 August, Final Demo Version)

## Before you go on stage

1. Start every backend service (see main `README.md`'s run order), or `docker compose up --build`
   (portals land on `:3000`/`:3001`, everything through the Gateway at `localhost:18080`).
2. Start both frontends: `npm run dev` in `frontend/courier-portal` and `frontend/fleet-portal`,
   or use the Docker-served versions at `:3000`/`:3001`.
3. Run the seed script once — this pre-creates the accounts, truck, and backhaul availability so
   the live demo starts at "log in," not "type out a truck registration form on stage":
   ```bash
   cd testing
   BASE_URL=http://localhost:18080/api bash demo-seed.sh
   ```
   Note the three usernames it prints (`demo_courier_<id>`, `demo_fleet_<id>`, `demo_driver_<id>`)
   — password for all is `Passw0rd!`.
4. Open three browser windows (or two + a phone/emulator for the Driver App): Courier Portal,
   Fleet Portal, Driver App.

If anything goes wrong mid-demo, `bash testing/integration-test.sh` is a fast way to confirm the
backend chain itself is healthy independent of the UI.

## The 11 steps

### 1. Courier User Logs In
Courier Portal → `/login` → sign in as `demo_courier_<id>`. Lands on the Dashboard.

### 2. Creates Shipment
Sidebar → **Requests** → fill in the New Shipment Request form. **Do this live** — pick
`Colombo` → `Kandy` to match the truck the seed script posted, any weight under 5 ton. Submit →
lands on the new Shipment Details page.

### 3. Requests Backhaul Transport
On Shipment Details → **"Request Backhaul Transport"** button → confirm in the dialog that opens
(shows the shipment's own route/weight) → **"Find Trucks."**

### 4. System Searches Available Trucks
Narrate this one — it's instant, so there's nothing to click. Mention: matching-service asked
fleet-service for every backhaul slot with enough capacity, computed the real distance between the
shipment's route and each candidate's posted route, and ranked them by wasted capacity + distance.

### 5. Match Found
Redirects automatically to **Match Results** — the seeded truck appears as a card (truck no.,
route, capacity, distance, estimated cost). Point out the `MATCH_FOUND` notification bell badge
that just appeared, top-right.

### 6. Courier Accepts Match
Click **"Accept Match"** on the truck card. Card updates to "Awaiting fleet confirmation."

### 7. Fleet Company Receives Booking
Switch to the Fleet Portal window → the bell badge has updated → **Bookings** page shows the
pending request.

### 8. Truck Capacity Is Reserved
Narrate: this already happened at step 6, not now — switch to the Fleet Portal's **Trucks** →
click the demo truck → **Availability** tab, and point out its status is already `BOOKED`, before
the fleet manager has even clicked anything here. That's the point: reservation is immediate,
confirmation is separate.

### 9. Driver Starts Trip
Still in Fleet Portal: **Bookings** → **Accept Booking**. Then **Trips** → find the newly created
trip (driver column shows "Unassigned") → assign `demo_driver_<id>` from the dropdown → **Assign**.
Switch to the Driver App → log in as `demo_driver_<id>` → the trip appears under "My Trips" → tap
it → **Start Trip**.

### 10. GPS Location Updates Live
The Driver App is now streaming location (real device GPS if on a phone; grant location permission
if prompted). Switch to Fleet Portal → **GPS Tracking** → the truck marker appears on the Google
Map, live.

### 11. Courier Tracks Shipment
Switch back to Courier Portal → **Tracking** → enter the shipment code (shown on the Shipment
Details page from step 2) → shows the status stepper and tracking history updating as the trip
progresses.

## If you have extra time

- Courier Portal → **Invoices**: an invoice was created automatically the moment the fleet manager
  accepted (step 9) — show the cost breakdown and the simulated "Pay" button.
- Fleet Portal → **Revenue** / **Reports**: the booking now shows up in both.
- Either portal's bell icon → click a notification → it deep-links to the relevant page.

## Known rough edges to mention if asked (don't hide these)

- Payment is simulated — no real payment gateway is wired up.
- Email notifications exist in the code but are off by default (no SMTP configured in this demo
  environment).
- The Driver App only transmits GPS while its screen is open — true background tracking needs a
  platform-specific foreground service, noted as future work.

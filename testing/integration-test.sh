#!/usr/bin/env bash
# 30 July — Full Integration
#
# Test Courier System <-> API Gateway <-> Backhaul-Match Platform <-> Fleet
# System <-> GPS App, checking: login, shipment creation, truck availability,
# GPS location, matching, booking, and capacity reservation.
#
# Prerequisites: every backend service running (see README's run order),
# curl and jq installed. Run from anywhere:
#   BASE_URL=http://localhost:8080/api bash testing/integration-test.sh

set -uo pipefail
cd "$(dirname "$0")"
source ./common.sh

echo "=== 30 July — Full Integration ==="
echo "Target: $BASE"
echo

# ---------------------------------------------------------------------------
echo "--- Login: courier, fleet manager, driver (Courier/Fleet/GPS App all authenticate the same way) ---"
register_and_login "courier" "COURIER_OPERATOR"; COURIER_TOKEN="$TOKEN"; COURIER_USER_ID="$USER_ID"
register_and_login "fleet" "FLEET_MANAGER";      FLEET_TOKEN="$TOKEN";   FLEET_USER_ID="$USER_ID"
register_and_login "driver" "DRIVER";            DRIVER_TOKEN="$TOKEN";  DRIVER_USER_ID="$USER_ID"

req POST /auth/login "{\"username\":\"nonexistent_user\",\"password\":\"wrong\"}"
check "login endpoint itself rejects bad creds during a good-path run too" "$([ "$STATUS" = "401" ] && echo true || echo false)"

# ---------------------------------------------------------------------------
echo
echo "--- Company setup (Courier System + Fleet System registering themselves) ---"
req PUT /courier/company/me '{"companyName":"Integration Test Courier","contactPhone":"0771234567"}' "$COURIER_TOKEN"
check_status "courier registers company" 200

req PUT /fleet/company/me '{"companyName":"Integration Test Fleet","contactPhone":"0777654321"}' "$FLEET_TOKEN"
check_status "fleet manager registers company" 200

# ---------------------------------------------------------------------------
echo
echo "--- Truck availability (Fleet System) ---"
req POST /fleet/trucks "{\"truckNo\":\"IT-$RUN_ID\",\"capacityTon\":5,\"truckType\":\"Box Truck\"}" "$FLEET_TOKEN"
check_status "register truck" 200
TRUCK_ID=$(echo "$BODY" | jq -r '.id')

req POST /fleet/drivers "{\"fullName\":\"Test Driver\",\"phone\":\"0770000000\",\"licenseNo\":\"LIC-$RUN_ID\",\"userId\":$DRIVER_USER_ID}" "$FLEET_TOKEN"
check_status "register driver (pre-linked to the Driver App account)" 200
DRIVER_ID=$(echo "$BODY" | jq -r '.id')

FUTURE_DATE=$(date -u -d '+1 day' +%Y-%m-%dT%H:%M:%S 2>/dev/null || date -u -v+1d +%Y-%m-%dT%H:%M:%S)
req POST "/fleet/trucks/$TRUCK_ID/availability" \
  "{\"routeFrom\":\"Colombo\",\"routeTo\":\"Kandy\",\"availableFrom\":\"$FUTURE_DATE\",\"availableCapacityTon\":5,\"tripType\":\"BACKHAUL\"}" \
  "$FLEET_TOKEN"
check_status "post backhaul truck availability (Colombo -> Kandy, 5 ton)" 200
AVAILABILITY_ID=$(echo "$BODY" | jq -r '.id')

req GET "/fleet/trucks/$TRUCK_ID/availability" "" "$FLEET_TOKEN"
COUNT=$(echo "$BODY" | jq 'length')
check "truck availability is queryable (found $COUNT entr(y/ies))" "$([ "$COUNT" -ge 1 ] && echo true || echo false)"

# ---------------------------------------------------------------------------
echo
echo "--- Shipment creation (Courier System) ---"
req POST /courier/shipments \
  "{\"newCustomer\":{\"fullName\":\"Test Customer\",\"phone\":\"0710000000\"},\"receiver\":{\"fullName\":\"Test Receiver\",\"phone\":\"0720000000\",\"address\":\"Kandy\"},\"pickupLocation\":\"Colombo\",\"pickupDatetime\":\"$FUTURE_DATE\",\"destination\":\"Kandy\",\"weightKg\":2000,\"parcelType\":\"General Cargo\"}" \
  "$COURIER_TOKEN"
check_status "create shipment (Colombo -> Kandy, 2 ton)" 200
SHIPMENT_ID=$(echo "$BODY" | jq -r '.id')
SHIPMENT_CODE=$(echo "$BODY" | jq -r '.shipmentCode')
echo "  shipment: $SHIPMENT_CODE (id=$SHIPMENT_ID)"

# ---------------------------------------------------------------------------
echo
echo "--- Matching (Backhaul-Match Platform: matching-service via the Gateway) ---"
req POST /matching/requests "{\"shipmentId\":$SHIPMENT_ID}" "$COURIER_TOKEN"
check_status "request backhaul match" 200
MATCH_REQUEST_ID=$(echo "$BODY" | jq -r '.id')

req GET "/matching/requests/$MATCH_REQUEST_ID/results" "" "$COURIER_TOKEN"
check_status "fetch match results" 200
RESULT_COUNT=$(echo "$BODY" | jq 'length')
check "match found at least one truck" "$([ "$RESULT_COUNT" -ge 1 ] && echo true || echo false)"
MATCH_RESULT_ID=$(echo "$BODY" | jq --argjson avail "$AVAILABILITY_ID" '[.[] | select(.truckAvailabilityId == $avail) | .id] | .[0]')

# ---------------------------------------------------------------------------
echo
echo "--- Booking + capacity reservation (Courier accepts -> Fleet receives) ---"
req POST "/matching/results/$MATCH_RESULT_ID/accept-match" "" "$COURIER_TOKEN"
check_status "courier accepts match (reserves truck capacity immediately)" 200
check "result status is PENDING_CONFIRMATION after accept" "$([ "$(echo "$BODY" | jq -r '.status')" = "PENDING_CONFIRMATION" ] && echo true || echo false)"

req GET "/fleet/trucks/$TRUCK_ID/availability" "" "$FLEET_TOKEN"
BOOKED=$(echo "$BODY" | jq --argjson id "$AVAILABILITY_ID" '[.[] | select(.id == $id) | .status] | .[0]')
check "truck capacity actually shows BOOKED after accept" "$([ "$BOOKED" = '"BOOKED"' ] && echo true || echo false)"

req GET /matching/bookings/pending "" "$FLEET_TOKEN"
check_status "fleet manager sees the pending booking request" 200
check "pending booking list contains our match result" "$(echo "$BODY" | jq --argjson id "$MATCH_RESULT_ID" 'any(.[]; .id == $id)')"

req POST "/matching/results/$MATCH_RESULT_ID/accept" "" "$FLEET_TOKEN"
check_status "fleet manager accepts the booking" 200

# ---------------------------------------------------------------------------
echo
echo "--- Trip + driver assignment (fleet receives booking -> assigns driver) ---"
req GET /fleet/trips "" "$FLEET_TOKEN"
TRIP_ID=$(echo "$BODY" | jq --argjson sid "$SHIPMENT_ID" '[.[] | select(.shipmentId == $sid)] | .[0].id')
check "a Trip was auto-created for the accepted booking" "$([ "$TRIP_ID" != "null" ] && echo true || echo false)"

req PATCH "/fleet/trips/$TRIP_ID/assign-driver" "{\"driverId\":$DRIVER_ID}" "$FLEET_TOKEN"
check_status "assign driver to the trip" 200

# ---------------------------------------------------------------------------
echo
echo "--- Driver App: my trips, start trip, GPS location ---"
req GET /fleet/trips/my "" "$DRIVER_TOKEN"
check_status "driver fetches their assigned trips" 200
check "assigned trip appears in driver's trip list" "$(echo "$BODY" | jq --argjson id "$TRIP_ID" 'any(.[]; .id == $id)')"

req PATCH "/fleet/trips/$TRIP_ID/start" "" "$DRIVER_TOKEN"
check_status "driver starts the trip" 200
check "trip status is IN_PROGRESS" "$([ "$(echo "$BODY" | jq -r '.status')" = "IN_PROGRESS" ] && echo true || echo false)"

req POST /gps/location \
  "{\"truckId\":$TRUCK_ID,\"driverId\":$DRIVER_ID,\"tripId\":$TRIP_ID,\"latitude\":7.2906,\"longitude\":80.6337,\"speedKmh\":45,\"heading\":90}" \
  "$DRIVER_TOKEN"
check_status "driver app transmits a GPS location" 200

req GET "/gps/live/$TRUCK_ID" "" "$FLEET_TOKEN"
check_status "fleet portal reads the truck's live GPS location" 200
check "GPS latitude matches what the driver app sent" "$([ "$(echo "$BODY" | jq -r '.latitude')" = "7.2906" ] && echo true || echo false)"

# ---------------------------------------------------------------------------
echo
echo "--- Invoice + notifications (created automatically when the booking was accepted) ---"
req GET /payment/invoices/mine "" "$COURIER_TOKEN"
check_status "courier fetches their invoices" 200
INVOICE_ID=$(echo "$BODY" | jq --argjson sid "$SHIPMENT_ID" '[.[] | select(.shipmentId == $sid)] | .[0].id')
check "an invoice exists for the accepted booking" "$([ "$INVOICE_ID" != "null" ] && echo true || echo false)"

req GET /notifications/mine "" "$COURIER_TOKEN"
check_status "courier fetches their notifications" 200
HAS_MATCH_FOUND=$(echo "$BODY" | jq 'any(.[]; .type == "MATCH_FOUND")')
HAS_BOOKING_ACCEPTED=$(echo "$BODY" | jq 'any(.[]; .type == "BOOKING_ACCEPTED")')
check "MATCH_FOUND notification was delivered" "$HAS_MATCH_FOUND"
check "BOOKING_ACCEPTED notification was delivered" "$HAS_BOOKING_ACCEPTED"

summary_and_exit

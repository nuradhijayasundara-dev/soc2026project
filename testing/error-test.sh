#!/usr/bin/env bash
# 31 July — Error Testing
#
# Test: no available truck, insufficient capacity, invalid login, GPS
# unavailable, duplicate booking, truck already reserved, and shipment
# cancellation.
#
# Prerequisites: same as integration-test.sh. Runs independently (registers
# its own accounts) so it doesn't depend on integration-test.sh having run
# first.
#   BASE_URL=http://localhost:8080/api bash testing/error-test.sh

set -uo pipefail
cd "$(dirname "$0")"
source ./common.sh

echo "=== 31 July — Error Testing ==="
echo "Target: $BASE"
echo

# --- Setup: one courier, one fleet manager, one truck with limited capacity ---
register_and_login "erruser_courier" "COURIER_OPERATOR"; COURIER_TOKEN="$TOKEN"
register_and_login "erruser_fleet" "FLEET_MANAGER";      FLEET_TOKEN="$TOKEN"

req PUT /courier/company/me '{"companyName":"Error Test Courier"}' "$COURIER_TOKEN"
req PUT /fleet/company/me '{"companyName":"Error Test Fleet"}' "$FLEET_TOKEN"

req POST /fleet/trucks "{\"truckNo\":\"ERR-$RUN_ID\",\"capacityTon\":3,\"truckType\":\"Box Truck\"}" "$FLEET_TOKEN"
TRUCK_ID=$(echo "$BODY" | jq -r '.id')

FUTURE_DATE=$(date -u -d '+1 day' +%Y-%m-%dT%H:%M:%S 2>/dev/null || date -u -v+1d +%Y-%m-%dT%H:%M:%S)
req POST "/fleet/trucks/$TRUCK_ID/availability" \
  "{\"routeFrom\":\"Colombo\",\"routeTo\":\"Galle\",\"availableFrom\":\"$FUTURE_DATE\",\"availableCapacityTon\":3,\"tripType\":\"BACKHAUL\"}" \
  "$FLEET_TOKEN"
AVAILABILITY_ID=$(echo "$BODY" | jq -r '.id')

echo
echo "--- 1. Invalid login ---"
req POST /auth/login '{"username":"this_user_does_not_exist","password":"wrongpassword"}'
check_status "wrong username/password is rejected" 401

req POST /auth/login "{\"username\":\"erruser_courier_$RUN_ID\",\"password\":\"totally-wrong-password\"}"
check_status "correct username with wrong password is rejected" 401

echo
echo "--- 2. No available truck (route with zero postings) ---"
req POST /courier/shipments \
  "{\"newCustomer\":{\"fullName\":\"No Truck Customer\"},\"receiver\":{\"fullName\":\"No Truck Receiver\"},\"pickupLocation\":\"Jaffna\",\"pickupDatetime\":\"$FUTURE_DATE\",\"destination\":\"Batticaloa\",\"weightKg\":1000}" \
  "$COURIER_TOKEN"
check_status "create shipment on a route with no posted availability" 200
NO_TRUCK_SHIPMENT_ID=$(echo "$BODY" | jq -r '.id')

req POST /matching/requests "{\"shipmentId\":$NO_TRUCK_SHIPMENT_ID}" "$COURIER_TOKEN"
check_status "match request is still accepted (search itself doesn't fail)" 200
NO_TRUCK_REQUEST_ID=$(echo "$BODY" | jq -r '.id')

req GET "/matching/requests/$NO_TRUCK_REQUEST_ID" "" "$COURIER_TOKEN"
check "request correctly resolves to NO_MATCH" "$([ "$(echo "$BODY" | jq -r '.status')" = "NO_MATCH" ] && echo true || echo false)"

req GET "/matching/requests/$NO_TRUCK_REQUEST_ID/results" "" "$COURIER_TOKEN"
check "no candidate trucks were returned" "$([ "$(echo "$BODY" | jq 'length')" = "0" ] && echo true || echo false)"

echo
echo "--- 3. Insufficient capacity (shipment too heavy for the only truck on that route) ---"
req POST /courier/shipments \
  "{\"newCustomer\":{\"fullName\":\"Heavy Customer\"},\"receiver\":{\"fullName\":\"Heavy Receiver\"},\"pickupLocation\":\"Colombo\",\"pickupDatetime\":\"$FUTURE_DATE\",\"destination\":\"Galle\",\"weightKg\":50000}" \
  "$COURIER_TOKEN"
check_status "create an intentionally over-capacity shipment (50 ton on a 3-ton truck)" 200
HEAVY_SHIPMENT_ID=$(echo "$BODY" | jq -r '.id')

req POST /matching/requests "{\"shipmentId\":$HEAVY_SHIPMENT_ID}" "$COURIER_TOKEN"
HEAVY_REQUEST_ID=$(echo "$BODY" | jq -r '.id')
req GET "/matching/requests/$HEAVY_REQUEST_ID/results" "" "$COURIER_TOKEN"
check "the 3-ton truck is correctly excluded as too small" "$([ "$(echo "$BODY" | jq 'length')" = "0" ] && echo true || echo false)"

req GET "/fleet/availability/$AVAILABILITY_ID/verify?requiredTon=50" "" "$FLEET_TOKEN"
check "direct capacity verification also rejects an oversized request" "$([ "$(echo "$BODY" | jq -r '.valid')" = "false" ] && echo true || echo false)"

echo
echo "--- 4. GPS unavailable (truck that has never reported a location) ---"
req GET "/gps/live/999999999" "" "$FLEET_TOKEN"
check_status "live location for an unknown/silent truck returns 404" 404

echo
echo "--- 5 & 6. Duplicate booking + truck already reserved ---"
req POST /courier/shipments \
  "{\"newCustomer\":{\"fullName\":\"Dup Customer\"},\"receiver\":{\"fullName\":\"Dup Receiver\"},\"pickupLocation\":\"Colombo\",\"pickupDatetime\":\"$FUTURE_DATE\",\"destination\":\"Galle\",\"weightKg\":1500}" \
  "$COURIER_TOKEN"
DUP_SHIPMENT_ID=$(echo "$BODY" | jq -r '.id')

req POST /matching/requests "{\"shipmentId\":$DUP_SHIPMENT_ID}" "$COURIER_TOKEN"
DUP_REQUEST_ID=$(echo "$BODY" | jq -r '.id')
req GET "/matching/requests/$DUP_REQUEST_ID/results" "" "$COURIER_TOKEN"
DUP_RESULT_ID=$(echo "$BODY" | jq -r '.[0].id')
check "found the 3-ton truck for a 1.5-ton shipment" "$([ "$DUP_RESULT_ID" != "null" ] && echo true || echo false)"

req POST "/matching/results/$DUP_RESULT_ID/accept-match" "" "$COURIER_TOKEN"
check_status "first accept-match succeeds and reserves the truck" 200

req POST "/matching/results/$DUP_RESULT_ID/accept-match" "" "$COURIER_TOKEN"
check_status "duplicate accept-match on the same result is rejected" 409

req PATCH "/fleet/availability/$AVAILABILITY_ID/reserve?requiredTon=1" "" "$FLEET_TOKEN"
check_status "reserving an already-BOOKED slot again is rejected (truck already reserved)" 409

echo
echo "--- 7. Shipment cancellation ---"
req PATCH "/courier/shipments/$NO_TRUCK_SHIPMENT_ID/status" '{"status":"CANCELLED","location":"Never picked up"}' "$COURIER_TOKEN"
check_status "cancel a shipment" 200
check "shipment status is now CANCELLED" "$([ "$(echo "$BODY" | jq -r '.status')" = "CANCELLED" ] && echo true || echo false)"

req GET /notifications/mine "" "$COURIER_TOKEN"
check "SHIPMENT_STATUS notification fired for the cancellation" "$(echo "$BODY" | jq 'any(.[]; .type == "SHIPMENT_STATUS")')"

summary_and_exit

#!/usr/bin/env bash
# Pre-seeds everything the 11-step demo needs EXCEPT the shipment itself —
# that's step 2 of the demo and should happen live, on stage, so the
# audience sees it. Run this once, right before the demo starts, then use
# the printed credentials to log into each portal.
#
#   BASE_URL=http://localhost:8080/api bash testing/demo-seed.sh

set -uo pipefail
cd "$(dirname "$0")"
source ./common.sh

echo "=== Seeding demo data ==="
echo

register_and_login "demo_courier" "COURIER_OPERATOR"; COURIER_TOKEN="$TOKEN"
register_and_login "demo_fleet" "FLEET_MANAGER";      FLEET_TOKEN="$TOKEN"
register_and_login "demo_driver" "DRIVER";            DRIVER_TOKEN="$TOKEN"; DRIVER_USER_ID="$USER_ID"

req PUT /courier/company/me '{"companyName":"Demo Courier Co","contactPhone":"0771234567"}' "$COURIER_TOKEN"
req PUT /fleet/company/me '{"companyName":"Demo Fleet Co","contactPhone":"0777654321"}' "$FLEET_TOKEN"

req POST /fleet/trucks "{\"truckNo\":\"DEMO-$RUN_ID\",\"capacityTon\":5,\"truckType\":\"Box Truck\"}" "$FLEET_TOKEN"
TRUCK_ID=$(echo "$BODY" | jq -r '.id')

req POST /fleet/drivers "{\"fullName\":\"Demo Driver\",\"phone\":\"0770000000\",\"licenseNo\":\"DEMO-LIC-$RUN_ID\",\"userId\":$DRIVER_USER_ID}" "$FLEET_TOKEN"

FUTURE_DATE=$(date -u -d '+1 day' +%Y-%m-%dT%H:%M:%S 2>/dev/null || date -u -v+1d +%Y-%m-%dT%H:%M:%S)
req POST "/fleet/trucks/$TRUCK_ID/availability" \
  "{\"routeFrom\":\"Colombo\",\"routeTo\":\"Kandy\",\"availableFrom\":\"$FUTURE_DATE\",\"availableCapacityTon\":5,\"tripType\":\"BACKHAUL\"}" \
  "$FLEET_TOKEN"

summary_and_exit > /dev/null # don't need the PASS/FAIL noise here, just the setup

echo
echo "======================================================"
echo " Demo accounts ready — password for all: Passw0rd!"
echo "======================================================"
echo " Courier Portal login: demo_courier_$RUN_ID"
echo " Fleet Portal login:   demo_fleet_$RUN_ID"
echo " Driver App login:     demo_driver_$RUN_ID"
echo
echo " Truck DEMO-$RUN_ID (5 ton) has backhaul availability posted"
echo " for Colombo -> Kandy, ready to be matched."
echo
echo " Now follow docs/demo-script.md starting at Step 1."
echo "======================================================"

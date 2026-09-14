#!/usr/bin/env bash
# Shared helpers for integration-test.sh and error-test.sh.
# Requires: curl, jq. All requests go through the API Gateway, same as the real
# frontends — never directly to a microservice — so this also exercises the
# Gateway's JWT filter and routing on every call.

BASE="${BASE_URL:-http://localhost:18080/api}"

PASS_COUNT=0
FAIL_COUNT=0

# --- HTTP helper -------------------------------------------------------
# req METHOD PATH [JSON_BODY] [BEARER_TOKEN]
# Leaves the response body in $BODY and the HTTP status code in $STATUS.
req() {
  local method="$1" path="$2" data="${3:-}" token="${4:-}"
  local args=(-s -w '\n%{http_code}' -X "$method" "$BASE$path" -H "Content-Type: application/json")
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$data" ] && args+=(-d "$data")

  local raw
  raw=$(curl "${args[@]}")
  STATUS=$(echo "$raw" | tail -n1)
  BODY=$(echo "$raw" | sed '$d')
}

# --- Assertions ----------------------------------------------------------
# check "description" "true|false"
check() {
  local desc="$1" ok="$2"
  if [ "$ok" = "true" ]; then
    echo "  PASS - $desc"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "  FAIL - $desc"
    echo "         status=$STATUS body=$BODY" | head -c 400
    echo
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

check_status() {
  local desc="$1" expected="$2"
  if [ "$STATUS" = "$expected" ]; then
    check "$desc (HTTP $STATUS)" true
  else
    check "$desc (expected HTTP $expected, got $STATUS)" false
  fi
}

summary_and_exit() {
  echo
  echo "======================================"
  echo " Passed: $PASS_COUNT   Failed: $FAIL_COUNT"
  echo "======================================"
  [ "$FAIL_COUNT" -eq 0 ]
}

# --- Test data helpers ---------------------------------------------------
RUN_ID=$(date +%s)  # unique suffix so re-running the script doesn't collide on usernames

# register_and_login ROLE_PREFIX ROLE -> sets TOKEN and USER_ID
register_and_login() {
  local prefix="$1" role="$2"
  local username="${prefix}_${RUN_ID}"
  local email="${username}@test.local"
  local password="Passw0rd!"

  req POST /auth/register "{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$password\",\"role\":\"$role\"}"
  check_status "register $role ($username)" 200

  req POST /auth/login "{\"username\":\"$username\",\"password\":\"$password\"}"
  check_status "login $role ($username)" 200

  TOKEN=$(echo "$BODY" | jq -r '.token')
  USER_ID=$(echo "$BODY" | jq -r '.userId')
}

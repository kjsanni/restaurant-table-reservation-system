#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8000}"
COOKIE_JAR=$(mktemp)
CSRF_TOKEN=""
TENANT_HEADER=( -H "x-tenant-id: 9" )

echo "=== RTRS API Smoke Test ==="
echo "Base URL: $BASE_URL"

cleanup() {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

echo ""
echo "Seeding local database..."
ADMIN_INITIAL_PASSWORD=admin123 npm run seed:all >/dev/null 2>&1 || true

echo ""
echo "1. Health Check"
curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/health"

echo ""
echo ""
echo "2. Get CSRF Token"
CSRF_TOKEN=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" "$BASE_URL/api/v1/csrf-token" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "CSRF Token: ${CSRF_TOKEN:0:20}..."

echo ""
echo "3. Login"
curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -H "x-xsrf-token: $CSRF_TOKEN" \
  -d '{"email":"admin@rtrs.com","password":"admin123"}'

echo ""
echo ""
echo "4. Get Me"
curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H "x-xsrf-token: $CSRF_TOKEN" \
  "${TENANT_HEADER[@]}" \
  "$BASE_URL/api/v1/auth/me" | python3 -m json.tool 2>/dev/null || curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H "x-xsrf-token: $CSRF_TOKEN" \
  "${TENANT_HEADER[@]}" \
  "$BASE_URL/api/v1/auth/me"

echo ""
echo ""
echo "5. Create Reservation"
RESERVATION_RESPONSE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE_URL/api/v1/reservations" \
  -H "Content-Type: application/json" \
  -H "x-xsrf-token: $CSRF_TOKEN" \
  "${TENANT_HEADER[@]}" \
  -d '{"firstName":"John","lastName":"Doe","phone":"0241234567","email":"john@example.com","resDate":"2026-07-30","resTime":"19:00","people":4}')
echo "$RESERVATION_RESPONSE"

echo ""
echo ""
echo "6. List Reservations"
LIST_RESPONSE=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H "x-xsrf-token: $CSRF_TOKEN" \
  "${TENANT_HEADER[@]}" \
  "$BASE_URL/api/v1/reservations")
echo "$LIST_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LIST_RESPONSE"
RESERVATION_ID=$(echo "$LIST_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2 || echo "1")

echo ""
echo ""
echo "7. Get Reservation ($RESERVATION_ID)"
curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H "x-xsrf-token: $CSRF_TOKEN" \
  "${TENANT_HEADER[@]}" \
  "$BASE_URL/api/v1/reservations/$RESERVATION_ID"

echo ""
echo ""
echo "8. List Tables"
curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H "x-xsrf-token: $CSRF_TOKEN" \
  "${TENANT_HEADER[@]}" \
  "$BASE_URL/api/v1/tables"

echo ""
echo ""
echo "9. Add Payment"
curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE_URL/api/v1/reservations/$RESERVATION_ID/payments" \
  -H "Content-Type: application/json" \
  -H "x-xsrf-token: $CSRF_TOKEN" \
  "${TENANT_HEADER[@]}" \
  -d '{"amount":150.0,"method":"cash","currency":"GHS"}'

echo ""
echo ""
echo "10. Cancel Reservation"
curl -s -o /dev/null -w "%{http_code}" -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X DELETE "$BASE_URL/api/v1/reservations/$RESERVATION_ID" \
  -H "x-xsrf-token: $CSRF_TOKEN" \
  "${TENANT_HEADER[@]}"

echo ""
echo ""
echo "=== Smoke Test Complete ==="

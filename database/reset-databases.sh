#!/usr/bin/env bash
# Drops and recreates every Backhaul-Match database — use this between demo
# rehearsals (or before the real demo) so old test data doesn't show up on
# stage. Safe to run repeatedly; each service recreates its own schema and
# tables automatically on next startup (createDatabaseIfNotExist=true +
# Hibernate ddl-auto=update), so you don't need to re-run the .sql files
# afterward — just restart the backend services.
#
#   MYSQL_USER=root MYSQL_PASSWORD=root bash database/reset-databases.sh

set -euo pipefail

USER="${MYSQL_USER:-root}"
PASS="${MYSQL_PASSWORD:-root}"
HOST="${MYSQL_HOST:-localhost}"

DBS="auth_db user_db courier_db fleet_db gps_db matching_db notification_db payment_db"

echo "This will DROP the following databases on $HOST: $DBS"
read -p "Type 'yes' to continue: " CONFIRM
[ "$CONFIRM" = "yes" ] || { echo "Aborted."; exit 1; }

for db in $DBS; do
  echo "Dropping $db..."
  mysql -h "$HOST" -u "$USER" -p"$PASS" -e "DROP DATABASE IF EXISTS $db;"
done

echo
echo "Done. Restart the backend services (or docker compose restart) —"
echo "each one recreates its own schema automatically on startup."

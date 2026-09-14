# Database Layout

Database-per-service — each microservice owns exactly one schema, never reads or writes another
service's tables directly. Cross-service references (e.g. a `Trip.shipmentId` pointing at a row in
`courier_db`) are plain IDs with no real foreign key, validated via the owning service's REST API
instead. See `docs/diagrams/er-diagram.svg` for the visual version.

| File | Owning service | Key tables |
|---|---|---|
| `auth_db.sql` | auth-service, user-service | `users`, `login_history`, `user_sessions`, `user_profiles` |
| `courier_db.sql` | courier-service | `courier_companies`, `customers`, `receivers`, `shipments`, `shipment_tracking` |
| `fleet_db.sql` | fleet-service | `fleet_companies`, `trucks`, `drivers`, `truck_availability`, `trips` |
| `gps_db.sql` | gps-service | `live_gps_locations`, `gps_tracking_history` |
| `matching_db.sql` | matching-service | `match_requests`, `match_results`, `capacity_reservations` |
| `notification_db.sql` | notification-service | `notifications` |
| `payment_db.sql` | payment-service | `invoices`, `payments` |

## Do you need to run these `.sql` files at all?

No, not normally. Every service's `application.yml` sets
`createDatabaseIfNotExist=true` on the JDBC URL and `spring.jpa.hibernate.ddl-auto=update` —
the schema and tables are created automatically the first time each service starts, whether
you're running locally or via `docker compose`. The `.sql` files here exist as:

- **Reference** — the canonical, typed schema (with real `FOREIGN KEY` constraints Hibernate's
  `ddl-auto=update` doesn't always create identically) for anyone reading the data model without
  spinning up the app.
- **A manual setup path** if you want stricter guarantees than `ddl-auto=update` gives you, or
  you're setting up a database a service will connect to without ever being allowed to alter schema
  itself (e.g. a locked-down shared dev database).

## Cleaning up before a demo or a fresh run

`reset-databases.sh` drops all eight databases in one step (asks for confirmation first). After
running it, just restart the backend services — each recreates its own schema on startup, so there's
no need to re-run any `.sql` file afterward:

```bash
MYSQL_USER=root MYSQL_PASSWORD=root bash database/reset-databases.sh
```

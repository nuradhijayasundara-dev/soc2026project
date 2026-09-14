# Backhaul-Match — Architecture & Team Reference
(All Members deliverable: microservices, DB relationships, API flow, roles, repo structure, stack)

## 1. Final Microservice List (aligned to your diagram)
| # | Service | Owner | Port |
|---|---------|-------|------|
| 1 | Discovery Server (Eureka) | Member 1 | 8761 |
| 2 | API Gateway | Member 1 | 8080 |
| 3 | Auth Service | Member 1 | 8081 |
| 4 | User Service | Member 1 | 8082 |
| 5 | Courier Service (Courier Companies, Shipments) | Member 2 | 8083 |
| 6 | Fleet Service (Fleet Companies, Trucks, Drivers) | Member 3 | 8084 |
| 7 | GPS Tracking Service | Member 3 (later) | 8085 |
| 8 | Matching Engine Service | shared (later sprint) | 8086 |
| 9 | Booking Service | shared (later) | 8087 |
| 10 | Pricing & Payment Service | shared (later) | 8088 |
| 11 | Notification Service | shared (later) | 8089 |
| 12 | Analytics & Audit Service | shared (later) | 8090 |

Sprint 1 (what's coded here) = Discovery, Gateway, Auth, User, Courier DB+frontend skeleton, Fleet DB+frontend skeleton, Driver app skeleton.

## 2. Database Relationships (per your 50-table list, grouped by service DB — database-per-service)
- **auth_db**: Users(1)---(M) User_Roles(M)---(1) Roles; Roles(1)---(M) Permissions via Role_Permissions; Users(1)---(M) Login_History; Users(1)---(M) User_Sessions.
- **user_db**: User_Profiles(1)---(1) Users.id (FK, no cross-DB constraint — validated via Auth API); User_Profiles(1)---(M) Addresses; User_Profiles(1)---(M) Contacts.
- **courier_db**: Courier_Companies(1)---(M) Courier_Branches; Courier_Companies(1)---(M) Customers; Customers(1)---(M) Shipments; Shipments(1)---(M) Shipment_Items; Shipments(1)---(M) Shipment_Tracking; Shipments(M)---(1) Receivers.
- **fleet_db**: Fleet_Companies(1)---(M) Trucks; Trucks(1)---(M) Truck_Availability; Trucks(1)---(M) Vehicle_Maintenance; Fleet_Companies(1)---(M) Drivers; Drivers(1)---(M) Driver_Licenses; Trucks(1)---(M) Trips; Drivers(1)---(M) Trips.
- Cross-service references (e.g. Shipment.userId, Trip.matchRequestId) are stored as plain UUID/long foreign keys with **no DB-level FK constraint across services** — services own their data and validate via REST calls to each other through the Gateway. This is the standard rule for microservices with database-per-service.

## 3. API Communication Flow
```
Client Apps (Courier Portal / Fleet Portal / Driver App)
        │  HTTPS + JWT
        ▼
   API Gateway (Spring Cloud Gateway, port 8080)
        │  routes by path prefix, validates JWT, forwards to services via Eureka service names
        ├─ /api/auth/**     → auth-service
        ├─ /api/users/**    → user-service
        ├─ /api/courier/**  → courier-service
        ├─ /api/fleet/**    → fleet-service
        └─ ...future services
        ▼
   Discovery Server (Eureka, port 8761) — every service registers here; Gateway looks services up by name, not hardcoded host:port
        ▼
   Each microservice → its own MySQL schema, exposes only REST + JSON, never accessed directly by clients
```
Service-to-service calls (e.g. Booking calling Fleet to check truck availability) also go through Eureka-resolved service names (via `RestTemplate`/`WebClient` with `@LoadBalanced`), not the Gateway.

## 4. User Roles
- `ADMIN` — full system access, manages users/companies.
- `COURIER_OPERATOR` — Courier Portal user; creates/manages shipments.
- `FLEET_MANAGER` — Fleet Portal user; manages trucks, drivers, accepts/declines bookings.
- `DRIVER` — Driver mobile app; updates trip status, sends GPS pings.
Roles are stored in `auth_db.Roles`, attached to a user via `User_Roles`, and embedded as a claim inside the JWT so the Gateway/services can do role checks without a DB hit.

## 5. GitHub Repo Structure (monorepo, recommended for a final-year team of 3)
```
backhaul-match/
├── backend/
│   ├── discovery-server/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── user-service/
│   ├── courier-service/      (Member 2 backend, sprint 2)
│   └── fleet-service/        (Member 3 backend, sprint 2)
├── frontend/
│   ├── courier-portal/       (Member 2)
│   └── fleet-portal/         (Member 3)
├── driver-app/                (Member 3, Flutter)
├── database/                  (schema .sql per service)
└── docs/
```
Branching: `main` (protected) ← `develop` ← feature branches `feature/<member>/<task>`. Each member opens a PR into `develop`; merge to `main` at sprint end.

## 6. Technology Stack (as per your table)
React.js + Material UI (web) · Flutter (driver app) · Spring Boot (Java) backend · MySQL · Redis (optional cache) · REST APIs · Traccar + Android GPS · Google Maps API · Spring Security + JWT · Eureka · Spring Cloud Gateway · Firebase Cloud Messaging + JavaMail · JasperReports + Apache POI · Postman · Git/GitHub · Docker.

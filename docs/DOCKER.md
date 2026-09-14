# Docker Setup

One `docker-compose.yml` at the repo root brings up the whole platform — MySQL, Eureka, the
Gateway, all 9 microservices, and both React portals.

## Run it

```bash
docker compose up --build
```

First build takes a while (10 backend images each doing a Maven build, 2 frontend images each
doing an `npm install` + `npm run build`). Subsequent builds are much faster — Docker caches the
dependency-download layer separately from your source, so editing a `.java` or `.jsx` file doesn't
re-download the world.

## What comes up, and where

| Service | URL |
|---|---|
| Eureka dashboard | http://localhost:8761 |
| API Gateway | http://localhost:18080 (host port → container 8085) |
| OSRM routing engine | http://localhost:5000 |
| Courier Portal | http://localhost:3000 |
| Fleet Portal | http://localhost:3001 |
| MySQL | localhost:3307 (root / root — remapped from 3306 because this dev box already hosts a local mysqld) |

Every backend service is reachable *inside* the Docker network by its Eureka name (that's how
they find each other — no change needed from how they work locally), but isn't published to your
host except the Gateway and Eureka's dashboard. That's intentional: in this project, exactly like
in production, clients only ever talk to the Gateway.

## How the services find MySQL and Eureka inside Docker

Locally (outside Docker), every service's `application.yml` points at `localhost` for both its
database and Eureka — fine when everything runs on your own machine. Inside Docker, `localhost`
inside a container means *that container*, not the host or its sibling containers, so
`docker-compose.yml` overrides both via environment variables Spring Boot's relaxed binding
picks up automatically:

- `SPRING_DATASOURCE_URL` → `jdbc:mysql://mysql:3306/<db_name>?...` (`mysql` is the MySQL
  container's name, resolved via Docker's internal DNS)
- `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` → `http://discovery-server:8761/eureka/`

No code changes were needed for this — `application.yml`'s hardcoded `localhost` values are just
defaults, and any of Spring's supported override mechanisms (env vars, `-D` system properties, a
mounted `application-docker.yml`) take precedence. Environment variables are the simplest for
Docker Compose, so that's what's used here.

## Database schema in Docker

No separate init-SQL step — each service's `createDatabaseIfNotExist=true` JDBC URL plus
`spring.jpa.hibernate.ddl-auto=update` creates its own schema and tables the first time it
connects, identical to running locally. See `database/README.md` for when you'd want to run the
`.sql` files manually instead.

## Frontend build-time configuration

Vite bakes `VITE_*` environment variables into the JavaScript bundle at **build** time, not
runtime — so they're passed as Docker build args, not container environment variables.
`docker-compose.yml` already sets `VITE_API_BASE_URL` to `http://localhost:18080/api` (the
Gateway's host-published port — the browser running the app needs a URL *it* can reach, not a
Docker-internal one) and `VITE_OSRM_BASE_URL` to `http://localhost:5000` (the local OSRM engine
used for the display route maps). To override either, edit the `args:` block for the portal in
`docker-compose.yml` or use a `.env.local` when running `npm run dev`.

## OSRM (route engine) service

`docker compose up -d osrm` runs `osrm/osrm-backend:latest` in router mode. It bind-mounts
`infrastructure/osrm` (`start.sh` bootstrap + `data/` with the `.osm.pbf` extract). The first time
the `data/` directory is empty, the bootstrap script downloads `sri-lanka-latest.osm.pbf`
(~130 MB) and preprocesses it into the engine's data files (`osrm-extract`, `osrm-cartogram`,
`osrm-partition`, `osrm-customize`). Backends call it at `http://osrm:5000` for real road
distances; browsers fall back to `https://router.project-osrm.org`, then a straight line.

## Troubleshooting

- **A service shows as DOWN in the Eureka dashboard right after `docker compose up`**: normal —
  Eureka takes a few seconds to come up and services registering before it's ready just retry
  until it is. Give it ~30 seconds; if it's still down, `docker compose restart <service>`.
- **`docker compose up` fails on the MySQL healthcheck**: first boot of the MySQL container can
  take a bit longer than the default healthcheck retries allow on a slow machine — re-run
  `docker compose up` once MySQL's own logs show `ready for connections`.
- **Frontend shows API errors even though the Gateway is up**: check that `VITE_API_BASE_URL`
  was actually baked in — inspect the built JS bundle, or just rebuild the frontend image
  (`docker compose build courier-portal`) after changing it, since it's a build arg, not something
  you can fix by restarting the container.
- **`docker compose config` warns `the attribute 'version' is obsolete`**: harmless — Compose
  ignores it (it's a leftover from the template); a future cleanup can remove the top-level
  `version:` line.

-- gps_db: owned by gps-service (Member 1)
CREATE DATABASE IF NOT EXISTS gps_db;
USE gps_db;

CREATE TABLE IF NOT EXISTS live_gps_locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    truck_id BIGINT NOT NULL UNIQUE,     -- references fleet_db.trucks.id (app-level FK)
    driver_id BIGINT,                    -- references fleet_db.drivers.id
    trip_id BIGINT,                      -- references fleet_db.trips.id
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    speed_kmh DOUBLE,
    heading DOUBLE,
    updated_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS gps_tracking_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    truck_id BIGINT NOT NULL,
    trip_id BIGINT,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    speed_kmh DOUBLE,
    recorded_at DATETIME NOT NULL,
    INDEX idx_truck_recorded (truck_id, recorded_at),
    INDEX idx_trip_recorded (trip_id, recorded_at)
);

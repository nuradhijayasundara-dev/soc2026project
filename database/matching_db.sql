-- matching_db: owned by matching-service (Member 1)
CREATE DATABASE IF NOT EXISTS matching_db;
USE matching_db;

CREATE TABLE IF NOT EXISTS match_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_id BIGINT NOT NULL,          -- references courier_db.shipments.id
    requested_by_user_id BIGINT NOT NULL, -- references auth_db.users.id
    pickup_location VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    weight_kg DECIMAL(8,2),
    status ENUM('PENDING','MATCHED','NO_MATCH','CANCELLED') NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS match_results (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    match_request_id BIGINT NOT NULL,
    truck_availability_id BIGINT NOT NULL, -- references fleet_db.truck_availability.id
    truck_id BIGINT NOT NULL,              -- references fleet_db.trucks.id
    fleet_company_id BIGINT NOT NULL,      -- references fleet_db.fleet_companies.id
    truck_no VARCHAR(20),
    truck_type VARCHAR(50),
    available_capacity_ton DECIMAL(6,2),
    route_from VARCHAR(100),
    route_to VARCHAR(100),
    distance_km DOUBLE,
    estimated_cost DECIMAL(10,2),
    match_score DOUBLE,
    status ENUM('RECOMMENDED','PENDING_CONFIRMATION','ACCEPTED','REJECTED') NOT NULL DEFAULT 'RECOMMENDED',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_request_id) REFERENCES match_requests(id)
);

-- Capacity_Reservations: created the instant a courier accepts a match (see
-- MatchingService.acceptMatch) — RESERVED until the fleet manager decides,
-- then CONFIRMED (accepted) or RELEASED (rejected, frees the slot back up).
CREATE TABLE IF NOT EXISTS capacity_reservations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    match_result_id BIGINT NOT NULL,
    truck_availability_id BIGINT NOT NULL,
    reserved_capacity_ton DECIMAL(6,2) NOT NULL,
    status ENUM('RESERVED','CONFIRMED','RELEASED') NOT NULL DEFAULT 'RESERVED',
    reserved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_result_id) REFERENCES match_results(id)
);

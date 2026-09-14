-- fleet_db: owned by fleet-service (Member 3)
CREATE DATABASE IF NOT EXISTS fleet_db;
USE fleet_db;

CREATE TABLE IF NOT EXISTS fleet_companies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,            -- references auth_db.users.id
    company_name VARCHAR(150) NOT NULL,
    registration_no VARCHAR(50),
    contact_phone VARCHAR(20),
    address VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fleet_company_id BIGINT NOT NULL,
    user_id BIGINT,                     -- references auth_db.users.id (role DRIVER), linked via /link-account
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    license_no VARCHAR(50),
    status ENUM('AVAILABLE','ON_TRIP','OFF_DUTY') NOT NULL DEFAULT 'AVAILABLE',
    FOREIGN KEY (fleet_company_id) REFERENCES fleet_companies(id)
);

CREATE TABLE IF NOT EXISTS driver_licenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    driver_id BIGINT NOT NULL,
    license_no VARCHAR(50) NOT NULL,
    license_class VARCHAR(20),
    expiry_date DATE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

CREATE TABLE IF NOT EXISTS trucks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fleet_company_id BIGINT NOT NULL,
    truck_no VARCHAR(20) NOT NULL UNIQUE,   -- e.g. WP-AB-1234
    capacity_ton DECIMAL(6,2) NOT NULL,
    truck_type VARCHAR(50),
    status ENUM('AVAILABLE','ON_TRIP','MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',
    FOREIGN KEY (fleet_company_id) REFERENCES fleet_companies(id)
);

CREATE TABLE IF NOT EXISTS truck_availability (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    truck_id BIGINT NOT NULL,
    route_from VARCHAR(100) NOT NULL,
    route_to VARCHAR(100) NOT NULL,          -- "return destination" for backhaul postings
    available_from DATETIME NOT NULL,
    available_capacity_ton DECIMAL(6,2) NOT NULL,
    trip_type ENUM('OUTBOUND','BACKHAUL') NOT NULL DEFAULT 'BACKHAUL',
    status ENUM('AVAILABLE','BOOKED','EXPIRED') NOT NULL DEFAULT 'AVAILABLE',
    FOREIGN KEY (truck_id) REFERENCES trucks(id)
);

CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    truck_id BIGINT NOT NULL,
    service_date DATE,
    description VARCHAR(255),
    cost DECIMAL(10,2),
    FOREIGN KEY (truck_id) REFERENCES trucks(id)
);

CREATE TABLE IF NOT EXISTS trips (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    truck_id BIGINT NOT NULL,
    driver_id BIGINT,                   -- nullable: trips auto-created on booking acceptance have no driver yet
    shipment_id BIGINT,                 -- references courier_db.shipments.id (app-level FK)
    start_time DATETIME,
    end_time DATETIME,
    status ENUM('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    FOREIGN KEY (truck_id) REFERENCES trucks(id),
    FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

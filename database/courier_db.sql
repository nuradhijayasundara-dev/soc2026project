-- courier_db: owned by courier-service (Member 2)
CREATE DATABASE IF NOT EXISTS courier_db;
USE courier_db;

CREATE TABLE IF NOT EXISTS courier_companies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,            -- references auth_db.users.id
    company_name VARCHAR(150) NOT NULL,
    registration_no VARCHAR(50),
    contact_phone VARCHAR(20),
    address VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courier_branches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    courier_company_id BIGINT NOT NULL,
    branch_name VARCHAR(150),
    city VARCHAR(100),
    address VARCHAR(255),
    FOREIGN KEY (courier_company_id) REFERENCES courier_companies(id)
);

CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    courier_company_id BIGINT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    FOREIGN KEY (courier_company_id) REFERENCES courier_companies(id)
);

CREATE TABLE IF NOT EXISTS receivers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS shipments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_code VARCHAR(20) NOT NULL UNIQUE,   -- e.g. SHP-0001
    customer_id BIGINT NOT NULL,
    receiver_id BIGINT NOT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    pickup_datetime DATETIME NOT NULL,
    destination VARCHAR(255) NOT NULL,
    delivery_deadline DATE,
    weight_kg DECIMAL(8,2),
    dimensions VARCHAR(50),
    parcel_type VARCHAR(50),
    remarks VARCHAR(255),
    status ENUM('PENDING','MATCHED','IN_TRANSIT','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    estimated_cost DECIMAL(10,2),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (receiver_id) REFERENCES receivers(id)
);

CREATE TABLE IF NOT EXISTS shipment_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_id BIGINT NOT NULL,
    item_name VARCHAR(150),
    quantity INT DEFAULT 1,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id)
);

CREATE TABLE IF NOT EXISTS shipment_tracking (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shipment_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id)
);

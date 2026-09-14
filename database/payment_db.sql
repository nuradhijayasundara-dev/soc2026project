-- payment_db: owned by payment-service (Member 1)
CREATE DATABASE IF NOT EXISTS payment_db;
USE payment_db;

CREATE TABLE IF NOT EXISTS invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_no VARCHAR(20) NOT NULL UNIQUE,     -- e.g. INV-0001
    shipment_id BIGINT NOT NULL,                -- references courier_db.shipments.id
    match_result_id BIGINT,                     -- references matching_db.match_results.id
    courier_user_id BIGINT NOT NULL,            -- references auth_db.users.id (who owes this)
    fleet_company_id BIGINT NOT NULL,           -- references fleet_db.fleet_companies.id (who earns this)
    truck_no VARCHAR(20),
    distance_km DOUBLE,
    weight_kg DECIMAL(8,2),
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('PENDING','PAID','FAILED') NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    INDEX idx_courier (courier_user_id),
    INDEX idx_fleet_company (fleet_company_id)
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    method ENUM('CARD','BANK_TRANSFER','CASH') NOT NULL,
    status ENUM('SUCCESS','FAILED') NOT NULL,
    transaction_ref VARCHAR(50),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

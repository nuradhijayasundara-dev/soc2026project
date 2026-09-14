-- auth_db: owned by auth-service / user-service (Member 1)
CREATE DATABASE IF NOT EXISTS auth_db;
USE auth_db;

-- Unifying all accounts under one role enum (see User.Role in auth-service):
-- COURIER_OPERATOR was the old name; it now maps to COURIER_USER (canonical).
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN','COURIER_USER','COURIER_OPERATOR','FLEET_MANAGER','DRIVER') NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    success BOOLEAN NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token_id VARCHAR(255) NOT NULL,
    issued_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- user_db (Spring Boot auto-creates via ddl-auto=update, kept here for reference/manual setup)
CREATE DATABASE IF NOT EXISTS user_db;
USE user_db;

CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,     -- references auth_db.users.id (app-level FK only)
    full_name VARCHAR(100),
    phone VARCHAR(20),
    company_name VARCHAR(150),
    address VARCHAR(255),
    city VARCHAR(100)
);

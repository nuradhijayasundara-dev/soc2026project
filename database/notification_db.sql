-- notification_db: owned by notification-service
CREATE DATABASE IF NOT EXISTS notification_db;
USE notification_db;

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,          -- references auth_db.users.id
    type ENUM('MATCH_FOUND','BOOKING_REQUESTED','BOOKING_ACCEPTED','BOOKING_REJECTED','SHIPMENT_STATUS') NOT NULL,
    title VARCHAR(150) NOT NULL,
    message VARCHAR(500) NOT NULL,
    reference_id BIGINT,              -- shipment id / match request id, depending on `type`
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_created (user_id, created_at)
);

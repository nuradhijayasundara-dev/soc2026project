package com.backhaulmatch.notification.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // References auth_db.users.id — who should see this in-app.
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    // Loosely-typed pointer back to the thing this notification is about
    // (a shipment id, a match request id, ...) — the frontend decides where
    // to link based on `type`.
    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public enum Type {
        MATCH_FOUND, BOOKING_REQUESTED, BOOKING_ACCEPTED, BOOKING_REJECTED, SHIPMENT_STATUS,

        // Admin Portal's Notification Management "send" action — a direct
        // message from a platform admin to one user, distinct from the
        // system-generated types above.
        ADMIN_MESSAGE
    }
}

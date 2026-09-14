package com.backhaulmatch.auth.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password; // BCrypt-hashed, never store plain text

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public enum Role {
        ADMIN, COURIER_USER, FLEET_MANAGER, DRIVER,

        // Legacy alias retained so pre-migration rows (auth_db stored
        // 'COURIER_OPERATOR') still read from the DB without a crash. All
        // new registrations persist the canonical COURIER_USER value.
        COURIER_OPERATOR;

        /** Canonical portal role used in JWTs; maps the legacy value onto its replacement. */
        public String portalName() {
            return this == COURIER_OPERATOR ? COURIER_USER.name() : this.name();
        }

        public static Role from(String raw) {
            String value = raw == null ? "" : raw.trim().toUpperCase();
            if (value.equals("COURIER_OPERATOR")) {
                return COURIER_USER;
            }
            return valueOf(value);
        }
    }
}

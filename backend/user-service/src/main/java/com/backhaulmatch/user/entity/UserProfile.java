package com.backhaulmatch.user.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "user_profiles")
@Data
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // References auth_db.users.id — no cross-DB foreign key, validated via Auth API/JWT.
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    private String fullName;
    private String phone;
    private String companyName; // for Courier/Fleet operators
    private String address;
    private String city;
}

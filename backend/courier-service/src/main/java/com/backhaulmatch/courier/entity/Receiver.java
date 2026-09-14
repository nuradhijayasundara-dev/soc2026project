package com.backhaulmatch.courier.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "receivers")
@Data
public class Receiver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    private String phone;
    private String address;
}

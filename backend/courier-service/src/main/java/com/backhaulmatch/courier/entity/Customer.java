package com.backhaulmatch.courier.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "customers")
@Data
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "courier_company_id", nullable = false)
    private Long courierCompanyId;

    @Column(nullable = false)
    private String fullName;

    private String phone;
    private String email;
}

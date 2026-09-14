package com.backhaulmatch.fleet.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Table(name = "trucks")
@Data
public class Truck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fleet_company_id", nullable = false)
    private Long fleetCompanyId;

    @Column(name = "truck_no", nullable = false, unique = true)
    private String truckNo; // e.g. WP-AB-1234

    @Column(name = "capacity_ton", nullable = false)
    private BigDecimal capacityTon;

    private String truckType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.AVAILABLE;

    public enum Status {
        AVAILABLE, ON_TRIP, MAINTENANCE
    }
}

package com.backhaulmatch.fleet.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "truck_availability")
@Data
public class TruckAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "truck_id", nullable = false)
    private Long truckId;

    @Column(name = "route_from", nullable = false)
    private String routeFrom;

    private Double routeFromLat;
    private Double routeFromLng;

    @Column(name = "route_to", nullable = false)
    private String routeTo;

    private Double routeToLat;
    private Double routeToLng;

    @Column(name = "available_from", nullable = false)
    private LocalDateTime availableFrom;

    @Column(name = "available_capacity_ton", nullable = false)
    private BigDecimal availableCapacityTon;

    // Most postings on this platform ARE backhaul (empty return leg) — this flag
    // just makes that explicit for reporting/filtering, and defaults accordingly.
    @Enumerated(EnumType.STRING)
    @Column(name = "trip_type", nullable = false)
    private TripType tripType = TripType.BACKHAUL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.AVAILABLE;

    public enum TripType {
        OUTBOUND, BACKHAUL
    }

    public enum Status {
        AVAILABLE, BOOKED, EXPIRED
    }
}

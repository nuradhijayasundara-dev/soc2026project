package com.backhaulmatch.fleet.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "trips")
@Data
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "truck_id", nullable = false)
    private Long truckId;

    @Column(name = "driver_id")
    private Long driverId;

    // References courier_db.shipments.id — validated via a call to courier-service, not a DB FK.
    @Column(name = "shipment_id")
    private Long shipmentId;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.SCHEDULED;

    public enum Status {
        SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    }
}

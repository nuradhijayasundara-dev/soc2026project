package com.backhaulmatch.gps.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/** Current position of each truck — one row per truckId, overwritten on every ping. */
@Entity
@Table(name = "live_gps_locations")
@Data
public class LiveGpsLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "truck_id", nullable = false, unique = true)
    private Long truckId;

    @Column(name = "driver_id")
    private Long driverId;

    @Column(name = "trip_id")
    private Long tripId;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private Double speedKmh;
    private Double heading;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}

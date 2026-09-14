package com.backhaulmatch.gps.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/** Append-only history — every ping ever received, used to draw the route a truck took. */
@Entity
@Table(name = "gps_tracking_history")
@Data
public class GpsTrackingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "truck_id", nullable = false)
    private Long truckId;

    @Column(name = "trip_id")
    private Long tripId;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private Double speedKmh;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;
}

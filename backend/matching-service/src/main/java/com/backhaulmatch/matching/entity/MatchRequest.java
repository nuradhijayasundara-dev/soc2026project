package com.backhaulmatch.matching.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** One row per "find me a truck for this shipment" request from the Courier Portal. */
@Entity
@Table(name = "match_requests")
@Data
public class MatchRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // References courier_db.shipments.id — validated via courier-service at creation time.
    @Column(name = "shipment_id", nullable = false)
    private Long shipmentId;

    @Column(name = "requested_by_user_id", nullable = false)
    private Long requestedByUserId;

    // Snapshot of the shipment at request time, so matching logic doesn't need
    // to re-call courier-service for every comparison.
    @Column(nullable = false)
    private String pickupLocation;

    @Column(nullable = false)
    private String destination;

    // Snapshot coordinates so scoring can use real OSRM driving routes without
    // re-calling courier-service (null-safe: falls back to the Places lookup).
    private Double pickupLat;
    private Double pickupLng;
    private Double destinationLat;
    private Double destinationLng;

    // Snapshot of the shipment's pickup window — used by the Time facet.
    private LocalDateTime pickupDatetime;

    private String requiredVehicleType;

    private BigDecimal weightKg;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public enum Status {
        PENDING,             // request created, results generated, awaiting selection
        MATCHED,             // a result has been selected
        WAITING_FOR_MATCH,   // matching ran (or re-ran) and found nothing suitable *right now* —
                              // never permanent: the scheduled sweep in MatchingService keeps
                              // retrying as new fleet availability is published, and the courier
                              // is notified the moment a suitable vehicle turns up.
        NO_MATCH,            // deprecated — kept only so historical rows still deserialize;
                              // no code path sets this anymore, see WAITING_FOR_MATCH.
        CANCELLED
    }
}

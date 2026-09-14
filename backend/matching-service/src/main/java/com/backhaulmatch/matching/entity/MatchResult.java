package com.backhaulmatch.matching.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** One row per candidate truck the Matching Engine found for a MatchRequest. */
@Entity
@Table(name = "match_results")
@Data
public class MatchResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_request_id", nullable = false)
    private Long matchRequestId;

    // References fleet_db.truck_availability.id / trucks.id — resolved via fleet-service.
    @Column(name = "truck_availability_id", nullable = false)
    private Long truckAvailabilityId;

    @Column(name = "truck_id", nullable = false)
    private Long truckId;

    @Column(name = "fleet_company_id", nullable = false)
    private Long fleetCompanyId;

    // Denormalized fields so the Courier Portal's results screen doesn't need
    // a second round-trip to fleet-service to render the list.
    private String truckNo;
    private String truckType;
    private BigDecimal availableCapacityTon;
    private String routeFrom;
    private String routeTo;

    // Truck's posted route coordinates (from fleet availability), denormalized
    // so the Courier Portal can draw the truck's route line against the
    // shipment's own line and show the overlap/route maps.
    private Double routeFromLat;
    private Double routeFromLng;
    private Double routeToLat;
    private Double routeToLng;

    // Road-network deviation between the shipment's actual route and this truck's
    // posted route (OSRM legs: truck start -> pickup, truck end -> destination).
    // 0 = the posted route exactly covers the shipment's. Used to reject any
    // candidate beyond MAX_ROUTE_DEVIATION_KM and as a scoring input.
    private Double distanceKm;

    private BigDecimal estimatedCost;

    // 0-100, HIGHER = better fit. Weighted combination of the five OSRM-backed
    // facets below — see MatchingService for the exact weights.
    private Double matchScore;

    // OSRM-backed scoring facets (each 0-100, higher = better). Kept as their
    // own columns so the frontend can render a score breakdown and reports can
    // reason about what drives decisions, not just the combined number.
    private Double routeScore;
    private Double capacityScore;
    private Double proximityScore;
    private Double timeScore;
    private Double vehicleScore;

    // Shipment's own OSRM route, denormalized for the "Ranked Match Results"
    // screen so each card can show driving distance + duration without asking
    // courier-service again.
    private Double routeDistanceKm;
    private Double routeDurationMin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.RECOMMENDED;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public enum Status {
        RECOMMENDED,          // matching engine's suggestion, not yet acted on
        PENDING_CONFIRMATION, // courier clicked "Accept Match" — capacity reserved, waiting on the fleet manager
        ACCEPTED,              // fleet manager accepted — this is the booking
        REJECTED               // fleet manager declined, or auto-rejected as a sibling of an accepted one
    }
}

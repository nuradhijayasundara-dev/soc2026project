package com.backhaulmatch.matching.dto;

import jakarta.validation.constraints.NotNull;

public class MatchingDtos {

    // Courier Portal's "Request Backhaul Transport" button posts this.
    public record CreateMatchRequestDto(
            @NotNull Long shipmentId
    ) {}

    // Raw shape we read back from fleet-service's availability search — kept
    // minimal since we only need a few fields for scoring + display.
    public record AvailabilityCandidate(
            Long id,          // truck_availability.id
            Long truckId,
            Long fleetCompanyId,
            String truckNo,
            String truckType,
            String routeFrom,
            String routeTo,
            Double routeFromLat,
            Double routeFromLng,
            Double routeToLat,
            Double routeToLng,
            String availableFrom, // ISO string
            java.math.BigDecimal availableCapacityTon
    ) {}
}

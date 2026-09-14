package com.backhaulmatch.gps.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public class GpsDtos {

    // Sent by the Driver App every few seconds while a trip is active.
    public record LocationUpdateRequest(
            @NotNull Long truckId,
            Long driverId,
            Long tripId,
            @NotNull Double latitude,
            @NotNull Double longitude,
            Double speedKmh,
            Double heading
    ) {}

    // Used by the Fleet Portal's map to fetch many trucks' live positions in one call.
    public record LiveLocationsRequest(
            List<Long> truckIds // null/empty = all trucks
    ) {}
}

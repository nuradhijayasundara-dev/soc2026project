package com.backhaulmatch.fleet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class FleetDtos {

    public record CompanyRequest(
            @NotBlank String companyName,
            String registrationNo,
            String contactPhone,
            String address
    ) {}

    public record TruckRequest(
            @NotBlank String truckNo,
            @NotNull BigDecimal capacityTon,
            String truckType
    ) {}

    public record DriverRequest(
            @NotBlank String fullName,
            String phone,
            String licenseNo,
            Long userId // optional: link to the driver's auth account (role DRIVER) up front
    ) {}

    // Lightweight proof-of-identity for self-service account linking: the caller must
    // know the phone number the fleet manager registered on the driver record.
    public record LinkAccountRequest(@NotBlank String phone) {}

    public record AvailabilityRequest(
            @NotBlank String routeFrom,
            @NotBlank String routeTo,
            @NotNull LocalDateTime availableFrom,
            @NotNull BigDecimal availableCapacityTon,
            String tripType // "OUTBOUND" | "BACKHAUL", defaults to BACKHAUL if omitted
    ) {}

    // "Post Backhaul Availability" quick-add form (fleet-portal /availability page) —
    // lets a fleet manager pick which truck without navigating into its details page first.
    public record QuickAvailabilityRequest(
            @NotNull Long truckId,
            @NotBlank String routeFrom,
            Double routeFromLat,  // from the portal's map picker (OSM); optional, falls back to the place lookup
            Double routeFromLng,
            @NotBlank String returnDestination, // routeTo, named for the backhaul UI
            Double routeToLat,
            Double routeToLng,
            @NotNull LocalDateTime availableFrom,
            @NotNull BigDecimal availableCapacityTon
    ) {}

    // Cross-company search result shape — this is what matching-service's
    // FleetServiceClient deserializes, so field names must match exactly.
    public record AvailabilityCandidateResponse(
            Long id,
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
            LocalDateTime availableFrom,
            BigDecimal availableCapacityTon
    ) {}

    public record CapacityVerificationResponse(
            boolean valid,
            BigDecimal availableCapacityTon,
            String reason // null when valid
    ) {}

    // "Fleet Reports" — total trips, used capacity (backhaul revenue comes from
    // payment-service's /revenue/summary, called separately by the frontend).
    public record FleetReportSummary(
            long totalTrips,
            BigDecimal usedCapacityTon
    ) {}

    public record DashboardSummary(
            long trucksOnline,
            BigDecimal availableCapacityTon,
            long activeBookings
    ) {}
}

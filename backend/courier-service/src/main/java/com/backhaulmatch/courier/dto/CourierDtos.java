package com.backhaulmatch.courier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class CourierDtos {

    public record CompanyRequest(
            @NotBlank String companyName,
            String registrationNo,
            String contactPhone,
            String address
    ) {}

    public record CustomerRequest(
            @NotBlank String fullName,
            String phone,
            String email
    ) {}

    public record ReceiverRequest(
            @NotBlank String fullName,
            String phone,
            String address
    ) {}

    // Used when creating a shipment: either pass an existing customerId, or
    // inline "newCustomer" details and inline "receiver" details in one call —
    // matches the "New Shipment Request" form in the interface map (pickup/delivery/parcel).
    public record CreateShipmentRequest(
            Long customerId,
            CustomerRequest newCustomer,
            @NotNull ReceiverRequest receiver,
            @NotBlank String pickupLocation,
            Double pickupLat,  // from the portal's map picker (OSM); optional, falls back to the place lookup
            Double pickupLng,
            @NotNull LocalDateTime pickupDatetime,
            @NotBlank String destination,
            Double destinationLat,
            Double destinationLng,
            String requiredVehicleType,
            LocalDate deliveryDeadline,
            BigDecimal weightKg,
            String dimensions,
            String parcelType,
            String remarks,
            String priority // STANDARD | EXPRESS | URGENT — defaults to STANDARD if blank/omitted
    ) {}

    public record StatusUpdateRequest(
            @NotBlank String status, // PENDING | MATCHED | IN_TRANSIT | DELIVERED | CANCELLED
            String location
    ) {}

    public record DashboardSummary(
            long totalRequests,
            long matchedShipments,
            long inTransit,
            long delivered
    ) {}

    // "Courier Reports": total shipments, successful matches, cost savings.
    // Shipment counts are this service's own SQL COUNT queries; the other two
    // figures are fetched from matching-service and payment-service, each
    // computed there the same way (SQL aggregates, no shared report table).
    public record CourierReportSummary(
            long totalShipments,
            long deliveredShipments,
            long cancelledShipments,
            long successfulMatches,
            java.math.BigDecimal costSavings
    ) {}
}

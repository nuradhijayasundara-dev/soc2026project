package com.backhaulmatch.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class PaymentDtos {

    // Called internally by matching-service the instant a booking is accepted.
    public record CreateInvoiceRequest(
            @NotNull Long shipmentId,
            Long matchResultId,
            @NotNull Long courierUserId,
            @NotNull Long fleetCompanyId,
            String truckNo,
            Double distanceKm,
            BigDecimal weightKg
    ) {}

    // "Payment API" — courier pays an invoice (simulated, no real gateway).
    public record PayInvoiceRequest(
            @NotBlank String method // CARD | BANK_TRANSFER | CASH
    ) {}

    // Pre-booking "Price Estimation" step (spec section 2) — called from the
    // Create Shipment form, before any vehicle is selected. Every field is
    // optional except nothing is strictly required: a partial form (e.g. no
    // dimensions yet) should still return a usable ballpark, not an error.
    public record PriceEstimateRequest(
            Double distanceKm,
            BigDecimal weightKg,
            String dimensions,   // free-text "L x W x H" in cm, e.g. "120 x 80 x 100"; parsed if possible
            String vehicleType,  // e.g. "Box Truck", "Lorry", "Light Truck", "Container Truck"
            String priority      // STANDARD | EXPRESS | URGENT
    ) {}

    // Full breakdown so the UI can show more than just the bottom line if it wants to,
    // while "estimatedPrice" alone is enough for the simple "Estimated Price: LKR X" label.
    public record PriceEstimateResponse(
            BigDecimal baseFare,
            BigDecimal distanceCharge,
            BigDecimal weightCharge,
            BigDecimal volumeCharge,
            BigDecimal subtotal,
            double priorityMultiplier,
            double backhaulDiscountPercent,
            BigDecimal backhaulDiscountAmount,
            BigDecimal estimatedPrice
    ) {}

    // "Courier Reports" — cost savings piece. Reused by courier-service's report endpoint.
    public record CourierCostSummaryResponse(
            long paidInvoiceCount,
            BigDecimal totalSpent,
            BigDecimal costSavings
    ) {}

    // "Fleet revenue display" / "booking revenue dashboard"
    public record RevenueSummaryResponse(
            long totalBookings,
            long paidBookings,
            long pendingBookings,
            BigDecimal totalRevenue,   // sum of PAID invoices
            BigDecimal pendingRevenue  // sum of PENDING invoices
    ) {}

    // Admin Portal's Payment Management page — platform-wide, not scoped to
    // one fleet company. Same shape as RevenueSummaryResponse plus failedInvoices,
    // since an admin (unlike a fleet manager) needs visibility into failures too.
    public record PlatformRevenueSummaryResponse(
            long totalInvoices,
            long paidInvoices,
            long pendingInvoices,
            long failedInvoices,
            BigDecimal totalRevenue,   // sum of PAID invoices
            BigDecimal pendingRevenue  // sum of PENDING invoices
    ) {}
}

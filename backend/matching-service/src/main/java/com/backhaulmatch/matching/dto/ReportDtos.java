package com.backhaulmatch.matching.dto;

import java.math.BigDecimal;

public class ReportDtos {

    // "Courier Reports" — successful matches piece, fed into courier-service's combined report.
    public record CourierMatchSummaryResponse(
            long successfulMatches
    ) {}

    // "Platform Reports" — total matches, successful bookings, total capacity utilized.
    public record PlatformSummaryResponse(
            long totalMatches,
            long successfulBookings,
            BigDecimal totalCapacityUtilizedTon
    ) {}
}

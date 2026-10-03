package com.backhaulmatch.matching.controller;

import com.backhaulmatch.matching.dto.ReportDtos.CourierMatchSummaryResponse;
import com.backhaulmatch.matching.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Called directly by courier-service (Eureka name, not through the Gateway)
 * when it assembles the combined "Courier Reports" page. Deliberately mounted
 * OUTSIDE /api/matching/** so the Gateway's matching-service route can never
 * proxy an authenticated user's request to it with an arbitrary courierUserId
 * — the Gateway has no route predicate for this path, so it 404s there.
 */
@RestController
@RequestMapping("/internal/reports")
@RequiredArgsConstructor
public class InternalReportController {

    private final ReportService reportService;

    @GetMapping("/courier-summary")
    public ResponseEntity<CourierMatchSummaryResponse> courierSummary(@RequestParam Long courierUserId) {
        return ResponseEntity.ok(reportService.getCourierMatchSummary(courierUserId));
    }
}

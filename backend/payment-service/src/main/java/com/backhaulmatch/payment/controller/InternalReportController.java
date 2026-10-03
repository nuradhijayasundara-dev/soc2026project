package com.backhaulmatch.payment.controller;

import com.backhaulmatch.payment.dto.PaymentDtos.CourierCostSummaryResponse;
import com.backhaulmatch.payment.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Called directly by courier-service (Eureka name, not through the Gateway)
 * when it assembles its own "Courier Reports" page. Deliberately mounted
 * OUTSIDE /api/payment/** so the Gateway's payment-service route can never
 * proxy an authenticated user's request to it with an arbitrary courierUserId
 * — the Gateway has no route predicate for this path, so it 404s there.
 */
@RestController
@RequestMapping("/internal/reports")
@RequiredArgsConstructor
public class InternalReportController {

    private final InvoiceService invoiceService;

    @GetMapping("/courier-summary")
    public ResponseEntity<CourierCostSummaryResponse> courierCostSummary(@RequestParam Long courierUserId) {
        return ResponseEntity.ok(invoiceService.getCourierCostSummary(courierUserId));
    }
}

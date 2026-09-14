package com.backhaulmatch.payment.controller;

import com.backhaulmatch.payment.dto.PaymentDtos.PlatformRevenueSummaryResponse;
import com.backhaulmatch.payment.entity.Invoice;
import com.backhaulmatch.payment.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only, read-only view over payment-service's own data ("Payment
 * Management" in the Admin Portal). The API Gateway protects
 * /api/payment/admin/** with allowedRoles: "ADMIN" ahead of the generic
 * /api/payment/** route (see api-gateway/application.yml).
 *
 * Deliberately does NOT expose a way to directly mutate invoices/payments —
 * an admin observes payment state through this API; the actual pay/refund
 * business logic stays owned by InvoiceService exactly as it is today (per
 * "Do NOT directly access payment_db" / "Do not place business logic inside
 * the Admin frontend").
 */
@RestController
@RequestMapping("/api/payment/admin")
@RequiredArgsConstructor
public class PaymentAdminController {

    private final InvoiceService invoiceService;

    @GetMapping("/invoices")
    public ResponseEntity<List<Invoice>> listInvoices() {
        return ResponseEntity.ok(invoiceService.listAll());
    }

    @GetMapping("/revenue-summary")
    public ResponseEntity<PlatformRevenueSummaryResponse> revenueSummary() {
        return ResponseEntity.ok(invoiceService.getPlatformRevenueSummary());
    }
}

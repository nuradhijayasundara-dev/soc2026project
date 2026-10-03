package com.backhaulmatch.payment.controller;

import com.backhaulmatch.payment.client.FleetServiceClient;
import com.backhaulmatch.payment.dto.PaymentDtos.*;
import com.backhaulmatch.payment.entity.Invoice;
import com.backhaulmatch.payment.entity.Payment;
import com.backhaulmatch.payment.service.InvoiceService;
import com.backhaulmatch.payment.service.PricingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final FleetServiceClient fleetServiceClient;
    private final PricingService pricingService;

    // Pre-booking "Price Estimation" (spec section 2) — Create Shipment form calls this
    // once pickup/destination/route are known, before any vehicle is selected. Pure
    // calculation, no persistence — safe to call on every form keystroke/debounce tick.
    @PostMapping("/pricing/estimate")
    public ResponseEntity<PriceEstimateResponse> estimate(@Valid @RequestBody PriceEstimateRequest request) {
        return ResponseEntity.ok(pricingService.calculateEstimate(request));
    }

    // Called directly by matching-service (Eureka name, not through the Gateway)
    // the instant a fleet manager accepts a booking.
    @PostMapping("/invoices/internal")
    public ResponseEntity<Invoice> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        return ResponseEntity.ok(invoiceService.createInvoice(request));
    }

    // Courier Portal's "Invoices" page — cost display + payment status
    @GetMapping("/invoices/mine")
    public ResponseEntity<List<Invoice>> myInvoices(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(invoiceService.listForCourier(userId));
    }

    @GetMapping("/invoices/{id}")
    public ResponseEntity<Invoice> getInvoice(@PathVariable Long id,
                                               @RequestHeader("X-User-Id") Long userId,
                                               @RequestHeader(value = "X-User-Role", required = false) String role) {
        Long companyId = callerFleetCompanyId(userId, role);
        return ResponseEntity.ok(invoiceService.getForCaller(id, userId, companyId, role));
    }

    @GetMapping("/invoices/{id}/payments")
    public ResponseEntity<List<Payment>> getPaymentHistory(@PathVariable Long id,
                                                             @RequestHeader("X-User-Id") Long userId,
                                                             @RequestHeader(value = "X-User-Role", required = false) String role) {
        Long companyId = callerFleetCompanyId(userId, role);
        return ResponseEntity.ok(invoiceService.getPaymentHistory(id, userId, companyId, role));
    }

    // Payment API — courier pays an invoice (simulated)
    @PostMapping("/invoices/{id}/pay")
    public ResponseEntity<Payment> pay(@PathVariable Long id, @Valid @RequestBody PayInvoiceRequest request,
                                        @RequestHeader("X-User-Id") Long userId,
                                        @RequestHeader(value = "X-User-Role", required = false) String role) {
        Long companyId = callerFleetCompanyId(userId, role);
        return ResponseEntity.ok(invoiceService.payInvoice(id, userId, companyId, role, request));
    }

    // Resolves the caller's fleet company only when it's actually possible (FLEET_MANAGER
    // callers own a company; COURIER_USER/ADMIN callers don't, and courier-service's own
    // resolveCompanyId-style lookup would 404 for them).
    private Long callerFleetCompanyId(Long userId, String role) {
        if (!"FLEET_MANAGER".equalsIgnoreCase(role)) {
            return null;
        }
        return fleetServiceClient.getCompanyIdForUser(userId);
    }

    // Fleet Portal's "booking revenue dashboard" — every invoice earned by this fleet company
    @GetMapping("/invoices/fleet/mine")
    public ResponseEntity<List<Invoice>> fleetInvoices(@RequestHeader("X-User-Id") Long userId) {
        Long companyId = fleetServiceClient.getCompanyIdForUser(userId);
        return ResponseEntity.ok(invoiceService.listForFleetCompany(companyId));
    }

    // "Fleet revenue display" — the summary cards at the top of that dashboard
    @GetMapping("/revenue/summary")
    public ResponseEntity<RevenueSummaryResponse> revenueSummary(@RequestHeader("X-User-Id") Long userId) {
        Long companyId = fleetServiceClient.getCompanyIdForUser(userId);
        return ResponseEntity.ok(invoiceService.getRevenueSummary(companyId));
    }
}

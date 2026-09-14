package com.backhaulmatch.matching.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Fires invoice creation directly at payment-service (Eureka name) the instant
 * a booking is accepted — "Booking Created" now also means "an invoice exists
 * to pay." Failures here are logged but swallowed: a missing invoice
 * shouldn't roll back an otherwise-successful booking acceptance; it's
 * something staff can create manually if this ever actually fails.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceClient {

    private final RestTemplate restTemplate;
    private static final String CREATE_INVOICE_URL = "http://PAYMENT-SERVICE/api/payment/invoices/internal";

    public void createInvoice(Long shipmentId, Long matchResultId, Long courierUserId, Long fleetCompanyId,
                               String truckNo, Double distanceKm, BigDecimal weightKg) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("shipmentId", shipmentId);
            body.put("matchResultId", matchResultId);
            body.put("courierUserId", courierUserId);
            body.put("fleetCompanyId", fleetCompanyId);
            body.put("truckNo", truckNo);
            body.put("distanceKm", distanceKm);
            body.put("weightKg", weightKg);
            restTemplate.postForObject(CREATE_INVOICE_URL, body, Void.class);
        } catch (Exception e) {
            log.warn("Could not create invoice for shipment {}: {}", shipmentId, e.getMessage());
        }
    }
}

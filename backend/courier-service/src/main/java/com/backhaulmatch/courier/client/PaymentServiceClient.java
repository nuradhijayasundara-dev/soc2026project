package com.backhaulmatch.courier.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.Map;

/** Calls payment-service directly (Eureka name) — the Pricing Service for this platform. */
@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceClient {

    private final RestTemplate restTemplate;
    private static final String COST_SUMMARY_URL = "http://PAYMENT-SERVICE/api/payment/reports/courier-summary";
    private static final String ESTIMATE_URL = "http://PAYMENT-SERVICE/api/payment/pricing/estimate";

    public BigDecimal getCostSavings(Long courierUserId) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(COST_SUMMARY_URL)
                    .queryParam("courierUserId", courierUserId)
                    .toUriString();
            Map<String, Object> result = restTemplate.getForObject(url, Map.class);
            return result == null ? BigDecimal.ZERO : new BigDecimal(result.get("costSavings").toString());
        } catch (Exception e) {
            log.warn("Could not fetch cost summary for user {}: {}", courierUserId, e.getMessage());
            return BigDecimal.ZERO;
        }
    }

    /**
     * Delegates the shipment's price estimate to payment-service (the Pricing
     * Service) so pricing logic lives in exactly one place. Returns null on
     * any failure — the caller falls back to a local estimate rather than
     * blocking shipment creation on payment-service being reachable.
     */
    @SuppressWarnings("unchecked")
    public BigDecimal getPriceEstimate(Double distanceKm, BigDecimal weightKg, String dimensions,
                                        String vehicleType, String priority) {
        try {
            Map<String, Object> body = new java.util.HashMap<>();
            body.put("distanceKm", distanceKm);
            body.put("weightKg", weightKg);
            body.put("dimensions", dimensions);
            body.put("vehicleType", vehicleType);
            body.put("priority", priority);
            Map<String, Object> result = restTemplate.postForObject(ESTIMATE_URL, body, Map.class);
            return result == null ? null : new BigDecimal(result.get("estimatedPrice").toString());
        } catch (Exception e) {
            log.warn("Could not reach payment-service for a price estimate: {}", e.getMessage());
            return null;
        }
    }
}

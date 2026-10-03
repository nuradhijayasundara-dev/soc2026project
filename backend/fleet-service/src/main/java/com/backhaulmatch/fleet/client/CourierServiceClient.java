package com.backhaulmatch.fleet.client;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Example of direct service-to-service communication (not via the Gateway):
 * fleet-service needs to confirm a shipment exists (and read its weight/route)
 * before creating a Trip against it. It calls courier-service by its Eureka
 * name — "COURIER-SERVICE" — resolved by the @LoadBalanced RestTemplate.
 *
 * Internal service calls like this skip the Gateway's JWT filter entirely,
 * since they happen inside the trusted backend network.
 */
@Component
@RequiredArgsConstructor
public class CourierServiceClient {

    private final RestTemplate restTemplate;

    private static final String COURIER_SERVICE_URL = "http://COURIER-SERVICE/internal/shipments/";

    /** Returns the shipment as a raw map, or throws 404 if courier-service doesn't have it. */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getShipment(Long shipmentId) {
        try {
            return restTemplate.getForObject(COURIER_SERVICE_URL + shipmentId, Map.class);
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Shipment " + shipmentId + " does not exist in courier-service");
        }
    }

    /**
     * "Driver completes delivery" -> shipment becomes DELIVERED. Called from
     * TripService.completeTrip() the instant a Trip is marked COMPLETED, so
     * the courier side reflects delivery without any manual status update.
     * Best-effort: courier-service owns the shipment, so if it's briefly
     * unreachable we don't want to fail the driver's "complete trip" action —
     * log and move on rather than throwing.
     */
    public void updateShipmentStatus(Long shipmentId, String status) {
        if (shipmentId == null) return;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(Map.of("status", status), headers);
            restTemplate.exchange(COURIER_SERVICE_URL + shipmentId + "/status", HttpMethod.PATCH, entity, Void.class);
        } catch (Exception e) {
            // Trip completion already succeeded on the fleet side; don't block
            // the driver on a courier-service hiccup. Worth a proper retry/
            // outbox queue in a production build.
        }
    }
}

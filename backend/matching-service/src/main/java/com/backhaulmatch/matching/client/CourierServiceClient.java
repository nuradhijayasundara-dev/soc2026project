package com.backhaulmatch.matching.client;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * Fetches shipment details directly from courier-service by its Eureka name.
 * Uses the same ownership-checked endpoint the Gateway proxies for browsers —
 * passing the requesting courier's own X-User-Id — so a courier can't request
 * matching for a shipment that isn't theirs (courier-service returns 403).
 */
@Component
@RequiredArgsConstructor
public class CourierServiceClient {

    private final RestTemplate restTemplate;
    private static final String BASE_URL = "http://COURIER-SERVICE/api/courier/shipments/";

    @SuppressWarnings("unchecked")
    public Map<String, Object> getShipment(Long shipmentId, Long courierUserId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-User-Id", String.valueOf(courierUserId));
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            return restTemplate.exchange(BASE_URL + shipmentId, HttpMethod.GET, entity, Map.class).getBody();
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shipment " + shipmentId + " does not exist");
        } catch (HttpClientErrorException.Forbidden e) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This shipment does not belong to you");
        }
    }
}

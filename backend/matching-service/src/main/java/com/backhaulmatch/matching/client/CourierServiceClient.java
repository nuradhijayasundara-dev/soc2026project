package com.backhaulmatch.matching.client;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/** Fetches shipment details directly from courier-service by its Eureka name. */
@Component
@RequiredArgsConstructor
public class CourierServiceClient {

    private final RestTemplate restTemplate;
    private static final String BASE_URL = "http://COURIER-SERVICE/api/courier/shipments/";

    @SuppressWarnings("unchecked")
    public Map<String, Object> getShipment(Long shipmentId) {
        try {
            return restTemplate.getForObject(BASE_URL + shipmentId, Map.class);
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Shipment " + shipmentId + " does not exist");
        }
    }
}

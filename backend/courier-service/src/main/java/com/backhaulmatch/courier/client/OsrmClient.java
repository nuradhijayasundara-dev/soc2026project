package com.backhaulmatch.courier.client;

import com.backhaulmatch.courier.util.Places;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Driving distance + duration via the local OSRM engine (Sri Lanka). Falls back
 * to a great-circle estimate when OSRM is unreachable so shipment creation and
 * price estimation never hard-fail on a flaky network.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OsrmClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String OSRM_URL = "http://osrm:5000";
    private static final double HAVERSINE_DETOUR_FACTOR = 1.3;
    private static final double AVERAGE_SPEED_KMH = 45.0;

    public record Route(Double distanceKm, Double durationMin) {}

    public Route between(Double fromLat, Double fromLng, Double toLat, Double toLng) {
        if (fromLat == null || fromLng == null || toLat == null || toLng == null) return null;
        try {
            String url = UriComponentsBuilder.fromHttpUrl(OSRM_URL + "/route/v1/driving/{flon},{flat};{tlon},{tlat}")
                    .queryParam("overview", "false")
                    .queryParam("alternatives", "false")
                    .buildAndExpand(fromLng, fromLat, toLng, toLat)
                    .toUriString();

            JsonNode root = objectMapper.readTree(restTemplate.getForObject(url, String.class));
            JsonNode route = root.path("routes").path(0);
            if ("Ok".equals(root.path("code").asText()) && !route.isMissingNode()) {
                double distanceMeters = route.path("distance").asDouble();
                if (distanceMeters > 0) {
                    return new Route(
                            Math.round(distanceMeters / 1000.0 * 100.0) / 100.0,
                            Math.round(route.path("duration").asDouble() / 60.0 * 10.0) / 10.0
                    );
                }
            }
            log.warn("OSRM returned no route; falling back to estimate");
        } catch (Exception e) {
            log.debug("OSRM unreachable ({}); using distance estimate", e.getMessage());
        }
        double straightKm = Places.haversineKm(fromLat, fromLng, toLat, toLng);
        return new Route(
                Math.round(straightKm * HAVERSINE_DETOUR_FACTOR * 100.0) / 100.0,
                Math.round(straightKm * HAVERSINE_DETOUR_FACTOR / AVERAGE_SPEED_KMH * 60.0 * 10.0) / 10.0
        );
    }
}
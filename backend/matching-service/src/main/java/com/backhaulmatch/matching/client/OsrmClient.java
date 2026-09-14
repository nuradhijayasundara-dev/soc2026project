package com.backhaulmatch.matching.client;

import com.backhaulmatch.matching.util.Places;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Thin client for the local OSRM routing engine (Sri Lanka). Exposes driving
 * distance/duration between two coordinate pairs through the standard OSRM
 * route HTTP API. Falls back to a great-circle estimate (with a typical road
 * detour factor) whenever OSRM is unreachable — a flaky network, a missing
 * routing container, or coordinates OSRM can't snap to a road — so matching
 * never hard-fails because routing is down.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OsrmClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // "osrm" = the compose service's container name.
    private static final String OSRM_URL = "http://osrm:5000";
    private static final double HAVERSINE_DETOUR_FACTOR = 1.3;
    private static final double AVERAGE_SPEED_KMH = 45.0;

    public record Route(Double distanceKm, Double durationMin) {}

    /** Driving distance (km) + duration (minutes), falling back to an estimate. */
    public Route between(double fromLat, double fromLng, double toLat, double toLng) {
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
            log.debug("OSRM unreachable ({}); falling back to estimate", e.getMessage());
        }
        double straightKm = Places.haversineKm(fromLat, fromLng, toLat, toLng);
        double distanceKm = Math.round(straightKm * HAVERSINE_DETOUR_FACTOR * 100.0) / 100.0;
        double durationMin = Math.round(distanceKm / AVERAGE_SPEED_KMH * 60.0 * 10.0) / 10.0;
        return new Route(distanceKm, durationMin);
    }

    /** Route using names + optional coordinates; returns null if neither is usable. */
    public Route resolve(String fromPlace, Double fromLat, Double fromLng,
                         String toPlace, Double toLat, Double toLng) {
        double[] from = coordsOf(fromPlace, fromLat, fromLng);
        double[] to = coordsOf(toPlace, toLat, toLng);
        if (from == null || to == null) return null;
        return between(from[0], from[1], to[0], to[1]);
    }

    private double[] coordsOf(String place, Double lat, Double lng) {
        if (lat != null && lng != null) return new double[]{lat, lng};
        return Places.coordFor(place);
    }
}
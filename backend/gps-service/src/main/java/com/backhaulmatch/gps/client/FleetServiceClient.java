package com.backhaulmatch.gps.client;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Resolves which truck ids the calling fleet manager actually owns, so the
 * live-location and history endpoints can be scoped to their own fleet
 * company instead of exposing every truck on the platform. Calls
 * fleet-service's own ownership-safe /api/fleet/trucks endpoint by Eureka
 * name, forwarding the caller's already-validated X-User-Id (set by the
 * Gateway on the original request into gps-service).
 */
@Component
@RequiredArgsConstructor
public class FleetServiceClient {

    private final RestTemplate restTemplate;
    private static final String TRUCKS_URL = "http://FLEET-SERVICE/api/fleet/trucks";

    @SuppressWarnings("unchecked")
    public Set<Long> myTruckIds(Long userId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", String.valueOf(userId));
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        List<Map<String, Object>> trucks = restTemplate.exchange(
                TRUCKS_URL, HttpMethod.GET, entity, List.class).getBody();
        if (trucks == null) return Set.of();
        return trucks.stream()
                .map(t -> Long.valueOf(t.get("id").toString()))
                .collect(Collectors.toSet());
    }
}

package com.backhaulmatch.courier.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

/** Calls matching-service directly (Eureka name) for the "successful matches" report figure. */
@Component
@RequiredArgsConstructor
@Slf4j
public class MatchingServiceClient {

    private final RestTemplate restTemplate;
    private static final String URL = "http://MATCHING-SERVICE/api/matching/reports/courier-summary";

    public long getSuccessfulMatchCount(Long courierUserId) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(URL)
                    .queryParam("courierUserId", courierUserId)
                    .toUriString();
            Map<String, Object> result = restTemplate.getForObject(url, Map.class);
            return result == null ? 0 : Long.parseLong(result.get("successfulMatches").toString());
        } catch (Exception e) {
            log.warn("Could not fetch match summary for user {}: {}", courierUserId, e.getMessage());
            return 0;
        }
    }
}

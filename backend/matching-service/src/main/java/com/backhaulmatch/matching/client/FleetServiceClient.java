package com.backhaulmatch.matching.client;

import com.backhaulmatch.matching.dto.MatchingDtos.AvailabilityCandidate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Searches fleet-service's cross-company backhaul availability directly
 * (Eureka name "FLEET-SERVICE") — this is the core input to the capacity
 * matching logic below.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FleetServiceClient {

    private final RestTemplate restTemplate;
    private static final String AVAILABILITY_URL = "http://FLEET-SERVICE/api/fleet/availability/search";
    private static final String COMPANY_ME_URL = "http://FLEET-SERVICE/api/fleet/company/me";
    private static final String COMPANY_BY_ID_URL = "http://FLEET-SERVICE/api/fleet/company/";
    private static final String RESERVE_URL_TEMPLATE = "http://FLEET-SERVICE/api/fleet/availability/%d/reserve";
    private static final String RELEASE_URL_TEMPLATE = "http://FLEET-SERVICE/api/fleet/availability/%d/release";
    private static final String TRIPS_INTERNAL_URL = "http://FLEET-SERVICE/api/fleet/trips/internal";

    public List<AvailabilityCandidate> searchAvailability(String from, String to, BigDecimal minCapacityTon) {
        String url = UriComponentsBuilder.fromHttpUrl(AVAILABILITY_URL)
                .queryParamIfPresent("from", java.util.Optional.ofNullable(from))
                .queryParamIfPresent("to", java.util.Optional.ofNullable(to))
                .queryParam("minCapacityTon", minCapacityTon)
                .toUriString();

        AvailabilityCandidate[] results = restTemplate.getForObject(url, AvailabilityCandidate[].class);
        return results == null ? List.of() : Arrays.asList(results);
    }

    /**
     * fleet-service's /company/me endpoint reads the caller from the "X-User-Id"
     * header — normally supplied by the Gateway's JWT filter. Here we're calling
     * it directly (service-to-service), so we set that header ourselves,
     * forwarding the id matching-service's own controller already validated.
     */
    @SuppressWarnings("unchecked")
    public Long getCompanyIdForUser(Long userId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", String.valueOf(userId));
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        Map<String, Object> company = restTemplate.exchange(
                COMPANY_ME_URL, HttpMethod.GET, entity, Map.class).getBody();
        return company == null ? null : Long.valueOf(company.get("id").toString());
    }

    /** Resolves a fleet company's owning userId — used to notify them of a new booking request. */
    @SuppressWarnings("unchecked")
    public Long getCompanyOwnerUserId(Long fleetCompanyId) {
        Map<String, Object> company = restTemplate.getForObject(COMPANY_BY_ID_URL + fleetCompanyId, Map.class);
        return company == null ? null : Long.valueOf(company.get("userId").toString());
    }

    /**
     * "Truck Capacity Reserved": verifies capacity one more time and, if it
     * still holds, flips the slot to BOOKED — called the instant a courier
     * clicks "Accept Match", before the fleet manager has even seen it.
     * Throws (propagating fleet-service's 409) if the slot was taken in the
     * meantime, so the courier can be told to pick another candidate.
     */
    public void reserveCapacity(Long truckAvailabilityId, BigDecimal requiredTon) {
        String url = UriComponentsBuilder.fromHttpUrl(RESERVE_URL_TEMPLATE.formatted(truckAvailabilityId))
                .queryParam("requiredTon", requiredTon)
                .toUriString();
        restTemplate.patchForObject(url, null, Void.class);
    }

    /** Fleet manager rejected the booking — free the slot back up for other couriers. */
    public void releaseCapacity(Long truckAvailabilityId) {
        String url = RELEASE_URL_TEMPLATE.formatted(truckAvailabilityId);
        restTemplate.patchForObject(url, null, Void.class);
    }

    /**
     * "Fleet receives booking" -> a real Trip. Called the instant a fleet
     * manager accepts a booking — no driver yet, that's assigned separately
     * via the existing Trip list / Driver Assignment screen. Failure here is
     * logged, not thrown: a missing Trip can be created manually by staff,
     * but it shouldn't undo an otherwise-successful booking acceptance.
     */
    public void createTripForBooking(Long truckId, Long shipmentId) {
        try {
            restTemplate.postForObject(TRIPS_INTERNAL_URL, Map.of("truckId", truckId, "shipmentId", shipmentId), Void.class);
        } catch (Exception e) {
            log.warn("Could not auto-create trip for shipment {} on truck {}: {}", shipmentId, truckId, e.getMessage());
        }
    }
}

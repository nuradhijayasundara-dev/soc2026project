package com.backhaulmatch.payment.client;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Resolves a fleet manager's own company id — the "booking revenue dashboard"
 * page needs to know which invoices belong to the logged-in fleet manager's
 * company, the same way fleet-service's own /trips endpoint does.
 */
@Component
@RequiredArgsConstructor
public class FleetServiceClient {

    private final RestTemplate restTemplate;
    private static final String COMPANY_ME_URL = "http://FLEET-SERVICE/api/fleet/company/me";

    @SuppressWarnings("unchecked")
    public Long getCompanyIdForUser(Long userId) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-User-Id", String.valueOf(userId));
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        Map<String, Object> company = restTemplate.exchange(
                COMPANY_ME_URL, HttpMethod.GET, entity, Map.class).getBody();
        return company == null ? null : Long.valueOf(company.get("id").toString());
    }
}

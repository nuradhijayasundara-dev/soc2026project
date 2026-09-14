package com.backhaulmatch.notification.client;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Only used when notification.email.enabled=true. Calls auth-service's
 * internal (unauthenticated, service-to-service) endpoint directly by its
 * Eureka name to resolve a user id to an email address before sending mail.
 */
@Component
@RequiredArgsConstructor
public class AuthServiceClient {

    private final RestTemplate restTemplate;
    private static final String BASE_URL = "http://AUTH-SERVICE/api/auth/internal/users/";

    @SuppressWarnings("unchecked")
    public String getEmail(Long userId) {
        try {
            Map<String, Object> user = restTemplate.getForObject(BASE_URL + userId, Map.class);
            return user == null ? null : (String) user.get("email");
        } catch (Exception e) {
            return null; // don't let a broken email lookup block the in-app notification
        }
    }
}

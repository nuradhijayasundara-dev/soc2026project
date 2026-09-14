package com.backhaulmatch.courier.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/** Fires in-app notifications by calling notification-service directly (Eureka name). */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationClient {

    private final RestTemplate restTemplate;
    private static final String URL = "http://NOTIFICATION-SERVICE/api/notifications/internal";

    public void notify(Long userId, String type, String title, String message, Long referenceId) {
        try {
            restTemplate.postForObject(URL, Map.of(
                    "userId", userId,
                    "type", type,
                    "title", title,
                    "message", message,
                    "referenceId", referenceId
            ), Void.class);
        } catch (Exception e) {
            log.warn("Could not send notification to user {}: {}", userId, e.getMessage());
        }
    }
}

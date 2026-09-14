package com.backhaulmatch.notification.controller;

import com.backhaulmatch.notification.dto.NotificationDtos.AdminSendRequest;
import com.backhaulmatch.notification.entity.Notification;
import com.backhaulmatch.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only view over notification-service's own data ("Notification
 * Management" in the Admin Portal). The API Gateway protects
 * /api/notifications/admin/** with allowedRoles: "ADMIN" ahead of the
 * generic /api/notifications/** route (see api-gateway/application.yml).
 */
@RestController
@RequestMapping("/api/notifications/admin")
@RequiredArgsConstructor
public class NotificationAdminController {

    private final NotificationService notificationService;

    // Platform-wide feed (capped — see NotificationRepository.findTop200ByOrderByCreatedAtDesc).
    @GetMapping("/all")
    public ResponseEntity<List<Notification>> all() {
        return ResponseEntity.ok(notificationService.listRecent());
    }

    // Admin broadcast to a single user — goes through the same create() path
    // (in-app + best-effort email) as every system-generated notification.
    @PostMapping("/send")
    public ResponseEntity<Notification> send(@Valid @RequestBody AdminSendRequest request) {
        return ResponseEntity.ok(notificationService.sendAdminMessage(request));
    }
}

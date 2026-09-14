package com.backhaulmatch.notification.controller;

import com.backhaulmatch.notification.dto.NotificationDtos.CreateNotificationRequest;
import com.backhaulmatch.notification.dto.NotificationDtos.UnreadCountResponse;
import com.backhaulmatch.notification.entity.Notification;
import com.backhaulmatch.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // Called directly by other services (matching-service, courier-service, ...) via their
    // Eureka name — NOT through the Gateway, so it intentionally has no JWT/X-User-Id check.
    @PostMapping("/internal")
    public ResponseEntity<Notification> create(@Valid @RequestBody CreateNotificationRequest request) {
        return ResponseEntity.ok(notificationService.create(request));
    }

    // Everything below goes through the Gateway (JWT-protected) — the bell icon in each portal.
    @GetMapping("/mine")
    public ResponseEntity<List<Notification>> mine(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(notificationService.listForUser(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> unreadCount(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(new UnreadCountResponse(notificationService.unreadCount(userId)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markRead(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(notificationService.markRead(id, userId));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@RequestHeader("X-User-Id") Long userId) {
        notificationService.markAllRead(userId);
        return ResponseEntity.noContent().build();
    }
}

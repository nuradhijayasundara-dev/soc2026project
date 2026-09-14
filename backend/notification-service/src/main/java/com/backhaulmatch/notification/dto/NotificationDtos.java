package com.backhaulmatch.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class NotificationDtos {

    // Every other service posts this to /api/notifications/internal directly
    // (by Eureka name, bypassing the Gateway) whenever something notification-worthy happens.
    public record CreateNotificationRequest(
            @NotNull Long userId,
            @NotBlank String type, // MATCH_FOUND | BOOKING_ACCEPTED | BOOKING_REJECTED | SHIPMENT_STATUS
            @NotBlank String title,
            @NotBlank String message,
            Long referenceId
    ) {}

    public record UnreadCountResponse(long unreadCount) {}

    // Admin Portal's Notification Management "send" action — a direct message
    // from a platform admin to one user. Always persisted as type ADMIN_MESSAGE;
    // unlike CreateNotificationRequest, the caller never chooses the type.
    public record AdminSendRequest(
            @NotNull Long userId,
            @NotBlank String title,
            @NotBlank String message
    ) {}
}

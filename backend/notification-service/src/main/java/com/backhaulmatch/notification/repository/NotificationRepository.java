package com.backhaulmatch.notification.repository;

import com.backhaulmatch.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndReadFalse(Long userId);
    List<Notification> findByUserIdAndReadFalse(Long userId);

    // Admin Portal's Notification Management page — platform-wide feed, capped
    // so it can't return an unbounded number of rows as the table grows.
    List<Notification> findTop200ByOrderByCreatedAtDesc();
}

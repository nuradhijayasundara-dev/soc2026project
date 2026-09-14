package com.backhaulmatch.notification.service;

import com.backhaulmatch.notification.client.AuthServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Bonus channel — off by default (notification.email.enabled=false) since it
 * needs real SMTP credentials to actually send anything. Turn it on in
 * application.yml once you've filled in spring.mail.* below.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final AuthServiceClient authServiceClient;

    @Value("${notification.email.enabled:false}")
    private boolean enabled;

    @Value("${notification.email.from:no-reply@backhaul-match.local}")
    private String fromAddress;

    public void sendIfEnabled(Long userId, String title, String message) {
        if (!enabled) return;

        String email = authServiceClient.getEmail(userId);
        if (email == null || email.isBlank()) {
            log.warn("Skipping email for user {} — no email on file", userId);
            return;
        }

        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(fromAddress);
            mail.setTo(email);
            mail.setSubject("Backhaul-Match: " + title);
            mail.setText(message);
            mailSender.send(mail);
        } catch (Exception e) {
            // Never let an email failure break the in-app notification flow.
            log.error("Failed to send email to {}: {}", email, e.getMessage());
        }
    }
}

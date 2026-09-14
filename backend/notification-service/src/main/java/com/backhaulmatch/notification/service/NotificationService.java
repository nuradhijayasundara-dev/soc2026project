package com.backhaulmatch.notification.service;

import com.backhaulmatch.notification.dto.NotificationDtos.AdminSendRequest;
import com.backhaulmatch.notification.dto.NotificationDtos.CreateNotificationRequest;
import com.backhaulmatch.notification.entity.Notification;
import com.backhaulmatch.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repository;
    private final EmailService emailService;

    /** In-app notification is always created; email is best-effort and only if enabled. */
    public Notification create(CreateNotificationRequest req) {
        Notification notification = new Notification();
        notification.setUserId(req.userId());
        notification.setType(Notification.Type.valueOf(req.type().toUpperCase()));
        notification.setTitle(req.title());
        notification.setMessage(req.message());
        notification.setReferenceId(req.referenceId());
        notification.setRead(false);
        Notification saved = repository.save(notification);

        emailService.sendIfEnabled(req.userId(), req.title(), req.message());

        return saved;
    }

    public List<Notification> listForUser(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long unreadCount(Long userId) {
        return repository.countByUserIdAndReadFalse(userId);
    }

    public Notification markRead(Long id, Long userId) {
        Notification notification = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!notification.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your notification");
        }
        notification.setRead(true);
        return repository.save(notification);
    }

    public void markAllRead(Long userId) {
        List<Notification> unread = repository.findByUserIdAndReadFalse(userId);
        unread.forEach(n -> n.setRead(true));
        repository.saveAll(unread);
    }

    /** Admin Portal's Notification Management page — platform-wide, capped feed. */
    public List<Notification> listRecent() {
        return repository.findTop200ByOrderByCreatedAtDesc();
    }

    /** Admin Portal's "send" action — routes through the same create() path (in-app + best-effort email) as every other notification, just always typed ADMIN_MESSAGE. */
    public Notification sendAdminMessage(AdminSendRequest req) {
        return create(new CreateNotificationRequest(
                req.userId(), Notification.Type.ADMIN_MESSAGE.name(), req.title(), req.message(), null));
    }
}

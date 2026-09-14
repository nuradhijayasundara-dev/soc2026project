package com.backhaulmatch.auth.controller;

import com.backhaulmatch.auth.entity.User;
import com.backhaulmatch.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Called directly by other services via Eureka name ("AUTH-SERVICE"), never through
 * the Gateway — so no JWT here. Used by notification-service's optional email bonus
 * to resolve a user id to an email address. Keep this endpoint minimal: it must never
 * leak the password hash or anything else sensitive.
 */
@RestController
@RequestMapping("/api/auth/internal")
@RequiredArgsConstructor
public class InternalUserController {

    private final UserRepository userRepository;

    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> getUser(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(u -> ResponseEntity.ok(Map.<String, Object>of(
                        "id", u.getId(),
                        "username", u.getUsername(),
                        "email", u.getEmail(),
                        "role", u.getRole().name()
                )))
                .orElse(ResponseEntity.notFound().build());
    }
}

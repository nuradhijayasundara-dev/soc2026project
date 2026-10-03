package com.backhaulmatch.auth.controller;

import com.backhaulmatch.auth.entity.User;
import com.backhaulmatch.auth.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * ADMIN-only user administration, consumed by the Admin Portal. The API Gateway
 * protects /api/auth/admin/** with the JwtAuthFilter(ADMIN) role gate BEFORE
 * requests reach this controller. We also re-check the forwarded X-User-Role
 * header here as defense-in-depth: this service isn't published to the host
 * network in docker-compose, but any container on the same network could
 * otherwise call it directly, bypassing the gateway entirely.
 */
@RestController
@RequestMapping("/api/auth/admin/users")
@RequiredArgsConstructor
public class AuthAdminController {

    private final UserRepository userRepository;

    private void requireAdmin(String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "ADMIN role required");
        }
    }

    @GetMapping
    public ResponseEntity<List<User>> listUsers(@RequestHeader(value = "X-User-Role", required = false) String role) {
        requireAdmin(role);
        return ResponseEntity.ok(userRepository.findAllByOrderByIdDesc());
    }

    @PatchMapping("/{id}/enabled")
    public ResponseEntity<User> setEnabled(@PathVariable Long id, @RequestBody EnabledRequest request,
                                            @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireAdmin(role);
        User user = userRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setEnabled(request.enabled());
        return ResponseEntity.ok(userRepository.save(user));
    }

    // Admin Portal's "change role" action on the Users page. Uses the same
    // User.Role.from() the auth flow already relies on, so legacy
    // COURIER_OPERATOR rows normalize the same way here as everywhere else.
    @PatchMapping("/{id}/role")
    public ResponseEntity<User> setRole(@PathVariable Long id, @RequestBody RoleRequest request,
                                         @RequestHeader(value = "X-User-Role", required = false) String role) {
        requireAdmin(role);
        User user = userRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setRole(User.Role.from(request.role()));
        return ResponseEntity.ok(userRepository.save(user));
    }

    public record EnabledRequest(boolean enabled) {}
    public record RoleRequest(String role) {}
}
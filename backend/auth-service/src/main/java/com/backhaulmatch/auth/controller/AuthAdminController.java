package com.backhaulmatch.auth.controller;

import com.backhaulmatch.auth.entity.User;
import com.backhaulmatch.auth.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ADMIN-only user administration, consumed by the Admin Portal. The API Gateway
 * protects /api/auth/admin/** with the JwtAuthFilter(ADMIN) role gate BEFORE
 * requests reach this controller, so a COURIER_USER/FLEET_MANAGER/DRIVER token
 * can never call these endpoints.
 */
@RestController
@RequestMapping("/api/auth/admin/users")
@RequiredArgsConstructor
public class AuthAdminController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<User>> listUsers() {
        return ResponseEntity.ok(userRepository.findAllByOrderByIdDesc());
    }

    @PatchMapping("/{id}/enabled")
    public ResponseEntity<User> setEnabled(@PathVariable Long id, @RequestBody EnabledRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setEnabled(request.enabled());
        return ResponseEntity.ok(userRepository.save(user));
    }

    // Admin Portal's "change role" action on the Users page. Uses the same
    // User.Role.from() the auth flow already relies on, so legacy
    // COURIER_OPERATOR rows normalize the same way here as everywhere else.
    @PatchMapping("/{id}/role")
    public ResponseEntity<User> setRole(@PathVariable Long id, @RequestBody RoleRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setRole(User.Role.from(request.role()));
        return ResponseEntity.ok(userRepository.save(user));
    }

    public record EnabledRequest(boolean enabled) {}
    public record RoleRequest(String role) {}
}
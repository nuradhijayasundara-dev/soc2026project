package com.backhaulmatch.user.controller;

import com.backhaulmatch.user.entity.UserProfile;
import com.backhaulmatch.user.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * The Gateway's JwtAuthFilter already validated the token and forwards
 * the authenticated user's id via the "X-User-Id" header — no need to
 * re-parse JWTs here.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService service;

    @GetMapping("/me")
    public ResponseEntity<UserProfile> getMyProfile(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.getByUserId(userId));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfile> updateMyProfile(@RequestHeader("X-User-Id") Long userId,
                                                         @RequestBody UserProfile body) {
        return ResponseEntity.ok(service.upsert(userId, body));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfile> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getByUserId(id));
    }
}

package com.backhaulmatch.auth.dto;

import com.backhaulmatch.auth.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AuthDtos {

    public record RegisterRequest(
            @NotBlank String username,
            @NotBlank @Email String email,
            @NotBlank String password,
            @NotBlank String role // ADMIN | COURIER_USER | FLEET_MANAGER | DRIVER
    ) {}

    public record LoginRequest(
            @NotBlank String username,
            @NotBlank String password
    ) {}

    public record AuthResponse(
            String token,
            Long userId,
            String username,
            User.Role role
    ) {}
}

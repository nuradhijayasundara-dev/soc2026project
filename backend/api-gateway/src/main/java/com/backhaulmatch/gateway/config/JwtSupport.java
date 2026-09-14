package com.backhaulmatch.gateway.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Shared JWT verification for the API Gateway. JwtAuthFilter uses this for
 * every proxied route (the normal case). SystemController also uses it: it's
 * a local, non-proxied controller (see its own docs for why), so it sits
 * outside the Gateway's route/filter chain and has to verify the token
 * itself instead of relying on JwtAuthFilter having already run.
 *
 * NOTE: for the demo this is a static shared secret; in production pull this
 * from an env var / secrets manager and keep it identical to auth-service's secret.
 */
public final class JwtSupport {

    private static final String SECRET = "backhaul-match-super-secret-key-change-me-1234567890";
    private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    private JwtSupport() {}

    /** Throws (unchecked) if the token is missing/invalid/expired/tampered. */
    public static Claims parseClaims(String rawToken) {
        return Jwts.parser().verifyWith(KEY).build().parseSignedClaims(rawToken).getPayload();
    }
}

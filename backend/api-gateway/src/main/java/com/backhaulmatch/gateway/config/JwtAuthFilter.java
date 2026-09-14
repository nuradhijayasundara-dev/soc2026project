package com.backhaulmatch.gateway.config;

import io.jsonwebtoken.Claims;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;

/**
 * Gateway-level filter: validates the JWT on every request to a protected route
 * and forwards the userId / role as headers to downstream services. When the
 * route declares allowed roles (YAML arg `allowedRoles: "COURIER_USER,ADMIN"`)
 * it also enforces role-based access control here at the gateway — a token whose
 * role is not in the list gets a 403 before the request ever reaches a microservice.
 *
 * Public routes (auth login/register) are listed without this filter in application.yml.
 */
@Component
public class JwtAuthFilter extends AbstractGatewayFilterFactory<JwtAuthFilter.Config> {

    public JwtAuthFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            List<String> authHeaders = exchange.getRequest().getHeaders().get("Authorization");
            if (authHeaders == null || authHeaders.isEmpty() || !authHeaders.get(0).startsWith("Bearer ")) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
            String token = authHeaders.get(0).substring(7);
            try {
                Claims claims = JwtSupport.parseClaims(token);

                String role = claims.get("role") == null ? "" : String.valueOf(claims.get("role"));

                // RBAC: if the route declared allowed roles, reject anything else outright.
                if (!config.allowedRoles.isEmpty()
                        && config.allowedRoles.stream().noneMatch(r -> r.equalsIgnoreCase(role))) {
                    exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                    return exchange.getResponse().setComplete();
                }

                exchange = exchange.mutate().request(r -> r
                        .header("X-User-Id", claims.getSubject())
                        .header("X-User-Role", role)
                ).build();
            } catch (Exception e) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
            return chain.filter(exchange);
        };
    }

    public static class Config {
        // Allowed roles reachable through this route; empty = any authenticated role.
        private List<String> allowedRoles = List.of();

        public boolean isRoleEnabled() {
            return !allowedRoles.isEmpty();
        }

        public List<String> getAllowedRoles() {
            return allowedRoles;
        }

        public void setAllowedRoles(String allowedRoles) {
            this.allowedRoles = allowedRoles == null || allowedRoles.isBlank()
                    ? List.of()
                    : Arrays.stream(allowedRoles.split(","))
                            .map(String::trim).filter(s -> !s.isEmpty()).toList();
        }
    }
}
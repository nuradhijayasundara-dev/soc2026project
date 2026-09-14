package com.backhaulmatch.gateway.controller;

import com.backhaulmatch.gateway.config.JwtSupport;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * "System Monitoring" for the Admin Portal — reports which backend services
 * are registered with Eureka and how many instances of each are up.
 *
 * This is deliberately a LOCAL controller, not a proxied Gateway route: it
 * answers from the Gateway's own in-memory Eureka client view
 * (DiscoveryClient) rather than forwarding to a microservice, because the
 * thing being reported on IS the set of microservices — there's no single
 * "system service" to proxy to, and the architecture rules explicitly say
 * not to invent an admin microservice just for this.
 *
 * Because it never passes through a configured route, it also never passes
 * through JwtAuthFilter (that filter only runs for requests matched to a
 * route in application.yml — see the routes list there). So this controller
 * verifies the bearer token and the ADMIN role itself, using the same
 * JwtSupport JwtAuthFilter uses, before touching the registry.
 */
@RestController
@CrossOrigin(origins = {
    "http://localhost:3000", "http://localhost:3001", "http://localhost:3002",
    "http://localhost:3100", "http://localhost:3101"
}, allowedHeaders = "*", maxAge = 3600)
@RequiredArgsConstructor
public class SystemController {

    private final DiscoveryClient discoveryClient;

    @GetMapping("/api/system/services")
    public ResponseEntity<?> services(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing or malformed Authorization header"));
        }

        Claims claims;
        try {
            claims = JwtSupport.parseClaims(authHeader.substring(7));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid or expired token"));
        }

        String role = claims.get("role") == null ? "" : String.valueOf(claims.get("role"));
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "System monitoring is restricted to admins"));
        }

        List<String> serviceIds = discoveryClient.getServices();
        List<Map<String, Object>> services = serviceIds.stream()
                .sorted()
                .map(this::describeService)
                .toList();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("services", services);
        body.put("totalServices", services.size());
        return ResponseEntity.ok(body);
    }

    private Map<String, Object> describeService(String serviceId) {
        List<ServiceInstance> instances = discoveryClient.getInstances(serviceId);

        List<Map<String, Object>> instanceDetails = instances.stream().map(instance -> {
            Map<String, Object> details = new LinkedHashMap<>();
            details.put("instanceId", instance.getInstanceId());
            details.put("host", instance.getHost());
            details.put("port", instance.getPort());
            details.put("uri", instance.getUri().toString());
            details.put("secure", instance.isSecure());
            return details;
        }).toList();

        Map<String, Object> service = new LinkedHashMap<>();
        service.put("serviceId", serviceId);
        // DiscoveryClient only ever returns instances Eureka currently
        // considers UP, so any instance present here IS up; zero instances
        // means the service is registered in name only (e.g. starting up)
        // or has gone fully down.
        service.put("status", instanceDetails.isEmpty() ? "DOWN" : "UP");
        service.put("instanceCount", instanceDetails.size());
        service.put("instances", instanceDetails);
        return service;
    }
}

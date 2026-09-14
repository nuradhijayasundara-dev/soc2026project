package com.backhaulmatch.fleet.controller;

import com.backhaulmatch.fleet.dto.FleetDtos.AvailabilityCandidateResponse;
import com.backhaulmatch.fleet.dto.FleetDtos.CapacityVerificationResponse;
import com.backhaulmatch.fleet.dto.FleetDtos.QuickAvailabilityRequest;
import com.backhaulmatch.fleet.entity.TruckAvailability;
import com.backhaulmatch.fleet.service.AvailabilityService;
import com.backhaulmatch.fleet.service.FleetCompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/fleet/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;
    private final FleetCompanyService companyService;

    // "Availability" page — every posting across the logged-in fleet manager's trucks
    @GetMapping("/mine")
    public ResponseEntity<List<TruckAvailability>> listMine(@RequestHeader("X-User-Id") Long userId) {
        Long companyId = companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(availabilityService.listForCompany(companyId));
    }

    // "Post Backhaul Availability" quick-add form — pick a truck, route, return destination, capacity
    @PostMapping
    public ResponseEntity<TruckAvailability> quickAdd(@RequestHeader("X-User-Id") Long userId,
                                                        @Valid @RequestBody QuickAvailabilityRequest request) {
        Long companyId = companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(availabilityService.quickAdd(companyId, request));
    }

    // Called directly by matching-service (not through the Gateway) — cross-company,
    // so it intentionally does NOT require X-User-Id / scope to one company.
    @GetMapping("/search")
    public ResponseEntity<List<AvailabilityCandidateResponse>> search(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) BigDecimal minCapacityTon) {
        return ResponseEntity.ok(availabilityService.search(from, to, minCapacityTon));
    }

    // Capacity Verification — called by matching-service before it commits to a candidate.
    // Also internal / service-to-service, no X-User-Id required.
    @GetMapping("/{id}/verify")
    public ResponseEntity<CapacityVerificationResponse> verify(
            @PathVariable Long id, @RequestParam(required = false) BigDecimal requiredTon) {
        return ResponseEntity.ok(availabilityService.verify(id, requiredTon));
    }

    // "Truck Capacity Reserved" — called by matching-service the instant a courier accepts a match.
    @PatchMapping("/{id}/reserve")
    public ResponseEntity<TruckAvailability> reserve(
            @PathVariable Long id, @RequestParam BigDecimal requiredTon) {
        return ResponseEntity.ok(availabilityService.reserve(id, requiredTon));
    }

    // Called by matching-service when a fleet manager rejects a pending booking.
    @PatchMapping("/{id}/release")
    public ResponseEntity<TruckAvailability> release(@PathVariable Long id) {
        return ResponseEntity.ok(availabilityService.release(id));
    }
}

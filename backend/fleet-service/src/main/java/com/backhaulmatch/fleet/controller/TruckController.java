package com.backhaulmatch.fleet.controller;

import com.backhaulmatch.fleet.dto.FleetDtos.AvailabilityRequest;
import com.backhaulmatch.fleet.dto.FleetDtos.TruckRequest;
import com.backhaulmatch.fleet.entity.Truck;
import com.backhaulmatch.fleet.entity.TruckAvailability;
import com.backhaulmatch.fleet.service.FleetCompanyService;
import com.backhaulmatch.fleet.service.TruckService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fleet/trucks")
@RequiredArgsConstructor
public class TruckController {

    private final TruckService truckService;
    private final FleetCompanyService companyService;

    @GetMapping
    public ResponseEntity<List<Truck>> list(@RequestHeader("X-User-Id") Long userId) {
        Long companyId = companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(truckService.listForCompany(companyId));
    }

    @PostMapping
    public ResponseEntity<Truck> register(@RequestHeader("X-User-Id") Long userId,
                                           @Valid @RequestBody TruckRequest request) {
        Long companyId = companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(truckService.register(companyId, request));
    }

    // "Truck details" screen
    @GetMapping("/{id}")
    public ResponseEntity<Truck> getById(@PathVariable Long id,
                                          @RequestHeader("X-User-Id") Long userId,
                                          @RequestHeader(value = "X-User-Role", required = false) String role) {
        Long companyId = "ADMIN".equalsIgnoreCase(role) ? null : companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(truckService.getForCompany(id, companyId, role));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<List<TruckAvailability>> getAvailability(@PathVariable Long id,
                                                                     @RequestHeader("X-User-Id") Long userId,
                                                                     @RequestHeader(value = "X-User-Role", required = false) String role) {
        Long companyId = "ADMIN".equalsIgnoreCase(role) ? null : companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(truckService.getAvailability(id, companyId, role));
    }

    // "Available capacity input" screen
    @PostMapping("/{id}/availability")
    public ResponseEntity<TruckAvailability> addAvailability(@PathVariable Long id,
                                                               @RequestHeader("X-User-Id") Long userId,
                                                               @RequestHeader(value = "X-User-Role", required = false) String role,
                                                               @Valid @RequestBody AvailabilityRequest request) {
        Long companyId = "ADMIN".equalsIgnoreCase(role) ? null : companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(truckService.addAvailability(id, companyId, role, request));
    }
}

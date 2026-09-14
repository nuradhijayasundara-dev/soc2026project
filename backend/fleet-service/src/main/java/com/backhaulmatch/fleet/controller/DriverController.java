package com.backhaulmatch.fleet.controller;

import com.backhaulmatch.fleet.dto.FleetDtos.DriverRequest;
import com.backhaulmatch.fleet.entity.Driver;
import com.backhaulmatch.fleet.service.DriverService;
import com.backhaulmatch.fleet.service.FleetCompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/fleet/drivers")
@RequiredArgsConstructor
public class DriverController {

    private final DriverService driverService;
    private final FleetCompanyService companyService;

    @GetMapping
    public ResponseEntity<List<Driver>> list(@RequestHeader("X-User-Id") Long userId,
                                              @RequestParam(required = false) Boolean availableOnly) {
        Long companyId = companyService.resolveCompanyId(userId);
        List<Driver> drivers = Boolean.TRUE.equals(availableOnly)
                ? driverService.listAvailableForCompany(companyId)
                : driverService.listForCompany(companyId);
        return ResponseEntity.ok(drivers);
    }

    @PostMapping
    public ResponseEntity<Driver> register(@RequestHeader("X-User-Id") Long userId,
                                            @Valid @RequestBody DriverRequest request) {
        Long companyId = companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(driverService.register(companyId, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Driver> getById(@PathVariable Long id) {
        return ResponseEntity.ok(driverService.getById(id));
    }

    // Driver App calls this right after login to find its own profile/status.
    @GetMapping("/me")
    public ResponseEntity<Driver> getMyProfile(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(driverService.getByUserId(userId));
    }

    // One-time "claim" — a driver logs in and links their account to the profile
    // the fleet manager registered for them (matched by driverId, e.g. shared via SMS/email).
    @PatchMapping("/{id}/link-account")
    public ResponseEntity<Driver> linkAccount(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(driverService.linkAccount(id, userId));
    }
}

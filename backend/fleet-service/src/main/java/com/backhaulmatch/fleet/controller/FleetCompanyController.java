package com.backhaulmatch.fleet.controller;

import com.backhaulmatch.fleet.dto.FleetDtos.CompanyRequest;
import com.backhaulmatch.fleet.entity.FleetCompany;
import com.backhaulmatch.fleet.service.FleetCompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/fleet/company")
@RequiredArgsConstructor
public class FleetCompanyController {

    private final FleetCompanyService companyService;

    @GetMapping("/me")
    public ResponseEntity<FleetCompany> getMyCompany(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(companyService.getByUserId(userId));
    }

    @PutMapping("/me")
    public ResponseEntity<FleetCompany> registerOrUpdate(@RequestHeader("X-User-Id") Long userId,
                                                           @Valid @RequestBody CompanyRequest request) {
        return ResponseEntity.ok(companyService.registerOrUpdate(userId, request));
    }

    // Called directly by matching-service (Eureka name, not through the Gateway) to resolve
    // which user owns a fleet company — e.g. so a "booking requested" notification reaches them.
    @GetMapping("/{id}")
    public ResponseEntity<FleetCompany> getById(@PathVariable Long id) {
        return ResponseEntity.ok(companyService.getById(id));
    }
}

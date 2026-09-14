package com.backhaulmatch.courier.controller;

import com.backhaulmatch.courier.dto.CourierDtos.CompanyRequest;
import com.backhaulmatch.courier.entity.CourierCompany;
import com.backhaulmatch.courier.service.CourierCompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * The Gateway forwards the authenticated user's id as "X-User-Id" after
 * validating the JWT — this service trusts that header instead of parsing tokens itself.
 */
@RestController
@RequestMapping("/api/courier/company")
@RequiredArgsConstructor
public class CourierCompanyController {

    private final CourierCompanyService companyService;

    @GetMapping("/me")
    public ResponseEntity<CourierCompany> getMyCompany(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(companyService.getByUserId(userId));
    }

    @PutMapping("/me")
    public ResponseEntity<CourierCompany> registerOrUpdate(@RequestHeader("X-User-Id") Long userId,
                                                             @Valid @RequestBody CompanyRequest request) {
        return ResponseEntity.ok(companyService.registerOrUpdate(userId, request));
    }
}

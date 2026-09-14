package com.backhaulmatch.courier.controller;

import com.backhaulmatch.courier.dto.CourierDtos.CustomerRequest;
import com.backhaulmatch.courier.entity.Customer;
import com.backhaulmatch.courier.service.CourierCompanyService;
import com.backhaulmatch.courier.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courier/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;
    private final CourierCompanyService companyService;

    @GetMapping
    public ResponseEntity<List<Customer>> list(@RequestHeader("X-User-Id") Long userId) {
        Long companyId = companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(customerService.listForCompany(companyId));
    }

    @PostMapping
    public ResponseEntity<Customer> create(@RequestHeader("X-User-Id") Long userId,
                                            @Valid @RequestBody CustomerRequest request) {
        Long companyId = companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(customerService.create(companyId, request));
    }
}

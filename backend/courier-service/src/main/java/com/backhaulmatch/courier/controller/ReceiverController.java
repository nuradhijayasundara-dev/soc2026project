package com.backhaulmatch.courier.controller;

import com.backhaulmatch.courier.dto.CourierDtos.ReceiverRequest;
import com.backhaulmatch.courier.entity.Receiver;
import com.backhaulmatch.courier.service.CourierCompanyService;
import com.backhaulmatch.courier.service.ReceiverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courier/receivers")
@RequiredArgsConstructor
public class ReceiverController {

    private final ReceiverService receiverService;
    private final CourierCompanyService companyService;

    @PostMapping
    public ResponseEntity<Receiver> create(@Valid @RequestBody ReceiverRequest request) {
        return ResponseEntity.ok(receiverService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Receiver> getById(@PathVariable Long id,
                                             @RequestHeader("X-User-Id") Long userId,
                                             @RequestHeader(value = "X-User-Role", required = false) String role) {
        Long companyId = "ADMIN".equalsIgnoreCase(role) ? null : companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(receiverService.getForCompany(id, companyId, role));
    }
}

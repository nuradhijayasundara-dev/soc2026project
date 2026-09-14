package com.backhaulmatch.courier.controller;

import com.backhaulmatch.courier.dto.CourierDtos.ReceiverRequest;
import com.backhaulmatch.courier.entity.Receiver;
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

    @PostMapping
    public ResponseEntity<Receiver> create(@Valid @RequestBody ReceiverRequest request) {
        return ResponseEntity.ok(receiverService.create(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Receiver> getById(@PathVariable Long id) {
        return ResponseEntity.ok(receiverService.getById(id));
    }
}

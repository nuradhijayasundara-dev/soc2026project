package com.backhaulmatch.courier.controller;

import com.backhaulmatch.courier.dto.CourierDtos.StatusUpdateRequest;
import com.backhaulmatch.courier.entity.Shipment;
import com.backhaulmatch.courier.service.ShipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Called directly by other services via Eureka name (fleet-service, matching-service),
 * never through the Gateway — no JWT/ownership check here, same trust boundary as
 * auth-service's InternalUserController. Deliberately mounted OUTSIDE /api/courier/**
 * so the Gateway's courier-service route (Path=/api/courier/**, allowedRoles
 * COURIER_USER/ADMIN) can never proxy an authenticated courier's request to it —
 * the Gateway has no route predicate for this path at all, so it 404s there.
 */
@RestController
@RequestMapping("/internal/shipments")
@RequiredArgsConstructor
public class InternalShipmentController {

    private final ShipmentService shipmentService;

    @GetMapping("/{id}")
    public ResponseEntity<Shipment> getById(@PathVariable Long id) {
        return ResponseEntity.ok(shipmentService.getById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Shipment> updateStatus(@PathVariable Long id, @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(shipmentService.updateStatusInternal(id, request));
    }
}

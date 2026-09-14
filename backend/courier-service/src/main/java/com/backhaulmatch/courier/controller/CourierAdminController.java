package com.backhaulmatch.courier.controller;

import com.backhaulmatch.courier.entity.CourierCompany;
import com.backhaulmatch.courier.entity.Shipment;
import com.backhaulmatch.courier.repository.CourierCompanyRepository;
import com.backhaulmatch.courier.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin-only, read-only view over courier-service's own data for the Admin
 * Portal. The API Gateway protects /api/courier/admin/** with
 * allowedRoles: "ADMIN" ahead of the generic /api/courier/** route (see
 * api-gateway/application.yml) — the same trust boundary every other
 * courier-service controller relies on for X-User-Id/X-User-Role, so this
 * controller does not re-check roles itself.
 *
 * Deliberately thin and read-only: the Admin Portal observes this service's
 * data through its own REST surface instead of owning or duplicating it —
 * no direct DB access, no separate admin micro-service, no business logic
 * moved into the frontend.
 */
@RestController
@RequestMapping("/api/courier/admin")
@RequiredArgsConstructor
public class CourierAdminController {

    private final CourierCompanyRepository companyRepository;
    private final ShipmentRepository shipmentRepository;

    @GetMapping("/companies")
    public ResponseEntity<List<CourierCompany>> listCompanies() {
        return ResponseEntity.ok(companyRepository.findAll());
    }

    @GetMapping("/shipments")
    public ResponseEntity<List<Shipment>> listShipments(@RequestParam(required = false) String status) {
        if (status == null || status.isBlank()) {
            return ResponseEntity.ok(shipmentRepository.findAllByOrderByCreatedAtDesc());
        }
        Shipment.Status parsed = Shipment.Status.valueOf(status.trim().toUpperCase());
        return ResponseEntity.ok(shipmentRepository.findByStatusOrderByCreatedAtDesc(parsed));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalCompanies", companyRepository.count());
        stats.put("totalShipments", shipmentRepository.count());

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Shipment.Status s : Shipment.Status.values()) {
            byStatus.put(s.name(), shipmentRepository.countByStatus(s));
        }
        stats.put("shipmentsByStatus", byStatus);

        return ResponseEntity.ok(stats);
    }
}

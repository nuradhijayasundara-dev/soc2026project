package com.backhaulmatch.courier.controller;

import com.backhaulmatch.courier.dto.CourierDtos.*;
import com.backhaulmatch.courier.entity.Shipment;
import com.backhaulmatch.courier.entity.ShipmentTracking;
import com.backhaulmatch.courier.service.CourierCompanyService;
import com.backhaulmatch.courier.service.ShipmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courier")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;
    private final CourierCompanyService companyService;

    @GetMapping("/shipments")
    public ResponseEntity<List<Shipment>> list(@RequestHeader("X-User-Id") Long userId) {
        Long companyId = companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(shipmentService.listForCompany(companyId));
    }

    @PostMapping("/shipments")
    public ResponseEntity<Shipment> create(@RequestHeader("X-User-Id") Long userId,
                                            @Valid @RequestBody CreateShipmentRequest request) {
        Long companyId = companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(shipmentService.create(companyId, request));
    }

    @GetMapping("/shipments/{id}")
    public ResponseEntity<Shipment> getById(@PathVariable Long id,
                                             @RequestHeader("X-User-Id") Long userId,
                                             @RequestHeader(value = "X-User-Role", required = false) String role) {
        Long companyId = "ADMIN".equalsIgnoreCase(role) ? null : companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(shipmentService.getForCompany(id, companyId, role));
    }

    @GetMapping("/shipments/{id}/tracking")
    public ResponseEntity<List<ShipmentTracking>> getTracking(@PathVariable Long id,
                                                                @RequestHeader("X-User-Id") Long userId,
                                                                @RequestHeader(value = "X-User-Role", required = false) String role) {
        Long companyId = "ADMIN".equalsIgnoreCase(role) ? null : companyService.resolveCompanyId(userId);
        shipmentService.getForCompany(id, companyId, role); // ownership check
        return ResponseEntity.ok(shipmentService.getTrackingHistory(id));
    }

    @PatchMapping("/shipments/{id}/status")
    public ResponseEntity<Shipment> updateStatus(@PathVariable Long id,
                                                  @Valid @RequestBody StatusUpdateRequest request,
                                                  @RequestHeader("X-User-Id") Long userId,
                                                  @RequestHeader(value = "X-User-Role", required = false) String role) {
        Long companyId = "ADMIN".equalsIgnoreCase(role) ? null : companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(shipmentService.updateStatus(id, companyId, role, request));
    }

    @GetMapping("/dashboard/summary")
    public ResponseEntity<DashboardSummary> dashboardSummary(@RequestHeader("X-User-Id") Long userId) {
        Long companyId = companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(shipmentService.getDashboardSummary(companyId));
    }

    // "Courier Reports" page — total shipments, successful matches, cost savings
    @GetMapping("/reports/summary")
    public ResponseEntity<CourierReportSummary> reportSummary(@RequestHeader("X-User-Id") Long userId) {
        Long companyId = companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(shipmentService.getReportSummary(userId, companyId));
    }
}

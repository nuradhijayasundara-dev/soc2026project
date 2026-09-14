package com.backhaulmatch.fleet.controller;

import com.backhaulmatch.fleet.dto.FleetDtos.FleetReportSummary;
import com.backhaulmatch.fleet.entity.Truck;
import com.backhaulmatch.fleet.entity.TruckAvailability;
import com.backhaulmatch.fleet.repository.TripRepository;
import com.backhaulmatch.fleet.repository.TruckAvailabilityRepository;
import com.backhaulmatch.fleet.repository.TruckRepository;
import com.backhaulmatch.fleet.service.FleetCompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * "Fleet Reports": total trips, used capacity. Both are plain SQL COUNT/SUM
 * queries against the existing trips / truck_availability tables — no
 * separate report table. Backhaul revenue lives in payment-service and is
 * fetched separately by the frontend (each service owns its own numbers).
 */
@RestController
@RequestMapping("/api/fleet/reports")
@RequiredArgsConstructor
public class ReportController {

    private final FleetCompanyService companyService;
    private final TruckRepository truckRepository;
    private final TripRepository tripRepository;
    private final TruckAvailabilityRepository availabilityRepository;

    @GetMapping("/summary")
    public ResponseEntity<FleetReportSummary> summary(@RequestHeader("X-User-Id") Long userId) {
        Long companyId = companyService.resolveCompanyId(userId);
        List<Long> truckIds = truckRepository.findByFleetCompanyId(companyId).stream()
                .map(Truck::getId).collect(Collectors.toList());

        long totalTrips = tripRepository.countByTruckIdIn(truckIds);
        BigDecimal usedCapacity = availabilityRepository.sumCapacityTonByTruckIdInAndStatus(
                truckIds, TruckAvailability.Status.BOOKED);

        return ResponseEntity.ok(new FleetReportSummary(
                totalTrips, usedCapacity == null ? BigDecimal.ZERO : usedCapacity));
    }
}

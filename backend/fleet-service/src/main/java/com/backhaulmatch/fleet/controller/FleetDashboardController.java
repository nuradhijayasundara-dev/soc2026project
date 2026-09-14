package com.backhaulmatch.fleet.controller;

import com.backhaulmatch.fleet.dto.FleetDtos.DashboardSummary;
import com.backhaulmatch.fleet.entity.Truck;
import com.backhaulmatch.fleet.repository.TripRepository;
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

@RestController
@RequestMapping("/api/fleet/dashboard")
@RequiredArgsConstructor
public class FleetDashboardController {

    private final FleetCompanyService companyService;
    private final TruckRepository truckRepository;
    private final TripRepository tripRepository;

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummary> summary(@RequestHeader("X-User-Id") Long userId) {
        Long companyId = companyService.resolveCompanyId(userId);
        List<Truck> trucks = truckRepository.findByFleetCompanyId(companyId);

        long trucksOnline = trucks.size();
        BigDecimal availableCapacity = trucks.stream()
                .filter(t -> t.getStatus() == Truck.Status.AVAILABLE)
                .map(Truck::getCapacityTon)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Long> truckIds = trucks.stream().map(Truck::getId).collect(Collectors.toList());
        long activeBookings = tripRepository.findByTruckIdInOrderByStartTimeDesc(truckIds).stream()
                .filter(t -> t.getStatus().name().equals("SCHEDULED") || t.getStatus().name().equals("IN_PROGRESS"))
                .count();

        return ResponseEntity.ok(new DashboardSummary(trucksOnline, availableCapacity, activeBookings));
    }
}

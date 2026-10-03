package com.backhaulmatch.fleet.controller;

import com.backhaulmatch.fleet.dto.TripDtos.AssignDriverRequest;
import com.backhaulmatch.fleet.dto.TripDtos.CreateTripFromBookingRequest;
import com.backhaulmatch.fleet.dto.TripDtos.CreateTripRequest;
import com.backhaulmatch.fleet.entity.Trip;
import com.backhaulmatch.fleet.repository.TruckRepository;
import com.backhaulmatch.fleet.service.FleetCompanyService;
import com.backhaulmatch.fleet.service.DriverService;
import com.backhaulmatch.fleet.service.TripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fleet/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;
    private final FleetCompanyService companyService;
    private final DriverService driverService;
    private final TruckRepository truckRepository;

    @GetMapping
    public ResponseEntity<List<Trip>> list(@RequestHeader("X-User-Id") Long userId) {
        Long companyId = companyService.resolveCompanyId(userId);
        List<Long> truckIds = truckRepository.findByFleetCompanyId(companyId).stream()
                .map(t -> t.getId()).collect(Collectors.toList());
        return ResponseEntity.ok(tripService.listForTrucks(truckIds));
    }

    // Driver App: trips assigned to the logged-in driver — feeds the "select truck/trip" screen.
    @GetMapping("/my")
    public ResponseEntity<List<Trip>> myTrips(@RequestHeader("X-User-Id") Long userId) {
        Long driverId = driverService.getByUserId(userId).getId();
        return ResponseEntity.ok(tripService.listForDriver(driverId));
    }

    // "Trip creation" screen: pick truck + driver (+ optional shipment to fulfill)
    @PostMapping
    public ResponseEntity<Trip> create(@Valid @RequestBody CreateTripRequest request) {
        return ResponseEntity.ok(tripService.create(request));
    }

    // Called directly by matching-service (Eureka name, not through the Gateway) the
    // instant a fleet manager accepts a booking — "fleet receives booking" becomes a
    // real, trackable Trip with no driver yet. No X-User-Id: this is service-to-service.
    @PostMapping("/internal")
    public ResponseEntity<Trip> createFromBooking(@Valid @RequestBody CreateTripFromBookingRequest request) {
        return ResponseEntity.ok(tripService.createFromBooking(request.truckId(), request.shipmentId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trip> getById(@PathVariable Long id,
                                         @RequestHeader("X-User-Id") Long userId,
                                         @RequestHeader(value = "X-User-Role", required = false) String role) {
        Long companyId = "ADMIN".equalsIgnoreCase(role) ? null : companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(tripService.getForCompany(id, companyId, role));
    }

    // Driver App: "Start Trip" button
    @PatchMapping("/{id}/start")
    public ResponseEntity<Trip> startTrip(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        Long driverId = driverService.getByUserId(userId).getId();
        return ResponseEntity.ok(tripService.startTrip(id, driverId));
    }

    // Driver App: "Complete Delivery" button
    @PatchMapping("/{id}/complete")
    public ResponseEntity<Trip> completeTrip(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        Long driverId = driverService.getByUserId(userId).getId();
        return ResponseEntity.ok(tripService.completeTrip(id, driverId));
    }

    // "Driver assignment" screen: swap the driver on a not-yet-started trip
    @PatchMapping("/{id}/assign-driver")
    public ResponseEntity<Trip> assignDriver(@PathVariable Long id,
                                              @RequestHeader("X-User-Id") Long userId,
                                              @RequestHeader(value = "X-User-Role", required = false) String role,
                                              @Valid @RequestBody AssignDriverRequest request) {
        Long companyId = "ADMIN".equalsIgnoreCase(role) ? null : companyService.resolveCompanyId(userId);
        return ResponseEntity.ok(tripService.assignDriver(id, companyId, role, request));
    }
}

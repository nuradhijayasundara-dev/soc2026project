package com.backhaulmatch.fleet.controller;

import com.backhaulmatch.fleet.entity.Driver;
import com.backhaulmatch.fleet.entity.FleetCompany;
import com.backhaulmatch.fleet.entity.Trip;
import com.backhaulmatch.fleet.entity.Truck;
import com.backhaulmatch.fleet.entity.TruckAvailability;
import com.backhaulmatch.fleet.repository.DriverRepository;
import com.backhaulmatch.fleet.repository.FleetCompanyRepository;
import com.backhaulmatch.fleet.repository.TripRepository;
import com.backhaulmatch.fleet.repository.TruckAvailabilityRepository;
import com.backhaulmatch.fleet.repository.TruckRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin-only, read-only view over fleet-service's own data for the Admin
 * Portal. The API Gateway protects /api/fleet/admin/** with
 * allowedRoles: "ADMIN" ahead of the generic /api/fleet/** route (see
 * api-gateway/application.yml) — the same trust boundary every other
 * fleet-service controller relies on for X-User-Id/X-User-Role.
 *
 * Deliberately thin and read-only: the Admin Portal observes this service's
 * data through its own REST surface instead of owning or duplicating it.
 */
@RestController
@RequestMapping("/api/fleet/admin")
@RequiredArgsConstructor
public class FleetAdminController {

    private final FleetCompanyRepository companyRepository;
    private final TruckRepository truckRepository;
    private final DriverRepository driverRepository;
    private final TripRepository tripRepository;
    private final TruckAvailabilityRepository availabilityRepository;

    @GetMapping("/companies")
    public ResponseEntity<List<FleetCompany>> listCompanies() {
        return ResponseEntity.ok(companyRepository.findAll());
    }

    @GetMapping("/trucks")
    public ResponseEntity<List<Truck>> listTrucks() {
        return ResponseEntity.ok(truckRepository.findAll());
    }

    @GetMapping("/drivers")
    public ResponseEntity<List<Driver>> listDrivers() {
        return ResponseEntity.ok(driverRepository.findAll());
    }

    @GetMapping("/trips")
    public ResponseEntity<List<Trip>> listTrips() {
        return ResponseEntity.ok(tripRepository.findAllByOrderByIdDesc());
    }

    @GetMapping("/availability")
    public ResponseEntity<List<TruckAvailability>> listAvailability() {
        return ResponseEntity.ok(availabilityRepository.findAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalCompanies", companyRepository.count());
        stats.put("totalTrucks", truckRepository.count());
        stats.put("totalDrivers", driverRepository.count());
        stats.put("totalTrips", tripRepository.count());

        Map<String, Long> trucksByStatus = new LinkedHashMap<>();
        for (Truck.Status s : Truck.Status.values()) {
            trucksByStatus.put(s.name(), truckRepository.countByStatus(s));
        }
        stats.put("trucksByStatus", trucksByStatus);

        Map<String, Long> driversByStatus = new LinkedHashMap<>();
        for (Driver.Status s : Driver.Status.values()) {
            driversByStatus.put(s.name(), driverRepository.countByStatus(s));
        }
        stats.put("driversByStatus", driversByStatus);

        Map<String, Long> tripsByStatus = new LinkedHashMap<>();
        for (Trip.Status s : Trip.Status.values()) {
            tripsByStatus.put(s.name(), tripRepository.countByStatus(s));
        }
        stats.put("tripsByStatus", tripsByStatus);

        return ResponseEntity.ok(stats);
    }
}

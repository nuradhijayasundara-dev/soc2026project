package com.backhaulmatch.gps.controller;

import com.backhaulmatch.gps.dto.GpsDtos.LocationUpdateRequest;
import com.backhaulmatch.gps.entity.GpsTrackingHistory;
import com.backhaulmatch.gps.entity.LiveGpsLocation;
import com.backhaulmatch.gps.service.GpsTrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

/**
 * All requests pass through the Gateway (/api/gps/**) and are already JWT-validated
 * there — the Driver App authenticates as a DRIVER, the Fleet Portal as a FLEET_MANAGER.
 */
@RestController
@RequestMapping("/api/gps")
@RequiredArgsConstructor
public class GpsController {

    private final GpsTrackingService gpsTrackingService;

    // Driver App -> Backend: called every few seconds while a trip is active.
    @PostMapping("/location")
    public ResponseEntity<LiveGpsLocation> reportLocation(@Valid @RequestBody LocationUpdateRequest request) {
        return ResponseEntity.ok(gpsTrackingService.recordLocation(request));
    }

    // Fleet Portal map: all trucks' current positions, or a filtered subset via ?truckIds=1,2,3
    // FLEET_MANAGER callers are scoped to their own company's trucks (never the whole platform).
    @GetMapping("/live")
    public ResponseEntity<List<LiveGpsLocation>> getLive(@RequestParam(required = false) String truckIds,
                                                           @RequestHeader("X-User-Id") Long userId,
                                                           @RequestHeader(value = "X-User-Role", required = false) String role) {
        List<Long> ids = (truckIds == null || truckIds.isBlank())
                ? null
                : Arrays.stream(truckIds.split(",")).map(Long::parseLong).toList();
        return ResponseEntity.ok(gpsTrackingService.getLiveForTrucks(ids, userId, role));
    }

    @GetMapping("/live/{truckId}")
    public ResponseEntity<LiveGpsLocation> getLiveForTruck(@PathVariable Long truckId,
                                                             @RequestHeader("X-User-Id") Long userId,
                                                             @RequestHeader(value = "X-User-Role", required = false) String role) {
        return gpsTrackingService.getLiveForTrucks(List.of(truckId), userId, role).stream().findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Tracking history — for playback on the courier tracking page or trip replay
    @GetMapping("/history/truck/{truckId}")
    public ResponseEntity<List<GpsTrackingHistory>> getHistoryForTruck(@PathVariable Long truckId,
                                                                        @RequestHeader("X-User-Id") Long userId,
                                                                        @RequestHeader(value = "X-User-Role", required = false) String role) {
        return ResponseEntity.ok(gpsTrackingService.getHistoryForTruck(truckId, userId, role));
    }

    @GetMapping("/history/trip/{tripId}")
    public ResponseEntity<List<GpsTrackingHistory>> getHistoryForTrip(@PathVariable Long tripId) {
        return ResponseEntity.ok(gpsTrackingService.getHistoryForTrip(tripId));
    }
}

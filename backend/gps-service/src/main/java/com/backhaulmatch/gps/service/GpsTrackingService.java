package com.backhaulmatch.gps.service;

import com.backhaulmatch.gps.client.FleetServiceClient;
import com.backhaulmatch.gps.dto.GpsDtos.LocationUpdateRequest;
import com.backhaulmatch.gps.entity.GpsTrackingHistory;
import com.backhaulmatch.gps.entity.LiveGpsLocation;
import com.backhaulmatch.gps.repository.GpsTrackingHistoryRepository;
import com.backhaulmatch.gps.repository.LiveGpsLocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class GpsTrackingService {

    private final LiveGpsLocationRepository liveRepository;
    private final GpsTrackingHistoryRepository historyRepository;
    private final FleetServiceClient fleetServiceClient;

    /**
     * Fleet managers may only see trucks belonging to their own company —
     * ADMIN and any other authenticated role (e.g. COURIER_USER tracking a
     * shipment on a truck owned by a different company, as designed in this
     * marketplace) are not restricted by truck ownership here.
     */
    private Set<Long> scopeForCaller(Long userId, String role) {
        if ("FLEET_MANAGER".equalsIgnoreCase(role)) {
            return fleetServiceClient.myTruckIds(userId);
        }
        return null; // no truck-ownership restriction for this role
    }

    private void requireOwnedTruck(Long truckId, Long userId, String role) {
        Set<Long> owned = scopeForCaller(userId, role);
        if (owned != null && !owned.contains(truckId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This truck does not belong to your company");
        }
    }

    /**
     * Called on every ping from the Driver App: upserts the truck's current
     * position (for the live map) AND appends an immutable history row
     * (for playback / route reconstruction).
     */
    public LiveGpsLocation recordLocation(LocationUpdateRequest req) {
        LocalDateTime now = LocalDateTime.now();

        LiveGpsLocation live = liveRepository.findByTruckId(req.truckId()).orElseGet(LiveGpsLocation::new);
        live.setTruckId(req.truckId());
        live.setDriverId(req.driverId());
        live.setTripId(req.tripId());
        live.setLatitude(req.latitude());
        live.setLongitude(req.longitude());
        live.setSpeedKmh(req.speedKmh());
        live.setHeading(req.heading());
        live.setUpdatedAt(now);
        LiveGpsLocation savedLive = liveRepository.save(live);

        GpsTrackingHistory history = new GpsTrackingHistory();
        history.setTruckId(req.truckId());
        history.setTripId(req.tripId());
        history.setLatitude(req.latitude());
        history.setLongitude(req.longitude());
        history.setSpeedKmh(req.speedKmh());
        history.setRecordedAt(now);
        historyRepository.save(history);

        return savedLive;
    }

    public List<LiveGpsLocation> getAllLive() {
        return liveRepository.findAll();
    }

    /**
     * Scoped by caller: a FLEET_MANAGER only ever sees their own company's
     * trucks (never the whole platform's live positions), even with no
     * truckIds filter supplied.
     */
    public List<LiveGpsLocation> getLiveForTrucks(List<Long> truckIds, Long userId, String role) {
        Set<Long> owned = scopeForCaller(userId, role);
        List<Long> ids = truckIds;
        if (owned != null) {
            ids = (ids == null || ids.isEmpty())
                    ? List.copyOf(owned)
                    : ids.stream().filter(owned::contains).toList();
        }
        return (ids == null || ids.isEmpty())
                ? (owned != null ? List.of() : liveRepository.findAll())
                : liveRepository.findByTruckIdIn(ids);
    }

    public List<GpsTrackingHistory> getHistoryForTruck(Long truckId, Long userId, String role) {
        requireOwnedTruck(truckId, userId, role);
        return historyRepository.findByTruckIdOrderByRecordedAtAsc(truckId);
    }

    public List<GpsTrackingHistory> getHistoryForTrip(Long tripId) {
        return historyRepository.findByTripIdOrderByRecordedAtAsc(tripId);
    }
}

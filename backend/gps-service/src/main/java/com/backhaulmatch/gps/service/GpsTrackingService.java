package com.backhaulmatch.gps.service;

import com.backhaulmatch.gps.dto.GpsDtos.LocationUpdateRequest;
import com.backhaulmatch.gps.entity.GpsTrackingHistory;
import com.backhaulmatch.gps.entity.LiveGpsLocation;
import com.backhaulmatch.gps.repository.GpsTrackingHistoryRepository;
import com.backhaulmatch.gps.repository.LiveGpsLocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GpsTrackingService {

    private final LiveGpsLocationRepository liveRepository;
    private final GpsTrackingHistoryRepository historyRepository;

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

    public List<LiveGpsLocation> getLiveForTrucks(List<Long> truckIds) {
        return (truckIds == null || truckIds.isEmpty())
                ? liveRepository.findAll()
                : liveRepository.findByTruckIdIn(truckIds);
    }

    public List<GpsTrackingHistory> getHistoryForTruck(Long truckId) {
        return historyRepository.findByTruckIdOrderByRecordedAtAsc(truckId);
    }

    public List<GpsTrackingHistory> getHistoryForTrip(Long tripId) {
        return historyRepository.findByTripIdOrderByRecordedAtAsc(tripId);
    }
}

package com.backhaulmatch.gps.repository;

import com.backhaulmatch.gps.entity.GpsTrackingHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GpsTrackingHistoryRepository extends JpaRepository<GpsTrackingHistory, Long> {
    List<GpsTrackingHistory> findByTruckIdOrderByRecordedAtAsc(Long truckId);
    List<GpsTrackingHistory> findByTripIdOrderByRecordedAtAsc(Long tripId);
}

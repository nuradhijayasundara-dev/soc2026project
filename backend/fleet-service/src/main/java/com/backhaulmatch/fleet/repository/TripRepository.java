package com.backhaulmatch.fleet.repository;

import com.backhaulmatch.fleet.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TripRepository extends JpaRepository<Trip, Long> {
    List<Trip> findByTruckIdInOrderByStartTimeDesc(List<Long> truckIds);
    List<Trip> findByDriverIdOrderByStartTimeDesc(Long driverId);

    // "Fleet Reports" — total trips, via a plain COUNT query.
    long countByTruckIdIn(List<Long> truckIds);

    // Admin Portal (platform-wide, not scoped to one fleet company).
    List<Trip> findAllByOrderByIdDesc();
    long countByStatus(Trip.Status status);
}

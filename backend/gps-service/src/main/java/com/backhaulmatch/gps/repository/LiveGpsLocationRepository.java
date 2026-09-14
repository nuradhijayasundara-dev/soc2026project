package com.backhaulmatch.gps.repository;

import com.backhaulmatch.gps.entity.LiveGpsLocation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LiveGpsLocationRepository extends JpaRepository<LiveGpsLocation, Long> {
    Optional<LiveGpsLocation> findByTruckId(Long truckId);
    List<LiveGpsLocation> findByTruckIdIn(List<Long> truckIds);
}

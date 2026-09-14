package com.backhaulmatch.fleet.repository;

import com.backhaulmatch.fleet.entity.Truck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TruckRepository extends JpaRepository<Truck, Long> {
    List<Truck> findByFleetCompanyId(Long fleetCompanyId);
    boolean existsByTruckNo(String truckNo);

    // Admin Portal.
    long countByStatus(Truck.Status status);
}

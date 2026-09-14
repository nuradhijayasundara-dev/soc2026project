package com.backhaulmatch.fleet.repository;

import com.backhaulmatch.fleet.entity.Driver;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DriverRepository extends JpaRepository<Driver, Long> {
    List<Driver> findByFleetCompanyId(Long fleetCompanyId);
    List<Driver> findByFleetCompanyIdAndStatus(Long fleetCompanyId, Driver.Status status);
    Optional<Driver> findByUserId(Long userId);

    // Admin Portal.
    long countByStatus(Driver.Status status);
}

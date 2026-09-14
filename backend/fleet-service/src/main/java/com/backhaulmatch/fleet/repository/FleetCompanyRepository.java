package com.backhaulmatch.fleet.repository;

import com.backhaulmatch.fleet.entity.FleetCompany;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FleetCompanyRepository extends JpaRepository<FleetCompany, Long> {
    Optional<FleetCompany> findByUserId(Long userId);
}

package com.backhaulmatch.courier.repository;

import com.backhaulmatch.courier.entity.CourierCompany;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CourierCompanyRepository extends JpaRepository<CourierCompany, Long> {
    Optional<CourierCompany> findByUserId(Long userId);
}

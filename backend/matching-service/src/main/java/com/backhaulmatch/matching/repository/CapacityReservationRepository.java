package com.backhaulmatch.matching.repository;

import com.backhaulmatch.matching.entity.CapacityReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;

public interface CapacityReservationRepository extends JpaRepository<CapacityReservation, Long> {
    Optional<CapacityReservation> findByMatchResultId(Long matchResultId);

    // "Platform Reports" — total capacity utilized: every reservation that was
    // actually confirmed into a booking (RESERVED-but-still-pending doesn't
    // count as "utilized" yet, RELEASED doesn't count at all).
    @Query("SELECT SUM(r.reservedCapacityTon) FROM CapacityReservation r WHERE r.status = :status")
    BigDecimal sumReservedCapacityTonByStatus(@Param("status") CapacityReservation.Status status);

    // Admin Portal.
    long countByStatus(CapacityReservation.Status status);
}

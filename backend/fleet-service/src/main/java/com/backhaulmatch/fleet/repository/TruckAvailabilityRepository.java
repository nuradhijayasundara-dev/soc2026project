package com.backhaulmatch.fleet.repository;

import com.backhaulmatch.fleet.entity.TruckAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface TruckAvailabilityRepository extends JpaRepository<TruckAvailability, Long> {
    List<TruckAvailability> findByTruckId(Long truckId);
    List<TruckAvailability> findByStatus(TruckAvailability.Status status);
    List<TruckAvailability> findByTruckIdInOrderByAvailableFromDesc(List<Long> truckIds);

    // Cross-company search used by matching-service: exact-route match, enough
    // spare capacity, and still AVAILABLE (not already booked/expired).
    @Query("""
        SELECT a FROM TruckAvailability a
        WHERE a.status = :status
          AND (:from IS NULL OR LOWER(a.routeFrom) = LOWER(:from))
          AND (:to IS NULL OR LOWER(a.routeTo) = LOWER(:to))
          AND a.availableCapacityTon >= :minCapacityTon
        ORDER BY a.availableCapacityTon ASC
        """)
    List<TruckAvailability> search(@Param("from") String from,
                                    @Param("to") String to,
                                    @Param("minCapacityTon") BigDecimal minCapacityTon,
                                    @Param("status") TruckAvailability.Status status);

    // "Fleet Reports" — used capacity: every ton currently committed (BOOKED)
    // across this company's trucks. A plain SQL SUM, no report table involved.
    @Query("""
        SELECT SUM(a.availableCapacityTon) FROM TruckAvailability a
        WHERE a.truckId IN :truckIds AND a.status = :status
        """)
    BigDecimal sumCapacityTonByTruckIdInAndStatus(@Param("truckIds") List<Long> truckIds,
                                                    @Param("status") TruckAvailability.Status status);
}

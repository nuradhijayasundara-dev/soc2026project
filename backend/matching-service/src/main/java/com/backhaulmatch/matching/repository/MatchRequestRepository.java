package com.backhaulmatch.matching.repository;

import com.backhaulmatch.matching.entity.MatchRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchRequestRepository extends JpaRepository<MatchRequest, Long> {
    List<MatchRequest> findByShipmentId(Long shipmentId);
    List<MatchRequest> findByRequestedByUserIdOrderByCreatedAtDesc(Long userId);

    // Backs the WAITING_FOR_MATCH retry sweep — every request still waiting for a truck.
    List<MatchRequest> findByStatus(MatchRequest.Status status);

    // "Courier Reports" / "Platform Reports" — plain SQL-style aggregate counts,
    // no separate report table needed.
    long countByRequestedByUserIdAndStatus(Long requestedByUserId, MatchRequest.Status status);
    long count(); // total matches, platform-wide (inherited, listed for clarity)

    // Admin Portal.
    List<MatchRequest> findAllByOrderByCreatedAtDesc();
    long countByStatus(MatchRequest.Status status);
}

package com.backhaulmatch.matching.repository;

import com.backhaulmatch.matching.entity.MatchResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchResultRepository extends JpaRepository<MatchResult, Long> {
    // Match score is 0-100, higher = better fit — ranked results come back best-first.
    List<MatchResult> findByMatchRequestIdOrderByMatchScoreDesc(Long matchRequestId);

    // "Booking Requests" page in the Fleet Portal — pending confirmations for this fleet company.
    List<MatchResult> findByFleetCompanyIdAndStatusOrderByCreatedAtDesc(Long fleetCompanyId, MatchResult.Status status);

    // "Platform Reports" — successful bookings, platform-wide.
    long countByStatus(MatchResult.Status status);

    // Admin Portal.
    List<MatchResult> findAllByOrderByCreatedAtDesc();
}

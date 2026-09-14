package com.backhaulmatch.matching.controller;

import com.backhaulmatch.matching.entity.CapacityReservation;
import com.backhaulmatch.matching.entity.MatchRequest;
import com.backhaulmatch.matching.entity.MatchResult;
import com.backhaulmatch.matching.repository.CapacityReservationRepository;
import com.backhaulmatch.matching.repository.MatchRequestRepository;
import com.backhaulmatch.matching.repository.MatchResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin-only, read-only view over matching-service's own data ("Matching
 * Monitoring" + the booking side of "Booking Management" in the Admin
 * Portal). The API Gateway protects /api/matching/admin/** with
 * allowedRoles: "ADMIN" ahead of the generic /api/matching/** route (see
 * api-gateway/application.yml).
 *
 * This is separate from the existing /api/matching/reports/platform-summary
 * endpoint (ReportController — also ADMIN-only, self-checked via
 * X-User-Role), which stays as-is and keeps feeding the Dashboard's three
 * top-line figures. This controller adds the raw, per-status-breakdown lists
 * the dedicated Matching / Bookings admin pages need.
 */
@RestController
@RequestMapping("/api/matching/admin")
@RequiredArgsConstructor
public class MatchAdminController {

    private final MatchRequestRepository matchRequestRepository;
    private final MatchResultRepository matchResultRepository;
    private final CapacityReservationRepository reservationRepository;

    // "Matching Monitoring" — every match request raised on the platform.
    @GetMapping("/requests")
    public ResponseEntity<List<MatchRequest>> listRequests() {
        return ResponseEntity.ok(matchRequestRepository.findAllByOrderByCreatedAtDesc());
    }

    // "Matching Monitoring" / "Booking Management" — every candidate result,
    // including ACCEPTED ones, which double as the platform's bookings.
    @GetMapping("/results")
    public ResponseEntity<List<MatchResult>> listResults() {
        return ResponseEntity.ok(matchResultRepository.findAllByOrderByCreatedAtDesc());
    }

    @GetMapping("/reservations")
    public ResponseEntity<List<CapacityReservation>> listReservations() {
        return ResponseEntity.ok(reservationRepository.findAll());
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalRequests", matchRequestRepository.count());
        stats.put("totalResults", matchResultRepository.count());
        stats.put("totalReservations", reservationRepository.count());

        Map<String, Long> requestsByStatus = new LinkedHashMap<>();
        for (MatchRequest.Status s : MatchRequest.Status.values()) {
            requestsByStatus.put(s.name(), matchRequestRepository.countByStatus(s));
        }
        stats.put("requestsByStatus", requestsByStatus);

        Map<String, Long> resultsByStatus = new LinkedHashMap<>();
        for (MatchResult.Status s : MatchResult.Status.values()) {
            resultsByStatus.put(s.name(), matchResultRepository.countByStatus(s));
        }
        stats.put("resultsByStatus", resultsByStatus);

        Map<String, Long> reservationsByStatus = new LinkedHashMap<>();
        for (CapacityReservation.Status s : CapacityReservation.Status.values()) {
            reservationsByStatus.put(s.name(), reservationRepository.countByStatus(s));
        }
        stats.put("reservationsByStatus", reservationsByStatus);

        return ResponseEntity.ok(stats);
    }
}

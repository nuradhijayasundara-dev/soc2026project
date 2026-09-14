package com.backhaulmatch.matching.service;

import com.backhaulmatch.matching.dto.ReportDtos.CourierMatchSummaryResponse;
import com.backhaulmatch.matching.dto.ReportDtos.PlatformSummaryResponse;
import com.backhaulmatch.matching.entity.CapacityReservation;
import com.backhaulmatch.matching.entity.MatchRequest;
import com.backhaulmatch.matching.entity.MatchResult;
import com.backhaulmatch.matching.repository.CapacityReservationRepository;
import com.backhaulmatch.matching.repository.MatchRequestRepository;
import com.backhaulmatch.matching.repository.MatchResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Every figure here comes straight from a SQL aggregate query (COUNT/SUM) run
 * against the existing match_requests / match_results / capacity_reservations
 * tables at request time — deliberately no separate "reports" table to keep
 * in sync.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

    private final MatchRequestRepository matchRequestRepository;
    private final MatchResultRepository matchResultRepository;
    private final CapacityReservationRepository reservationRepository;

    public CourierMatchSummaryResponse getCourierMatchSummary(Long courierUserId) {
        long successful = matchRequestRepository.countByRequestedByUserIdAndStatus(
                courierUserId, MatchRequest.Status.MATCHED);
        return new CourierMatchSummaryResponse(successful);
    }

    public PlatformSummaryResponse getPlatformSummary() {
        long totalMatches = matchRequestRepository.count();
        long successfulBookings = matchResultRepository.countByStatus(MatchResult.Status.ACCEPTED);

        BigDecimal utilized = reservationRepository.sumReservedCapacityTonByStatus(CapacityReservation.Status.CONFIRMED);
        if (utilized == null) utilized = BigDecimal.ZERO;

        return new PlatformSummaryResponse(totalMatches, successfulBookings, utilized);
    }
}

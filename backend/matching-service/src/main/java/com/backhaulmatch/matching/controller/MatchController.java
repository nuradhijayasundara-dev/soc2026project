package com.backhaulmatch.matching.controller;

import com.backhaulmatch.matching.dto.MatchingDtos.CreateMatchRequestDto;
import com.backhaulmatch.matching.entity.MatchRequest;
import com.backhaulmatch.matching.entity.MatchResult;
import com.backhaulmatch.matching.service.MatchingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
public class MatchController {

    private final MatchingService matchingService;

    // Courier Portal's "Request Backhaul Transport" button
    @PostMapping("/requests")
    public ResponseEntity<MatchRequest> createRequest(@RequestHeader("X-User-Id") Long userId,
                                                        @Valid @RequestBody CreateMatchRequestDto request) {
        return ResponseEntity.ok(matchingService.createAndRun(request.shipmentId(), userId));
    }

    @GetMapping("/requests/{id}")
    public ResponseEntity<MatchRequest> getRequest(@PathVariable Long id,
                                                     @RequestHeader("X-User-Id") Long userId,
                                                     @RequestHeader(value = "X-User-Role", required = false) String role) {
        return ResponseEntity.ok(matchingService.getRequestForUser(id, userId, role));
    }

    // "4. MATCH RESULTS INTERFACE" — the ranked list of candidate trucks
    @GetMapping("/requests/{id}/results")
    public ResponseEntity<List<MatchResult>> getResults(@PathVariable Long id,
                                                          @RequestHeader("X-User-Id") Long userId,
                                                          @RequestHeader(value = "X-User-Role", required = false) String role) {
        return ResponseEntity.ok(matchingService.getResultsForUser(id, userId, role));
    }

    // Courier Portal's "Check again" button on a WAITING_FOR_MATCH request — forces an
    // immediate re-run instead of waiting for the background retry sweep.
    @PostMapping("/requests/{id}/retry")
    public ResponseEntity<MatchRequest> retry(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(matchingService.retryOne(id, userId));
    }

    // "Courier Accepts" — Member 2's Accept Match button. Verifies + reserves
    // truck capacity immediately (see MatchingService.acceptMatch) and notifies
    // the fleet manager. Status becomes PENDING_CONFIRMATION.
    @PostMapping("/results/{id}/accept-match")
    public ResponseEntity<MatchResult> acceptMatch(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(matchingService.acceptMatch(id, userId));
    }

    // Fleet Portal's "Booking Requests" page — everything awaiting this fleet manager's decision
    @GetMapping("/bookings/pending")
    public ResponseEntity<List<MatchResult>> getPendingBookings(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(matchingService.getPendingBookingsForUser(userId));
    }

    // Step 2a: fleet manager accepts -> "Booking accepted" notification to the courier
    @PostMapping("/results/{id}/accept")
    public ResponseEntity<MatchResult> accept(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(matchingService.acceptBooking(id, userId));
    }

    // Step 2b: fleet manager declines -> "Booking rejected" notification to the courier
    @PostMapping("/results/{id}/reject")
    public ResponseEntity<MatchResult> reject(@PathVariable Long id, @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(matchingService.rejectBooking(id, userId));
    }
}

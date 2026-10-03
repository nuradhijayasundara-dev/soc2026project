package com.backhaulmatch.matching.controller;

import com.backhaulmatch.matching.dto.ReportDtos.PlatformSummaryResponse;
import com.backhaulmatch.matching.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/matching/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    // "Platform Reports" — system-wide, so it's restricted to ADMIN. The Gateway's
    // JwtAuthFilter already forwards the caller's role as "X-User-Role" alongside
    // "X-User-Id", so no extra token parsing is needed here to enforce that.
    @GetMapping("/platform-summary")
    public ResponseEntity<PlatformSummaryResponse> platformSummary(@RequestHeader("X-User-Role") String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Platform reports are restricted to admins");
        }
        return ResponseEntity.ok(reportService.getPlatformSummary());
    }
}

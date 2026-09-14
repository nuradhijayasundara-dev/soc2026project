package com.backhaulmatch.matching.service;

import com.backhaulmatch.matching.client.CourierServiceClient;
import com.backhaulmatch.matching.client.FleetServiceClient;
import com.backhaulmatch.matching.client.NotificationClient;
import com.backhaulmatch.matching.client.OsrmClient;
import com.backhaulmatch.matching.client.PaymentServiceClient;
import com.backhaulmatch.matching.dto.MatchingDtos.AvailabilityCandidate;
import com.backhaulmatch.matching.entity.CapacityReservation;
import com.backhaulmatch.matching.entity.MatchRequest;
import com.backhaulmatch.matching.entity.MatchResult;
import com.backhaulmatch.matching.repository.CapacityReservationRepository;
import com.backhaulmatch.matching.repository.MatchRequestRepository;
import com.backhaulmatch.matching.repository.MatchResultRepository;
import com.backhaulmatch.matching.util.Places;
import com.backhaulmatch.matching.util.RouteContainment;
import com.backhaulmatch.matching.util.RouteContainment.Evaluation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class MatchingService {

    private final MatchRequestRepository matchRequestRepository;
    private final MatchResultRepository matchResultRepository;
    private final CapacityReservationRepository reservationRepository;
    private final CourierServiceClient courierServiceClient;
    private final FleetServiceClient fleetServiceClient;
    private final NotificationClient notificationClient;
    private final PaymentServiceClient paymentServiceClient;
    private final OsrmClient osrmClient;

    // Match Score facets — 100 = perfect, each serves one business question:
    // does the truck's posted route contain the shipment's route (40%)? is its
    // spare capacity roughly the shipment's size (25%)? is it near the pickup
    // (15%)? does its schedule line up (10%)? is it the right vehicle type (10%)?
    private static final double ROUTE_WEIGHT = 0.40;
    private static final double CAPACITY_WEIGHT = 0.25;
    private static final double PROXIMITY_WEIGHT = 0.15;
    private static final double TIME_WEIGHT = 0.10;
    private static final double VEHICLE_WEIGHT = 0.10;

    // Route compatibility is a hard gate, not a score: a shipment only matches a
    // truck when its pickup and destination occur sequentially ALONG the truck's
    // planned route (strict containment). See RouteContainment for the geometry.

    // Cost estimate only — the authoritative invoice comes from payment-service.
    private static final BigDecimal BASE_FARE = new BigDecimal("1000");
    private static final BigDecimal RATE_PER_KM = new BigDecimal("150");
    private static final BigDecimal RATE_PER_TON_FALLBACK = new BigDecimal("500");

    /**
     * The Matching Engine's core flow:
     *   1. Pull the shipment (route, coordinates, weight, dates) from courier-service.
     *   2. Create a MatchRequest snapshot.
     *   3. Ask fleet-service for every backhaul availability with enough spare capacity.
     *   4. Gate on strict route containment (shipment pickup then destination,
     *      sequentially along the truck's route), score each surviving candidate
     *      across the four weighted facets, and rank the rest.
     *   5. Persist the ranked list as MatchResult rows and return them.
     *   6. If anything was found, notify the requester — "Match found".
     */
    public MatchRequest createAndRun(Long shipmentId, Long userId) {
        Map<String, Object> shipment = courierServiceClient.getShipment(shipmentId);

        MatchRequest request = new MatchRequest();
        request.setShipmentId(shipmentId);
        request.setRequestedByUserId(userId);
        request.setPickupLocation((String) shipment.get("pickupLocation"));
        request.setDestination((String) shipment.get("destination"));
        request.setPickupLat(amount(shipment.get("pickupLat")));
        request.setPickupLng(amount(shipment.get("pickupLng")));
        request.setDestinationLat(amount(shipment.get("destinationLat")));
        request.setDestinationLng(amount(shipment.get("destinationLng")));
        request.setPickupDatetime(datetime(shipment.get("pickupDatetime")));
        request.setRequiredVehicleType((String) shipment.get("requiredVehicleType"));
        Object weight = shipment.get("weightKg");
        request.setWeightKg(weight == null ? BigDecimal.ZERO : new BigDecimal(weight.toString()));
        request.setStatus(MatchRequest.Status.PENDING);
        MatchRequest saved = matchRequestRepository.save(request);

        List<MatchResult> results = runMatching(saved);
        applyMatchOutcome(saved, results);
        return saved;
    }

    /**
     * A courier can force an immediate re-check on a request that's still
     * WAITING_FOR_MATCH instead of waiting for the scheduled sweep below —
     * same outcome, just on demand.
     */
    public MatchRequest retryOne(Long matchRequestId, Long courierUserId) {
        MatchRequest request = getRequest(matchRequestId);
        if (!request.getRequestedByUserId().equals(courierUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This match request isn't yours");
        }
        if (request.getStatus() != MatchRequest.Status.WAITING_FOR_MATCH) {
            return request; // already matched/cancelled — nothing to retry
        }
        applyMatchOutcome(request, runMatching(request));
        return request;
    }

    /**
     * Rule: a shipment is never permanently declared unmatched. Every request
     * still WAITING_FOR_MATCH gets re-scored here against whatever fleet
     * availability exists right now — this is what lets a truck a fleet
     * manager posts five minutes after the courier's request still produce a
     * match, and it's what fires the "a suitable vehicle became available"
     * notification without anyone having to ask again.
     */
    @Scheduled(fixedDelayString = "${matching.retry-interval-ms:60000}", initialDelayString = "30000")
    public void retryWaitingRequests() {
        for (MatchRequest request : matchRequestRepository.findByStatus(MatchRequest.Status.WAITING_FOR_MATCH)) {
            try {
                applyMatchOutcome(request, runMatching(request));
            } catch (Exception e) {
                // one candidate/service hiccup shouldn't stop the sweep for every other request
            }
        }
    }

    /** Shared by createAndRun/retryOne/retryWaitingRequests: persist status + notify on a fresh find. */
    private void applyMatchOutcome(MatchRequest request, List<MatchResult> results) {
        if (results.isEmpty()) {
            if (request.getStatus() != MatchRequest.Status.WAITING_FOR_MATCH) {
                request.setStatus(MatchRequest.Status.WAITING_FOR_MATCH);
                matchRequestRepository.save(request);
            }
            return;
        }
        boolean wasWaiting = request.getStatus() == MatchRequest.Status.WAITING_FOR_MATCH;
        request.setStatus(MatchRequest.Status.PENDING);
        matchRequestRepository.save(request);
        notificationClient.notify(
                request.getRequestedByUserId(),
                "MATCH_FOUND",
                wasWaiting ? "A suitable vehicle became available" : "Backhaul trucks found",
                String.format("%d truck(s) available for your shipment from %s to %s.",
                        results.size(), request.getPickupLocation(), request.getDestination()),
                request.getId()
        );
    }

    /**
     * Capacity matching + strict route containment. fleet-service's search is
     * called with NO route filter so it returns every AVAILABLE slot with
     * enough capacity; matching-service drops every candidate whose route does
     * NOT contain the shipment's route (pickup then destination, sequentially,
     * along the truck's planned route) and ranks the survivors by the weighted
     * facets.
     */
    private List<MatchResult> runMatching(MatchRequest request) {
        BigDecimal requiredTon = toTons(request.getWeightKg());

        List<AvailabilityCandidate> candidates = fleetServiceClient.searchAvailability(null, null, requiredTon);

        List<MatchResult> results = candidates.stream()
                .map(c -> toScoredResult(request, c, requiredTon))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingDouble(MatchResult::getMatchScore).reversed())
                .limit(10)
                .toList();

        return matchResultRepository.saveAll(results);
    }

    private MatchResult toScoredResult(MatchRequest request, AvailabilityCandidate c, BigDecimal requiredTon) {
        // Strict containment gate — unknown geometry never qualifies.
        Evaluation containment = RouteContainment.evaluate(
                coords(c.routeFrom(), c.routeFromLat(), c.routeFromLng()),
                coords(c.routeTo(), c.routeToLat(), c.routeToLng()),
                coords(request.getPickupLocation(), request.getPickupLat(), request.getPickupLng()),
                coords(request.getDestination(), request.getDestinationLat(), request.getDestinationLng()));
        if (!containment.contained) {
            return null;
        }

        MatchResult result = new MatchResult();
        result.setMatchRequestId(request.getId());
        result.setTruckAvailabilityId(c.id());
        result.setTruckId(c.truckId());
        result.setFleetCompanyId(c.fleetCompanyId());
        result.setTruckNo(c.truckNo());
        result.setTruckType(c.truckType());
        result.setAvailableCapacityTon(c.availableCapacityTon());
        result.setRouteFrom(c.routeFrom());
        result.setRouteTo(c.routeTo());
        result.setRouteFromLat(c.routeFromLat());
        result.setRouteFromLng(c.routeFromLng());
        result.setRouteToLat(c.routeToLat());
        result.setRouteToLng(c.routeToLng());

        // Shipment's own OSRM route — drives the estimate + the results screen.
        OsrmClient.Route shipmentRoute = osrmClient.resolve(
                request.getPickupLocation(), request.getPickupLat(), request.getPickupLng(),
                request.getDestination(), request.getDestinationLat(), request.getDestinationLng());
        double shipmentKm = shipmentRoute == null ? 0.0 : shipmentRoute.distanceKm();
        result.setRouteDistanceKm(shipmentRoute == null ? null : shipmentRoute.distanceKm());
        result.setRouteDurationMin(shipmentRoute == null ? null : shipmentRoute.durationMin());
        result.setEstimatedCost(estimateCost(request, shipmentKm));

        // Truck's posted start -> shipment pickup, and posted end -> shipment
        // destination, as OSRM driving legs. Same leg 1 also feeds Proximity.
        // distanceKm = empty reposition the truck must still make around the
        // shipment's contained segment (display only — containment is the gate).
        OsrmClient.Route toPickup = osrmClient.resolve(
                c.routeFrom(), c.routeFromLat(), c.routeFromLng(),
                null, request.getPickupLat(), request.getPickupLng());
        OsrmClient.Route toDestination = osrmClient.resolve(
                c.routeTo(), c.routeToLat(), c.routeToLng(),
                null, request.getDestinationLat(), request.getDestinationLng());

        double leg1Km = toPickup == null ? 500.0 : toPickup.distanceKm();
        double leg2Km = toDestination == null ? 500.0 : toDestination.distanceKm();
        result.setDistanceKm(leg1Km + leg2Km);

        double routeScore = RouteContainment.routeScore(containment);
        double capacityScore = capacityScore(requiredTon, c.availableCapacityTon());
        double proximityScore = clamp(100 - leg1Km * 1.5);
        double timeScore = timeScore(request.getPickupDatetime(), c.availableFrom());
        double vehicleScore = vehicleScore(request.getRequiredVehicleType(), c.truckType());

        result.setRouteScore(round1(routeScore));
        result.setCapacityScore(round1(capacityScore));
        result.setProximityScore(round1(proximityScore));
        result.setTimeScore(round1(timeScore));
        result.setVehicleScore(round1(vehicleScore));
        result.setMatchScore(round2(
                routeScore * ROUTE_WEIGHT + capacityScore * CAPACITY_WEIGHT
                        + proximityScore * PROXIMITY_WEIGHT + timeScore * TIME_WEIGHT
                        + vehicleScore * VEHICLE_WEIGHT));

        result.setStatus(MatchResult.Status.RECOMMENDED);
        return result;
    }

    /** Least-wasted-capacity wins: a 2.5t truck beats a 4.5t truck for a 2t shipment. */
    private double capacityScore(BigDecimal requiredTon, BigDecimal availableTon) {
        if (requiredTon == null || availableTon == null || requiredTon.signum() <= 0) {
            return 60.0;
        }
        double required = requiredTon.doubleValue();
        double available = availableTon.doubleValue();
        double wasted = Math.max(available - required, 0);
        double denom = required + 1.0; // a ton of slack is "good enough" — no penalty
        return clamp(100 - (wasted / denom) * 50);
    }

    /** How well the truck's posted start lines up with the shipment pickup window. */
    private double timeScore(LocalDateTime pickupDatetime, String availableFrom) {
        if (pickupDatetime == null || availableFrom == null) return 60.0;
        try {
            double diffHours = Math.abs(pickupDatetime.toEpochSecond(java.time.ZoneOffset.UTC)
                    - OffsetDateTime.parse(availableFrom).toEpochSecond()) / 3600.0;
            return clamp(100 - diffHours * 2);
        } catch (Exception e) {
            return 60.0;
        }
    }

    private double vehicleScore(String requiredType, String truckType) {
        if (requiredType == null || requiredType.isBlank()) return 60.0;
        if (truckType != null && truckType.toLowerCase().contains(requiredType.toLowerCase())) return 100.0;
        return 40.0;
    }

    private BigDecimal estimateCost(MatchRequest request, Double shipmentRouteKm) {
        if (shipmentRouteKm != null && shipmentRouteKm > 0) {
            return BASE_FARE.add(BigDecimal.valueOf(shipmentRouteKm).multiply(RATE_PER_KM)).setScale(2, RoundingMode.HALF_UP);
        }
        return toTons(request.getWeightKg()).multiply(RATE_PER_TON_FALLBACK).setScale(2, RoundingMode.HALF_UP);
    }

    public List<MatchResult> getResults(Long matchRequestId) {
        return matchResultRepository.findByMatchRequestIdOrderByMatchScoreDesc(matchRequestId);
    }

    public MatchRequest getRequest(Long id) {
        return matchRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match request not found"));
    }

    private MatchResult getResult(Long id) {
        return matchResultRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match result not found"));
    }

    /**
     * "Courier Accepts" -> "Booking Created" -> "Truck Capacity Reserved", all in one step:
     * re-verifies capacity and immediately reserves the slot in fleet-service (BOOKED),
     * records a CapacityReservation, marks the result PENDING_CONFIRMATION, and sends
     * the fleet manager a "booking request" notification.
     */
    public MatchResult acceptMatch(Long matchResultId, Long courierUserId) {
        MatchResult result = getResult(matchResultId);
        if (result.getStatus() != MatchResult.Status.RECOMMENDED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This candidate is no longer available");
        }

        MatchRequest request = getRequest(result.getMatchRequestId());
        if (!request.getRequestedByUserId().equals(courierUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This match request isn't yours");
        }

        BigDecimal requiredTon = toTons(request.getWeightKg());

        try {
            fleetServiceClient.reserveCapacity(result.getTruckAvailabilityId(), requiredTon);
        } catch (HttpClientErrorException.Conflict e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This truck's capacity was just taken by another shipment — pick a different candidate");
        }

        result.setStatus(MatchResult.Status.PENDING_CONFIRMATION);
        MatchResult saved = matchResultRepository.save(result);

        CapacityReservation reservation = new CapacityReservation();
        reservation.setMatchResultId(result.getId());
        reservation.setTruckAvailabilityId(result.getTruckAvailabilityId());
        reservation.setReservedCapacityTon(requiredTon);
        reservation.setStatus(CapacityReservation.Status.RESERVED);
        reservationRepository.save(reservation);

        Long fleetOwnerUserId = fleetServiceClient.getCompanyOwnerUserId(result.getFleetCompanyId());
        if (fleetOwnerUserId != null) {
            notificationClient.notify(
                    fleetOwnerUserId,
                    "BOOKING_REQUESTED",
                    "New booking request",
                    String.format("A courier wants to book truck %s for the %s -> %s route. Capacity is reserved pending your decision.",
                            result.getTruckNo(), request.getPickupLocation(), request.getDestination()),
                    result.getId()
            );
        }

        return saved;
    }

    /** "Booking Requests" page in the Fleet Portal: everything awaiting this company's decision. */
    public List<MatchResult> getPendingBookingsForUser(Long fleetManagerUserId) {
        Long companyId = fleetServiceClient.getCompanyIdForUser(fleetManagerUserId);
        return matchResultRepository.findByFleetCompanyIdAndStatusOrderByCreatedAtDesc(
                companyId, MatchResult.Status.PENDING_CONFIRMATION);
    }

    /** Fleet manager accepts — the reservation becomes permanent, siblings are auto-rejected. */
    public MatchResult acceptBooking(Long matchResultId) {
        MatchResult chosen = getResult(matchResultId);
        if (chosen.getStatus() != MatchResult.Status.PENDING_CONFIRMATION) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This booking request is no longer pending");
        }
        chosen.setStatus(MatchResult.Status.ACCEPTED);
        matchResultRepository.save(chosen);

        reservationRepository.findByMatchResultId(chosen.getId()).ifPresent(r -> {
            r.setStatus(CapacityReservation.Status.CONFIRMED);
            reservationRepository.save(r);
        });

        List<MatchResult> siblings = matchResultRepository.findByMatchRequestIdOrderByMatchScoreDesc(chosen.getMatchRequestId());
        for (MatchResult sibling : siblings) {
            if (!sibling.getId().equals(chosen.getId()) && sibling.getStatus() != MatchResult.Status.REJECTED) {
                sibling.setStatus(MatchResult.Status.REJECTED);
            }
        }
        matchResultRepository.saveAll(siblings);

        MatchRequest request = getRequest(chosen.getMatchRequestId());
        request.setStatus(MatchRequest.Status.MATCHED);
        matchRequestRepository.save(request);

        notificationClient.notify(
                request.getRequestedByUserId(),
                "BOOKING_ACCEPTED",
                "Booking accepted",
                String.format("Truck %s confirmed for your shipment from %s to %s.",
                        chosen.getTruckNo(), request.getPickupLocation(), request.getDestination()),
                request.getShipmentId()
        );

        fleetServiceClient.createTripForBooking(chosen.getTruckId(), request.getShipmentId());
        paymentServiceClient.createInvoice(
                request.getShipmentId(), chosen.getId(), request.getRequestedByUserId(), chosen.getFleetCompanyId(),
                chosen.getTruckNo(), chosen.getRouteDistanceKm() != null ? chosen.getRouteDistanceKm() : chosen.getDistanceKm(),
                request.getWeightKg()
        );

        return chosen;
    }

    /** Fleet manager declines — release the reserved capacity, notify the courier, try again. */
    public MatchResult rejectBooking(Long matchResultId) {
        MatchResult result = getResult(matchResultId);
        if (result.getStatus() != MatchResult.Status.PENDING_CONFIRMATION) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This booking request is no longer pending");
        }
        result.setStatus(MatchResult.Status.REJECTED);
        matchResultRepository.save(result);

        fleetServiceClient.releaseCapacity(result.getTruckAvailabilityId());
        reservationRepository.findByMatchResultId(result.getId()).ifPresent(r -> {
            r.setStatus(CapacityReservation.Status.RELEASED);
            reservationRepository.save(r);
        });

        MatchRequest request = getRequest(result.getMatchRequestId());
        notificationClient.notify(
                request.getRequestedByUserId(),
                "BOOKING_REJECTED",
                "Booking declined",
                String.format("Truck %s declined your booking request for the %s -> %s shipment. " +
                                "Try another recommended truck.",
                        result.getTruckNo(), request.getPickupLocation(), request.getDestination()),
                request.getShipmentId()
        );

        boolean anyLeft = matchResultRepository.findByMatchRequestIdOrderByMatchScoreDesc(request.getId()).stream()
                .anyMatch(r -> r.getStatus() == MatchResult.Status.RECOMMENDED || r.getStatus() == MatchResult.Status.PENDING_CONFIRMATION);
        if (!anyLeft) {
            // Not a dead end — WAITING_FOR_MATCH puts this request back in the
            // scheduled retry sweep so a newly-posted truck can still pick it up.
            request.setStatus(MatchRequest.Status.WAITING_FOR_MATCH);
            matchRequestRepository.save(request);
        }

        return result;
    }

    private static double clamp(double v) {
        return Math.max(0, Math.min(100, v));
    }

    private static double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }

    private BigDecimal toTons(BigDecimal weightKg) {
        return weightKg == null ? BigDecimal.ZERO : weightKg.divide(new BigDecimal("1000"), 4, RoundingMode.HALF_UP);
    }

    /** Coordinates for a place: explicit lat/lng win, else town-centre lookup by name. */
    private static double[] coords(String place, Double lat, Double lng) {
        if (lat != null && lng != null) return new double[]{lat, lng};
        return Places.coordFor(place);
    }

    private static Double amount(Object value) {
        if (value == null) return null;
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static LocalDateTime datetime(Object value) {
        if (value == null) return null;
        try {
            return LocalDateTime.parse(value.toString());
        } catch (Exception e) {
            return null;
        }
    }
}
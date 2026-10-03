package com.backhaulmatch.courier.service;

import com.backhaulmatch.courier.client.MatchingServiceClient;
import com.backhaulmatch.courier.client.NotificationClient;
import com.backhaulmatch.courier.client.OsrmClient;
import com.backhaulmatch.courier.client.PaymentServiceClient;
import com.backhaulmatch.courier.dto.CourierDtos.*;
import com.backhaulmatch.courier.entity.Customer;
import com.backhaulmatch.courier.entity.CourierCompany;
import com.backhaulmatch.courier.entity.Receiver;
import com.backhaulmatch.courier.entity.Shipment;
import com.backhaulmatch.courier.entity.ShipmentTracking;
import com.backhaulmatch.courier.repository.CourierCompanyRepository;
import com.backhaulmatch.courier.repository.ShipmentRepository;
import com.backhaulmatch.courier.repository.ShipmentTrackingRepository;
import com.backhaulmatch.courier.util.Places;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentTrackingRepository trackingRepository;
    private final CustomerService customerService;
    private final ReceiverService receiverService;
    private final CourierCompanyRepository courierCompanyRepository;
    private final NotificationClient notificationClient;
    private final MatchingServiceClient matchingServiceClient;
    private final PaymentServiceClient paymentServiceClient;
    private final OsrmClient osrmClient;

    // Creation-time price estimate (LKR). The authoritative, configurable
    // invoice comes from payment-service at booking time — this is just what
    // the "price estimate" step shows before the shipment exists.
    private static final BigDecimal BASE_FARE = new BigDecimal("1000");
    private static final BigDecimal RATE_PER_KM = new BigDecimal("150");

    public List<Shipment> listForCompany(Long courierCompanyId) {
        return shipmentRepository.findByCourierCompanyIdOrderByCreatedAtDesc(courierCompanyId);
    }

    public Shipment getById(Long id) {
        return shipmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));
    }

    /** Same as getById, but rejects access to shipments owned by a different courier company (ADMIN bypasses). */
    public Shipment getForCompany(Long id, Long callerCompanyId, String callerRole) {
        Shipment shipment = getById(id);
        if (!"ADMIN".equalsIgnoreCase(callerRole) && !shipment.getCourierCompanyId().equals(callerCompanyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your shipment");
        }
        return shipment;
    }

    // Status transitions allowed via the status update endpoints. MATCHED can go
    // straight to DELIVERED because trip completion (fleet-service, internal call)
    // marks delivery directly without the courier having manually set IN_TRANSIT first.
    private static final java.util.Map<Shipment.Status, java.util.Set<Shipment.Status>> ALLOWED_TRANSITIONS = java.util.Map.of(
            Shipment.Status.PENDING, java.util.Set.of(Shipment.Status.MATCHED, Shipment.Status.CANCELLED),
            Shipment.Status.MATCHED, java.util.Set.of(Shipment.Status.IN_TRANSIT, Shipment.Status.DELIVERED, Shipment.Status.CANCELLED),
            Shipment.Status.IN_TRANSIT, java.util.Set.of(Shipment.Status.DELIVERED, Shipment.Status.CANCELLED),
            Shipment.Status.DELIVERED, java.util.Set.of(),
            Shipment.Status.CANCELLED, java.util.Set.of()
    );

    public List<ShipmentTracking> getTrackingHistory(Long shipmentId) {
        return trackingRepository.findByShipmentIdOrderByUpdatedAtAsc(shipmentId);
    }

    public Shipment create(Long courierCompanyId, CreateShipmentRequest req) {
        // Resolve or create the customer
        Long customerId = req.customerId();
        if (customerId == null) {
            if (req.newCustomer() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Either customerId or newCustomer must be provided");
            }
            Customer customer = customerService.create(courierCompanyId, req.newCustomer());
            customerId = customer.getId();
        } else {
            customerService.getById(customerId); // validates it exists
        }

        // Create the receiver for this shipment
        Receiver receiver = receiverService.create(req.receiver());

        Shipment shipment = new Shipment();
        shipment.setShipmentCode(nextShipmentCode());
        shipment.setCustomerId(customerId);
        shipment.setReceiverId(receiver.getId());
        shipment.setCourierCompanyId(courierCompanyId);
        shipment.setPickupLocation(req.pickupLocation());
        shipment.setPickupLat(coords(req.pickupLocation(), req.pickupLat()));
        shipment.setPickupLng(coordsLng(req.pickupLocation(), req.pickupLng()));
        shipment.setPickupDatetime(req.pickupDatetime());
        shipment.setDestination(req.destination());
        shipment.setDestinationLat(coords(req.destination(), req.destinationLat()));
        shipment.setDestinationLng(coordsLng(req.destination(), req.destinationLng()));
        shipment.setRequiredVehicleType(req.requiredVehicleType());
        shipment.setDeliveryDeadline(req.deliveryDeadline());
        shipment.setWeightKg(req.weightKg());
        shipment.setDimensions(req.dimensions());
        shipment.setParcelType(req.parcelType());
        shipment.setRemarks(req.remarks());
        shipment.setPriority(parsePriority(req.priority()));
        shipment.setStatus(Shipment.Status.PENDING);

        // OSRM (road) distance + duration for the shipment's own route; drives
        // the price estimate and, later, the tracking map's planned route.
        OsrmClient.Route route = osrmClient.between(
                shipment.getPickupLat(), shipment.getPickupLng(),
                shipment.getDestinationLat(), shipment.getDestinationLng());
        if (route != null) {
            shipment.setDistanceKm(route.distanceKm());
            shipment.setEstimatedDurationMin(route.durationMin());
        }
        shipment.setEstimatedCost(resolveEstimatedCost(shipment));

        Shipment saved = shipmentRepository.save(shipment);
        recordTracking(saved.getId(), "PENDING", req.pickupLocation());
        return saved;
    }

    private static Double coords(String name, Double explicit) {
        if (explicit != null) return explicit;
        double[] resolved = Places.coordFor(name);
        return resolved == null ? null : resolved[0];
    }

    private static Double coordsLng(String name, Double explicit) {
        if (explicit != null) return explicit;
        double[] resolved = Places.coordFor(name);
        return resolved == null ? null : resolved[1];
    }

    /**
     * The Pricing Service (payment-service) is the source of truth — this
     * mirrors the same distance/weight/volume/vehicle/priority/backhaul-discount
     * calculation shown to the courier before they clicked "Create Shipment".
     * Falls back to a bare distance+weight estimate only if payment-service
     * can't be reached, so shipment creation never hard-fails on pricing.
     */
    private BigDecimal resolveEstimatedCost(Shipment shipment) {
        BigDecimal remote = paymentServiceClient.getPriceEstimate(
                shipment.getDistanceKm(), shipment.getWeightKg(), shipment.getDimensions(),
                shipment.getRequiredVehicleType(), shipment.getPriority().name());
        return remote != null ? remote : estimateCost(shipment.getDistanceKm(), shipment.getWeightKg());
    }

    private static BigDecimal estimateCost(Double distanceKm, BigDecimal weightKg) {
        if (distanceKm != null && distanceKm > 0) {
            return BASE_FARE.add(BigDecimal.valueOf(distanceKm).multiply(RATE_PER_KM)).setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal tons = weightKg == null ? BigDecimal.ZERO
                : weightKg.divide(new BigDecimal("1000"), 4, RoundingMode.HALF_UP);
        return BASE_FARE.multiply(BigDecimal.ONE).add(tons.multiply(new BigDecimal("500"))).setScale(2, RoundingMode.HALF_UP);
    }

    private static Shipment.Priority parsePriority(String priority) {
        if (priority == null || priority.isBlank()) return Shipment.Priority.STANDARD;
        try {
            return Shipment.Priority.valueOf(priority.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return Shipment.Priority.STANDARD;
        }
    }

    public Shipment updateStatus(Long shipmentId, Long callerCompanyId, String callerRole, StatusUpdateRequest req) {
        Shipment shipment = getForCompany(shipmentId, callerCompanyId, callerRole);
        return applyStatusUpdate(shipment, req);
    }

    /** Used by the internal (non-Gateway, service-to-service) endpoint — no company ownership to check. */
    public Shipment updateStatusInternal(Long shipmentId, StatusUpdateRequest req) {
        Shipment shipment = getById(shipmentId);
        return applyStatusUpdate(shipment, req);
    }

    private Shipment applyStatusUpdate(Shipment shipment, StatusUpdateRequest req) {
        Long shipmentId = shipment.getId();
        Shipment.Status newStatus;
        try {
            newStatus = Shipment.Status.valueOf(req.status().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + req.status());
        }
        if (!ALLOWED_TRANSITIONS.getOrDefault(shipment.getStatus(), java.util.Set.of()).contains(newStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot transition shipment from " + shipment.getStatus() + " to " + newStatus);
        }
        shipment.setStatus(newStatus);
        Shipment saved = shipmentRepository.save(shipment);
        recordTracking(shipmentId, newStatus.name(), req.location());

        courierCompanyRepository.findById(shipment.getCourierCompanyId()).ifPresent(company ->
                notificationClient.notify(
                        company.getUserId(),
                        "SHIPMENT_STATUS",
                        "Shipment " + shipment.getShipmentCode() + " is now " + newStatus.name(),
                        req.location() != null
                                ? "Last seen at " + req.location() + "."
                                : "Status updated.",
                        shipment.getId()
                )
        );

        return saved;
    }

    public DashboardSummary getDashboardSummary(Long courierCompanyId) {
        long total = shipmentRepository.countByCourierCompanyId(courierCompanyId);
        long matched = shipmentRepository.countByCourierCompanyIdAndStatus(courierCompanyId, Shipment.Status.MATCHED);
        long inTransit = shipmentRepository.countByCourierCompanyIdAndStatus(courierCompanyId, Shipment.Status.IN_TRANSIT);
        long delivered = shipmentRepository.countByCourierCompanyIdAndStatus(courierCompanyId, Shipment.Status.DELIVERED);
        return new DashboardSummary(total, matched, inTransit, delivered);
    }

    /**
     * "Courier Reports": total shipments / delivered / cancelled are this
     * service's own SQL COUNT queries; successful matches and cost savings
     * are fetched live from matching-service and payment-service (each
     * computed there the same way — SQL aggregates, no shared report table).
     */
    public CourierReportSummary getReportSummary(Long courierUserId, Long courierCompanyId) {
        long total = shipmentRepository.countByCourierCompanyId(courierCompanyId);
        long delivered = shipmentRepository.countByCourierCompanyIdAndStatus(courierCompanyId, Shipment.Status.DELIVERED);
        long cancelled = shipmentRepository.countByCourierCompanyIdAndStatus(courierCompanyId, Shipment.Status.CANCELLED);

        long successfulMatches = matchingServiceClient.getSuccessfulMatchCount(courierUserId);
        var costSavings = paymentServiceClient.getCostSavings(courierUserId);

        return new CourierReportSummary(total, delivered, cancelled, successfulMatches, costSavings);
    }

    private void recordTracking(Long shipmentId, String status, String location) {
        ShipmentTracking tracking = new ShipmentTracking();
        tracking.setShipmentId(shipmentId);
        tracking.setStatus(status);
        tracking.setLocation(location);
        trackingRepository.save(tracking);
    }

    // Next code is derived from the highest existing code in the DB (not from
    // count()+an in-memory counter) so it stays unique across service restarts
    // even after rows are deleted. Code is SHP-0001..SHP-9999; the zero pad keeps
    // lexicographic ordering aligned with numeric order for 4-digit codes.
    private synchronized String nextShipmentCode() {
        long n = shipmentRepository.findMaxShipmentCodeNumber().orElse(0L) + 1;
        return String.format("SHP-%04d", n);
    }
}

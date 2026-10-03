package com.backhaulmatch.fleet.service;

import com.backhaulmatch.fleet.client.CourierServiceClient;
import com.backhaulmatch.fleet.dto.TripDtos.AssignDriverRequest;
import com.backhaulmatch.fleet.dto.TripDtos.CreateTripRequest;
import com.backhaulmatch.fleet.entity.Driver;
import com.backhaulmatch.fleet.entity.Trip;
import com.backhaulmatch.fleet.entity.Truck;
import com.backhaulmatch.fleet.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final TruckService truckService;
    private final DriverService driverService;
    private final CourierServiceClient courierServiceClient;

    public List<Trip> listForTrucks(List<Long> truckIds) {
        return tripRepository.findByTruckIdInOrderByStartTimeDesc(truckIds);
    }

    // Driver App: "which trips are assigned to me" — feeds the truck-selection screen.
    public List<Trip> listForDriver(Long driverId) {
        return tripRepository.findByDriverIdOrderByStartTimeDesc(driverId);
    }

    public Trip getById(Long id) {
        return tripRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Trip not found"));
    }

    /** Same as getById, but rejects access to a trip whose truck belongs to a different fleet company (ADMIN bypasses). */
    public Trip getForCompany(Long id, Long callerCompanyId, String callerRole) {
        Trip trip = getById(id);
        if (!"ADMIN".equalsIgnoreCase(callerRole)) {
            Truck truck = truckService.getById(trip.getTruckId());
            if (!truck.getFleetCompanyId().equals(callerCompanyId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your trip");
            }
        }
        return trip;
    }

    /** Driver App's "Start Trip" button. Only the assigned driver may start it. */
    public Trip startTrip(Long tripId, Long driverId) {
        Trip trip = getById(tripId);
        if (!trip.getDriverId().equals(driverId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This trip is not assigned to you");
        }
        if (trip.getStatus() != Trip.Status.SCHEDULED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Trip has already started or finished");
        }
        trip.setStatus(Trip.Status.IN_PROGRESS);
        trip.setStartTime(LocalDateTime.now());
        return tripRepository.save(trip);
    }

    /**
     * Creates a Trip for a truck (+ optionally a driver), optionally against a
     * real shipment. If a shipmentId is supplied we validate it exists by
     * calling courier-service directly (service-to-service, bypassing the Gateway).
     * driverId may be null — a trip created automatically when a booking is
     * accepted doesn't have one yet; the fleet manager assigns it afterwards.
     */
    public Trip create(CreateTripRequest req) {
        Truck truck = truckService.getById(req.truckId());
        if (truck.getStatus() != Truck.Status.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Truck is not available");
        }

        Driver driver = null;
        if (req.driverId() != null) {
            driver = driverService.getById(req.driverId());
            if (driver.getStatus() != Driver.Status.AVAILABLE) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Driver is not available");
            }
        }

        if (req.shipmentId() != null) {
            courierServiceClient.getShipment(req.shipmentId()); // throws 400 if it doesn't exist
        }

        Trip trip = new Trip();
        trip.setTruckId(req.truckId());
        trip.setDriverId(req.driverId());
        trip.setShipmentId(req.shipmentId());
        trip.setStatus(Trip.Status.SCHEDULED);
        Trip saved = tripRepository.save(trip);

        // BUGFIX: these status flips used to be made only on the in-memory
        // (detached) Truck/Driver objects and never persisted, so a truck
        // stayed AVAILABLE in the DB even while genuinely out on a trip —
        // letting it be double-booked into a second trip. Persist via the
        // owning service (same pattern DriverService.setStatus already used
        // in assignDriver() below).
        truckService.setStatus(truck.getId(), Truck.Status.ON_TRIP);
        if (driver != null) {
            driverService.setStatus(driver.getId(), Driver.Status.ON_TRIP);
        }

        return saved;
    }

    /**
     * Driver App's "Complete Delivery" button — the last leg of the main
     * workflow: Trip -> COMPLETED, truck + driver freed back to AVAILABLE,
     * and (if this trip was fulfilling a real shipment) courier-service is
     * told the shipment is DELIVERED. This was previously missing entirely —
     * a trip could be started but never actually finished.
     */
    public Trip completeTrip(Long tripId, Long driverId) {
        Trip trip = getById(tripId);
        if (!trip.getDriverId().equals(driverId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This trip is not assigned to you");
        }
        if (trip.getStatus() != Trip.Status.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Trip is not in progress");
        }
        trip.setStatus(Trip.Status.COMPLETED);
        trip.setEndTime(LocalDateTime.now());
        Trip saved = tripRepository.save(trip);

        truckService.setStatus(trip.getTruckId(), Truck.Status.AVAILABLE);
        driverService.setStatus(driverId, Driver.Status.AVAILABLE);

        courierServiceClient.updateShipmentStatus(trip.getShipmentId(), "DELIVERED");

        return saved;
    }

    /**
     * "Fleet receives booking" -> Trip created automatically the instant a
     * booking is accepted (called directly by matching-service, Eureka name,
     * no Gateway/JWT). Truck capacity was already reserved earlier when the
     * courier clicked "Accept Match" — this just gives the shipment a Trip to
     * track. No driver yet: the fleet manager assigns one via the existing
     * Trip list / "Driver Assignment" screen, and GPS tracking begins once
     * that driver starts the trip from the Driver App.
     */
    public Trip createFromBooking(Long truckId, Long shipmentId) {
        return create(new CreateTripRequest(truckId, null, shipmentId));
    }

    /** "Driver assignment" — assign (or reassign) a driver on an existing, not-yet-started trip. */
    public Trip assignDriver(Long tripId, Long callerCompanyId, String callerRole, AssignDriverRequest req) {
        Trip trip = getForCompany(tripId, callerCompanyId, callerRole);
        if (trip.getStatus() != Trip.Status.SCHEDULED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Can only reassign a driver before the trip starts");
        }
        Driver newDriver = driverService.getById(req.driverId());
        if (!"ADMIN".equalsIgnoreCase(callerRole) && !newDriver.getFleetCompanyId().equals(callerCompanyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Driver does not belong to your company");
        }
        if (newDriver.getStatus() != Driver.Status.AVAILABLE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Driver is not available");
        }

        if (trip.getDriverId() != null) {
            driverService.setStatus(trip.getDriverId(), Driver.Status.AVAILABLE); // free the old driver
        }
        trip.setDriverId(newDriver.getId());
        driverService.setStatus(newDriver.getId(), Driver.Status.ON_TRIP);

        return tripRepository.save(trip);
    }
}

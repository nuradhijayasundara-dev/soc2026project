package com.backhaulmatch.fleet.service;

import com.backhaulmatch.fleet.dto.FleetDtos.AvailabilityRequest;
import com.backhaulmatch.fleet.dto.FleetDtos.TruckRequest;
import com.backhaulmatch.fleet.entity.Truck;
import com.backhaulmatch.fleet.entity.TruckAvailability;
import com.backhaulmatch.fleet.repository.TruckAvailabilityRepository;
import com.backhaulmatch.fleet.repository.TruckRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TruckService {

    private final TruckRepository truckRepository;
    private final TruckAvailabilityRepository availabilityRepository;

    public List<Truck> listForCompany(Long fleetCompanyId) {
        return truckRepository.findByFleetCompanyId(fleetCompanyId);
    }

    public Truck getById(Long id) {
        return truckRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Truck not found"));
    }

    /** Same as getById, but rejects access to a truck owned by a different fleet company (ADMIN bypasses). */
    public Truck getForCompany(Long id, Long callerCompanyId, String callerRole) {
        Truck truck = getById(id);
        if (!"ADMIN".equalsIgnoreCase(callerRole) && !truck.getFleetCompanyId().equals(callerCompanyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your truck");
        }
        return truck;
    }

    public Truck register(Long fleetCompanyId, TruckRequest req) {
        if (truckRepository.existsByTruckNo(req.truckNo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Truck number already registered");
        }
        Truck truck = new Truck();
        truck.setFleetCompanyId(fleetCompanyId);
        truck.setTruckNo(req.truckNo());
        truck.setCapacityTon(req.capacityTon());
        truck.setTruckType(req.truckType());
        truck.setStatus(Truck.Status.AVAILABLE);
        return truckRepository.save(truck);
    }

    /** Persists a status change (e.g. AVAILABLE -&gt; ON_TRIP when a Trip is created). */
    public Truck setStatus(Long id, Truck.Status status) {
        Truck truck = getById(id);
        truck.setStatus(status);
        return truckRepository.save(truck);
    }

    /** "Truck details" screen: truck info + its availability list. */
    public List<TruckAvailability> getAvailability(Long truckId, Long callerCompanyId, String callerRole) {
        getForCompany(truckId, callerCompanyId, callerRole); // 404/403
        return availabilityRepository.findByTruckId(truckId);
    }

    /** "Available capacity input" screen: fleet manager posts a new lane + capacity + date. */
    public TruckAvailability addAvailability(Long truckId, Long callerCompanyId, String callerRole, AvailabilityRequest req) {
        getForCompany(truckId, callerCompanyId, callerRole);
        TruckAvailability availability = new TruckAvailability();
        availability.setTruckId(truckId);
        availability.setRouteFrom(req.routeFrom());
        availability.setRouteTo(req.routeTo());
        availability.setAvailableFrom(req.availableFrom());
        availability.setAvailableCapacityTon(req.availableCapacityTon());
        availability.setTripType(req.tripType() != null
                ? TruckAvailability.TripType.valueOf(req.tripType().toUpperCase())
                : TruckAvailability.TripType.BACKHAUL);
        availability.setStatus(TruckAvailability.Status.AVAILABLE);
        return availabilityRepository.save(availability);
    }
}

package com.backhaulmatch.fleet.service;

import com.backhaulmatch.fleet.dto.FleetDtos.DriverRequest;
import com.backhaulmatch.fleet.entity.Driver;
import com.backhaulmatch.fleet.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository repository;

    public List<Driver> listForCompany(Long fleetCompanyId) {
        return repository.findByFleetCompanyId(fleetCompanyId);
    }

    public List<Driver> listAvailableForCompany(Long fleetCompanyId) {
        return repository.findByFleetCompanyIdAndStatus(fleetCompanyId, Driver.Status.AVAILABLE);
    }

    public Driver getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));
    }

    public Driver getByUserId(Long userId) {
        return repository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No driver profile is linked to this account yet — ask your fleet manager to link it"));
    }

    public Driver register(Long fleetCompanyId, DriverRequest req) {
        Driver driver = new Driver();
        driver.setFleetCompanyId(fleetCompanyId);
        driver.setFullName(req.fullName());
        driver.setPhone(req.phone());
        driver.setLicenseNo(req.licenseNo());
        driver.setUserId(req.userId());
        driver.setStatus(Driver.Status.AVAILABLE);
        return repository.save(driver);
    }

    /** Lets a logged-in DRIVER account claim an unclaimed driver record by its id. */
    public Driver linkAccount(Long driverId, Long userId) {
        Driver driver = getById(driverId);
        if (driver.getUserId() != null && !driver.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This driver profile is already linked to another account");
        }
        driver.setUserId(userId);
        return repository.save(driver);
    }

    public Driver setStatus(Long driverId, Driver.Status status) {
        Driver driver = getById(driverId);
        driver.setStatus(status);
        return repository.save(driver);
    }
}

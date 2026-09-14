package com.backhaulmatch.fleet.service;

import com.backhaulmatch.fleet.dto.FleetDtos.CompanyRequest;
import com.backhaulmatch.fleet.entity.FleetCompany;
import com.backhaulmatch.fleet.repository.FleetCompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class FleetCompanyService {

    private final FleetCompanyRepository repository;

    public FleetCompany getByUserId(Long userId) {
        return repository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No fleet company registered for this account yet"));
    }

    public FleetCompany getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fleet company not found"));
    }

    public FleetCompany registerOrUpdate(Long userId, CompanyRequest req) {
        FleetCompany company = repository.findByUserId(userId).orElseGet(FleetCompany::new);
        company.setUserId(userId);
        company.setCompanyName(req.companyName());
        company.setRegistrationNo(req.registrationNo());
        company.setContactPhone(req.contactPhone());
        company.setAddress(req.address());
        return repository.save(company);
    }

    public Long resolveCompanyId(Long userId) {
        return getByUserId(userId).getId();
    }
}

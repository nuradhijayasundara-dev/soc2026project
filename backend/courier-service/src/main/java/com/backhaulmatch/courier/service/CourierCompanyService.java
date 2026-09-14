package com.backhaulmatch.courier.service;

import com.backhaulmatch.courier.dto.CourierDtos.CompanyRequest;
import com.backhaulmatch.courier.entity.CourierCompany;
import com.backhaulmatch.courier.repository.CourierCompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CourierCompanyService {

    private final CourierCompanyRepository repository;

    public CourierCompany getByUserId(Long userId) {
        return repository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No courier company registered for this account yet"));
    }

    /** Creates the company on first use, or updates it if the operator already has one. */
    public CourierCompany registerOrUpdate(Long userId, CompanyRequest req) {
        CourierCompany company = repository.findByUserId(userId).orElseGet(CourierCompany::new);
        company.setUserId(userId);
        company.setCompanyName(req.companyName());
        company.setRegistrationNo(req.registrationNo());
        company.setContactPhone(req.contactPhone());
        company.setAddress(req.address());
        return repository.save(company);
    }

    /** Internal helper used by other services in this app — resolves company id for a user. */
    public Long resolveCompanyId(Long userId) {
        return getByUserId(userId).getId();
    }
}

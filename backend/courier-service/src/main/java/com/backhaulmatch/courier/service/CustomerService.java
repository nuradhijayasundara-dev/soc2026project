package com.backhaulmatch.courier.service;

import com.backhaulmatch.courier.dto.CourierDtos.CustomerRequest;
import com.backhaulmatch.courier.entity.Customer;
import com.backhaulmatch.courier.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository repository;

    public List<Customer> listForCompany(Long courierCompanyId) {
        return repository.findByCourierCompanyId(courierCompanyId);
    }

    public Customer create(Long courierCompanyId, CustomerRequest req) {
        Customer customer = new Customer();
        customer.setCourierCompanyId(courierCompanyId);
        customer.setFullName(req.fullName());
        customer.setPhone(req.phone());
        customer.setEmail(req.email());
        return repository.save(customer);
    }

    public Customer getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
    }
}

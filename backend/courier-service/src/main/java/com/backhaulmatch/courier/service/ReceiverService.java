package com.backhaulmatch.courier.service;

import com.backhaulmatch.courier.dto.CourierDtos.ReceiverRequest;
import com.backhaulmatch.courier.entity.Receiver;
import com.backhaulmatch.courier.repository.ReceiverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ReceiverService {

    private final ReceiverRepository repository;

    public Receiver create(ReceiverRequest req) {
        Receiver receiver = new Receiver();
        receiver.setFullName(req.fullName());
        receiver.setPhone(req.phone());
        receiver.setAddress(req.address());
        return repository.save(receiver);
    }

    public Receiver getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver not found"));
    }
}

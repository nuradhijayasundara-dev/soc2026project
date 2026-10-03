package com.backhaulmatch.courier.service;

import com.backhaulmatch.courier.dto.CourierDtos.ReceiverRequest;
import com.backhaulmatch.courier.entity.Receiver;
import com.backhaulmatch.courier.entity.Shipment;
import com.backhaulmatch.courier.repository.ReceiverRepository;
import com.backhaulmatch.courier.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ReceiverService {

    private final ReceiverRepository repository;
    private final ShipmentRepository shipmentRepository;

    public Receiver create(ReceiverRequest req) {
        Receiver receiver = new Receiver();
        receiver.setFullName(req.fullName());
        receiver.setPhone(req.phone());
        receiver.setAddress(req.address());
        return repository.save(receiver);
    }

    /** Only the courier company whose shipment the receiver belongs to (or ADMIN) may read it. */
    public Receiver getForCompany(Long id, Long callerCompanyId, String callerRole) {
        Receiver receiver = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver not found"));
        if (!"ADMIN".equalsIgnoreCase(callerRole)) {
            Shipment owningShipment = shipmentRepository.findByReceiverId(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Receiver not found"));
            if (!owningShipment.getCourierCompanyId().equals(callerCompanyId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your receiver");
            }
        }
        return receiver;
    }
}

package com.backhaulmatch.courier.repository;

import com.backhaulmatch.courier.entity.ShipmentTracking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShipmentTrackingRepository extends JpaRepository<ShipmentTracking, Long> {
    List<ShipmentTracking> findByShipmentIdOrderByUpdatedAtAsc(Long shipmentId);
}

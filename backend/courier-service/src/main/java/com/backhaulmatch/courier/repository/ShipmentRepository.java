package com.backhaulmatch.courier.repository;

import com.backhaulmatch.courier.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByCourierCompanyIdOrderByCreatedAtDesc(Long courierCompanyId);
    Optional<Shipment> findByReceiverId(Long receiverId);

    // Native query so we only read back the numeric code, not a full row whose
    // legacy status may not map to the current entity enum.
    @Query(value = "SELECT MAX(CAST(SUBSTRING(shipment_code, 5) AS UNSIGNED)) FROM shipments", nativeQuery = true)
    Optional<Long> findMaxShipmentCodeNumber();

    long countByCourierCompanyId(Long courierCompanyId);
    long countByCourierCompanyIdAndStatus(Long courierCompanyId, Shipment.Status status);

    // Admin Portal (platform-wide, not scoped to one courier company).
    List<Shipment> findAllByOrderByCreatedAtDesc();
    List<Shipment> findByStatusOrderByCreatedAtDesc(Shipment.Status status);
    long countByStatus(Shipment.Status status);
}

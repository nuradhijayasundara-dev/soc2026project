package com.backhaulmatch.matching.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Created the moment a courier clicks "Accept Match" — reserves the truck's
 * capacity immediately (fleet-service's TruckAvailability flips to BOOKED at
 * the same time) so a second courier can't grab the same slot while the fleet
 * manager is still deciding. Confirmed on Accept, released on Reject.
 */
@Entity
@Table(name = "capacity_reservations")
@Data
public class CapacityReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_result_id", nullable = false)
    private Long matchResultId;

    @Column(name = "truck_availability_id", nullable = false)
    private Long truckAvailabilityId;

    @Column(name = "reserved_capacity_ton", nullable = false)
    private BigDecimal reservedCapacityTon;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.RESERVED;

    @Column(name = "reserved_at", updatable = false)
    private LocalDateTime reservedAt;

    @PrePersist
    public void prePersist() {
        this.reservedAt = LocalDateTime.now();
    }

    public enum Status {
        RESERVED,  // courier accepted the match, fleet manager hasn't decided yet
        CONFIRMED, // fleet manager accepted the booking
        RELEASED   // fleet manager rejected — capacity freed back up
    }
}

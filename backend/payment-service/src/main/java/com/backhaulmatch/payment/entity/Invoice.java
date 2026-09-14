package com.backhaulmatch.payment.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** One invoice per accepted booking — created automatically the moment a fleet manager accepts. */
@Entity
@Table(name = "invoices")
@Data
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_no", nullable = false, unique = true)
    private String invoiceNo; // e.g. INV-0001

    @Column(name = "shipment_id", nullable = false)
    private Long shipmentId; // references courier_db.shipments.id

    @Column(name = "match_result_id")
    private Long matchResultId; // references matching_db.match_results.id

    @Column(name = "courier_user_id", nullable = false)
    private Long courierUserId; // who owes this — references auth_db.users.id

    @Column(name = "fleet_company_id", nullable = false)
    private Long fleetCompanyId; // who earns this — references fleet_db.fleet_companies.id

    private String truckNo;
    private Double distanceKm;
    private BigDecimal weightKg;

    @Column(nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime paidAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }

    public enum Status {
        PENDING, PAID, FAILED
    }
}

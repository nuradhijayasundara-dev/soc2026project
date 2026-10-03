package com.backhaulmatch.payment.repository;

import com.backhaulmatch.payment.entity.Invoice;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByCourierUserIdOrderByCreatedAtDesc(Long courierUserId);
    List<Invoice> findByFleetCompanyIdOrderByCreatedAtDesc(Long fleetCompanyId);

    // Row-locks the invoice for the duration of the transaction so two concurrent
    // "pay" requests for the same invoice can't both pass the PAID check before
    // either commits (see InvoiceService.payInvoice).
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Invoice i WHERE i.id = :id")
    Optional<Invoice> findByIdForUpdate(@Param("id") Long id);

    long countByFleetCompanyId(Long fleetCompanyId);
    long countByFleetCompanyIdAndStatus(Long fleetCompanyId, Invoice.Status status);
    long countByCourierUserIdAndStatus(Long courierUserId, Invoice.Status status);

    // Sums are null when there are zero matching rows — callers handle that.
    @Query("SELECT SUM(i.amount) FROM Invoice i WHERE i.fleetCompanyId = :companyId AND i.status = :status")
    BigDecimal sumAmountByFleetCompanyIdAndStatus(@Param("companyId") Long companyId, @Param("status") Invoice.Status status);

    @Query("SELECT SUM(i.amount) FROM Invoice i WHERE i.courierUserId = :courierUserId AND i.status = :status")
    BigDecimal sumAmountByCourierUserIdAndStatus(@Param("courierUserId") Long courierUserId, @Param("status") Invoice.Status status);

    // Admin Portal — platform-wide, not scoped to one fleet company/courier.
    List<Invoice> findAllByOrderByCreatedAtDesc();
    long countByStatus(Invoice.Status status);

    @Query("SELECT SUM(i.amount) FROM Invoice i WHERE i.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") Invoice.Status status);
}

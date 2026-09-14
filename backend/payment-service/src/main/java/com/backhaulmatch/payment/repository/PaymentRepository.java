package com.backhaulmatch.payment.repository;

import com.backhaulmatch.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByInvoiceIdOrderByCreatedAtDesc(Long invoiceId);
}

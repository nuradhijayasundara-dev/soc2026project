package com.backhaulmatch.payment.service;

import com.backhaulmatch.payment.dto.PaymentDtos.CourierCostSummaryResponse;
import com.backhaulmatch.payment.dto.PaymentDtos.CreateInvoiceRequest;
import com.backhaulmatch.payment.dto.PaymentDtos.PayInvoiceRequest;
import com.backhaulmatch.payment.dto.PaymentDtos.PlatformRevenueSummaryResponse;
import com.backhaulmatch.payment.dto.PaymentDtos.RevenueSummaryResponse;
import com.backhaulmatch.payment.entity.Invoice;
import com.backhaulmatch.payment.entity.Payment;
import com.backhaulmatch.payment.repository.InvoiceRepository;
import com.backhaulmatch.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final PricingService pricingService;

    private final AtomicLong codeCounter = new AtomicLong(0);

    /** Called by matching-service the instant a fleet manager accepts a booking. */
    public Invoice createInvoice(CreateInvoiceRequest req) {
        Invoice invoice = new Invoice();
        invoice.setInvoiceNo(nextInvoiceNo());
        invoice.setShipmentId(req.shipmentId());
        invoice.setMatchResultId(req.matchResultId());
        invoice.setCourierUserId(req.courierUserId());
        invoice.setFleetCompanyId(req.fleetCompanyId());
        invoice.setTruckNo(req.truckNo());
        invoice.setDistanceKm(req.distanceKm());
        invoice.setWeightKg(req.weightKg());
        invoice.setAmount(pricingService.calculateCost(req.distanceKm(), req.weightKg()));
        invoice.setStatus(Invoice.Status.PENDING);
        return invoiceRepository.save(invoice);
    }

    public Invoice getById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found"));
    }

    public List<Invoice> listForCourier(Long courierUserId) {
        return invoiceRepository.findByCourierUserIdOrderByCreatedAtDesc(courierUserId);
    }

    public List<Invoice> listForFleetCompany(Long fleetCompanyId) {
        return invoiceRepository.findByFleetCompanyIdOrderByCreatedAtDesc(fleetCompanyId);
    }

    /**
     * Payment API — simulated: there's no real payment gateway wired up, so
     * this always succeeds and marks the invoice PAID immediately. Swap the
     * body of this method for a real gateway call (Stripe/PayHere/etc.) when
     * one is available; the rest of the flow (invoice status, payment
     * history) doesn't need to change.
     */
    public Payment payInvoice(Long invoiceId, PayInvoiceRequest req) {
        Invoice invoice = getById(invoiceId);
        if (invoice.getStatus() == Invoice.Status.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Invoice is already paid");
        }

        Payment.Method method;
        try {
            method = Payment.Method.valueOf(req.method().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment method: " + req.method());
        }

        Payment payment = new Payment();
        payment.setInvoiceId(invoiceId);
        payment.setAmount(invoice.getAmount());
        payment.setMethod(method);
        payment.setStatus(Payment.Status.SUCCESS); // simulated — always succeeds
        payment.setTransactionRef("SIM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        Payment savedPayment = paymentRepository.save(payment);

        invoice.setStatus(Invoice.Status.PAID);
        invoice.setPaidAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        return savedPayment;
    }

    public List<Payment> getPaymentHistory(Long invoiceId) {
        return paymentRepository.findByInvoiceIdOrderByCreatedAtDesc(invoiceId);
    }

    /**
     * "Courier Reports" — cost savings piece. Backhaul-Match's whole value
     * proposition is that booking a truck's empty return leg costs less than
     * booking a dedicated forward-haul truck. We don't have real market rate
     * data to compare against, so — clearly flagged as a placeholder —
     * "savings" is estimated as a fixed multiple of what was actually paid:
     * a dedicated truck is assumed to cost STANDARD_RATE_MULTIPLIER times as
     * much, so the difference is what backhaul matching "saved" the courier.
     * Swap this for a real rate-card comparison once one exists.
     */
    private static final BigDecimal STANDARD_RATE_MULTIPLIER = new BigDecimal("1.4");

    public CourierCostSummaryResponse getCourierCostSummary(Long courierUserId) {
        long paidCount = invoiceRepository.countByCourierUserIdAndStatus(courierUserId, Invoice.Status.PAID);
        BigDecimal totalSpent = invoiceRepository.sumAmountByCourierUserIdAndStatus(courierUserId, Invoice.Status.PAID);
        if (totalSpent == null) totalSpent = BigDecimal.ZERO;

        BigDecimal estimatedStandardCost = totalSpent.multiply(STANDARD_RATE_MULTIPLIER);
        BigDecimal costSavings = estimatedStandardCost.subtract(totalSpent).setScale(2, java.math.RoundingMode.HALF_UP);

        return new CourierCostSummaryResponse(paidCount, totalSpent, costSavings);
    }

    /** "Fleet revenue display" / "booking revenue dashboard" summary cards. */
    public RevenueSummaryResponse getRevenueSummary(Long fleetCompanyId) {
        long total = invoiceRepository.countByFleetCompanyId(fleetCompanyId);
        long paid = invoiceRepository.countByFleetCompanyIdAndStatus(fleetCompanyId, Invoice.Status.PAID);
        long pending = invoiceRepository.countByFleetCompanyIdAndStatus(fleetCompanyId, Invoice.Status.PENDING);

        BigDecimal paidRevenue = invoiceRepository.sumAmountByFleetCompanyIdAndStatus(fleetCompanyId, Invoice.Status.PAID);
        BigDecimal pendingRevenue = invoiceRepository.sumAmountByFleetCompanyIdAndStatus(fleetCompanyId, Invoice.Status.PENDING);

        return new RevenueSummaryResponse(
                total, paid, pending,
                paidRevenue == null ? BigDecimal.ZERO : paidRevenue,
                pendingRevenue == null ? BigDecimal.ZERO : pendingRevenue
        );
    }

    /** Admin Portal's Payment Management page — platform-wide, all fleet companies. */
    public PlatformRevenueSummaryResponse getPlatformRevenueSummary() {
        long total = invoiceRepository.count();
        long paid = invoiceRepository.countByStatus(Invoice.Status.PAID);
        long pending = invoiceRepository.countByStatus(Invoice.Status.PENDING);
        long failed = invoiceRepository.countByStatus(Invoice.Status.FAILED);

        BigDecimal paidRevenue = invoiceRepository.sumAmountByStatus(Invoice.Status.PAID);
        BigDecimal pendingRevenue = invoiceRepository.sumAmountByStatus(Invoice.Status.PENDING);

        return new PlatformRevenueSummaryResponse(
                total, paid, pending, failed,
                paidRevenue == null ? BigDecimal.ZERO : paidRevenue,
                pendingRevenue == null ? BigDecimal.ZERO : pendingRevenue
        );
    }

    /** Admin Portal's Payment Management page — every invoice, platform-wide. */
    public List<Invoice> listAll() {
        return invoiceRepository.findAllByOrderByCreatedAtDesc();
    }

    private String nextInvoiceNo() {
        long n = invoiceRepository.count() + codeCounter.incrementAndGet();
        return String.format("INV-%04d", n);
    }
}

package com.backhaulmatch.payment.service;

import com.backhaulmatch.payment.dto.PaymentDtos.PriceEstimateRequest;
import com.backhaulmatch.payment.dto.PaymentDtos.PriceEstimateResponse;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The authoritative cost calculation for a booking — separate from the quick
 * estimate matching-service shows at match time, which exists only so the
 * courier has a number to look at before committing. This is what actually
 * gets invoiced, and it's the one place pricing logic lives, so it can be
 * swapped for a real rate table / fuel-surcharge model later without hunting
 * through other services.
 */
@Service
public class PricingService {

    // Placeholder tariff until a real Pricing rate table exists.
    private static final BigDecimal BASE_FARE = new BigDecimal("1000");       // LKR, flat
    private static final BigDecimal RATE_PER_KM = new BigDecimal("150");      // LKR per km
    private static final BigDecimal RATE_PER_TON = new BigDecimal("300");     // LKR per ton, on top of distance
    private static final double DEFAULT_DISTANCE_KM = 150.0; // used if distanceKm wasn't supplied

    /**
     * Cost Calculation: base fare + distance charge + weight charge.
     * distanceKm and weightKg are both optional inputs (a caller might not
     * have one or the other) — missing values fall back to sane defaults
     * rather than producing a zero or null invoice amount.
     */
    public BigDecimal calculateCost(Double distanceKm, BigDecimal weightKg) {
        double km = (distanceKm == null || distanceKm <= 0) ? DEFAULT_DISTANCE_KM : distanceKm;
        BigDecimal distanceCharge = BigDecimal.valueOf(km).multiply(RATE_PER_KM);

        BigDecimal tons = weightKg == null
                ? BigDecimal.ZERO
                : weightKg.divide(new BigDecimal("1000"), 4, RoundingMode.HALF_UP);
        BigDecimal weightCharge = tons.multiply(RATE_PER_TON);

        return BASE_FARE.add(distanceCharge).add(weightCharge).setScale(2, RoundingMode.HALF_UP);
    }

    // --- Pre-booking price estimate (spec section 2) -----------------------------------
    // A separate, additive calculation so the existing calculateCost() above — the
    // authoritative invoice math used once a booking is confirmed — is untouched.

    private static final BigDecimal RATE_PER_CBM = new BigDecimal("200"); // LKR per cubic metre of declared volume
    private static final double BACKHAUL_DISCOUNT_PERCENT = 15.0; // this platform only ever books backhaul (return-leg) capacity
    private static final Pattern DIMENSIONS_PATTERN =
            Pattern.compile("([0-9]+(?:\\.[0-9]+)?)\\s*[xX×]\\s*([0-9]+(?:\\.[0-9]+)?)\\s*[xX×]\\s*([0-9]+(?:\\.[0-9]+)?)");

    // Box Truck is the baseline (1.0); larger/specialised vehicles cost more to run.
    private static final Map<String, Double> VEHICLE_TYPE_MULTIPLIER = Map.of(
            "box truck", 1.0,
            "light truck", 0.9,
            "lorry", 1.1,
            "container truck", 1.3
    );

    private static final Map<String, Double> PRIORITY_MULTIPLIER = Map.of(
            "standard", 1.0,
            "express", 1.25,
            "urgent", 1.5
    );

    /**
     * Estimated Price shown on the Create Shipment form, before a vehicle is
     * selected. Every pricing criterion from the spec feeds in: distance,
     * weight, declared volume/dimensions, vehicle type, delivery priority, and
     * a backhaul discount (this platform books return-leg capacity, which is
     * why it's cheaper than chartering a dedicated forward-haul truck).
     */
    public PriceEstimateResponse calculateEstimate(PriceEstimateRequest req) {
        double km = (req.distanceKm() == null || req.distanceKm() <= 0) ? DEFAULT_DISTANCE_KM : req.distanceKm();
        BigDecimal distanceCharge = BigDecimal.valueOf(km).multiply(RATE_PER_KM).setScale(2, RoundingMode.HALF_UP);

        BigDecimal tons = req.weightKg() == null
                ? BigDecimal.ZERO
                : req.weightKg().divide(new BigDecimal("1000"), 4, RoundingMode.HALF_UP);
        BigDecimal weightCharge = tons.multiply(RATE_PER_TON).setScale(2, RoundingMode.HALF_UP);

        BigDecimal volumeCharge = volumeCharge(req.dimensions());

        double vehicleMultiplier = VEHICLE_TYPE_MULTIPLIER.getOrDefault(
                normalize(req.vehicleType()), 1.0);
        double priorityMultiplier = PRIORITY_MULTIPLIER.getOrDefault(
                normalize(req.priority()), 1.0);

        BigDecimal subtotal = BASE_FARE.add(distanceCharge).add(weightCharge).add(volumeCharge)
                .multiply(BigDecimal.valueOf(vehicleMultiplier))
                .multiply(BigDecimal.valueOf(priorityMultiplier))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal backhaulDiscountAmount = subtotal
                .multiply(BigDecimal.valueOf(BACKHAUL_DISCOUNT_PERCENT / 100.0))
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal estimatedPrice = subtotal.subtract(backhaulDiscountAmount).setScale(2, RoundingMode.HALF_UP);

        return new PriceEstimateResponse(
                BASE_FARE, distanceCharge, weightCharge, volumeCharge, subtotal,
                priorityMultiplier, BACKHAUL_DISCOUNT_PERCENT, backhaulDiscountAmount, estimatedPrice);
    }

    /** Parses a free-text "L x W x H" (cm) string into a cubic-metre charge; 0 if unparsable/blank. */
    private BigDecimal volumeCharge(String dimensions) {
        if (dimensions == null || dimensions.isBlank()) return BigDecimal.ZERO;
        Matcher m = DIMENSIONS_PATTERN.matcher(dimensions);
        if (!m.find()) return BigDecimal.ZERO;
        try {
            double lengthCm = Double.parseDouble(m.group(1));
            double widthCm = Double.parseDouble(m.group(2));
            double heightCm = Double.parseDouble(m.group(3));
            double cubicMetres = (lengthCm * widthCm * heightCm) / 1_000_000.0;
            return BigDecimal.valueOf(cubicMetres).multiply(RATE_PER_CBM).setScale(2, RoundingMode.HALF_UP);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}

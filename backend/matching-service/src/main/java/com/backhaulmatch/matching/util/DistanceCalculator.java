package com.backhaulmatch.matching.util;

import java.util.Map;

/**
 * Straight-line (great-circle) distance between two named locations.
 *
 * This project doesn't have a geocoding service, so locations are matched
 * against a small fixed table of major Sri Lankan cities/towns — enough to
 * cover the demo data used throughout this project (Colombo, Kandy, Galle, ...).
 * Swap CITY_COORDINATES for a real geocoding call (e.g. Google Geocoding API)
 * if shipments/availability start using addresses outside this list.
 */
public final class DistanceCalculator {

    private DistanceCalculator() {}

    private static final double EARTH_RADIUS_KM = 6371.0;

    // lat, lng for each city's town center — approximate, fine for routing-distance estimates.
    private static final Map<String, double[]> CITY_COORDINATES = Map.ofEntries(
            Map.entry("colombo", new double[]{6.9271, 79.8612}),
            Map.entry("kandy", new double[]{7.2906, 80.6337}),
            Map.entry("galle", new double[]{6.0535, 80.2210}),
            Map.entry("kurunegala", new double[]{7.4863, 80.3647}),
            Map.entry("anuradhapura", new double[]{8.3114, 80.4037}),
            Map.entry("negombo", new double[]{7.2083, 79.8358}),
            Map.entry("jaffna", new double[]{9.6615, 80.0255}),
            Map.entry("matara", new double[]{5.9549, 80.5550}),
            Map.entry("trincomalee", new double[]{8.5874, 81.2152}),
            Map.entry("batticaloa", new double[]{7.7170, 81.7000}),
            Map.entry("ratnapura", new double[]{6.6828, 80.4012}),
            Map.entry("badulla", new double[]{6.9934, 81.0550}),
            Map.entry("nuwara eliya", new double[]{6.9497, 80.7891}),
            Map.entry("polonnaruwa", new double[]{7.9403, 81.0188}),
            Map.entry("ampara", new double[]{7.2975, 81.6747}),
            Map.entry("puttalam", new double[]{8.0362, 79.8283}),
            Map.entry("vavuniya", new double[]{8.7514, 80.4971}),
            Map.entry("hambantota", new double[]{6.1246, 81.1185}),
            Map.entry("gampaha", new double[]{7.0917, 80.0000}),
            Map.entry("kalutara", new double[]{6.5854, 79.9607})
    );

    /** Returns kilometers between two city names, or null if either isn't in the lookup table. */
    public static Double distanceBetweenCities(String cityA, String cityB) {
        double[] a = lookup(cityA);
        double[] b = lookup(cityB);
        if (a == null || b == null) return null;
        return haversineKm(a[0], a[1], b[0], b[1]);
    }

    // Distance assumed when a city isn't in the lookup table — large enough to
    // sort behind any real match, but not infinite (keeps sorting/filtering stable).
    private static final double UNKNOWN_LOCATION_PENALTY_KM = 500.0;

    /**
     * Total "detour" a candidate truck represents for a shipment: how far its
     * posted start is from the shipment's actual pickup, plus how far its
     * posted end is from the shipment's actual destination. Zero means a
     * perfect route match. Falls back to a fixed penalty distance (rather than
     * throwing or returning null) whenever a city name isn't in the table, so
     * an unrecognized location gets deprioritized instead of breaking matching.
     */
    public static double routeDeviationKm(String shipmentPickup, String shipmentDestination,
                                           String candidateFrom, String candidateTo) {
        Double pickupLeg = distanceBetweenCities(shipmentPickup, candidateFrom);
        Double destinationLeg = distanceBetweenCities(shipmentDestination, candidateTo);
        return (pickupLeg == null ? UNKNOWN_LOCATION_PENALTY_KM : pickupLeg)
                + (destinationLeg == null ? UNKNOWN_LOCATION_PENALTY_KM : destinationLeg);
    }

    private static double[] lookup(String city) {
        if (city == null) return null;
        return CITY_COORDINATES.get(city.trim().toLowerCase());
    }

    public static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}

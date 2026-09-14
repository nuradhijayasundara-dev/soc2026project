package com.backhaulmatch.courier.util;

import java.util.Map;

/**
 * Fallback place -> coordinate resolution. The portal normally sends explicit
 * coordinates (picked on the map); when it doesn't (older clients, seeded demo
 * data) we resolve known Sri Lankan towns to town-center coordinates so OSRM
 * routing and price estimation still work.
 */
public final class Places {

    private Places() {}

    private static final Map<String, double[]> PLACES = Map.ofEntries(
            Map.entry("colombo", new double[]{6.9271, 79.8612}),
            Map.entry("kandy", new double[]{7.2906, 80.6337}),
            Map.entry("matale", new double[]{7.4675, 80.6234}),
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

    /** Town-center coordinates for a place name, or null if unknown. */
    public static double[] coordFor(String place) {
        if (place == null) return null;
        String first = place.split("->")[0].trim().toLowerCase();
        return PLACES.get(first);
    }

    public static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6371.0 * c;
    }
}
package com.backhaulmatch.matching.util;

/**
 * Strict route containment for backhaul matching.
 *
 * A shipment is route-compatible with a truck ONLY when its pickup and
 * destination both lie on the truck's planned route — the straight corridor
 * from the truck's posted start to its posted end — and occur SEQUENTIALLY
 * along that route:
 *
 *     truck start -> .... -> pickup -> .... -> destination -> .... -> truck end
 *
 * Each point is projected onto the start->end segment (flat-earth Cartesian
 * frame centred on the route). Containment requires:
 *   1. pickup projects at position p with 0 <= p
 *   2. destination projects at position d with d <= 1
 *   3. p <= d          (pickup before destination — order must be preserved)
 *   4. cross-track (perpendicular) distance of BOTH points <= CORRIDOR_KM
 *
 * A point "before" the truck's start, "after" its end, ordered the wrong way,
 * or merely near the route (outside the corridor) does NOT qualify — partial /
 * nearby overlap is not a match. When geometry cannot be established (unknown
 * places / degenerate route) the candidate never qualifies.
 */
public final class RouteContainment {

    private RouteContainment() {}

    /** Max perpendicular distance from the route line that still counts as "on the route". */
    public static final double CORRIDOR_KM = 20.0;

    public static final class Evaluation {
        public final boolean contained;
        public final double routeKm;      // truck's posted route length
        public final double crossTrackKm; // worst of the two points' off-line distance
        public final double unusedKm;     // route span before pickup + after destination

        private Evaluation(boolean contained, double routeKm, double crossTrackKm, double unusedKm) {
            this.contained = contained;
            this.routeKm = routeKm;
            this.crossTrackKm = crossTrackKm;
            this.unusedKm = unusedKm;
        }
    }

    /** @param from   [lat, lng] truck route start, or null if unknowable
     *  @param to     [lat, lng] truck route end, or null if unknowable
     *  @param pickup [lat, lng] shipment pickup, or null if unknowable
     *  @param dest   [lat, lng] shipment destination, or null if unknowable */
    public static Evaluation evaluate(double[] from, double[] to,
                                      double[] pickup, double[] dest) {
        if (from == null || to == null || pickup == null || dest == null) {
            return new Evaluation(false, 0, 0, 0); // unknown geometry never qualifies
        }

        double midLatRad = Math.toRadians((from[0] + to[0]) / 2.0);
        double mPerDegLng = 111320.0 * Math.cos(midLatRad);
        double mPerDegLat = 110540.0;

        // Truck route as a flat-earth vector from (0,0) to B.
        double bx = (to[1] - from[1]) * mPerDegLng;
        double by = (to[0] - from[0]) * mPerDegLat;
        double len2 = bx * bx + by * by;
        if (len2 <= 1e-4 || (Math.abs(from[1] - to[1]) < 1e-9 && Math.abs(from[0] - to[0]) < 1e-9)) {
            return new Evaluation(false, 0, 0, 0); // degenerate route
        }
        double routeKm = Math.sqrt(len2) / 1000.0;

        double[] p = project(bx, by, len2, pickup[1], pickup[0], from[1], from[0], mPerDegLng, mPerDegLat);
        double[] d = project(bx, by, len2, dest[1], dest[0], from[1], from[0], mPerDegLng, mPerDegLat);

        double pickupCrossKm = p[1];
        double destCrossKm = d[1];
        double crossTrackKm = Math.max(pickupCrossKm, destCrossKm);

        boolean contained = p[0] >= 0.0 && d[0] <= 1.0
                && p[0] <= d[0]
                && pickupCrossKm <= CORRIDOR_KM
                && destCrossKm <= CORRIDOR_KM;

        double unusedKm = 0.0;
        if (contained) {
            unusedKm = p[0] * routeKm + (1.0 - d[0]) * routeKm;
        }
        return new Evaluation(contained, routeKm, crossTrackKm, unusedKm);
    }

    /**
     * Route compatibility score for a CONTAINED shipment (0..100). Perfect when
     * the shipment sits exactly on the route line and spans it; penalised
     * lightly for off-line drift and for leaving empty route segments unused.
     * May be called for any evaluation but only meaningful when contained.
     */
    public static double routeScore(Evaluation e) {
        double crossPen = Math.min(e.crossTrackKm * 3.0, 40.0);
        double slackRatio = e.routeKm <= 0 ? 0.0 : Math.min(e.unusedKm / e.routeKm, 1.0);
        double slackPen = slackRatio * 20.0;
        return Math.max(0, Math.min(100, 100.0 - crossPen - slackPen));
    }

    /** Returns [position 0..1, cross-track km] of a point on the from->to segment. */
    private static double[] project(double bx, double by, double len2,
                                    double lng, double lat, double fromLng, double fromLat,
                                    double mPerDegLng, double mPerDegLat) {
        double px = (lng - fromLng) * mPerDegLng;
        double py = (lat - fromLat) * mPerDegLat;
        double t = (px * bx + py * by) / len2;
        double crossX = px - t * bx;
        double crossY = py - t * by;
        return new double[]{t, Math.hypot(crossX, crossY) / 1000.0};
    }
}
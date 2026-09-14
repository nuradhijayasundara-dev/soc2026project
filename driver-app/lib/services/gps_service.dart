import 'dart:async';
import 'dart:convert';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'api_service.dart';

/// Handles device GPS collection and pushes each fix to gps-service
/// (through the Gateway, POST /api/gps/location) while a trip is active.
class GpsService {
  static Timer? _timer;
  static StreamSubscription<Position>? _positionStream;

  /// Call once before starting a trip — asks for location permission and
  /// makes sure location services are actually turned on.
  static Future<bool> ensurePermission() async {
    if (!await Geolocator.isLocationServiceEnabled()) return false;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission == LocationPermission.always || permission == LocationPermission.whileInUse;
  }

  /// Starts streaming device location and sends a ping to gps-service
  /// every time the device moves ~20m (configurable), which is both battery-friendly
  /// and enough resolution for a live map + route history.
  static void startTransmitting({
    required int truckId,
    required int driverId,
    required int tripId,
  }) {
    stopTransmitting(); // avoid double-subscriptions if called twice

    const settings = LocationSettings(accuracy: LocationAccuracy.high, distanceFilter: 20);
    _positionStream = Geolocator.getPositionStream(locationSettings: settings).listen((position) {
      _sendLocation(
        truckId: truckId,
        driverId: driverId,
        tripId: tripId,
        position: position,
      );
    });
  }

  static void stopTransmitting() {
    _positionStream?.cancel();
    _positionStream = null;
    _timer?.cancel();
    _timer = null;
  }

  static Future<void> _sendLocation({
    required int truckId,
    required int driverId,
    required int tripId,
    required Position position,
  }) async {
    try {
      final headers = await ApiService.authHeaders();
      await http.post(
        Uri.parse('${ApiService.baseUrl}/gps/location'),
        headers: headers,
        body: jsonEncode({
          'truckId': truckId,
          'driverId': driverId,
          'tripId': tripId,
          'latitude': position.latitude,
          'longitude': position.longitude,
          'speedKmh': position.speed * 3.6, // geolocator gives m/s
          'heading': position.heading,
        }),
      );
    } catch (_) {
      // Swallow transient network errors — the next fix will retry.
      // For production, queue failed pings locally and flush when back online.
    }
  }
}

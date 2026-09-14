import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class Trip {
  final int id;
  final int truckId;
  final int driverId;
  final int? shipmentId;
  final String status;

  Trip({required this.id, required this.truckId, required this.driverId, this.shipmentId, required this.status});

  factory Trip.fromJson(Map<String, dynamic> json) => Trip(
        id: json['id'],
        truckId: json['truckId'],
        driverId: json['driverId'],
        shipmentId: json['shipmentId'],
        status: json['status'],
      );
}

/// Talks to fleet-service through the Gateway (/api/fleet/**) for everything
/// related to "which trip is mine" and "start my trip".
class TripService {
  static Future<List<Trip>> getMyTrips() async {
    final headers = await ApiService.authHeaders();
    final response = await http.get(Uri.parse('${ApiService.baseUrl}/fleet/trips/my'), headers: headers);
    if (response.statusCode != 200) {
      throw Exception('Could not load your trips');
    }
    final List<dynamic> data = jsonDecode(response.body);
    return data.map((e) => Trip.fromJson(e)).toList();
  }

  static Future<Trip> startTrip(int tripId) async {
    final headers = await ApiService.authHeaders();
    final response = await http.patch(
      Uri.parse('${ApiService.baseUrl}/fleet/trips/$tripId/start'),
      headers: headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Could not start trip — it may already be in progress');
    }
    return Trip.fromJson(jsonDecode(response.body));
  }

  /// "Delivery confirmation" -> "End trip": marks the trip COMPLETED, frees
  /// the truck/driver back to AVAILABLE on the fleet side, and flips the
  /// shipment to DELIVERED on the courier side (see fleet-service's
  /// TripService.completeTrip()).
  static Future<Trip> completeTrip(int tripId) async {
    final headers = await ApiService.authHeaders();
    final response = await http.patch(
      Uri.parse('${ApiService.baseUrl}/fleet/trips/$tripId/complete'),
      headers: headers,
    );
    if (response.statusCode != 200) {
      throw Exception('Could not complete trip');
    }
    return Trip.fromJson(jsonDecode(response.body));
  }
}

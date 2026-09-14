import 'package:flutter/material.dart';
import '../services/trip_service.dart';
import '../services/gps_service.dart';

class ActiveTripScreen extends StatefulWidget {
  final Trip trip;
  const ActiveTripScreen({super.key, required this.trip});

  @override
  State<ActiveTripScreen> createState() => _ActiveTripScreenState();
}

class _ActiveTripScreenState extends State<ActiveTripScreen> {
  late String _status;
  bool _starting = false;
  bool _completing = false;
  bool _transmitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _status = widget.trip.status;
    // If we're re-opening a trip that's already IN_PROGRESS, resume GPS transmission.
    if (_status == 'IN_PROGRESS') {
      _beginGpsTransmission();
    }
  }

  @override
  void dispose() {
    // NOTE: for a real app you'd keep transmitting in the background (foreground
    // service / background_locator) even after the screen closes. This demo
    // only transmits while ActiveTripScreen is on screen.
    GpsService.stopTransmitting();
    super.dispose();
  }

  Future<void> _handleStartTrip() async {
    setState(() { _starting = true; _error = null; });
    try {
      final updated = await TripService.startTrip(widget.trip.id);
      setState(() => _status = updated.status);
      _beginGpsTransmission();
    } catch (e) {
      setState(() => _error = 'Could not start trip.');
    } finally {
      setState(() => _starting = false);
    }
  }

  Future<void> _handleCompleteTrip() async {
    setState(() { _completing = true; _error = null; });
    try {
      final updated = await TripService.completeTrip(widget.trip.id);
      GpsService.stopTransmitting();
      setState(() { _status = updated.status; _transmitting = false; });
    } catch (e) {
      setState(() => _error = 'Could not complete delivery.');
    } finally {
      setState(() => _completing = false);
    }
  }

  Future<void> _beginGpsTransmission() async {
    final granted = await GpsService.ensurePermission();
    if (!granted) {
      setState(() => _error = 'Location permission is required to start tracking this trip.');
      return;
    }
    GpsService.startTransmitting(
      truckId: widget.trip.truckId,
      driverId: widget.trip.driverId,
      tripId: widget.trip.id,
    );
    setState(() => _transmitting = true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Trip #${widget.trip.id}')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Truck #${widget.trip.truckId}', style: const TextStyle(fontSize: 18)),
            if (widget.trip.shipmentId != null)
              Text('Shipment #${widget.trip.shipmentId}', style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 24),

            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(_error!, style: const TextStyle(color: Colors.red)),
              ),

            if (_status == 'SCHEDULED')
              ElevatedButton.icon(
                icon: const Icon(Icons.play_arrow),
                label: Text(_starting ? 'Starting…' : 'Start Trip'),
                onPressed: _starting ? null : _handleStartTrip,
              )
            else if (_status == 'IN_PROGRESS')
              Column(
                children: [
                  Icon(_transmitting ? Icons.gps_fixed : Icons.gps_off,
                      size: 48, color: _transmitting ? Colors.green : Colors.grey),
                  const SizedBox(height: 8),
                  Text(_transmitting
                      ? 'Trip in progress — sharing your location'
                      : 'Trip in progress — location not yet transmitting'),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.flag),
                    label: Text(_completing ? 'Completing…' : 'Complete Delivery'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                    onPressed: _completing ? null : _handleCompleteTrip,
                  ),
                ],
              )
            else
              Text('This trip is $_status.'),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/trip_service.dart';
import 'active_trip_screen.dart';
import 'login_screen.dart';

class TripSelectionScreen extends StatefulWidget {
  const TripSelectionScreen({super.key});

  @override
  State<TripSelectionScreen> createState() => _TripSelectionScreenState();
}

class _TripSelectionScreenState extends State<TripSelectionScreen> {
  List<Trip> _trips = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTrips();
  }

  Future<void> _loadTrips() async {
    setState(() { _loading = true; _error = null; });
    try {
      final trips = await TripService.getMyTrips();
      setState(() => _trips = trips);
    } catch (e) {
      setState(() => _error = 'Could not load your trips. Ask your fleet manager to assign one, '
          'or link your account from the Trucks screen if this is your first login.');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _logout() async {
    await ApiService.logout();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'SCHEDULED': return Colors.orange;
      case 'IN_PROGRESS': return Colors.blue;
      case 'COMPLETED': return Colors.green;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Trips'),
        actions: [IconButton(icon: const Icon(Icons.logout), onPressed: _logout)],
      ),
      body: RefreshIndicator(
        onRefresh: _loadTrips,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? ListView(children: [
                    Padding(padding: const EdgeInsets.all(24), child: Text(_error!, textAlign: TextAlign.center)),
                  ])
                : _trips.isEmpty
                    ? ListView(children: const [
                        Padding(padding: EdgeInsets.all(24), child: Text('No trips assigned yet.', textAlign: TextAlign.center)),
                      ])
                    : ListView.builder(
                        itemCount: _trips.length,
                        itemBuilder: (context, index) {
                          final trip = _trips[index];
                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            child: ListTile(
                              leading: const Icon(Icons.local_shipping),
                              title: Text('Trip #${trip.id} — Truck #${trip.truckId}'),
                              subtitle: Text(trip.shipmentId != null
                                  ? 'Shipment #${trip.shipmentId}'
                                  : 'Repositioning trip (no shipment)'),
                              trailing: Chip(
                                label: Text(trip.status, style: const TextStyle(color: Colors.white)),
                                backgroundColor: _statusColor(trip.status),
                              ),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (_) => ActiveTripScreen(trip: trip)),
                                );
                              },
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}

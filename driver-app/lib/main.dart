import 'package:flutter/material.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(const BackhaulMatchDriverApp());
}

class BackhaulMatchDriverApp extends StatelessWidget {
  const BackhaulMatchDriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Backhaul-Match Driver',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(primarySwatch: Colors.blue, useMaterial3: true),
      home: const LoginScreen(),
    );
  }
}

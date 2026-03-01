import "package:flutter/material.dart";

import "screens/auth_gate_screen.dart";
import "theme/sana_theme.dart";

class SanaApp extends StatelessWidget {
  const SanaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: "Sana Mobile",
      theme: SanaTheme.light(),
      home: const AuthGateScreen(),
    );
  }
}

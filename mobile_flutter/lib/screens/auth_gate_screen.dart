import "package:flutter/material.dart";

import "login_screen.dart";
import "shell_screen.dart";

class AuthGateScreen extends StatefulWidget {
  const AuthGateScreen({super.key});

  @override
  State<AuthGateScreen> createState() => _AuthGateScreenState();
}

class _AuthGateScreenState extends State<AuthGateScreen> {
  bool _authenticated = false;

  void _onLoginSuccess() {
    setState(() => _authenticated = true);
  }

  @override
  Widget build(BuildContext context) {
    if (_authenticated) {
      return const ShellScreen();
    }
    return LoginScreen(onContinue: _onLoginSuccess);
  }
}

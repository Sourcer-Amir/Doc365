import "package:flutter/material.dart";

class LoginScreen extends StatefulWidget {
  final VoidCallback onContinue;

  const LoginScreen({super.key, required this.onContinue});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late final TextEditingController _emailController;
  late final TextEditingController _passwordController;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: "doctor@sana.app");
    _passwordController = TextEditingController(text: "Demo123!");
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFEFF8F4), Color(0xFFF8FBFA), Color(0xFFE4F1EC)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 430),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(22),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(14),
                              child: Image.asset(
                                "assets/branding/sana-logo.png",
                                width: 42,
                                height: 42,
                                fit: BoxFit.cover,
                              ),
                            ),
                            const SizedBox(width: 12),
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    "Sana Mobile",
                                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
                                  ),
                                  SizedBox(height: 2),
                                  Text("Atención médica en tu bolsillo"),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          "Iniciar sesión",
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 22),
                        ),
                        const SizedBox(height: 6),
                        const Text("Accede como paciente o doctor para ver la demo."),
                        const SizedBox(height: 18),
                        TextField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(labelText: "Correo"),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: const InputDecoration(labelText: "Contraseña"),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: widget.onContinue,
                          child: const Text("Entrar"),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            const Expanded(child: Divider()),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 10),
                              child: Text(
                                "o continúa con",
                                style: Theme.of(context).textTheme.labelMedium,
                              ),
                            ),
                            const Expanded(child: Divider()),
                          ],
                        ),
                        const SizedBox(height: 12),
                        OutlinedButton.icon(
                          onPressed: widget.onContinue,
                          icon: const Icon(Icons.g_mobiledata_rounded, size: 24),
                          label: const Text("Entrar con Google"),
                        ),
                        const SizedBox(height: 18),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF2FAF7),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFD8EEE6)),
                          ),
                          child: const Text(
                            "UI-only: este botón representa el login de Google para la versión móvil.",
                            style: TextStyle(fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

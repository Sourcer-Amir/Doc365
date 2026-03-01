import "package:flutter/material.dart";

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _online = true;
  bool _inPerson = true;
  bool _notifications = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Perfil")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const CircleAvatar(
                    radius: 38,
                    backgroundColor: Color(0xFFDDF4EA),
                    child: Icon(Icons.person_rounded, size: 38),
                  ),
                  const SizedBox(height: 10),
                  const Text("Dr. Amir", style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800)),
                  const Text("Medicina Interna"),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: const [
                      Chip(label: Text("Español · Avanzado")),
                      Chip(label: Text("English · Intermedio")),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Configuración profesional", style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  SwitchListTile(
                    title: const Text("Consulta en línea"),
                    value: _online,
                    onChanged: (v) => setState(() => _online = v),
                  ),
                  SwitchListTile(
                    title: const Text("Consulta presencial"),
                    value: _inPerson,
                    onChanged: (v) => setState(() => _inPerson = v),
                  ),
                  SwitchListTile(
                    title: const Text("Notificaciones"),
                    value: _notifications,
                    onChanged: (v) => setState(() => _notifications = v),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Ubicación del consultorio", style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  const TextField(
                    decoration: InputDecoration(
                      labelText: "Dirección",
                      hintText: "Av. Reforma 230, CDMX",
                    ),
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.map_rounded),
                    label: const Text("Ver en Maps"),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.save_rounded),
            label: const Text("Guardar cambios"),
          ),
        ],
      ),
    );
  }
}

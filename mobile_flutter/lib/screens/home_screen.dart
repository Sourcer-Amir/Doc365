import "package:flutter/material.dart";

import "../data/mock_data.dart";

class HomeScreen extends StatelessWidget {
  final ValueChanged<int> onGoToTab;

  const HomeScreen({super.key, required this.onGoToTab});

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          pinned: true,
          floating: true,
          expandedHeight: 170,
          title: const Text("Sana"),
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF185A47), Color(0xFF0DA27D)],
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 76, 20, 18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Hola, Amir",
                      style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "Tienes 2 consultas hoy y 1 seguimiento pendiente.",
                      style: TextStyle(color: Colors.white.withOpacity(0.9)),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _QuickActionCard(
                        icon: Icons.video_call_rounded,
                        title: "Video consulta",
                        subtitle: "Iniciar llamada",
                        color: const Color(0xFFD9F6EC),
                        onTap: () => onGoToTab(3),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _QuickActionCard(
                        icon: Icons.calendar_today_rounded,
                        title: "Agenda",
                        subtitle: "Ver calendario",
                        color: const Color(0xFFE9F0FF),
                        onTap: () => onGoToTab(2),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: _QuickActionCard(
                        icon: Icons.groups_rounded,
                        title: "Colegas",
                        subtitle: "Chat doctor-doctor",
                        color: const Color(0xFFFFF0DD),
                        onTap: () => onGoToTab(3),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _QuickActionCard(
                        icon: Icons.location_on_rounded,
                        title: "Maps",
                        subtitle: "Ver consultorios",
                        color: const Color(0xFFEAF6E8),
                        onTap: () => onGoToTab(1),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "Doctores mejor calificados",
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 12),
                        ...doctors.take(3).map(
                          (doc) => ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: CircleAvatar(
                              backgroundColor: const Color(0xFFDFF3EA),
                              child: Text(doc.name.split(" ").last[0]),
                            ),
                            title: Text(doc.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                            subtitle: Text("${doc.specialty} • ${doc.responseTime}"),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.star_rounded, color: Colors.amber, size: 18),
                                Text(" ${doc.rating}"),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 24),
              const SizedBox(height: 14),
              Text(title, style: const TextStyle(fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text(subtitle, style: const TextStyle(fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}

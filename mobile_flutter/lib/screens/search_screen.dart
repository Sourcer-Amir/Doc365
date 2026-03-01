import "package:flutter/material.dart";

import "../data/mock_data.dart";

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _queryController = TextEditingController();
  String _filter = "Todos";

  @override
  Widget build(BuildContext context) {
    final filtered = doctors.where((doc) {
      final query = _queryController.text.trim().toLowerCase();
      final hitsQuery = query.isEmpty ||
          doc.name.toLowerCase().contains(query) ||
          doc.specialty.toLowerCase().contains(query);
      final hitsFilter = _filter == "Todos" || doc.specialty == _filter;
      return hitsQuery && hitsFilter;
    }).toList();

    final specialties = <String>{"Todos", ...doctors.map((d) => d.specialty)};

    return Scaffold(
      appBar: AppBar(title: const Text("Buscar doctores")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _queryController,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(
              hintText: "Busca por nombre o especialidad",
              prefixIcon: Icon(Icons.search_rounded),
            ),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: specialties
                  .map(
                    (sp) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(sp),
                        selected: _filter == sp,
                        onSelected: (_) => setState(() => _filter = sp),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.map_rounded),
                      const SizedBox(width: 8),
                      Text(
                        "Mapa de consultorios",
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Container(
                    height: 160,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: const LinearGradient(
                        colors: [Color(0xFFCDEEE2), Color(0xFFE9F7F2)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Stack(
                      children: const [
                        Positioned(left: 28, top: 40, child: Icon(Icons.location_on_rounded, color: Color(0xFF1E765C), size: 28)),
                        Positioned(right: 44, top: 52, child: Icon(Icons.location_on_rounded, color: Color(0xFF1E765C), size: 28)),
                        Positioned(left: 120, bottom: 28, child: Icon(Icons.location_on_rounded, color: Color(0xFF1E765C), size: 28)),
                        Center(
                          child: Text(
                            "Vista Maps (UI)\nConecta aquí Google Maps SDK",
                            textAlign: TextAlign.center,
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text("Abrir Google Maps (demo UI)")),
                      );
                    },
                    icon: const Icon(Icons.open_in_new_rounded),
                    label: const Text("Abrir en Google Maps"),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          ...filtered.map((doc) => _DoctorTile(doc: doc)),
        ],
      ),
    );
  }
}

class _DoctorTile extends StatelessWidget {
  final DoctorItem doc;

  const _DoctorTile({required this.doc});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(top: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: const Color(0xFFD9F3E8),
                  child: Text(
                    doc.name.split(" ").last[0],
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(doc.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                      Text(doc.specialty),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.star_rounded, size: 16, color: Colors.amber),
                          Text(" ${doc.rating}"),
                          const SizedBox(width: 10),
                          const Icon(Icons.schedule_rounded, size: 15),
                          Text(" ${doc.responseTime}"),
                        ],
                      ),
                    ],
                  ),
                ),
                if (doc.verified)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFDFF4EA),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Text("Verificado", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                for (final lang in doc.languages) Chip(label: Text(lang)),
                Chip(label: Text(doc.online ? "Disponible ahora" : "No disponible")),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.location_on_rounded, size: 16),
                const SizedBox(width: 4),
                Expanded(child: Text(doc.location)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.map_rounded),
                    label: const Text("Mapa"),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.chat_rounded),
                    label: const Text("Contactar"),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

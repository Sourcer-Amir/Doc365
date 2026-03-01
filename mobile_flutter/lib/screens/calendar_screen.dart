import "package:flutter/material.dart";

import "../data/mock_data.dart";

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  int _selectedDay = 20;
  static const int _year = 2026;
  static const int _month = 2;

  @override
  Widget build(BuildContext context) {
    final daysInMonth = DateTime(_year, _month + 1, 0).day;
    final startWeekday = DateTime(_year, _month, 1).weekday; // Mon=1...Sun=7
    final offset = startWeekday - 1;
    final selectedAppointments =
        februaryAppointments.where((a) => a.day == _selectedDay).toList();

    return Scaffold(
      appBar: AppBar(title: const Text("Calendario")),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Febrero 2026", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                      Chip(label: Text("Hoy: 20 Feb")),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _Weekday("Lun"),
                      _Weekday("Mar"),
                      _Weekday("Mié"),
                      _Weekday("Jue"),
                      _Weekday("Vie"),
                      _Weekday("Sáb"),
                      _Weekday("Dom"),
                    ],
                  ),
                  const SizedBox(height: 8),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: offset + daysInMonth,
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 7,
                      childAspectRatio: 1,
                    ),
                    itemBuilder: (_, index) {
                      if (index < offset) return const SizedBox.shrink();
                      final day = index - offset + 1;
                      final selected = day == _selectedDay;
                      final hasEvents = februaryAppointments.any((a) => a.day == day);

                      return GestureDetector(
                        onTap: () => setState(() => _selectedDay = day),
                        child: Container(
                          margin: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: selected ? const Color(0xFF1D6B54) : null,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: selected
                                  ? const Color(0xFF1D6B54)
                                  : const Color(0xFFE2E8EE),
                            ),
                          ),
                          child: Stack(
                            children: [
                              Center(
                                child: Text(
                                  "$day",
                                  style: TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: selected ? Colors.white : null,
                                  ),
                                ),
                              ),
                              if (hasEvents)
                                Positioned(
                                  bottom: 6,
                                  right: 6,
                                  child: Container(
                                    width: 6,
                                    height: 6,
                                    decoration: BoxDecoration(
                                      color: selected ? Colors.white : const Color(0xFF0DA27D),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      );
                    },
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
                  Text(
                    "Agenda del $_selectedDay de febrero",
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 12),
                  if (selectedAppointments.isEmpty)
                    const Text("No hay consultas para este día.")
                  else
                    ...selectedAppointments.map(
                      (a) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF2F8F6),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFD9E9E3)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 46,
                              height: 46,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                a.mode == "Video"
                                    ? Icons.videocam_rounded
                                    : Icons.medical_services_rounded,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(a.title, style: const TextStyle(fontWeight: FontWeight.w800)),
                                  Text("${a.time} • ${a.mode}"),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 8),
                  ElevatedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.add_rounded),
                    label: const Text("Crear consulta"),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Weekday extends StatelessWidget {
  final String text;
  const _Weekday(this.text);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 36,
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
      ),
    );
  }
}

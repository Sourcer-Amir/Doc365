import "package:flutter/material.dart";

import "../data/mock_data.dart";

class ChatsScreen extends StatefulWidget {
  const ChatsScreen({super.key});

  @override
  State<ChatsScreen> createState() => _ChatsScreenState();
}

class _ChatsScreenState extends State<ChatsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final TextEditingController _messageController = TextEditingController();
  String? _selectedPatientDoctorThread;
  String? _selectedDoctorDoctorThread;
  final List<String> _messages = [
    "Hola doctor, tengo una duda sobre mi tratamiento.",
    "Claro, cuéntame tus síntomas actuales.",
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _selectedPatientDoctorThread = patientDoctorThreads.first.person;
    _selectedDoctorDoctorThread = doctorDoctorThreads.first.person;
  }

  @override
  void dispose() {
    _tabController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _messages.add(text);
      _messageController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Chats"),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: "Paciente ↔ Doctor"),
            Tab(text: "Doctor ↔ Doctor"),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _ChatPane(
            threads: patientDoctorThreads,
            selected: _selectedPatientDoctorThread,
            onSelect: (v) => setState(() => _selectedPatientDoctorThread = v),
            messages: _messages,
            composer: _buildComposer(),
          ),
          _ChatPane(
            threads: doctorDoctorThreads,
            selected: _selectedDoctorDoctorThread,
            onSelect: (v) => setState(() => _selectedDoctorDoctorThread = v),
            messages: _messages,
            composer: _buildComposer(doctorMode: true),
          ),
        ],
      ),
    );
  }

  Widget _buildComposer({bool doctorMode = false}) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0xFFE0E7EC))),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _messageController,
              decoration: InputDecoration(
                hintText: doctorMode
                    ? "Escribe para otro doctor..."
                    : "Escribe para tu doctor...",
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton.filled(
            onPressed: _sendMessage,
            icon: const Icon(Icons.send_rounded),
          ),
          const SizedBox(width: 4),
          if (doctorMode)
            IconButton(
              onPressed: () {},
              icon: const Icon(Icons.video_call_rounded),
              tooltip: "Videollamada entre doctores",
            )
          else
            IconButton(
              onPressed: () {},
              icon: const Icon(Icons.video_call_rounded),
              tooltip: "Videollamada con doctor",
            ),
        ],
      ),
    );
  }
}

class _ChatPane extends StatelessWidget {
  final List<ChatThread> threads;
  final String? selected;
  final ValueChanged<String> onSelect;
  final List<String> messages;
  final Widget composer;

  const _ChatPane({
    required this.threads,
    required this.selected,
    required this.onSelect,
    required this.messages,
    required this.composer,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 112,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
            itemCount: threads.length,
            itemBuilder: (_, index) {
              final t = threads[index];
              final active = selected == t.person;
              return GestureDetector(
                onTap: () => onSelect(t.person),
                child: Container(
                  width: 220,
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: active ? const Color(0xFFE5F6F0) : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: active ? const Color(0xFFAEDFD0) : const Color(0xFFE2E9EF),
                    ),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        child: Text(t.person.split(" ").last[0]),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              t.person,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.w800),
                            ),
                            Text(t.role, style: const TextStyle(fontSize: 12)),
                            Text(
                              t.lastMessage,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: messages.length,
            itemBuilder: (_, index) {
              final mine = index.isOdd;
              final msg = messages[index];
              return Align(
                alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  constraints: const BoxConstraints(maxWidth: 320),
                  decoration: BoxDecoration(
                    color: mine ? const Color(0xFF1D6B54) : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(
                    msg,
                    style: TextStyle(
                      color: mine ? Colors.white : null,
                      fontWeight: mine ? FontWeight.w500 : FontWeight.w400,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        composer,
      ],
    );
  }
}

import "package:flutter/material.dart";

import "calendar_screen.dart";
import "chats_screen.dart";
import "home_screen.dart";
import "profile_screen.dart";
import "search_screen.dart";

class ShellScreen extends StatefulWidget {
  const ShellScreen({super.key});

  @override
  State<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends State<ShellScreen> {
  int _index = 0;

  void _goToTab(int newIndex) {
    setState(() => _index = newIndex);
  }

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      HomeScreen(onGoToTab: _goToTab),
      const SearchScreen(),
      const CalendarScreen(),
      const ChatsScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: pages[_index],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: _goToTab,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: "Inicio"),
          BottomNavigationBarItem(icon: Icon(Icons.search_rounded), label: "Doctores"),
          BottomNavigationBarItem(icon: Icon(Icons.calendar_month_rounded), label: "Calendario"),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_rounded), label: "Chats"),
          BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: "Perfil"),
        ],
      ),
    );
  }
}

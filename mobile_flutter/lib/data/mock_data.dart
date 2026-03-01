class DoctorItem {
  final String name;
  final String specialty;
  final double rating;
  final String responseTime;
  final String location;
  final List<String> languages;
  final bool verified;
  final bool online;

  const DoctorItem({
    required this.name,
    required this.specialty,
    required this.rating,
    required this.responseTime,
    required this.location,
    required this.languages,
    required this.verified,
    required this.online,
  });
}

class ChatThread {
  final String person;
  final String role;
  final String lastMessage;
  final String time;
  final bool unread;

  const ChatThread({
    required this.person,
    required this.role,
    required this.lastMessage,
    required this.time,
    required this.unread,
  });
}

class AppointmentItem {
  final int day;
  final String time;
  final String title;
  final String mode;

  const AppointmentItem({
    required this.day,
    required this.time,
    required this.title,
    required this.mode,
  });
}

const List<DoctorItem> doctors = [
  DoctorItem(
    name: "Dra. Mariana Torres",
    specialty: "Cardiología",
    rating: 4.9,
    responseTime: "5 min",
    location: "Av. Reforma 230, CDMX",
    languages: ["Español", "Inglés"],
    verified: true,
    online: true,
  ),
  DoctorItem(
    name: "Dr. Jorge Álvarez",
    specialty: "Dermatología",
    rating: 4.8,
    responseTime: "12 min",
    location: "Polanco, CDMX",
    languages: ["Español", "Portugués"],
    verified: true,
    online: false,
  ),
  DoctorItem(
    name: "Dra. Natalia Suárez",
    specialty: "Pediatría",
    rating: 4.7,
    responseTime: "8 min",
    location: "Guadalajara, Jalisco",
    languages: ["Español", "Francés"],
    verified: true,
    online: true,
  ),
];

const List<ChatThread> patientDoctorThreads = [
  ChatThread(
    person: "Dra. Mariana Torres",
    role: "Cardiología",
    lastMessage: "Te recomiendo seguimiento en 2 semanas.",
    time: "10:20",
    unread: true,
  ),
  ChatThread(
    person: "Dr. Jorge Álvarez",
    role: "Dermatología",
    lastMessage: "Aplica la crema en la noche.",
    time: "Ayer",
    unread: false,
  ),
];

const List<ChatThread> doctorDoctorThreads = [
  ChatThread(
    person: "Dra. Lucía Herrera",
    role: "Pediatría",
    lastMessage: "¿Qué opinas del caso de asma crónica?",
    time: "09:12",
    unread: true,
  ),
  ChatThread(
    person: "Dr. Carlos Mena",
    role: "Neurología",
    lastMessage: "Te comparto el protocolo actualizado.",
    time: "Ayer",
    unread: false,
  ),
];

const List<AppointmentItem> februaryAppointments = [
  AppointmentItem(day: 20, time: "09:30", title: "Control de seguimiento", mode: "Video"),
  AppointmentItem(day: 20, time: "13:00", title: "Primera consulta", mode: "Presencial"),
  AppointmentItem(day: 22, time: "11:30", title: "Resultados de laboratorio", mode: "Video"),
  AppointmentItem(day: 26, time: "17:15", title: "Ajuste de tratamiento", mode: "Video"),
];

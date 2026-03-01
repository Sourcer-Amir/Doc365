# Sana Mobile (Flutter UI)

Frontend móvil de demo para Android/iOS, enfocado en presentación:

- Login con Google (solo UI)
- Dashboard móvil
- Búsqueda de doctores
- Sección de mapa (preview UI)
- Calendario de consultas (Febrero 2026 con foco en 20)
- Chats:
  - Paciente ↔ Doctor
  - Doctor ↔ Doctor

## Estructura

- `lib/main.dart`: punto de entrada
- `lib/sana_app.dart`: app principal
- `lib/theme/sana_theme.dart`: tema visual
- `lib/screens/*`: pantallas
- `lib/data/mock_data.dart`: datos demo
- `assets/branding/sana-logo.png`: logo

## Cómo correr (cuando tengas Flutter instalado)

1. Instala Flutter SDK y Android Studio (con Android SDK + emulator).
2. Entra a esta carpeta:
   - `cd mobile_flutter`
3. Instala dependencias:
   - `flutter create --platforms=android,ios .`
   - `flutter pub get`
4. Verifica dispositivos:
   - `flutter devices`
5. Corre en Android:
   - `flutter run`

## Nota

Este proyecto es UI-only para demo. No conecta APIs reales todavía.

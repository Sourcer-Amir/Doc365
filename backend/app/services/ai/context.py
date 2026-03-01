from __future__ import annotations

from typing import List

from app.db.models import PatientProfile, User


def build_profile_summary(profile: PatientProfile | None) -> List[str]:
    lines: List[str] = []
    if not profile:
        return lines

    if profile.chronic_conditions:
        lines.append(f"Condiciones crónicas: {', '.join(profile.chronic_conditions)}")
    if profile.allergies:
        lines.append(f"Alergias: {', '.join(profile.allergies)}")
    if profile.current_medications:
        meds = [f"{m.get('name')} ({m.get('dosage', 'N/A')})" for m in profile.current_medications]
        lines.append(f"Medicamentos actuales: {', '.join(meds)}")
    return lines


def build_patient_context(profile: PatientProfile | None) -> str:
    lines = build_profile_summary(profile)
    context = "Información del paciente:\n"
    if lines:
        context += "\n".join(lines) + "\n"
    return context


def build_doctor_context(doctors: list[User] | None) -> str:
    if not doctors:
        return ""
    lines: list[str] = ["Doctores disponibles en la plataforma (nombre - especialidad):"]
    for doc in doctors[:50]:
        specialty = doc.specialty or "Medicina General"
        lines.append(f"- {doc.full_name} — {specialty}")
    return "\n".join(lines)

import os
import sys
import uuid
from typing import Optional

import requests


BASE_URL = os.getenv("BASE_URL", "http://localhost:8001")
API = f"{BASE_URL}/api"
TIMEOUT = 15


def req(method: str, path: str, token: Optional[str] = None, **kwargs) -> Optional[requests.Response]:
    headers = kwargs.pop("headers", {})
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = API + path
    try:
        resp = requests.request(method, url, headers=headers, timeout=TIMEOUT, **kwargs)
        print(f"{method} {path} -> {resp.status_code}")
        if resp.status_code >= 400:
            print(resp.text[:500])
        return resp
    except requests.RequestException as exc:
        print(f"{method} {path} -> ERROR: {exc}")
        return None


def require_ok(resp: Optional[requests.Response], label: str) -> bool:
    if resp is None:
        print(f"[FAIL] {label}: no response")
        return False
    if resp.status_code >= 400:
        print(f"[FAIL] {label}: {resp.status_code}")
        return False
    print(f"[OK] {label}")
    return True


def optional_ok(resp: Optional[requests.Response], label: str) -> bool:
    if resp is None:
        print(f"[WARN] {label}: no response")
        return False
    if resp.status_code >= 400:
        print(f"[WARN] {label}: {resp.status_code}")
        return False
    print(f"[OK] {label}")
    return True


def main() -> int:
    suffix = uuid.uuid4().hex[:8]
    password = "Test1234!"

    patient_email = f"patient_{suffix}@example.com"
    doctor_email = f"doctor_{suffix}@example.com"

    # Register patient
    patient_register = req(
        "POST",
        "/auth/register",
        json={
            "email": patient_email,
            "password": password,
            "full_name": "Paciente Test",
            "role": "patient",
        },
    )
    if not require_ok(patient_register, "register patient"):
        return 1
    patient_token = patient_register.json()["token"]
    patient_user = patient_register.json()["user"]

    # Register doctor
    doctor_register = req(
        "POST",
        "/auth/register",
        json={
            "email": doctor_email,
            "password": password,
            "full_name": "Doctor Test",
            "role": "doctor",
            "specialty": "Medicina General",
        },
    )
    if not require_ok(doctor_register, "register doctor"):
        return 1
    doctor_token = doctor_register.json()["token"]
    doctor_user = doctor_register.json()["user"]

    # Login patient
    patient_login = req(
        "POST",
        "/auth/login",
        json={"email": patient_email, "password": password},
    )
    require_ok(patient_login, "login patient")

    # Login doctor
    doctor_login = req(
        "POST",
        "/auth/login",
        json={"email": doctor_email, "password": password},
    )
    require_ok(doctor_login, "login doctor")

    # Users
    require_ok(req("GET", "/doctors", token=patient_token), "list doctors")
    require_ok(req("GET", "/patients", token=doctor_token), "list patients")

    # Profile
    require_ok(req("GET", "/profile", token=patient_token), "get profile")
    require_ok(
        req(
            "PUT",
            "/profile",
            token=patient_token,
            json={"blood_type": "O+", "allergies": ["polen"]},
        ),
        "update profile",
    )

    # Chat (doctor)
    require_ok(
        req(
            "POST",
            "/chat",
            token=patient_token,
            json={
                "content": "Hola doctor, prueba de mensaje.",
                "recipient_id": doctor_user["id"],
                "chat_type": "doctor",
            },
        ),
        "send doctor chat",
    )
    require_ok(
        req(
            "GET",
            f"/chat/doctor?other_user_id={doctor_user['id']}",
            token=patient_token,
        ),
        "get doctor chat",
    )

    # Chat (AI) - optional if AI key missing
    optional_ok(
        req(
            "POST",
            "/chat",
            token=patient_token,
            json={"content": "Hola AI", "chat_type": "ai"},
        ),
        "send ai chat",
    )
    optional_ok(req("GET", "/chat/ai", token=patient_token), "get ai chat")

    # Documents
    file_payload = {"file": ("test.txt", b"Hola Sana", "text/plain")}
    upload_resp = req("POST", "/documents", token=patient_token, files=file_payload)
    if require_ok(upload_resp, "upload document"):
        doc_id = upload_resp.json()["id"]
        require_ok(req("GET", "/documents", token=patient_token), "list documents")
        require_ok(req("GET", f"/documents/{doc_id}", token=patient_token), "get document")

    # Recommendations (optional if AI key missing)
    optional_ok(req("POST", "/recommendations/generate", token=patient_token), "generate recs")
    require_ok(req("GET", "/recommendations", token=patient_token), "list recs")

    print("\nSmoke tests completed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

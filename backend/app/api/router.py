from fastapi import APIRouter

from app.api.routes import auth, profiles, users, chat, recommendations, documents, verification, doctor, telegram

api_router = APIRouter()

api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(profiles.router, tags=["profile"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(chat.router, tags=["chat"])
api_router.include_router(recommendations.router, tags=["recommendations"])
api_router.include_router(documents.router, tags=["documents"])
api_router.include_router(verification.router, tags=["verification"])
api_router.include_router(doctor.router, tags=["doctor"])
api_router.include_router(telegram.router, tags=["telegram"])

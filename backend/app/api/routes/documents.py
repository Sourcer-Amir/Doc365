from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
import base64

from app.core.deps import get_current_user
from app.db.session import get_db
from app.schemas.document import DocumentOut, DocumentListOut, DocumentUploadResponse
from app.services.documents import create_document, list_documents, get_document

router = APIRouter()


@router.post("/documents", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can upload documents",
        )

    file_content = await file.read()
    file_data_b64 = base64.b64encode(file_content).decode("utf-8")

    doc = await create_document(
        db,
        user_id=current_user["user_id"],
        filename=file.filename,
        file_data=file_data_b64,
        file_type=file.content_type or "application/octet-stream",
    )

    return DocumentUploadResponse(
        id=doc.id,
        filename=doc.filename,
        uploaded_at=doc.uploaded_at,
    )


@router.get("/documents", response_model=list[DocumentListOut])
async def get_documents(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.get("role") != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients have documents",
        )

    docs = await list_documents(db, current_user["user_id"])
    return [DocumentListOut.model_validate(doc) for doc in docs]


@router.get("/documents/{doc_id}", response_model=DocumentOut)
async def get_document_by_id(
    doc_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = await get_document(db, current_user["user_id"], doc_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    return DocumentOut.model_validate(doc)

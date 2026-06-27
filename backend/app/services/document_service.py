from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.document_repository import DocumentRepository
from app.schemas.document import DocumentUpdate


from app.db.repositories.document_repository import DocumentRepository
from app.db.repositories.project_repository import ProjectRepository
from app.schemas.document import DocumentUpdate


async def _ensure_project(session: AsyncSession, project_id: int) -> None:
    project = await ProjectRepository(session).get_by_id(project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found.",
        )


async def list_project_documents(session: AsyncSession, project_id: int):
    await _ensure_project(session, project_id)
    return await DocumentRepository(session).list_by_project(project_id)


async def get_project_document_file(
    session: AsyncSession, project_id: int, document_id: int
) -> tuple[bytes, str, str]:
    doc = await DocumentRepository(session).get_by_id(project_id, document_id)
    if doc is None or not doc.file_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {document_id} not found or has no stored file.",
        )
    content_type = doc.content_type or "application/pdf"
    filename = doc.file_name or f"document-{document_id}.pdf"
    return doc.file_content, content_type, filename


async def update_document_extracted_text(
    session: AsyncSession,
    project_id: int,
    document_type: str,
    extracted_text: str,
) -> int | None:
    doc_repo = DocumentRepository(session)
    doc = await doc_repo.get_by_type(project_id, document_type)
    if doc is None:
        return None
    await doc_repo.update(doc, DocumentUpdate(extracted_text=extracted_text))
    return doc.document_id

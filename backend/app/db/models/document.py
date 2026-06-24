from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mysql_types import LongText
from app.db.models.mixins import CreatedAtMixin

if TYPE_CHECKING:
    from app.db.models.project import Project


class Document(Base, CreatedAtMixin):
    __tablename__ = "documents"

    document_id: Mapped[int] = mapped_column(
        BigInteger, primary_key=True, autoincrement=True
    )
    project_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("projects.project_id"), nullable=False, index=True
    )
    document_type: Mapped[Optional[str]] = mapped_column(String(100))
    file_name: Mapped[Optional[str]] = mapped_column(String(255))
    blob_url: Mapped[Optional[str]] = mapped_column(String(2048))
    extracted_text: Mapped[Optional[str]] = mapped_column(LongText)
    uploaded_by: Mapped[Optional[str]] = mapped_column(String(255))

    project: Mapped[Project] = relationship(back_populates="documents")

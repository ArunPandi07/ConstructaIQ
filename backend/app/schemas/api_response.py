from datetime import datetime, timezone
from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    data: T
    status: Literal["success", "error"] = "success"
    message: str | None = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def success_response(data: T, message: str | None = None) -> ApiResponse[T]:
    return ApiResponse(data=data, status="success", message=message)

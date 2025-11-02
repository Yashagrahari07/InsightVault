from __future__ import annotations

from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


class ContentType(str, Enum):
    LINK = "link"
    REPO = "repo"
    NOTE = "note"


class SummaryStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class EntryBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content_type: ContentType
    url: Optional[HttpUrl] = None
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class EntryCreate(EntryBase):
    pass


class EntryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")


class TagCreate(TagBase):
    pass


class TagResponse(TagBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class EntryResponse(EntryBase):
    id: UUID
    user_id: UUID
    ai_summary: Optional[str] = None
    summary_status: SummaryStatus
    created_at: datetime
    updated_at: datetime
    tags: List[TagResponse] = []

    class Config:
        from_attributes = True


class EntryListResponse(BaseModel):
    data: List[EntryResponse]
    pagination: Dict[str, int]


class EntrySearchRequest(BaseModel):
    q: str = Field(..., min_length=1)
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)
    content_type: Optional[ContentType] = None
    tags: Optional[List[UUID]] = None


class SummarizeRequest(BaseModel):
    entry_id: UUID


class SummaryResponse(BaseModel):
    summary: Optional[str] = None
    status: SummaryStatus
    error: Optional[str] = None

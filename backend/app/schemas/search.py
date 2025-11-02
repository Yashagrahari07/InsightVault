from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from app.schemas.entry import ContentType


class EntryFilter(BaseModel):
    """Filter schema for entry search"""
    content_type: Optional[ContentType] = None
    tags: Optional[List[UUID]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    has_summary: Optional[bool] = None
    has_url: Optional[bool] = None


class SearchRequest(BaseModel):
    """Search request schema"""
    q: str = Field(..., min_length=1, max_length=500)
    filters: Optional[EntryFilter] = None
    sort: str = Field("relevance", regex="^(relevance|newest|oldest)$")
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)


class SearchHistoryResponse(BaseModel):
    """Search history response schema"""
    id: UUID
    query: str
    filters: Optional[Dict[str, Any]] = None
    result_count: str
    created_at: datetime

    class Config:
        from_attributes = True


class SavedFilterBase(BaseModel):
    """Base schema for saved filter"""
    name: str = Field(..., min_length=1, max_length=200)
    filters: EntryFilter


class SavedFilterCreate(SavedFilterBase):
    """Schema for creating saved filter"""
    pass


class SavedFilterUpdate(BaseModel):
    """Schema for updating saved filter"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    filters: Optional[EntryFilter] = None


class SavedFilterResponse(SavedFilterBase):
    """Saved filter response schema"""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SearchSuggestionResponse(BaseModel):
    """Search suggestion response schema"""
    suggestions: List[str]


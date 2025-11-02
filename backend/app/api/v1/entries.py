from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc
from typing import List, Optional
from uuid import UUID
from app.core.database import get_db
from app.core.redis import redis_client
from app.core.security import get_current_user
from app.models.user import User
from app.models.entry import Entry, Tag, EntryTag
from app.schemas.entry import (
    EntryCreate,
    EntryUpdate,
    EntryResponse,
    EntryListResponse,
    EntrySearchRequest,
    ContentType,
    SummaryStatus,
)
import json
import httpx
from bs4 import BeautifulSoup
from loguru import logger

router = APIRouter()


def fetch_url_metadata(url: str) -> dict:
    """Fetch metadata from a URL"""
    try:
        response = httpx.get(url, timeout=10, follow_redirects=True)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        title = soup.find("title")
        title_text = title.get_text(strip=True) if title else ""

        meta_description = soup.find("meta", attrs={"name": "description"})
        description = meta_description.get("content", "") if meta_description else ""

        og_image = soup.find("meta", attrs={"property": "og:image"})
        image_url = og_image.get("content", "") if og_image else ""

        return {
            "title": title_text[:500],
            "description": description[:1000],
            "image": image_url,
        }
    except Exception as e:
        logger.error(f"Error fetching metadata for {url}: {e}")
        return {}


def fetch_github_repo_metadata(repo_url: str) -> dict:
    """Fetch metadata from GitHub repository"""
    try:
        # Extract owner/repo from URL
        parts = repo_url.replace("https://github.com/", "").strip("/").split("/")
        if len(parts) < 2:
            raise ValueError("Invalid GitHub URL")

        owner, repo = parts[0], parts[1]

        # Fetch from GitHub API
        api_url = f"https://api.github.com/repos/{owner}/{repo}"
        response = httpx.get(api_url, timeout=10)
        response.raise_for_status()

        data = response.json()

        return {
            "name": data.get("name", ""),
            "full_name": data.get("full_name", ""),
            "description": data.get("description", ""),
            "stars": data.get("stargazers_count", 0),
            "language": data.get("language", ""),
            "forks": data.get("forks_count", 0),
            "url": data.get("html_url", ""),
        }
    except Exception as e:
        logger.error(f"Error fetching GitHub metadata: {e}")
        return {}


@router.post(
    "/entries", response_model=EntryResponse, status_code=status.HTTP_201_CREATED
)
async def create_entry(
    entry_data: EntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new entry"""
    entry_metadata = entry_data.metadata or {}

    # Fetch metadata based on content type
    if entry_data.content_type == ContentType.LINK and entry_data.url:
        fetched_metadata = fetch_url_metadata(str(entry_data.url))
        entry_metadata.update(fetched_metadata)
        if not entry_data.title and fetched_metadata.get("title"):
            entry_data.title = fetched_metadata["title"]

    elif entry_data.content_type == ContentType.REPO and entry_data.url:
        fetched_metadata = fetch_github_repo_metadata(str(entry_data.url))
        entry_metadata.update(fetched_metadata)
        if not entry_data.title and fetched_metadata.get("full_name"):
            entry_data.title = fetched_metadata["full_name"]

    entry = Entry(
        user_id=current_user.id,
        title=entry_data.title,
        content_type=entry_data.content_type.value,
        url=str(entry_data.url) if entry_data.url else None,
        content=entry_data.content,
        entry_metadata=entry_metadata,
    )

    db.add(entry)
    db.commit()
    db.refresh(entry)

    return entry


@router.get("/entries", response_model=EntryListResponse)
async def list_entries(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    content_type: Optional[ContentType] = None,
    sort: str = Query("newest", regex="^(newest|oldest)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List user's entries with pagination"""
    # Cache key
    cache_key = f"entries:{current_user.id}:{page}:{limit}:{content_type}:{sort}"

    # Try to get from cache
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    # Build query
    query = db.query(Entry).filter(Entry.user_id == current_user.id)

    if content_type:
        query = query.filter(Entry.content_type == content_type.value)

    # Sort
    if sort == "newest":
        query = query.order_by(desc(Entry.created_at))
    else:
        query = query.order_by(Entry.created_at)

    # Count total
    total = query.count()

    # Paginate
    offset = (page - 1) * limit
    entries = query.offset(offset).limit(limit).all()

    result = EntryListResponse(
        data=entries,
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit,
        },
    )

    # Cache for 5 minutes
    redis_client.setex(cache_key, 300, json.dumps(result.model_dump(), default=str))

    return result


@router.get("/entries/{entry_id}", response_model=EntryResponse)
async def get_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific entry"""
    entry = (
        db.query(Entry)
        .filter(Entry.id == entry_id, Entry.user_id == current_user.id)
        .first()
    )

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    return entry


@router.put("/entries/{entry_id}", response_model=EntryResponse)
async def update_entry(
    entry_id: UUID,
    entry_data: EntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an entry"""
    entry = (
        db.query(Entry)
        .filter(Entry.id == entry_id, Entry.user_id == current_user.id)
        .first()
    )

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    # Update fields
    if entry_data.title is not None:
        entry.title = entry_data.title
    if entry_data.content is not None:
        entry.content = entry_data.content
    if entry_data.metadata is not None:
        entry.entry_metadata = entry_data.metadata

    db.commit()
    db.refresh(entry)

    # Invalidate cache
    redis_client.delete(f"entries:{current_user.id}:*")

    return entry


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an entry"""
    entry = (
        db.query(Entry)
        .filter(Entry.id == entry_id, Entry.user_id == current_user.id)
        .first()
    )

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )

    db.delete(entry)
    db.commit()

    # Invalidate cache
    redis_client.delete(f"entries:{current_user.id}:*")

    return None


@router.get("/entries/search", response_model=EntryListResponse)
async def search_entries(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search entries using full-text search"""
    # Cache key
    cache_key = f"search:{current_user.id}:{q}:{page}:{limit}"

    # Try cache
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    # Full-text search
    search_query = func.to_tsquery("english", q.replace(" ", " & "))

    query = (
        db.query(Entry)
        .filter(
            Entry.user_id == current_user.id,
            func.to_tsvector(
                "english",
                func.coalesce(Entry.title, "")
                + " "
                + func.coalesce(Entry.content, "")
                + " "
                + func.coalesce(Entry.ai_summary, ""),
            ).match(search_query),
        )
        .order_by(desc(Entry.created_at))
    )

    total = query.count()
    offset = (page - 1) * limit
    entries = query.offset(offset).limit(limit).all()

    result = EntryListResponse(
        data=entries,
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit,
        },
    )

    # Cache for 10 minutes
    redis_client.setex(cache_key, 600, json.dumps(result.model_dump(), default=str))

    return result

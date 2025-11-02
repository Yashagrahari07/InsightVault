from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.core.redis import redis_client
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.search import (
    SearchRequest,
    SearchHistoryResponse,
    SearchSuggestionResponse,
    SavedFilterCreate,
    SavedFilterUpdate,
    SavedFilterResponse,
)
from app.schemas.entry import EntryListResponse, ContentType
from app.services.search_service import (
    AdvancedSearchService,
    SuggestionService,
    SavedFilterService,
)
import json
from loguru import logger

router = APIRouter()


@router.post("/entries/search", response_model=EntryListResponse)
async def advanced_search_entries(
    search_request: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Advanced search with filters, sorting, and relevance ranking"""

    # Build cache key
    cache_key_parts = [
        "search",
        str(current_user.id),
        search_request.q,
        str(search_request.page),
        str(search_request.limit),
        search_request.sort,
    ]
    if search_request.filters:
        filters_str = json.dumps(
            search_request.filters.model_dump(exclude_none=True),
            default=str,
            sort_keys=True,
        )
        cache_key_parts.append(filters_str)
    cache_key = ":".join(cache_key_parts)

    # Try cache
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    # Initialize service
    search_service = AdvancedSearchService(db)

    # Convert filters to dict
    filters_dict = None
    if search_request.filters:
        filters_dict = search_request.filters.model_dump(exclude_none=True)
        # Convert content_type enum to string if present
        if "content_type" in filters_dict and isinstance(
            filters_dict["content_type"], ContentType
        ):
            filters_dict["content_type"] = filters_dict["content_type"].value

    # Perform search
    offset = (search_request.page - 1) * search_request.limit
    results = search_service.search_entries(
        query=search_request.q,
        user_id=current_user.id,
        filters=filters_dict,
        sort=search_request.sort,
        limit=search_request.limit,
        offset=offset,
    )

    # Save to search history
    suggestion_service = SuggestionService(db)
    suggestion_service.save_search_history(
        user_id=current_user.id,
        query=search_request.q,
        filters=filters_dict,
        result_count=results["total"],
    )

    # Format response
    result = EntryListResponse(
        data=results["data"],
        pagination={
            "page": results["page"],
            "limit": results["limit"],
            "total": results["total"],
            "pages": (results["total"] + results["limit"] - 1) // results["limit"],
        },
    )

    # Cache for 10 minutes
    redis_client.setex(cache_key, 600, json.dumps(result.model_dump(), default=str))

    return result


@router.get("/search/suggestions", response_model=SearchSuggestionResponse)
async def get_search_suggestions(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get search suggestions/autocomplete"""

    # Cache key
    cache_key = f"suggestions:{current_user.id}:{q}:{limit}"

    # Try cache
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    # Get suggestions
    suggestion_service = SuggestionService(db)
    suggestions = suggestion_service.get_suggestions(
        query=q, user_id=current_user.id, limit=limit
    )

    result = SearchSuggestionResponse(suggestions=suggestions)

    # Cache for 5 minutes
    redis_client.setex(cache_key, 300, json.dumps(result.model_dump()))

    return result


@router.get("/search/history", response_model=List[SearchHistoryResponse])
async def get_search_history(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user's search history"""

    suggestion_service = SuggestionService(db)
    history = suggestion_service.get_search_history(
        user_id=current_user.id, limit=limit
    )

    return history


@router.delete("/search/history", status_code=status.HTTP_204_NO_CONTENT)
async def clear_search_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clear user's search history"""

    suggestion_service = SuggestionService(db)
    suggestion_service.clear_search_history(user_id=current_user.id)

    return None


@router.post(
    "/filters", response_model=SavedFilterResponse, status_code=status.HTTP_201_CREATED
)
async def create_saved_filter(
    filter_data: SavedFilterCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new saved filter"""

    filter_service = SavedFilterService(db)

    try:
        saved_filter = filter_service.create_saved_filter(
            user_id=current_user.id, filter_data=filter_data
        )
        return saved_filter
    except Exception as e:
        logger.error(f"Error creating saved filter: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create saved filter. Filter name may already exist.",
        )


@router.get("/filters", response_model=List[SavedFilterResponse])
async def list_saved_filters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all saved filters for the current user"""

    filter_service = SavedFilterService(db)
    filters = filter_service.get_saved_filters(user_id=current_user.id)

    return filters


@router.get("/filters/{filter_id}", response_model=SavedFilterResponse)
async def get_saved_filter(
    filter_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific saved filter"""

    filter_service = SavedFilterService(db)
    saved_filter = filter_service.get_saved_filter(
        filter_id=filter_id, user_id=current_user.id
    )

    if not saved_filter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved filter not found",
        )

    return saved_filter


@router.put("/filters/{filter_id}", response_model=SavedFilterResponse)
async def update_saved_filter(
    filter_id: UUID,
    filter_data: SavedFilterUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a saved filter"""

    filter_service = SavedFilterService(db)
    saved_filter = filter_service.update_saved_filter(
        filter_id=filter_id, user_id=current_user.id, filter_data=filter_data
    )

    if not saved_filter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved filter not found",
        )

    return saved_filter


@router.delete("/filters/{filter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_filter(
    filter_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a saved filter"""

    filter_service = SavedFilterService(db)
    deleted = filter_service.delete_saved_filter(
        filter_id=filter_id, user_id=current_user.id
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved filter not found",
        )

    return None

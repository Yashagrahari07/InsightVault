from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
from typing import List, Dict, Optional
from uuid import UUID
from datetime import datetime
from app.models.entry import Entry, Tag, EntryTag
from app.models.search import SearchHistory, SavedFilter
from app.schemas.search import SavedFilterCreate, SavedFilterUpdate
from loguru import logger


class AdvancedSearchService:
    """Advanced search service with relevance ranking and filters"""

    def __init__(self, db: Session):
        self.db = db

    def search_entries(
        self,
        query: str,
        user_id: UUID,
        filters: Optional[Dict] = None,
        sort: str = "relevance",
        limit: int = 20,
        offset: int = 0,
    ) -> Dict:
        """Advanced search with relevance ranking and filters"""

        # Build base query
        base_query = self.db.query(Entry).filter(Entry.user_id == user_id)

        # Apply filters first (before search)
        if filters:
            if filters.get("content_type"):
                base_query = base_query.filter(
                    Entry.content_type == filters["content_type"]
                )

            if filters.get("tags"):
                base_query = base_query.join(EntryTag).filter(
                    EntryTag.tag_id.in_(filters["tags"])
                ).distinct()

            if filters.get("date_from"):
                base_query = base_query.filter(Entry.created_at >= filters["date_from"])

            if filters.get("date_to"):
                base_query = base_query.filter(Entry.created_at <= filters["date_to"])

            if filters.get("has_summary") is not None:
                if filters["has_summary"]:
                    base_query = base_query.filter(Entry.ai_summary.isnot(None))
                else:
                    base_query = base_query.filter(Entry.ai_summary.is_(None))

            if filters.get("has_url") is not None:
                if filters["has_url"]:
                    base_query = base_query.filter(Entry.url.isnot(None))
                else:
                    base_query = base_query.filter(Entry.url.is_(None))

        # Full-text search with ranking
        search_vector = func.to_tsvector(
            "english",
            func.coalesce(Entry.title, "")
            + " "
            + func.coalesce(Entry.content, "")
            + " "
            + func.coalesce(Entry.ai_summary, ""),
        )
        query_vector = func.plainto_tsquery("english", query)

        # Calculate relevance score using ts_rank
        relevance = func.ts_rank(search_vector, query_vector)

        # Apply search filter
        results_query = base_query.filter(search_vector.match(query_vector)).add_columns(
            relevance.label("relevance")
        )

        # Sort
        if sort == "relevance":
            results_query = results_query.order_by(desc(relevance))
        elif sort == "newest":
            results_query = results_query.order_by(desc(Entry.created_at))
        elif sort == "oldest":
            results_query = results_query.order_by(asc(Entry.created_at))

        # Get total count
        total = results_query.count()

        # Pagination
        entries_with_relevance = results_query.offset(offset).limit(limit).all()

        # Extract entries and relevance scores
        entries = []
        relevance_scores = {}
        for row in entries_with_relevance:
            if isinstance(row, tuple):
                entry = row[0]
                relevance_score = float(row[1]) if row[1] else 0.0
            else:
                entry = row
                relevance_score = 0.0
            entries.append(entry)
            relevance_scores[str(entry.id)] = relevance_score

        return {
            "data": entries,
            "total": total,
            "page": offset // limit + 1,
            "limit": limit,
            "relevance_scores": relevance_scores,
        }


class SuggestionService:
    """Service for search suggestions and autocomplete"""

    def __init__(self, db: Session):
        self.db = db

    def get_suggestions(
        self, query: str, user_id: UUID, limit: int = 10
    ) -> List[str]:
        """Get search suggestions based on query"""

        if len(query) < 2:
            return []

        # Get suggestions from entry titles that start with or contain the query
        suggestions_query = (
            self.db.query(Entry.title)
            .filter(
                Entry.user_id == user_id,
                Entry.title.ilike(f"%{query}%"),
            )
            .distinct()
            .limit(limit)
        )

        suggestions = [title for title, in suggestions_query.all()]

        # Also get suggestions from search history
        history_suggestions = (
            self.db.query(SearchHistory.query)
            .filter(
                SearchHistory.user_id == user_id,
                SearchHistory.query.ilike(f"%{query}%"),
            )
            .distinct()
            .order_by(desc(SearchHistory.created_at))
            .limit(5)
            .all()
        )

        history_queries = [q for q, in history_suggestions]

        # Combine and deduplicate
        all_suggestions = list(dict.fromkeys(suggestions + history_queries))

        return all_suggestions[:limit]

    def save_search_history(
        self, user_id: UUID, query: str, filters: Optional[Dict] = None, result_count: int = 0
    ):
        """Save search query to history"""
        try:
            search_history = SearchHistory(
                user_id=user_id,
                query=query,
                filters=filters or {},
                result_count=str(result_count),
            )
            self.db.add(search_history)
            self.db.commit()
        except Exception as e:
            logger.error(f"Error saving search history: {e}")
            self.db.rollback()

    def get_search_history(self, user_id: UUID, limit: int = 20) -> List[SearchHistory]:
        """Get user's search history"""
        return (
            self.db.query(SearchHistory)
            .filter(SearchHistory.user_id == user_id)
            .order_by(desc(SearchHistory.created_at))
            .limit(limit)
            .all()
        )

    def clear_search_history(self, user_id: UUID):
        """Clear user's search history"""
        try:
            self.db.query(SearchHistory).filter(
                SearchHistory.user_id == user_id
            ).delete()
            self.db.commit()
        except Exception as e:
            logger.error(f"Error clearing search history: {e}")
            self.db.rollback()


class SavedFilterService:
    """Service for managing saved filters"""

    def __init__(self, db: Session):
        self.db = db

    def create_saved_filter(
        self, user_id: UUID, filter_data: SavedFilterCreate
    ) -> SavedFilter:
        """Create a new saved filter"""
        saved_filter = SavedFilter(
            user_id=user_id,
            name=filter_data.name,
            filters=filter_data.filters.model_dump(),
        )
        self.db.add(saved_filter)
        self.db.commit()
        self.db.refresh(saved_filter)
        return saved_filter

    def get_saved_filters(self, user_id: UUID) -> List[SavedFilter]:
        """Get all saved filters for a user"""
        return (
            self.db.query(SavedFilter)
            .filter(SavedFilter.user_id == user_id)
            .order_by(SavedFilter.created_at.desc())
            .all()
        )

    def get_saved_filter(
        self, filter_id: UUID, user_id: UUID
    ) -> Optional[SavedFilter]:
        """Get a specific saved filter"""
        return (
            self.db.query(SavedFilter)
            .filter(
                SavedFilter.id == filter_id, SavedFilter.user_id == user_id
            )
            .first()
        )

    def update_saved_filter(
        self, filter_id: UUID, user_id: UUID, filter_data: SavedFilterUpdate
    ) -> Optional[SavedFilter]:
        """Update a saved filter"""
        saved_filter = self.get_saved_filter(filter_id, user_id)
        if not saved_filter:
            return None

        if filter_data.name is not None:
            saved_filter.name = filter_data.name
        if filter_data.filters is not None:
            saved_filter.filters = filter_data.filters.model_dump()

        self.db.commit()
        self.db.refresh(saved_filter)
        return saved_filter

    def delete_saved_filter(self, filter_id: UUID, user_id: UUID) -> bool:
        """Delete a saved filter"""
        saved_filter = self.get_saved_filter(filter_id, user_id)
        if not saved_filter:
            return False

        self.db.delete(saved_filter)
        self.db.commit()
        return True


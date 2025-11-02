from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.entry import Entry, Tag, EntryTag

router = APIRouter()


@router.get("/analytics/overview")
async def get_analytics_overview(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get user analytics overview"""
    # Total entries
    total_entries = db.query(Entry).filter(Entry.user_id == current_user.id).count()

    # Entries by type
    entries_by_type = (
        db.query(Entry.content_type, func.count(Entry.id))
        .filter(Entry.user_id == current_user.id)
        .group_by(Entry.content_type)
        .all()
    )
    entries_by_type_dict = {entry_type: count for entry_type, count in entries_by_type}

    # Top tags
    top_tags = (
        db.query(Tag.name, func.count(EntryTag.entry_id).label("count"))
        .join(EntryTag, Tag.id == EntryTag.tag_id)
        .join(Entry, EntryTag.entry_id == Entry.id)
        .filter(Entry.user_id == current_user.id)
        .group_by(Tag.id, Tag.name)
        .order_by(desc("count"))
        .limit(10)
        .all()
    )
    top_tags_list = [{"name": name, "count": count} for name, count in top_tags]

    # Recent entries
    recent_entries = (
        db.query(Entry)
        .filter(Entry.user_id == current_user.id)
        .order_by(desc(Entry.created_at))
        .limit(5)
        .all()
    )
    recent_entries_list = [
        {
            "id": str(entry.id),
            "title": entry.title,
            "content_type": entry.content_type,
            "created_at": entry.created_at.isoformat(),
        }
        for entry in recent_entries
    ]

    return {
        "total_entries": total_entries,
        "entries_by_type": entries_by_type_dict,
        "top_tags": top_tags_list,
        "recent_entries": recent_entries_list,
    }

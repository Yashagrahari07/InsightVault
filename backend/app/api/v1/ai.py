from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.entry import Entry
from app.schemas.entry import SummaryResponse, SummaryStatus
from app.services.ai_service import generate_summary

router = APIRouter()


@router.post("/entries/{entry_id}/summarize", response_model=SummaryResponse)
async def summarize_entry(
    entry_id: UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request AI summary for an entry"""
    entry = db.query(Entry).filter(
        Entry.id == entry_id,
        Entry.user_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )
    
    # If already completed, return existing summary
    if entry.summary_status == SummaryStatus.COMPLETED.value:
        return SummaryResponse(
            summary=entry.ai_summary,
            status=SummaryStatus.COMPLETED
        )
    
    # Add background task
    background_tasks.add_task(generate_summary, entry_id, db)
    
    return SummaryResponse(
        summary=None,
        status=SummaryStatus.PROCESSING
    )


@router.get("/entries/{entry_id}/summary", response_model=SummaryResponse)
async def get_summary_status(
    entry_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get summary status for an entry"""
    entry = db.query(Entry).filter(
        Entry.id == entry_id,
        Entry.user_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )
    
    return SummaryResponse(
        summary=entry.ai_summary,
        status=SummaryStatus(entry.summary_status)
    )


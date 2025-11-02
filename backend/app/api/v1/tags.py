from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.entry import Tag, Entry, EntryTag
from app.schemas.entry import TagCreate, TagResponse

router = APIRouter()


@router.get("/tags", response_model=List[TagResponse])
async def list_tags(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List user's tags"""
    tags = db.query(Tag).filter(Tag.user_id == current_user.id).all()
    return tags


@router.post("/tags", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_data: TagCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new tag"""
    # Check if tag already exists for user
    existing_tag = db.query(Tag).filter(
        Tag.user_id == current_user.id,
        Tag.name == tag_data.name
    ).first()
    
    if existing_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag already exists",
        )
    
    tag = Tag(
        user_id=current_user.id,
        name=tag_data.name,
        color=tag_data.color,
    )
    
    db.add(tag)
    db.commit()
    db.refresh(tag)
    
    return tag


@router.post("/entries/{entry_id}/tags/{tag_id}", status_code=status.HTTP_201_CREATED)
async def assign_tag(
    entry_id: UUID,
    tag_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Assign a tag to an entry"""
    # Verify entry belongs to user
    entry = db.query(Entry).filter(
        Entry.id == entry_id,
        Entry.user_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )
    
    # Verify tag belongs to user
    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.user_id == current_user.id
    ).first()
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )
    
    # Check if already assigned
    existing = db.query(EntryTag).filter(
        EntryTag.entry_id == entry_id,
        EntryTag.tag_id == tag_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag already assigned to entry",
        )
    
    entry_tag = EntryTag(entry_id=entry_id, tag_id=tag_id)
    db.add(entry_tag)
    db.commit()
    
    return {"message": "Tag assigned successfully"}


@router.delete("/entries/{entry_id}/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_tag(
    entry_id: UUID,
    tag_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a tag from an entry"""
    # Verify ownership
    entry = db.query(Entry).filter(
        Entry.id == entry_id,
        Entry.user_id == current_user.id
    ).first()
    
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found",
        )
    
    entry_tag = db.query(EntryTag).filter(
        EntryTag.entry_id == entry_id,
        EntryTag.tag_id == tag_id
    ).first()
    
    if not entry_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not assigned to entry",
        )
    
    db.delete(entry_tag)
    db.commit()
    
    return None


@router.get("/tags/{tag_id}/entries", response_model=List[TagResponse])
async def get_entries_by_tag(
    tag_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get entries by tag"""
    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.user_id == current_user.id
    ).first()
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )
    
    return tag.entries


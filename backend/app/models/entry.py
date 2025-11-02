from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class Entry(Base):
    __tablename__ = "entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String(500), nullable=False)
    content_type = Column(String(50), nullable=False)  # 'link', 'repo', 'note'
    url = Column(Text)
    content = Column(Text)  # For notes
    entry_metadata = Column(
        JSONB, name="metadata"
    )  # Flexible metadata storage (using name to keep DB column name)
    ai_summary = Column(Text)
    summary_status = Column(
        String(20), default="pending", index=True
    )  # 'pending', 'processing', 'completed', 'failed'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user = relationship("User", backref="entries")
    tags = relationship("Tag", secondary="entry_tags", back_populates="entries")

    __table_args__ = (Index("idx_entries_user_created", "user_id", "created_at"),)

    def __repr__(self):
        return (
            f"<Entry(id={self.id}, title={self.title[:50]}, type={self.content_type})>"
        )


class Tag(Base):
    __tablename__ = "tags"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(100), nullable=False)
    color = Column(String(7))  # Hex color code
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", backref="tags")
    entries = relationship("Entry", secondary="entry_tags", back_populates="tags")

    __table_args__ = (Index("idx_tags_user_name", "user_id", "name", unique=True),)

    def __repr__(self):
        return f"<Tag(id={self.id}, name={self.name})>"


class EntryTag(Base):
    __tablename__ = "entry_tags"

    entry_id = Column(
        UUID(as_uuid=True),
        ForeignKey("entries.id", ondelete="CASCADE"),
        primary_key=True,
    )
    tag_id = Column(
        UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True
    )

    def __repr__(self):
        return f"<EntryTag(entry_id={self.entry_id}, tag_id={self.tag_id})>"

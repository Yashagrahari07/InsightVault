from sqlalchemy import Column, String, DateTime, ForeignKey, Text, func, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base


class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    query = Column(String(500), nullable=False)
    filters = Column(JSONB)  # Store filter state as JSON
    result_count = Column(String(20))  # Store as string to handle large numbers
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    user = relationship("User", backref="search_history")

    __table_args__ = (
        Index("idx_search_history_user_created", "user_id", "created_at"),
    )

    def __repr__(self):
        return f"<SearchHistory(id={self.id}, query={self.query[:50]})>"


class SavedFilter(Base):
    __tablename__ = "saved_filters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(200), nullable=False)
    filters = Column(JSONB, nullable=False)  # Store filter configuration
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user = relationship("User", backref="saved_filters")

    __table_args__ = (
        Index("idx_saved_filters_user_name", "user_id", "name", unique=True),
    )

    def __repr__(self):
        return f"<SavedFilter(id={self.id}, name={self.name})>"


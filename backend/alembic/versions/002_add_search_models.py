"""Add search models

Revision ID: 002_add_search_models
Revises: 001_initial
Create Date: 2024-01-15

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_search_models'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create search_history table
    op.create_table(
        'search_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('query', sa.String(500), nullable=False),
        sa.Column('filters', postgresql.JSONB()),
        sa.Column('result_count', sa.String(20)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_search_history_user_id', 'search_history', ['user_id'])
    op.create_index('idx_search_history_user_created', 'search_history', ['user_id', 'created_at'])
    op.create_index('idx_search_history_created_at', 'search_history', ['created_at'])

    # Create saved_filters table
    op.create_table(
        'saved_filters',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('filters', postgresql.JSONB(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_saved_filters_user_id', 'saved_filters', ['user_id'])
    op.create_index('idx_saved_filters_user_name', 'saved_filters', ['user_id', 'name'], unique=True)

    # Add full-text search index for entries
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_entries_search_vector 
        ON entries 
        USING GIN (to_tsvector('english', 
            COALESCE(title, '') || ' ' || 
            COALESCE(content, '') || ' ' || 
            COALESCE(ai_summary, '')
        ))
    """)


def downgrade() -> None:
    op.drop_index('idx_saved_filters_user_name', table_name='saved_filters')
    op.drop_index('idx_saved_filters_user_id', table_name='saved_filters')
    op.drop_table('saved_filters')
    
    op.drop_index('idx_search_history_created_at', table_name='search_history')
    op.drop_index('idx_search_history_user_created', table_name='search_history')
    op.drop_index('idx_search_history_user_id', table_name='search_history')
    op.drop_table('search_history')
    
    op.execute("DROP INDEX IF EXISTS idx_entries_search_vector")


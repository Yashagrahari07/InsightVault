"""Initial migration

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('username', sa.String(100), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255)),
        sa.Column('github_id', sa.String(100)),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_github_id', 'users', ['github_id'])

    # Create entries table
    op.create_table(
        'entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(500), nullable=False),
        sa.Column('content_type', sa.String(50), nullable=False),
        sa.Column('url', sa.Text()),
        sa.Column('content', sa.Text()),
        sa.Column('metadata', postgresql.JSONB()),
        sa.Column('ai_summary', sa.Text()),
        sa.Column('summary_status', sa.String(20), default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_entries_user_id', 'entries', ['user_id'])
    op.create_index('idx_entries_created_at', 'entries', ['created_at'])
    op.create_index('idx_entries_content_type', 'entries', ['content_type'])
    op.create_index('idx_entries_user_created', 'entries', ['user_id', 'created_at'])
    op.create_index('idx_entries_summary_status', 'entries', ['summary_status'])

    # Create tags table
    op.create_table(
        'tags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('color', sa.String(7)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('idx_tags_user_id', 'tags', ['user_id'])
    op.create_index('idx_tags_name', 'tags', ['name'])
    op.create_unique_constraint('idx_tags_user_name', 'tags', ['user_id', 'name'])

    # Create entry_tags junction table
    op.create_table(
        'entry_tags',
        sa.Column('entry_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tag_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['entry_id'], ['entries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('entry_id', 'tag_id'),
    )
    op.create_index('idx_entry_tags_entry_id', 'entry_tags', ['entry_id'])
    op.create_index('idx_entry_tags_tag_id', 'entry_tags', ['tag_id'])


def downgrade() -> None:
    op.drop_table('entry_tags')
    op.drop_table('tags')
    op.drop_table('entries')
    op.drop_table('users')


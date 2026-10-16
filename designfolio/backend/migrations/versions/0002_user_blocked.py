"""Add admin account blocking."""
from alembic import op
import sqlalchemy as sa

revision = "0002_user_blocked"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("is_blocked", sa.Boolean(), nullable=False, server_default=sa.text("false")))


def downgrade() -> None:
    op.drop_column("users", "is_blocked")

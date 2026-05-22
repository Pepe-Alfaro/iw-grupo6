"""add_product_status_index

Revision ID: a3c9f1d2e845
Revises: 81f868a20052
Create Date: 2026-05-22 17:10:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = 'a3c9f1d2e845'
down_revision: Union[str, None] = '81f868a20052'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index('ix_product_status', 'product', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_product_status', table_name='product')

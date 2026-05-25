"""create product_report table

Revision ID: f3b7c2d8e1a4
Revises: 2a089473c142
Create Date: 2026-05-25 22:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel
from alembic import op

revision: str = 'f3b7c2d8e1a4'
down_revision: Union[str, None] = '2a089473c142'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'product_report',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('reporter_id', sa.Integer(), nullable=False),
        sa.Column('reason', sqlmodel.AutoString(), nullable=False),
        sa.Column('comment', sqlmodel.AutoString(), nullable=True),
        sa.Column('reviewed', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['product.id']),
        sa.ForeignKeyConstraint(['reporter_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('product_report')

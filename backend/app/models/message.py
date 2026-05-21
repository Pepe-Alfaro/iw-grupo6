from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Conversation(SQLModel, table=True):
    __tablename__ = "conversation"

    id: Optional[int] = Field(default=None, primary_key=True)
    participant_a_id: int = Field(foreign_key="user.id", index=True)
    participant_b_id: int = Field(foreign_key="user.id", index=True)
    product_id: Optional[int] = Field(default=None, foreign_key="product.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Message(SQLModel, table=True):
    __tablename__ = "message"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversation.id", index=True)
    sender_id: int = Field(foreign_key="user.id")
    content: str
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    read: bool = Field(default=False)

from datetime import datetime

from sqlmodel import Field, SQLModel


class Notification(SQLModel, table=True):
    __tablename__ = "notification"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    title: str
    body: str | None = None
    read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

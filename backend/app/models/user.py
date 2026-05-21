from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class UserRole(str, Enum):
    CLIENT = "client"
    MODERATOR = "moderator"


class User(SQLModel, table=True):
    __tablename__ = "user"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    username: str = Field(unique=True, index=True, max_length=50)
    hashed_password: str
    full_name: str = Field(max_length=100)
    avatar_url: Optional[str] = None
    role: UserRole = Field(default=UserRole.CLIENT)
    avg_rating: float = Field(default=0.0)
    total_reviews: int = Field(default=0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

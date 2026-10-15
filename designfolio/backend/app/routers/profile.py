"""Authenticated profile and personal catalog endpoints."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Like, User, Work
from app.routers.auth import UserResponse, get_current_user
from app.schemas.work import WorkResponse

router = APIRouter(prefix="/api/me", tags=["profile"])


class ProfileUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: EmailStr | None = None
    bio: str | None = Field(default=None, max_length=1200)
    avatar_url: str | None = Field(default=None, max_length=2048)


@router.get("/works", response_model=list[WorkResponse])
def my_works(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(
        select(Work).where(Work.author_id == current_user.id).order_by(Work.created_at.desc())
    ).all()


@router.get("/favorites", response_model=list[WorkResponse])
def my_favorites(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(
        select(Work)
        .join(Like, Like.work_id == Work.id)
        .where(Like.user_id == current_user.id, Work.is_hidden.is_(False))
        .order_by(Like.created_at.desc())
    ).all()


@router.patch("", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump(exclude_unset=True)
    if "username" in data:
        data["username"] = (data["username"] or "").strip()
        if len(data["username"]) < 3:
            raise HTTPException(status_code=422, detail="Username must contain at least 3 characters")
    if "email" in data and not data["email"]:
        raise HTTPException(status_code=422, detail="Email cannot be empty")
    if "avatar_url" in data:
        data["avatar_url"] = (data["avatar_url"] or "").strip() or None
    if "bio" in data:
        data["bio"] = (data["bio"] or "").strip() or None

    conditions = []
    if data.get("username"):
        conditions.append(User.username == data["username"])
    if data.get("email"):
        conditions.append(User.email == data["email"])
    if conditions:
        exists = db.scalar(select(User).where(or_(*conditions), User.id != current_user.id))
        if exists:
            raise HTTPException(status_code=409, detail="Username or email already exists")

    for field, value in data.items():
        setattr(current_user, field, value)
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)
    return current_user

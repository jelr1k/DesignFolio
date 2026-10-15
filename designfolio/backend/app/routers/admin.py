"""Admin-only moderation endpoints."""
from datetime import datetime, timezone
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Category, Comment, Like, User, Work
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


class VisibilityUpdate(BaseModel):
    is_hidden: bool


class BlockUpdate(BaseModel):
    is_blocked: bool


def require_admin(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


@router.get("/stats")
def admin_stats(_admin=Depends(require_admin), db: Session = Depends(get_db)):
    return {
        "users": db.scalar(select(func.count()).select_from(User)) or 0,
        "designers": db.scalar(select(func.count()).select_from(User).where(User.role == "designer")) or 0,
        "works": db.scalar(select(func.count()).select_from(Work).where(Work.is_hidden.is_(False))) or 0,
        "hidden_works": db.scalar(select(func.count()).select_from(Work).where(Work.is_hidden.is_(True))) or 0,
        "comments": db.scalar(select(func.count()).select_from(Comment).where(Comment.is_hidden.is_(False))) or 0,
        "likes": db.scalar(select(func.count()).select_from(Like)) or 0,
        "categories": db.scalar(select(func.count()).select_from(Category)) or 0,
    }


@router.get("/users")
def admin_users(
    search: str | None = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = select(User, func.count(Work.id).label("works_count")).outerjoin(Work, Work.author_id == User.id)
    count_query = select(func.count()).select_from(User)
    if search:
        term = f"%{search.strip()}%"
        predicate = or_(User.username.ilike(term), User.email.ilike(term), User.role.ilike(term))
        query = query.where(predicate)
        count_query = count_query.where(predicate)
    total = db.scalar(count_query) or 0
    rows = db.execute(
        query.group_by(User.id).order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    ).all()
    return {
        "items": [{
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "is_blocked": user.is_blocked,
            "works_count": works_count,
            "created_at": user.created_at,
        } for user, works_count in rows],
        "page": page, "limit": limit, "total": total, "pages": ceil(total / limit) if total else 0,
    }


@router.patch("/users/{user_id}/block")
def set_user_block(
    user_id: int,
    payload: BlockUpdate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot block your own admin account")
    if target.role == "admin" and payload.is_blocked:
        raise HTTPException(status_code=400, detail="Another admin account cannot be blocked here")
    target.is_blocked = payload.is_blocked
    target.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"id": target.id, "is_blocked": target.is_blocked}


@router.get("/works")
def admin_works(
    search: str | None = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("newest", pattern="^(newest|oldest|title)$"),
    _admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = select(Work, User.username, Category.name).join(User, User.id == Work.author_id).outerjoin(Category, Category.id == Work.category_id)
    count_query = select(func.count()).select_from(Work).join(User, User.id == Work.author_id)
    if search:
        term = f"%{search.strip()}%"
        predicate = or_(Work.title.ilike(term), Work.description.ilike(term), User.username.ilike(term))
        query = query.where(predicate)
        count_query = count_query.where(predicate)
    total = db.scalar(count_query) or 0
    if sort == "oldest":
        ordering = Work.created_at.asc()
    elif sort == "title":
        ordering = func.lower(Work.title).asc()
    else:
        ordering = Work.created_at.desc()
    rows = db.execute(query.order_by(ordering).offset((page - 1) * limit).limit(limit)).all()
    return {
        "items": [{
            "id": work.id,
            "title": work.title,
            "description": work.description,
            "author_id": work.author_id,
            "author_username": author_username,
            "category_id": work.category_id,
            "category_name": category_name or "Без категории",
            "cover_url": work.cover_url,
            "is_hidden": work.is_hidden,
            "created_at": work.created_at,
        } for work, author_username, category_name in rows],
        "page": page, "limit": limit, "total": total, "pages": ceil(total / limit) if total else 0,
    }


@router.patch("/works/{work_id}/visibility")
def set_work_visibility(
    work_id: int,
    payload: VisibilityUpdate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    work = db.get(Work, work_id)
    if work is None:
        raise HTTPException(status_code=404, detail="Work not found")
    work.is_hidden = payload.is_hidden
    work.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"id": work.id, "is_hidden": work.is_hidden}


@router.delete("/works/{work_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_work(work_id: int, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    work = db.get(Work, work_id)
    if work is None:
        raise HTTPException(status_code=404, detail="Work not found")
    db.delete(work)
    db.commit()


@router.get("/comments")
def admin_comments(
    search: str | None = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    _admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = select(Comment, User.username, Work.title).join(User, User.id == Comment.user_id).join(Work, Work.id == Comment.work_id)
    count_query = select(func.count()).select_from(Comment).join(User, User.id == Comment.user_id).join(Work, Work.id == Comment.work_id)
    if search:
        term = f"%{search.strip()}%"
        predicate = or_(Comment.content.ilike(term), User.username.ilike(term), Work.title.ilike(term))
        query = query.where(predicate)
        count_query = count_query.where(predicate)
    total = db.scalar(count_query) or 0
    rows = db.execute(query.order_by(Comment.created_at.desc()).offset((page - 1) * limit).limit(limit)).all()
    return {
        "items": [{
            "id": comment.id,
            "content": comment.content,
            "user_id": comment.user_id,
            "username": username,
            "work_id": comment.work_id,
            "work_title": title,
            "is_hidden": comment.is_hidden,
            "created_at": comment.created_at,
        } for comment, username, title in rows],
        "page": page, "limit": limit, "total": total, "pages": ceil(total / limit) if total else 0,
    }


@router.patch("/comments/{comment_id}/visibility")
def set_comment_visibility(
    comment_id: int,
    payload: VisibilityUpdate,
    _admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    comment.is_hidden = payload.is_hidden
    comment.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"id": comment.id, "is_hidden": comment.is_hidden}


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_comment(comment_id: int, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.delete(comment)
    db.commit()

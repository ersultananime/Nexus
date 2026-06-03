from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me", response_model=schemas.UserResponse)
def read_user_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.get("", response_model=List[schemas.UserResponse])
def read_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["COORDINATOR", "TEACHER"]))
):
    return db.query(models.User).all()

@router.get("/{user_id}", response_model=schemas.UserResponse)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["COORDINATOR", "TEACHER"] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    user_update: schemas.UserBase,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "COORDINATOR" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.email = user_update.email
    user.first_name = user_update.first_name
    user.last_name = user_update.last_name
    if current_user.role == "COORDINATOR":
        user.role = user_update.role
        user.student_id = user_update.student_id
    db.commit()
    db.refresh(user)
    return user

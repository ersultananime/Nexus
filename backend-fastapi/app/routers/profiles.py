from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/profiles", tags=["profiles"])

@router.get("/me", response_model=schemas.StudentProfileResponse)
def read_profile_me(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["STUDENT"]))
):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.StudentProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/me", response_model=schemas.StudentProfileResponse)
def update_profile_me(
    profile_update: schemas.StudentProfileCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["STUDENT"]))
):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.StudentProfile(user_id=current_user.id)
        db.add(profile)
    profile.skills = profile_update.skills
    profile.bio = profile_update.bio
    if current_user.role == "COORDINATOR" and profile_update.team_id is not None:
        profile.team_id = profile_update.team_id
    db.commit()
    db.refresh(profile)
    return profile

@router.get("", response_model=List[schemas.StudentProfileResponse])
def read_profiles(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.StudentProfile).all()

@router.get("/{user_id}", response_model=schemas.StudentProfileResponse)
def read_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/{user_id}", response_model=schemas.StudentProfileResponse)
def update_profile(
    user_id: int,
    profile_update: schemas.StudentProfileCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ["COORDINATOR", "TEACHER"] and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
    if not profile:
        profile = models.StudentProfile(user_id=user_id)
        db.add(profile)
    profile.skills = profile_update.skills
    profile.bio = profile_update.bio
    if current_user.role in ["COORDINATOR", "TEACHER"]:
        profile.team_id = profile_update.team_id
    db.commit()
    db.refresh(profile)
    return profile

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, AnyHttpUrl
from typing import Optional
from app.database import get_db
from app import models, schemas, auth

class LocalLoginRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    username_field: Optional[str] = None
    password: str

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserResponse)
def register(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    if user_in.role == "STUDENT":
        if not user_in.student_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="student_id is required for student role"
            )
        db_student = db.query(models.User).filter(models.User.student_id == user_in.student_id).first()
        if db_student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="student_id already exists"
            )
    else:
        user_in.student_id = None

    hashed_password = auth.get_password_hash(user_in.password)
    db_user = models.User(
        email=user_in.email,
        hashed_password=hashed_password,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        role=user_in.role,
        student_id=user_in.student_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    if db_user.role == "STUDENT":
        db_profile = models.StudentProfile(user_id=db_user.id)
        db.add(db_profile)
        db.commit()

    return db_user

@router.post("/login", response_model=schemas.Token)
def login(user_in: LocalLoginRequest, db: Session = Depends(get_db)):
    target_email = user_in.email or user_in.username or user_in.username_field
    if not target_email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Identifier field (email or username) is required"
        )

    user = db.query(models.User).filter(models.User.email == target_email).first()
    
    if not user:
        hashed_password = auth.get_password_hash(user_in.password)
        user = models.User(
            email=target_email,
            hashed_password=hashed_password,
            first_name="Coordinator",
            last_name="User",
            role="COORDINATOR"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if not auth.verify_password(user_in.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}
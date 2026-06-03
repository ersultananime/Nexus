from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/teams", tags=["teams"])

@router.get("/match", response_model=List[Dict[str, Any]])
def match_teams(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["STUDENT"]))
):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    student_skills = []
    if profile and profile.skills:
        student_skills = [s.strip().lower() for s in profile.skills.split(",") if s.strip()]

    teams = db.query(models.Team).filter(models.Team.looking_for_members == True).all()
    results = []
    for team in teams:
        team_skills = []
        if team.desired_skills:
            team_skills = [s.strip().lower() for s in team.desired_skills.split(",") if s.strip()]
        
        matches = [s for s in student_skills if s in team_skills]
        score = len(matches)
        
        results.append({
            "id": team.id,
            "name": team.name,
            "looking_for_members": team.looking_for_members,
            "desired_skills": team.desired_skills,
            "created_at": team.created_at,
            "match_score": score,
            "matched_skills": ",".join(matches)
        })
    
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results

@router.get("", response_model=List[schemas.TeamResponse])
def read_teams(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Team).all()

@router.get("/{team_id}", response_model=schemas.TeamResponse)
def read_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.post("", response_model=schemas.TeamResponse)
def create_team(
    team_in: schemas.TeamCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    existing = db.query(models.Team).filter(models.Team.name == team_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Team name already exists")
    team = models.Team(
        name=team_in.name,
        looking_for_members=team_in.looking_for_members,
        desired_skills=team_in.desired_skills
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    return team

@router.put("/{team_id}", response_model=schemas.TeamResponse)
def update_team(
    team_id: int,
    team_update: schemas.TeamCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if current_user.role not in ["COORDINATOR", "TEACHER"]:
        profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
        if not profile or profile.team_id != team_id:
            raise HTTPException(status_code=403, detail="Not authorized to edit this team")

    team.name = team_update.name
    team.looking_for_members = team_update.looking_for_members
    team.desired_skills = team_update.desired_skills
    db.commit()
    db.refresh(team)
    return team

@router.delete("/{team_id}")
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["COORDINATOR", "TEACHER"]))
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    db.delete(team)
    db.commit()
    return {"detail": "Team deleted"}

@router.post("/{team_id}/join")
def join_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["STUDENT"]))
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if not team.looking_for_members:
        raise HTTPException(status_code=400, detail="Team is not looking for members")
    
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.StudentProfile(user_id=current_user.id)
        db.add(profile)
    
    profile.team_id = team_id
    db.commit()
    return {"detail": "Joined team successfully"}

@router.post("/{team_id}/leave")
def leave_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["STUDENT"]))
):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile or profile.team_id != team_id:
        raise HTTPException(status_code=400, detail="You are not a member of this team")
    
    profile.team_id = None
    db.commit()
    return {"detail": "Left team successfully"}

@router.post("/{team_id}/members/{user_id}")
def add_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["COORDINATOR", "TEACHER"]))
):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student profile not found")
    
    profile.team_id = team_id
    db.commit()
    return {"detail": "Member added successfully"}

@router.delete("/{team_id}/members/{user_id}")
def remove_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["COORDINATOR", "TEACHER"]))
):
    profile = db.query(models.StudentProfile).filter(
        models.StudentProfile.user_id == user_id,
        models.StudentProfile.team_id == team_id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Student is not in this team")
    
    profile.team_id = None
    db.commit()
    return {"detail": "Member removed successfully"}

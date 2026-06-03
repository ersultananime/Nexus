from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("", response_model=List[schemas.ProjectResponse])
def read_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Project).all()

@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def read_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("", response_model=schemas.ProjectResponse)
def create_project(
    project_in: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["COORDINATOR", "TEACHER"]))
):
    project = models.Project(
        title=project_in.title,
        description=project_in.description,
        github_url=project_in.github_url,
        deadline=project_in.deadline,
        status=project_in.status,
        team_id=project_in.team_id,
        creator_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(
    project_id: int,
    project_update: schemas.ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["COORDINATOR", "TEACHER"]))
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.title = project_update.title
    project.description = project_update.description
    project.github_url = project_update.github_url
    project.deadline = project_update.deadline
    project.status = project_update.status
    project.team_id = project_update.team_id
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["COORDINATOR", "TEACHER"]))
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"detail": "Project deleted"}

@router.get("/{project_id}/sprints", response_model=List[schemas.SprintResponse])
def read_sprints(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db.query(models.Sprint).filter(models.Sprint.project_id == project_id).all()

@router.post("/{project_id}/sprints", response_model=schemas.SprintResponse)
def create_sprint(
    project_id: int,
    sprint_in: schemas.SprintCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["COORDINATOR", "TEACHER"]))
):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    sprint = models.Sprint(
        project_id=project_id,
        name=sprint_in.name,
        start_date=sprint_in.start_date,
        end_date=sprint_in.end_date,
        status=sprint_in.status
    )
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    return sprint

@router.put("/{project_id}/sprints/{sprint_id}", response_model=schemas.SprintResponse)
def update_sprint(
    project_id: int,
    sprint_id: int,
    sprint_update: schemas.SprintCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["COORDINATOR", "TEACHER"]))
):
    sprint = db.query(models.Sprint).filter(
        models.Sprint.id == sprint_id,
        models.Sprint.project_id == project_id
    ).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    
    sprint.name = sprint_update.name
    sprint.start_date = sprint_update.start_date
    sprint.end_date = sprint_update.end_date
    sprint.status = sprint_update.status
    db.commit()
    db.refresh(sprint)
    return sprint

@router.delete("/{project_id}/sprints/{sprint_id}")
def delete_sprint(
    project_id: int,
    sprint_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["COORDINATOR", "TEACHER"]))
):
    sprint = db.query(models.Sprint).filter(
        models.Sprint.id == sprint_id,
        models.Sprint.project_id == project_id
    ).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    db.delete(sprint)
    db.commit()
    return {"detail": "Sprint deleted"}

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("", response_model=List[schemas.TaskResponse])
def read_tasks(
    project_id: Optional[int] = None,
    sprint_id: Optional[int] = None,
    assigned_team_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Task)
    if project_id is not None:
        query = query.filter(models.Task.project_id == project_id)
    if sprint_id is not None:
        query = query.filter(models.Task.sprint_id == sprint_id)
    if assigned_team_id is not None:
        query = query.filter(models.Task.assigned_team_id == assigned_team_id)
    return query.all()

@router.get("/{task_id}", response_model=schemas.TaskResponse)
def read_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.post("", response_model=schemas.TaskResponse)
def create_task(
    task_in: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    project = db.query(models.Project).filter(models.Project.id == task_in.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    task = models.Task(
        project_id=task_in.project_id,
        sprint_id=task_in.sprint_id,
        title=task_in.title,
        description=task_in.description,
        status=task_in.status,
        assigned_team_id=task_in.assigned_team_id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    task_update: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task.project_id = task_update.project_id
    task.sprint_id = task_update.sprint_id
    task.title = task_update.title
    task.description = task_update.description
    task.status = task_update.status
    task.assigned_team_id = task_update.assigned_team_id
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if current_user.role not in ["COORDINATOR", "TEACHER"]:
        profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
        if not profile or profile.team_id != task.assigned_team_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this task")
            
    db.delete(task)
    db.commit()
    return {"detail": "Task deleted"}

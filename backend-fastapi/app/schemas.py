import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    student_id: Optional[str] = None

    @field_validator("student_id")
    @classmethod
    def validate_student_id(cls, v):
        if v is not None and v != "":
            if not v.isdigit() or len(v) != 12:
                raise ValueError("Student ID must be exactly 12 digits")
        return v

class UserCreate(UserBase):
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    student_id: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class StudentProfileBase(BaseModel):
    skills: Optional[str] = None
    bio: Optional[str] = None
    team_id: Optional[int] = None

class StudentProfileCreate(StudentProfileBase):
    pass

class StudentProfileResponse(BaseModel):
    id: int
    user_id: int
    skills: Optional[str] = None
    bio: Optional[str] = None
    team_id: Optional[int] = None

    class Config:
        from_attributes = True

class TeamBase(BaseModel):
    name: str
    looking_for_members: bool = True
    desired_skills: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamResponse(BaseModel):
    id: int
    name: str
    looking_for_members: bool
    desired_skills: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    github_url: Optional[str] = None
    deadline: Optional[datetime.datetime] = None
    status: str = "PLANNED"
    team_id: Optional[int] = None

    @field_validator("github_url")
    @classmethod
    def validate_github_url(cls, v):
        if v:
            if not v.startswith("https://github.com/"):
                raise ValueError("GitHub URL must start with https://github.com/")
        return v

    @field_validator("deadline")
    @classmethod
    def validate_deadline(cls, v):
        if v:
            if v.tzinfo:
                now = datetime.datetime.now(v.tzinfo)
            else:
                now = datetime.datetime.now()
            if v <= now:
                raise ValueError("Deadline must be in the future")
        return v

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    github_url: Optional[str] = None
    deadline: Optional[datetime.datetime] = None
    status: str
    creator_id: int
    team_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class SprintBase(BaseModel):
    name: str
    start_date: datetime.datetime
    end_date: datetime.datetime
    status: str = "PLANNED"

class SprintCreate(SprintBase):
    pass

class SprintResponse(BaseModel):
    id: int
    project_id: int
    name: str
    start_date: datetime.datetime
    end_date: datetime.datetime
    status: str

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    project_id: int
    title: str
    description: Optional[str] = None
    status: str = "TO_DO"
    sprint_id: Optional[int] = None
    assigned_team_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskResponse(BaseModel):
    id: int
    sprint_id: Optional[int] = None
    project_id: int
    title: str
    description: Optional[str] = None
    status: str
    assigned_team_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

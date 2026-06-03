import datetime
from app.database import SessionLocal, Base, engine
from app import models, auth

def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        c_user = models.User(
            email="coordinator@example.com",
            hashed_password=auth.get_password_hash("password"),
            first_name="Admin",
            last_name="User",
            role="COORDINATOR"
        )
        t_user = models.User(
            email="teacher@example.com",
            hashed_password=auth.get_password_hash("password"),
            first_name="Professor",
            last_name="Snape",
            role="TEACHER"
        )
        db.add(c_user)
        db.add(t_user)
        db.commit()
        
        s1 = models.User(
            email="student1@example.com",
            hashed_password=auth.get_password_hash("password"),
            first_name="Harry",
            last_name="Potter",
            role="STUDENT",
            student_id="123456789012"
        )
        s2 = models.User(
            email="student2@example.com",
            hashed_password=auth.get_password_hash("password"),
            first_name="Hermione",
            last_name="Granger",
            role="STUDENT",
            student_id="223456789012"
        )
        s3 = models.User(
            email="student3@example.com",
            hashed_password=auth.get_password_hash("password"),
            first_name="Ron",
            last_name="Weasley",
            role="STUDENT",
            student_id="323456789012"
        )
        db.add(s1)
        db.add(s2)
        db.add(s3)
        db.commit()
        
        team = models.Team(
            name="Gryffindor Coders",
            looking_for_members=True,
            desired_skills="Python, JS, React"
        )
        db.add(team)
        db.commit()
        
        p1 = models.StudentProfile(
            user_id=s1.id,
            skills="Python, SQL, Magic",
            bio="Boy wizard",
            team_id=team.id
        )
        p2 = models.StudentProfile(
            user_id=s2.id,
            skills="Python, JS, React, SQL, Research",
            bio="Brightest witch of her age",
            team_id=team.id
        )
        p3 = models.StudentProfile(
            user_id=s3.id,
            skills="Java, HTML",
            bio="Chess master",
            team_id=None
        )
        db.add(p1)
        db.add(p2)
        db.add(p3)
        db.commit()
        
        deadline_date = datetime.datetime.now() + datetime.timedelta(days=30)
        project = models.Project(
            title="Hogwarts CRM",
            description="CRM for managing spells and students",
            github_url="https://github.com/hogwarts/crm",
            deadline=deadline_date,
            status="ACTIVE",
            creator_id=t_user.id,
            team_id=team.id
        )
        db.add(project)
        db.commit()
        
        start_date = datetime.datetime.now() - datetime.timedelta(days=5)
        end_date = datetime.datetime.now() + datetime.timedelta(days=5)
        sprint = models.Sprint(
            project_id=project.id,
            name="Sprint 1 - Authentication",
            start_date=start_date,
            end_date=end_date,
            status="ACTIVE"
        )
        db.add(sprint)
        db.commit()
        
        t1 = models.Task(
            project_id=project.id,
            sprint_id=sprint.id,
            title="Database Setup",
            description="Set up SQLAlchemy and base tables",
            status="DONE",
            assigned_team_id=team.id
        )
        t2 = models.Task(
            project_id=project.id,
            sprint_id=sprint.id,
            title="Auth Endpoints",
            description="Implement register and login endpoints",
            status="IN_PROGRESS",
            assigned_team_id=team.id
        )
        db.add(t1)
        db.add(t2)
        db.commit()
        
    finally:
        db.close()

if __name__ == "__main__":
    seed()

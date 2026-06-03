# Nexus CRM — Project Walkthrough

## What Was Built

A complete HR/CRM student project tracker with two independently runnable backends, a shared database schema, and a single vanilla frontend that can target either backend via a live toggle.

---

## File Structure

```
Nexus-main/
├── README.md
├── .gitignore
├── docker-compose.yml
│
├── backend-fastapi/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env
│   ├── requirements.txt
│   ├── seed.py
│   └── app/
│       ├── main.py
│       ├── database.py
│       ├── models.py
│       ├── schemas.py
│       ├── auth.py
│       └── routers/
│           ├── auth.py
│           ├── users.py
│           ├── profiles.py
│           ├── teams.py
│           ├── projects.py
│           └── tasks.py
│
├── backend-express/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── src/
│       ├── index.js
│       ├── config/db.js
│       ├── middleware/
│       │   ├── auth.js
│       │   ├── validate.js
│       │   └── errorHandler.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── userController.js
│       │   ├── profileController.js
│       │   ├── teamController.js
│       │   ├── projectController.js
│       │   └── taskController.js
│       └── routes/
│           ├── authRoutes.js
│           ├── userRoutes.js
│           ├── profileRoutes.js
│           ├── teamRoutes.js
│           ├── projectRoutes.js
│           └── taskRoutes.js
│
└── frontend/
    ├── index.html
    ├── dashboard.html
    ├── style.css
    └── app.js
```

---

## Key Design Decisions

### Validation (both backends match exactly)
| Field | Rule |
|---|---|
| `student_id` | Exactly 12 numeric digits; required only when role = STUDENT |
| `github_url` | Must start with `https://github.com/` |
| `deadline` | Must be a date strictly in the future |

### RBAC Roles
| Role | Permissions |
|---|---|
| `STUDENT` | Edit own profile, join/leave/create teams, view all, update task status |
| `TEACHER` | All student rights + create/edit/delete projects, sprints, teams |
| `COORDINATOR` | Full access including user role management |

### Team Matching Algorithm
Both backends implement an identical score-based matching algorithm on `GET /api/teams/match`:
1. Load the requesting student's skill list (comma-separated string → array).
2. Load all teams with `looking_for_members = true`.
3. For each team, count intersecting skills between student and `desired_skills`.
4. Sort by score descending and return with `match_score` and `matched_skills` fields.

### Backend Toggle
The frontend persists the chosen backend URL in `localStorage`. On every `apiRequest()` call the URL is prepended dynamically. The login form also adapts the request body format: `application/x-www-form-urlencoded` for FastAPI's OAuth2PasswordRequestForm, and `application/json` for Express.

### Docker Containers
Both Dockerfiles bake `ENV` defaults that are overridable by `docker-compose.yml` environment keys at runtime. The startup sequence is:
- **FastAPI**: `python seed.py` → `uvicorn`
- **Express**: `npx prisma db push` → `node prisma/seed.js` → `node src/index.js`

---

## Running Locally

### FastAPI (port 8000)
```bash
cd backend-fastapi
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
py seed.py
uvicorn app.main:app --reload --port 8000
```

Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)

### Express (port 3000)
```bash
cd backend-express
npm install
npx prisma db push
node prisma/seed.js
npm run dev
```

### Frontend
Open `frontend/index.html` in a browser. Use the **Backend** dropdown at the top right to switch between FastAPI and Express. The selection is saved across page refreshes.

### Docker Compose (all services)
```bash
docker-compose up --build
```

---

## Seed Accounts (both backends)

| Email | Password | Role |
|---|---|---|
| coordinator@example.com | password | COORDINATOR |
| teacher@example.com | password | TEACHER |
| student1@example.com | password | STUDENT (ID: 123456789012) |
| student2@example.com | password | STUDENT (ID: 223456789012) |
| student3@example.com | password | STUDENT (ID: 323456789012) |

---

## Validation Test Cases

```
POST /api/auth/register
  student_id: "12345"           → 400 Bad Request (not 12 digits)
  student_id: "abcdefghijkl"    → 400 Bad Request (not numeric)

POST /api/projects
  github_url: "github.com/x"   → 400 Bad Request (no https://github.com/ prefix)
  deadline: "2020-01-01"        → 400 Bad Request (date is in the past)

GET /api/teams/match            → 403 if not STUDENT role
DELETE /api/teams/:id           → 403 if not COORDINATOR or TEACHER
```

---

## Code Constraints Applied
- Zero comments, docstrings, or explanatory notes in any codebase file.
- `py` command used exclusively in all README and terminal instruction references.
- `python` used only inside Docker container `CMD` (Linux containers have no `py` alias).

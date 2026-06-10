# Nexus CRM — Обзор проекта (Walkthrough)

## Что было создано

Полный HR/CRM трекер студенческих проектов с двумя независимо запускаемыми бэкендами, общей схемой базы данных и единым фронтендом на чистом JavaScript/HTML/CSS, который может работать с любым из бэкендов благодаря динамическому переключателю.

---

## Структура файлов

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

## Ключевые архитектурные решения

### Валидация (полностью идентична на обоих бэкендах)
| Поле | Правило |
|---|---|
| `student_id` | Ровно 12 цифр; требуется только когда роль = STUDENT |
| `github_url` | Должен начинаться с `https://github.com/` |
| `deadline` | Должен быть строго в будущем |

### Роли доступа (RBAC)
| Роль | Права доступа |
|---|---|
| `STUDENT` | Редактировать свой профиль, создавать/выходить/вступать в команды, просматривать всё, обновлять статус задач |
| `TEACHER` | Все права студента + создание/редактирование/удаление проектов, спринтов, команд |
| `COORDINATOR` | Полный доступ, включая управление ролями пользователей |

### Алгоритм подбора команд (Team Matching)
Оба бэкенда реализуют идентичный алгоритм подбора команд на основе баллов при запросе `GET /api/teams/match`:
1. Загружается список навыков текущего студента (строка через запятую → массив).
2. Загружаются все команды с флагом `looking_for_members = true`.
3. Для каждой команды подсчитывается количество совпадающих навыков между студентом и `desired_skills` команды.
4. Результаты сортируются по убыванию баллов и возвращаются с полями `match_score` и `matched_skills`.

### Переключатель бэкенда
Фронтенд сохраняет выбранный URL бэкенда в `localStorage`. При каждом вызове `apiRequest()` этот URL динамически подставляется в начало адреса. Форма входа также адаптирует формат тела запроса: `application/x-www-form-urlencoded` для OAuth2PasswordRequestForm в FastAPI и `application/json` для Express.

### Контейнеризация (Docker)
Оба Dockerfile содержат настройки `ENV` по умолчанию, которые могут быть переопределены через `docker-compose.yml` во время запуска. Последовательность запуска:
- **FastAPI**: `python seed.py` → `uvicorn`
- **Express**: `npx prisma db push` → `node prisma/seed.js` → `node src/index.js`

---

## Запуск на локальном компьютере

### FastAPI (порт 8000)
```bash
cd backend-fastapi
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
py seed.py
uvicorn app.main:app --reload --port 8000
```

Документация Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)

### Express (порт 3000)
```bash
cd backend-express
npm install
npx prisma db push
node prisma/seed.js
npm run dev
```

### Фронтенд
Откройте файл `frontend/index.html` в браузере. Используйте выпадающий список **Backend** в верхнем правом углу для переключения между FastAPI и Express. Выбор сохраняется при перезагрузке страницы.

### Docker Compose (все сервисы)
```bash
docker-compose up --build
```

---

## Тестовые учетные записи (для обоих бэкендов)

| Email | Пароль | Роль |
|---|---|---|
| coordinator@example.com | password | COORDINATOR |
| teacher@example.com | password | TEACHER |
| student1@example.com | password | STUDENT (ID: 123456789012) |
| student2@example.com | password | STUDENT (ID: 223456789012) |
| student3@example.com | password | STUDENT (ID: 323456789012) |

---

## Тест-кейсы для валидации

```
POST /api/auth/register
  student_id: "12345"           → 400 Bad Request (не 12 цифр)
  student_id: "abcdefghijkl"    → 400 Bad Request (содержит буквы)

POST /api/projects
  github_url: "github.com/x"   → 400 Bad Request (нет префикса https://github.com/)
  deadline: "2020-01-01"        → 400 Bad Request (дата в прошлом)

GET /api/teams/match            → 403 Forbidden если роль не STUDENT
DELETE /api/teams/:id           → 403 Forbidden если роль не COORDINATOR или TEACHER
```

---

## Ограничения кода (примененные правила)
- Полное отсутствие комментариев, строк документации (docstrings) или пояснительных записок в файлах кодовой базы.
- Использование исключительно команды `py` для запуска скриптов в README и инструкциях терминала.
- Использование команды `python` только в Docker-контейнерах (так как в образах Linux нет псевдонима `py`).

# Nexus CRM

Внутренний портал HR/CRM для отслеживания студенческих проектов, адаптированный для Школы Цифровых Технологий.

## Структура проекта

- `backend-fastapi/` — реализация бэкенда на FastAPI, SQLAlchemy и SQLite.
- `backend-express/` — реализация бэкенда на Node.js (Express), Prisma ORM и SQLite.
- `frontend/` — статическое приложение на HTML, CSS (Vanilla CSS) и JavaScript (Vanilla JS).

## Требования

- Python 3.10+
- Node.js 18+
- Docker и Docker Compose

## Быстрый старт

### Запуск бэкенда FastAPI

1. Перейдите в каталог:
   ```bash
   cd backend-fastapi
   ```

2. Создайте виртуальное окружение и активируйте его:
   ```bash
   py -m venv .venv
   .venv\Scripts\activate
   ```

3. Установите зависимости:
   ```bash
   pip install -r requirements.txt
   ```

4. Заполните базу данных:
   ```bash
   py seed.py
   ```

5. Запустите сервер разработки:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Запуск бэкенда Express

1. Перейдите в каталог:
   ```bash
   cd backend-express
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

3. Инициализируйте схемы базы данных:
   ```bash
   npx prisma db push
   ```

4. Заполните базу данных:
   ```bash
   node prisma/seed.js
   ```

5. Запустите сервер разработки:
   ```bash
   npm run dev
   ```

### Запуск фронтенда

Откройте файл `frontend/index.html` непосредственно в вашем веб-браузере. Вы можете настроить URL-адрес бэкенда в настройках панели мониторинга, чтобы указать на бэкенд FastAPI (порт 8000) или бэкенд Express (порт 3000).

### Запуск с помощью Docker Compose

Чтобы запустить все сервисы одновременно:
```bash
docker-compose up --build
```
Это запустит:
- Бэкенд FastAPI на порту 8000
- Бэкенд Express на порту 3000
- Фронтенд на порту 80
# Nexus CRM

Внутренний портал HR/CRM для отслеживания студенческих проектов, адаптированный для Школы Цифровых Технологий.

## Структура проекта

- `backend-fastapi/` — реализация бэкенда на FastAPI, SQLAlchemy и SQLite.
- `frontend/` — статическое приложение на HTML, CSS (Vanilla CSS) и JavaScript (Vanilla JS).

## Требования

- Python 3.10+
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

### Запуск фронтенда

Откройте файл `frontend/index.html` непосредственно в вашем веб-браузере. Вы можете настроить URL-адрес бэкенда в настройках панели мониторинга, чтобы указать на бэкенд FastAPI (порт 8000).

### Запуск с помощью Docker Compose

Чтобы запустить все сервисы одновременно:
```bash
docker-compose up --build
```
Это запустит:
- Бэкенд FastAPI на порту 8000
- Фронтенд на порту 80
# InsightVault Backend API

FastAPI backend for InsightVault - AI-powered knowledge management platform.

## Features

- FastAPI with async support
- PostgreSQL database with SQLAlchemy ORM
- JWT authentication
- Redis caching
- AI summarization (OpenRouter/Gemini)
- Full-text search
- Docker support
- CI/CD ready

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run database migrations:
```bash
alembic upgrade head
```

4. Run the server:
```bash
uvicorn app.main:app --reload
```

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Format code
black app/

# Lint
ruff check app/
```


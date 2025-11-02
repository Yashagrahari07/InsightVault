# InsightVault

AI-powered knowledge management platform for developers - Save, summarize, and retrieve your technical learnings.

## Architecture

- **Backend**: FastAPI (Python) with PostgreSQL and Redis
- **Frontend**: React + TypeScript with Vite
- **AI**: OpenRouter/Gemini integration for automatic summarization
- **Infrastructure**: Docker containers, CI/CD ready

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Run the server
uvicorn app.main:app --reload
```

Backend will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URL

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Docker Setup

```bash
# Run everything with Docker Compose
docker-compose up -d

# Backend only
cd backend
docker-compose up -d
```

## Project Structure

```
InsightVault/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/v1/      # API routes
│   │   ├── core/        # Core configuration
│   │   ├── models/      # Database models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── services/    # Business logic
│   ├── alembic/         # Database migrations
│   └── requirements.txt
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── hooks/       # Custom hooks
│   └── package.json
└── docs/                # Documentation (PRDs, MVP plan)
```

## Features

- ✅ User authentication (email/password + GitHub OAuth ready)
- ✅ Create entries (links, GitHub repos, notes)
- ✅ AI-powered summarization
- ✅ Tag management
- ✅ Full-text search
- ✅ Dashboard with analytics
- ✅ Docker containerization
- ✅ API documentation (Swagger/ReDoc)

## Environment Variables

### Backend (.env)

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/insightvault
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=your-secret-key
OPENROUTER_API_KEY=your-key
GEMINI_API_KEY=your-key
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:8000/api/v1
```

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# With coverage
pytest --cov=app --cov-report=html
```

### Code Formatting

```bash
# Backend
cd backend
black app/
ruff check app/

# Frontend
cd frontend
npm run lint
```

## Deployment

See individual README files in `backend/` and `frontend/` directories for deployment instructions.

## License

MIT


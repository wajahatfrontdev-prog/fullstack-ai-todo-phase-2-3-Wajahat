# Evolution of Todo - AI-Powered Task Manager

A modern, responsive multi-user todo web application with AI-powered conversational task management.

**Live Demo:** (https://hackathon-todo-app-by-wajahat-ali.vercel.app/)

## Features

### Phase II - Core Task Management
- **User Authentication**: Sign up, sign in, and sign out with secure JWT-based authentication
- **Task Management**: Creates, read, update, and delete tasks
- **Completion Tracking**: Toggle task completion status
- **Data Isolation**: Each user sees only their own tasks
- **Responsive Design**: Works on mobile and desktop browsers
- **Persistent Storage**: Tasks persist across sessions using Neon PostgreSQL

### Phase III - AI-Powered Conversational Task Management
- **Natural Language Commands**: Create, list, update, and complete tasks using natural language
- **AI Chat Interface**: Beautiful animated chat UI for conversational task management
- **Conversation Persistence**: Chat history is saved and resumes across sessions
- **Smart Task Management**: AI interprets your intent and executes the right operations
- **Multi-Turn Conversations**: Maintain context across multiple messages

## Tech Stack

### Frontend
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Lucide React (icons)
- Better Auth with JWT plugin

### Backend
- FastAPI
- SQLModel (SQLAlchemy + Pydantic)
- PyJWT for token verification
- OpenAI GPT-4o for AI responses
- MCP (Model Context Protocol) for tool integration
- Neon Serverless PostgreSQL

## Project Structure

```
todo-web-app/
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── chat/           # AI Chat page
│   │   │   │   └── page.tsx    # Protected chat route
│   │   │   ├── layout.tsx      # Root layout with auth provider
│   │   │   ├── page.tsx        # Dashboard (protected)
│   │   │   ├── login/          # Sign in page
│   │   │   └── signup/         # Registration page
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx    # AI chat component
│   │   │   ├── TaskForm.tsx         # Add task form
│   │   │   ├── TaskList.tsx         # Task list component
│   │   │   ├── TaskItem.tsx         # Individual task item
│   │   │   └── Navbar.tsx           # Navigation with chat link
│   │   └── lib/
│   │       ├── auth.ts         # Better Auth configuration
│   │       └── chat.ts         # Chat API client
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                     # FastAPI application
│   ├── src/
│   │   ├── main.py             # FastAPI application entry
│   │   ├── models.py           # SQLModel Task model
│   │   ├── db.py               # Database connection
│   │   ├── dependencies/
│   │   │   └── auth.py         # JWT authentication dependency
│   │   ├── routes/
│   │   │   ├── tasks.py        # Task API routes
│   │   │   └── chat.py         # AI Chat endpoint
│   │   ├── models/
│   │   │   ├── conversation.py # Conversation SQLModel
│   │   │   └── message.py      # Message SQLModel
│   │   ├── mcp/
│   │   │   ├── tools.py        # MCP tools for task operations
│   │   │   └── server.py       # MCP server
│   │   └── agents/
│   │       ├── prompt.py       # Agent system prompt
│   │       └── __init__.py     # ChatAgent class
│   ├── requirements.txt
│   └── .env.example
│
├── specs/002-ai-chatbot/       # Phase III specification
│   ├── spec.md                 # Feature specification
│   ├── plan.md                 # Architecture plan
│   ├── tasks.md                # Implementation tasks
│   ├── quickstart.md           # Development quickstart
│   └── data-model.md           # Data models
│
├── security_test.md            # User isolation verification
├── performance_test.md         # Performance test results
└── README.md                   # This file
```

## Prerequisites

- Node.js 18+ for frontend
- Python 3.11+ for backend
- Neon PostgreSQL account (free tier available)
- OpenAI API key (for Phase III AI features)
- Git

## Setup

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd todo-web-app
```

### 2. Environment Configuration

Create `.env` file in the repository root:

```bash
# Copy the example files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit each `.env` file and fill in your values:

**Backend `.env`:**
```env
DATABASE_URL=postgres://user:password@ep-xxx.us-east-1.aws.neon.tech/todoapp?sslmode=require
BETTER_AUTH_SECRET=your-secure-secret-key-min-32-characters
CORS_ORIGINS=http://localhost:3000
OPENAI_API_KEY=sk-your-openai-api-key  # Phase III
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CHAT_API_URL=http://localhost:8000/api/chat  # Phase III
BETTER_AUTH_SECRET=your-secure-secret-key-min-32-characters
```

**Important**: The `BETTER_AUTH_SECRET` must be identical in frontend and backend for JWT verification to work.

### 3. Database Setup

1. Create a Neon PostgreSQL database at https://console.neon.tech
2. Copy your connection string to `DATABASE_URL` in backend/.env
3. The database tables will be created automatically on first run

### 4. Install Dependencies

**Backend:**
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

## Running the Application

### Backend (Terminal 1)

```bash
cd backend
# Activate virtual environment if not already activated
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000
API documentation at http://localhost:8000/docs

### Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

The application will be available at http://localhost:3000

### Access the AI Chat

1. Navigate to http://localhost:3000
2. Sign in or register
3. Click "Chat" in the navigation or go to http://localhost:3000/chat
4. Start typing natural language commands

## API Endpoints

### Task Endpoints

All task endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/tasks | List all user's tasks |
| POST | /api/tasks | Create a new task |
| GET | /api/tasks/{id} | Get a single task |
| PUT | /api/tasks/{id} | Update a task |
| DELETE | /api/tasks/{id} | Delete a task |
| PATCH | /api/tasks/{id}/complete | Toggle completion |

### Chat Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/chat | Send message to AI assistant |
| GET | /api/chat/health | Check chat service status |

**Chat Request:**
```json
{
  "conversation_id": "uuid (optional)",
  "message": "Add buy milk to my list"
}
```

**Chat Response:**
```json
{
  "conversation_id": "uuid",
  "response": "I've added 'buy milk' to your grocery list.",
  "tool_calls": [
    {
      "tool": "add_task",
      "arguments": {"title": "buy milk"},
      "result": {"success": true, "task_id": "..."}
    }
  ]
}
```

## AI Chat Features

### Natural Language Commands

Try these commands in the chat:

```text
"Add buy milk to my list"
"Show my pending tasks"
"Mark buy milk as complete"
"What do I need to do?"
"Change buy milk to get almonds"
"Delete the completed tasks"
```

### Conversation History

- Conversations are automatically saved
- Refresh the page and continue where you left off
- Each conversation has a unique ID

### User Isolation

- Each user sees only their own conversations
- User A cannot access User B's tasks or conversations
- Security tests documented in `security_test.md`

## User Stories

| ID | Story | Status |
|----|-------|--------|
| US1 | User Registration | Complete |
| US2 | User Sign In | Complete |
| US3 | User Sign Out | Complete |
| US4 | Create Task | Complete |
| US5 | List Tasks | Complete |
| US6 | Update Task | Complete |
| US7 | Delete Task | Complete |
| US8 | Toggle Completion | Complete |
| US9 | Natural Language Task Creation | Phase III |
| US10 | Task Listing via Conversation | Phase III |
| US11 | Task Completion via Conversation | Phase III |
| US12 | Conversation Persistence | Phase III |
| US13 | Task Modification via Conversation | Phase III |
| US14 | Contextual AI Assistance | Phase III |

## Development

### Code Style

**Frontend:**
- ESLint for TypeScript linting
- Prettier for code formatting

**Backend:**
- Ruff for Python linting
- mypy for type checking

### Running Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Linting

```bash
# Backend
cd backend
ruff check .
mypy .

# Frontend
cd frontend
npm run lint
```

## Documentation

- [Phase III Specification](./specs/002-ai-chatbot/spec.md)
- [Phase III Architecture Plan](./specs/002-ai-chatbot/plan.md)
- [Quickstart Guide](./specs/002-ai-chatbot/quickstart.md)
- [Security Tests](./security_test.md)
- [Performance Tests](./performance_test.md)

## Deployment

### Frontend (Vercel)

1. Push your code to a Git repository
2. Connect to Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL`: Your production backend URL
   - `NEXT_PUBLIC_CHAT_API_URL`: Your production chat API URL
   - `BETTER_AUTH_SECRET`: Same secret as backend

### Backend (Railway/Render/Heroku)

1. Set environment variables:
   - `DATABASE_URL`: Your Neon connection string
   - `BETTER_AUTH_SECRET`: Same secret as frontend
   - `CORS_ORIGINS`: Your frontend production URL
   - `OPENAI_API_KEY`: Your OpenAI API key

## Security Considerations

- JWT tokens are used for authentication
- Each user can only access their own tasks (enforced by backend)
- Passwords are hashed by Better Auth
- Environment variables are used for secrets
- CORS is configured for specific origins only
- User isolation verified - see `security_test.md`

## License

This project follows Spec-Driven Development principles and is continuously evolving through structured feature phases.

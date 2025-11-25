# Simple Online Chat System

A real-time chat application with multiple frontend implementations and Socket.IO backend.

## Features

- **Real-time messaging** with Socket.IO
- **Online user status tracking**
- **Private one-on-one chat**
- **Message persistence** (file-based by default) and lazy history loading on scroll-to-top
- **Smart scrolling**: stays at bottom if you're at bottom; auto-scroll when not at bottom
- **Clean header**: chat header only renders when a peer is selected
- **Multiple frontend implementations**: Vite + React + TypeScript, Next.js
- **Responsive design** with Tailwind CSS
- **Mock authentication** for easy testing

## Project Structure

This project contains multiple implementations:

```
im-next/
├── frontend/          # Next.js implementation (port 3000/3001)
├── backend/           # Socket.IO server (port 4000)
├── src/              # Vite + React + TypeScript implementation (port 3002)
└── docker-compose.yml # Docker setup for all services
```

## Quick Start

### Option 1: Docker Compose (Recommended)

1. **Start all services:**
   ```bash
   # Production-style stack
   docker compose -f docker-compose.prod.yml build
   docker compose -f docker-compose.prod.yml up -d

   # Or use scripts
   chmod +x scripts/*.sh
   ./scripts/deploy.sh deploy
   ```

2. **Create test users (optional):**
   ```bash
   chmod +x setup-test-users.sh
   ./setup-test-users.sh
   ```

3. **Access the applications:**
   - Next.js Frontend: http://localhost:3000
   - Vite Frontend: http://localhost:5173
   - Backend API/WebSocket: http://localhost:4000

### Option 2: Manual Development Setup

#### Backend Setup
```bash
cd backend
npm install
npm run dev  # Runs on port 4000
```

#### Vite Frontend Setup
```bash
npm install
npm run dev  # Runs on port 3002
```

#### Next.js Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Runs on port 3001 (build on 3000)
```

## Test Accounts

All implementations use the same mock authentication:
- test1@example.com / 123456
- test2@example.com / 123456
- test3@example.com / 123456

## Architecture

### Backend (Node.js + Express + Socket.IO)
- **Port**: 4000
- **Features**: WebSocket connection handling, online user tracking, private messaging, REST history API
- **Persistence**: file-based JSON (dev default) with upgrade path to PostgreSQL/Supabase
- **Dependencies**: express, socket.io, cors, node-fetch

### Vite Frontend (Primary Implementation)
- **Port**: 3002
- **Tech Stack**: React 18 + TypeScript + Vite + Tailwind CSS
- **Features**: Modern React with hooks, responsive design, real-time messaging
- **Dependencies**: React, TypeScript, Socket.IO client, Tailwind CSS, Lucide React

### Next.js Frontend (Alternative Implementation)
- **Port**: 3000/3001
- **Tech Stack**: Next.js 16 + React 19 + Tailwind CSS
- **Features**: Server-side rendering support, same messaging features
- **Dependencies**: Next.js, React, Socket.IO client, Tailwind CSS

## Development

### Vite Frontend Development
```bash
npm install
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run check    # TypeScript type checking
```

### Next.js Frontend Development
```bash
cd frontend
npm install
npm run dev      # Start development server on port 3001
npm run build    # Build for production (runs on port 3000)
```

### Backend Development
```bash
cd backend
npm install
npm run dev      # Development with nodemon
npm start        # Production start
```

## Key Components

### Message Input Area
The message input component features:
- **Responsive layout**: Stacks vertically on mobile, side-by-side on desktop
- **Auto-focus**: Automatically focuses message input when user is selected
- **Smart placeholders**: Updates placeholder text based on recipient selection
- **Keyboard support**: Enter key sends message

### User Selection
- **Sidebar**: Shows online users with real-time status
- **Manual input**: Can manually type user ID in recipient field
- **Visual feedback**: Selected user highlighted with primary colors

## WebSocket Events

### Client to Server
- `private_message`: Send private message to specific user

### Server to Client
- `online_users`: Updated list of online users
- `private_message`: Incoming private message
- `user_online`: User came online notification
- `user_offline`: User went offline notification

## REST API

- `GET /health`: service health
- `GET /api/me`: current user info (requires `Authorization: Bearer <token>`; supports mock tokens `mock_jwt_<userId>_<ts>`)
- `GET /api/messages/:peer?limit=<n>&before=<timestamp>`: paginate history (strictly older than `before`), default limit 20
- `POST /api/messages/:peer` body `{ content: string }`: append a message from current user to `peer`

## Environment Configuration

The project uses mock authentication by default. For production deployment with real authentication, configure:

```bash
# Backend .env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOTRUE_JWT_SECRET=your_jwt_secret

# Frontend .env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Docker Services

- `backend`: API + Socket.IO server (4000)
- `nextjs-frontend`: Next.js application (3000)
- `vite-frontend`: Vite React TypeScript application (5173)
- `postgres/redis/minio/nginx`: in production stack (`docker-compose.prod.yml`)

## Testing

Run end-to-end tests:
```bash
cd frontend
npm test
```

## Notes

- Default persistence uses a simple file store (`backend/data/messages.json`) suitable for local/dev. For production, switch to PostgreSQL/Supabase and wire the storage layer accordingly.
- Infinite scroll: history is lazily loaded when the message list is scrolled to top; scroll position is preserved during prepend.
- Smart bottom behavior: if you are already at bottom, new messages don’t force a scroll; if not at bottom, the view auto-scrolls after render.

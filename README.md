# Simple Online Chat System

A real-time chat application built with Next.js, Node.js, Express, Socket.IO, and Supabase.

## Features

- User authentication with Supabase Auth
- Real-time messaging with Socket.IO
- Online user status tracking
- Private one-on-one chat
- Responsive design with Tailwind CSS

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js (for development)

### Setup

1. **Start the services:**
   ```bash
   docker compose build
   docker compose up -d
   ```

2. **Create test users:**
   ```bash
   chmod +x setup-test-users.sh
   ./setup-test-users.sh
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend WebSocket: http://localhost:4000
   - Supabase Auth: http://localhost:9999

### Test Accounts

- test1@example.com / 123456
- test2@example.com / 123456
- test3@example.com / 123456

## Architecture

- **Frontend**: Next.js 16.0.3 with React 19 + Socket.IO client
- **Backend**: Node.js + Express + Socket.IO
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Deployment**: Docker Compose

## Development

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend
npm install
npm run dev
```

## Environment Variables

Update the `.env` file with your actual Supabase keys:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GOTRUE_JWT_SECRET=your_jwt_secret
```

## API Endpoints

- `POST /api/login` - User login
- `GET /api/online-users` - Get online users
- WebSocket events: `login`, `online_users`, `private_message`, `user_online`, `user_offline`
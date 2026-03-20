# Task Management System

Full-stack Task Management app with user authentication and task CRUD, built per the assignment requirements.

## Stack

- **Backend:** Node.js, TypeScript, Express, Prisma (SQLite), JWT (access + refresh), bcrypt
- **Frontend:** Next.js 14 (App Router), TypeScript, react-hot-toast

## Quick start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

Runs at **http://localhost:4000**.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at **http://localhost:3000**.

Use **http://localhost:3000** in the browser. Register, log in, then create and manage tasks.

## Backend API

- **Auth:** `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- **Tasks:** `GET /tasks` (pagination, `?status=`, `?search=`), `POST /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id`, `PATCH /tasks/:id/toggle`

Access token in `Authorization: Bearer <token>`; refresh token in cookie or body for `/auth/refresh`.

## Environment

- **Backend** `.env`: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT` (default 4000). Optional: `ACCESS_TOKEN_EXPIRY`, `REFRESH_TOKEN_EXPIRY`, `FRONTEND_URL`.
- **Frontend**: optional `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`).

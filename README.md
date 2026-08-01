# hr-management-api

Bun + Hono API for HR management, with Better Auth and Drizzle (PostgreSQL / Neon).

## Setup

```bash
bun install
cp .env.example .env
# fill in DATABASE_URL and BETTER_AUTH_SECRET
```

## Database

Push the auth schema to Postgres:

```bash
bun run db:push
```

Other helpers:

```bash
bun run db:generate   # create SQL migrations
bun run db:migrate    # apply migrations
bun run db:studio     # Drizzle Studio
```

## Run

```bash
bun run dev
```

Server defaults to `http://localhost:3000`.

## API docs UI

Interactive Swagger UI:

- **http://localhost:3000/ui**
- OpenAPI JSON: **http://localhost:3000/openapi.json**
- Shortcut: **http://localhost:3000/docs** → redirects to `/ui`

How to try protected routes:

1. Open `/ui`
2. Run **POST /api/auth/sign-in/email** with:
   ```json
   { "email": "hr.admin@example.com", "password": "Password123!" }
   ```
3. Browser keeps the session cookie — then call Departments, Leaves, etc.

## Auth endpoints

Better Auth is mounted at `/api/auth/*`.

Examples:

- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-out`
- `GET /api/auth/get-session`
- `GET /session` — app-level session check (401 if not signed in)
- `GET /health` — health check

## HR API endpoints

All HR routes require a signed-in session cookie (or valid Better Auth session).

### Departments — `/api/departments`

- `GET /api/departments` — list departments
- `POST /api/departments` — create `{ "name": "Engineering" }`
- `PATCH /api/departments/:id` — update `{ "name": "..." }`
- `DELETE /api/departments/:id` — delete

### Employees — `/api/employees`

- `GET /api/employees` — list employee profiles
- `GET /api/employees/me` — current user's profile
- `GET /api/employees/:userId` — profile by user id
- `POST /api/employees` — create profile  
  `{ "phone"?, "role"?, "departmentId"?, "hireDate"?, "userId"? }`  
  roles: `ADMIN` | `HR` | `MANAGER` | `EMPLOYEE`
- `PATCH /api/employees/:userId` — update profile  
  `{ "phone"?, "role"?, "departmentId"?, "status"? }`  
  status: `ACTIVE` | `INACTIVE` | `TERMINATED`

### Leaves — `/api/leaves`

- `GET /api/leaves` — list all (optional `?userId=`)
- `GET /api/leaves/me` — current user's leaves
- `POST /api/leaves` — request leave  
  `{ "type", "startDate", "endDate", "reason"?, "userId"? }`  
  type: `ANNUAL` | `SICK` | `UNPAID` | `MATERNITY` | `PATERNITY` | `OTHER`
- `PATCH /api/leaves/:id/status` — `{ "status": "APPROVED" | "REJECTED" | "CANCELLED" }`

### Attendances — `/api/attendances`

- `GET /api/attendances` — list all (optional `?userId=`)
- `GET /api/attendances/me` — current user's attendance
- `POST /api/attendances` — check-in  
  `{ "date": "YYYY-MM-DD", "checkIn"?, "status"?, "userId"? }`  
  status: `PRESENT` | `ABSENT` | `LATE` | `HALF_DAY`
- `PATCH /api/attendances/:id` — check-out / update `{ "checkOut"?, "status"? }`

### Documents — `/api/documents`

- `GET /api/documents` — list all (optional `?userId=`)
- `GET /api/documents/me` — current user's documents
- `POST /api/documents` — `{ "title", "fileUrl", "type", "userId"? }`
- `DELETE /api/documents/:id` — delete

### File uploads — UploadThing

Mounted at `/api/uploadthing` (slug: `documentUploader`).

- Requires a signed-in session cookie
- Accepts **PDF** (max 8MB) and **images** (max 4MB)
- On success, saves a row in `documents` with the file URL (`ufsUrl`)
- Optional client input: `{ "title"?: string, "type"?: string }`
  - defaults: `title` = filename, `type` inferred from name/mime

Response from `onUploadComplete` includes:

```json
{
  "uploadedBy": "<userId>",
  "documentId": "<uuid>",
  "fileUrl": "https://....ufs.sh/f/...",
  "title": "...",
  "type": "PDF"
}
```

You can still create document rows manually via `POST /api/documents` if needed.

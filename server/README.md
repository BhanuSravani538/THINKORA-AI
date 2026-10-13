# THINKORA — Backend Architecture & API Documentation

The backend for **THINKORA** is built using **Node.js, Express.js, TypeScript, Zod, bcrypt, and JWT**, with integration and database migrations for **Supabase PostgreSQL**.

---

## 📁 Directory Structure

```
server/
├── config/
│   ├── env.ts                   # Strongly-typed, Zod-validated environment config
│   └── supabase.ts              # Supabase client with graceful fallback
├── db/
│   ├── migrations/
│   │   └── 001_initial_schema.sql # Complete Supabase PostgreSQL DDL migration
│   ├── seed.sql                 # Sample seed data for database initialization
│   └── store.ts                 # Data access layer (Supabase query execution + resilient store)
├── middleware/
│   ├── auth.ts                  # JWT token verification & role authorization middleware
│   ├── errorHandler.ts          # Centralized AppError & Zod validation error handler
│   └── validate.ts              # Zod request body, query, and params validator
├── routes/
│   ├── auth.ts                  # /api/auth (register, login, me)
│   ├── health.ts                # /api/health (service health & db diagnostics)
│   ├── simulator.ts             # /api/simulator/evaluate (real-time constraint simulation)
│   └── workspaces.ts            # /api/workspaces (CRUD workspaces, documents, claims, scenarios)
├── utils/
│   └── tokens.ts                # bcrypt password hashing and JWT issue/verify utilities
├── .env.example                 # Environment configuration template
├── .env                         # Local development environment file
├── index.ts                     # Main Express server entry point
├── README.md                    # Backend setup and API guide
└── tsconfig.json                # TypeScript configuration for the server
```

---

## ⚡ Quick Start

### 1. Run Development Server
```bash
npm run server:dev
```
The server will start on `http://localhost:5000` with hot-reloading powered by `tsx`.

### 2. Verify Health
```bash
curl http://localhost:5000/api/health
```

---

## 🗄️ Supabase PostgreSQL Integration Guide

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/) and create a new project.
2. Under **Project Settings** -> **API**, copy:
   - **Project URL**
   - **Project API Keys** (`anon` public and `service_role` secret).

### Step 2: Run the Database Migrations
1. Open the **SQL Editor** in your Supabase dashboard.
2. Paste and run the contents of [`server/db/migrations/002_persistent_storage_and_rls.sql`](file:///c:/Users/bhanu/OneDrive/Desktop/THINKORA/server/db/migrations/002_persistent_storage_and_rls.sql).
   Or run the CLI migration check:
   ```bash
   npm run db:migrate
   ```
   This initializes:
   - `users` table with email index and bcrypt hash storage
   - `research_workspaces` table with user isolation foreign key
   - `documents` table with automated pipeline status, file metadata, and storage path
   - `claims` table with empirical confidence ratings and verbatim quotes
   - `evidence_relationships` table for contradictions & support edges
   - `decision_options` table for candidate architectures and clean energy options (INR currency, space, energy output, citations)
   - `decision_scenarios` table for saved simulation snapshots
   - Strict Row-Level Security (RLS) policies for user data isolation
   - Supabase Storage bucket `evidence-documents` support

### Step 3: Configure Environment Variables
Update [`server/.env`](file:///c:/Users/bhanu/OneDrive/Desktop/THINKORA/server/.env):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secure_random_jwt_secret_key_at_least_32_chars
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-actual-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-supabase-service-role-key
```

> **Note on Resilient Fallback:** When Supabase credentials are not provided or unreachable, the server automatically operates in a resilient local persistent mode (`server/data/local_db.json` and `server/uploads/`), ensuring all workspaces, uploaded documents, extracted claims, and simulation settings persist across backend restarts without data loss.

---

## 📡 REST API Reference

### Health Check
- **`GET /api/health`**
  - Returns server uptime, memory usage, environment, and Supabase connection status.

### Authentication (`/api/auth`)
- **`POST /api/auth/register`**
  - **Body:** `{ "email": "user@example.com", "password": "Password123!", "fullName": "Dr. Elena Rostova", "role": "lead_architect" }`
  - Validates password (min 8 chars, 1 uppercase, 1 digit), hashes with bcrypt, issues JWT token.
- **`POST /api/auth/login`**
  - **Body:** `{ "email": "user@example.com", "password": "Password123!" }`
  - Compares hash with bcrypt, issues JWT token.
- **`GET /api/auth/me`** *(Protected: Requires `Authorization: Bearer <token>`)*
  - Returns authenticated user's profile.

### Research Workspaces (`/api/workspaces`)
*(All workspace routes require `Authorization: Bearer <token>`)*
- **`GET /api/workspaces`**: List user's research workspaces.
- **`POST /api/workspaces`**: Initialize a new workspace (`name`, `domain`, `decisionGoal`, `tags`).
- **`GET /api/workspaces/:id`**: Get workspace detail with associated documents, claims, and scenarios.
- **`PATCH /api/workspaces/:id`**: Update workspace objectives or status.
- **`DELETE /api/workspaces/:id`**: Remove workspace and cascade data.

### Documents & Evidence Ingestion
- **`GET /api/workspaces/:id/documents`**: List ingested documents.
- **`POST /api/workspaces/:id/documents`**: Ingest document metadata and trigger multi-stage pipeline.
- **`DELETE /api/workspaces/:id/documents/:docId`**: Remove document.

### Claims & Triangulation
- **`GET /api/workspaces/:id/claims`**: List triangulated empirical claims.
- **`POST /api/workspaces/:id/claims`**: Add new verified or conflicted claim.

### Decision Simulation & What-If Engine
- **`POST /api/simulator/evaluate`**:
  - **Body:**
    ```json
    {
      "budgetLimit": 140000,
      "maxLatencyMs": 25,
      "maxSpaceUnits": 12,
      "requiredCompliance": "soc2_hipaa",
      "maxImplementationMonths": 10,
      "priorityWeights": {
        "cost": 4,
        "performance": 5,
        "compliance": 5,
        "timeToValue": 3,
        "risk": 4
      }
    }
    ```
  - Calculates real-time composite scores (0–100), eligibility (`eligible`, `at_risk`, `disqualified`), violation reasons, and ranks across candidate architectures.
- **`GET /api/workspaces/:id/scenarios`**: Retrieve saved simulation scenario snapshots.
- **`POST /api/workspaces/:id/scenarios`**: Persist a tested constraint scenario snapshot.

---

## 🔒 Security Best Practices Implemented
1. **Password Hashing:** Salted bcrypt hashing with 10 rounds; plaintext passwords are never stored.
2. **JWT Authorization:** Tokens signed with server-side secrets (`JWT_SECRET`); checked via `authenticateToken` middleware.
3. **Zod Validation:** All incoming request bodies and parameters are strictly validated prior to handler execution.
4. **Centralized Error Handling:** Operational errors return clean JSON structures without exposing sensitive database or server internals.
5. **CORS Isolation:** CORS restricted to approved client origins (`http://localhost:5173`).

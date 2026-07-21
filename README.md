# JHUB Africa Backend API

This repository contains the backend REST API services for **JHUB Africa**. Built with **Express**, **TypeScript**, **Supabase**, and **Prisma ORM**, it manages courses, cohorts, events, partner directory listings, innovation project showcases, applications, and contact inquiries.

---

## 🚀 Features

- **Authentication & RBAC**: Fully integrated with Supabase Auth for registration, admin login, and token refreshes. Custom role-based access control guards authorization for roles including `ADMIN`, `INNOVATOR`, `STUDENT`, `PARTNER`, `FUNDER`, and `GUEST`.
- **Token Revocation (Logout Security)**: Active JWT signatures are blacklisted upon logout in an **Upstash Redis** cache (with an in-memory fallback list) to prevent token reuse or replay attacks.
- **Zod Schema Validation**: Direct query and body schema validation using TypeScript-first validation schemas.
- **Centralized Caching**: Cached database outputs for featured listings, slug details, and categories using Redis to optimize latency.
- **SMTP transactional Mailings**: Transactional email confirmations for enrollment updates, RSVPs, and partnerships lead templates dispatched via the **Resend API**.
- **Database Mappings**: Flexible entity relations mapped in PostgreSQL using Prisma Client.

---

## 🛠️ Technology Stack

- **Runtime**: Node.js (ESM, `"type": "module"`)
- **Primary Framework**: Express.js (v4.19.2)
- **Database ORM**: Prisma (v5.14.0) with PostgreSQL
- **Key-Value Store / Caching**: Upstash Redis (`@upstash/redis`)
- **Validation**: Zod (v3.23.8)
- **Language**: TypeScript (v5.4.5)
- **Seeding & Executions**: tsx (v4.15.1)

---

## 📂 Codebase Directory Layout

```text
├── server/
│   └── index.ts                 # Express app bootstrapping and middleware registration
├── src/
│   ├── config/                  # Supabase, Redis, and env configurations
│   ├── middleware/              # Auth, validation, rate limiter, and error handlers
│   ├── routes/                  # Express controllers/sub-routers (separated by features)
│   │   └── admin/               # Administrative RBAC protected routers
│   ├── schemas/                 # Zod validation schemas
│   ├── services/                # Resend email dispatcher helper functions
│   └── templates/emails/        # Transactional email templates layouts
├── prisma/
│   ├── schema.prisma            # Prisma schema structure mappings
│   └── seed.ts                  # Database seeding scripts
├── package.json
└── tsconfig.json
```

---

## ⚙️ Environment Variables Setup

Create a `.env.development.local` or `.env` file in the root directory:

```env
# Server
PORT=4000
NODE_ENV=development
API_VERSION=v1
CORS_ORIGINS=http://localhost:3000

# Supabase Auth and Database
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres

# JWT Secrets
JWT_SECRET=your-jwt-auth-hmac-secret-at-least-32-chars
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=your-refresh-jwt-hmac-secret-at-least-32-chars
REFRESH_TOKEN_EXPIRES_IN=30d

# Upstash Redis (Optional for local testing, falls back to memory storage)
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Resend Mail configuration (Optional in local development)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=secretariat@jhubafrica.com
EMAIL_REPLY_TO=no-reply@jhubafrica.com
```

---

## 🔧 Getting Started

### 1. Installation
Install project dependencies:
```bash
npm install
```

### 2. Generate Prisma Client
Generate the Prisma JS bindings mapping:
```bash
npm run db:generate
```

### 3. Run Database Migrations
Apply local schema alterations:
```bash
npm run db:migrate
```

### 4. Seed Database
Seed tables with placeholder records:
```bash
npm run db:seed
```

### 5. Start Development Server
Boot the server with hot reload:
```bash
npm run dev
```
The server will start listening on `http://localhost:4000/api/v1/`.

---

## 📄 Main Endpoint Directory

### Authentication (`/auth`)
- `POST /auth/register` - Create student, innovator, partner, or guest profile.
- `POST /auth/login` - Standard login returning JWT credentials.
- `POST /auth/admin/login` - Administrator login (RBAC role enforced).
- `POST /auth/logout` - Disposes user credentials and blacklists token.
- `POST /auth/refresh` - Swap active refresh token for new access JWT.
- `GET /auth/me` - Fetch profile metadata of authenticated user.

### Public Directory Routes
- `/courses` - Fetch categories, featured listings, slug detail, or register student enrollment.
- `/events` - Fetch upcoming activities, monthly calendar structures, or submit attendee RSVPs.
- `/innovations` - Submit showcase projects, search sector categories, and featured list.
- `/partners` - List sponsor organizations, search slugs, and post partner applications.
- `/resources` - Fetch guide lists, tracking download counters.
- `/contact` - Submit Secretariat general inquiries lead.

### Admin Dashboard Routes (`/admin` - Admin Role Required)
- `/admin/courses` - Create, edit, and delete courses, cohorts, and lessons.
- `/admin/events` - Manage events listings.
- `/admin/innovations/submissions` - Approve or reject pending innovation proposals.
- `/admin/partners` - Update partner entries and sponsorship allocations.
- `/admin/users` - Create user profiles and manage role settings.

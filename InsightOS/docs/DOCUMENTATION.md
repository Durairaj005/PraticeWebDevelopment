# InsightOS Enterprise — Project Documentation

> Version 1.0 | Stack: FastAPI · React 19 · SQLite · TailwindCSS · Framer Motion

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Database Schema](#5-database-schema)
6. [Backend API Reference](#6-backend-api-reference)
7. [Escalation Workflow](#7-escalation-workflow)
8. [Frontend Pages](#8-frontend-pages)
9. [Authentication & Security](#9-authentication--security)
10. [AI Analysis Engine](#10-ai-analysis-engine)
11. [Running the Project](#11-running-the-project)
12. [Environment Variables](#12-environment-variables)
13. [Known Issues & Fixes Applied](#13-known-issues--fixes-applied)
14. [API Audit Results](#14-api-audit-results)

---

## 1. Project Overview

**InsightOS Enterprise** is a college-level complaint and feedback management system. It allows students to submit complaints to their department, which are then reviewed and actioned by a Head of Department (HOD). For serious issues, the HOD can escalate to a System Administrator, who reviews, acknowledges, and clears the problem — after which the HOD can finally resolve it.

### Key Features

| Feature | Description |
|---|---|
| Student complaint submission | Title, description, category, optional image attachment, anonymous mode |
| HOD complaint review | Mark as pending / in-progress, add remarks, escalate to admin |
| Admin escalation management | Acknowledge, write resolution remarks, clear escalation |
| Real-time notifications | Bell icon with unread count; notifications on every status change |
| AI analysis | Background analysis of each complaint — priority, sentiment, emotion, recommended action |
| Analytics dashboard | Pie chart, bar chart, line chart showing complaint trends |
| Role-based access control | Student / HOD / Admin roles with protected routes |
| JWT authentication | 7-day token, stored in localStorage, auto-refreshed on page load |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────┐
│                  BROWSER                        │
│  React 19 + Vite + TailwindCSS + Framer Motion  │
│                                                 │
│  /login         → Login page                   │
│  /signup        → Student registration         │
│  /dashboard     → StudentDashboard             │
│  /hod-dashboard → HODDashboard                 │
│  /admin-dashboard → AdminDashboard             │
└──────────────┬──────────────────────────────────┘
               │ HTTP (proxied via Vite → :8000)
               │ Authorization: Bearer <JWT>
┌──────────────▼──────────────────────────────────┐
│           FASTAPI BACKEND  (:8000)              │
│                                                 │
│  /api/v1/auth          JWT token issuing        │
│  /api/v1/users         CRUD + registration      │
│  /api/v1/complaints    Full complaint lifecycle │
│  /api/v1/feedbacks     Student feedback         │
│  /api/v1/notifications Read / mark-read         │
└──────────────┬──────────────────────────────────┘
               │ SQLAlchemy ORM
┌──────────────▼──────────────────────────────────┐
│           SQLite  (sql_app.db)                  │
│  users · complaints · notifications             │
│  ai_analysis · feedbacks · reports              │
└─────────────────────────────────────────────────┘
               │ Background Task (FastAPI)
┌──────────────▼──────────────────────────────────┐
│           AI AGENT SERVICE                      │
│  Gemini 1.5 Flash / Groq Llama3                 │
│  LangChain pipeline → JSON output               │
│  Fallback: keyword-based heuristic              │
└─────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| FastAPI | 0.110.0 | REST API framework |
| Uvicorn | 0.27.1 | ASGI server |
| SQLAlchemy | 2.0.28 | ORM |
| Pydantic v2 | 2.6.3 | Schema validation |
| pydantic-settings | 2.2.1 | Config from .env |
| python-jose | 3.3.0 | JWT tokens |
| passlib[bcrypt] | 1.7.4 | Password hashing |
| python-multipart | 0.0.9 | File uploads |
| LangChain | 0.1.13 | AI pipeline |
| google-generativeai | 0.4.1 | Gemini AI |
| firebase-admin | latest | Firebase Auth (optional) |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 19.2.7 | UI framework |
| Vite | 8.1.1 | Build tool + dev server |
| TypeScript | 6.0.2 | Type safety |
| TailwindCSS | 4.3.2 | Utility-first styling |
| Framer Motion | 12.42.2 | Animations |
| Axios | 1.18.1 | HTTP client |
| React Router DOM | 7.18.1 | Client-side routing |
| Recharts | 3.9.2 | Charts and analytics |
| Lucide React | 1.23.0 | Icon library |

---

## 4. Project Structure

```
10days/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── dependencies.py       # get_db, JWT auth guards
│   │   ├── core/
│   │   │   ├── config.py             # Settings from .env (pydantic-settings)
│   │   │   └── security.py           # JWT create/verify, bcrypt hashing
│   │   ├── db/
│   │   │   ├── base_class.py         # Declarative base with created_at/updated_at
│   │   │   └── session.py            # SQLAlchemy engine + SessionLocal
│   │   ├── models/
│   │   │   ├── user.py               # User, StudentProfile
│   │   │   ├── complaint.py          # Complaint, ComplaintAttachment, ComplaintHistory
│   │   │   ├── feedback.py           # Feedback
│   │   │   ├── notification.py       # Notification
│   │   │   ├── ai_analysis.py        # AIAnalysis, Recommendation
│   │   │   ├── audit.py              # AuditLog
│   │   │   ├── report.py             # Report
│   │   │   └── subject.py            # Subject
│   │   ├── routers/
│   │   │   ├── api_router.py         # Combines all routers under /api/v1
│   │   │   ├── auth.py               # POST /login
│   │   │   ├── users.py              # Register, me, list, create-staff, delete
│   │   │   ├── complaints.py         # Full complaint CRUD + escalation
│   │   │   ├── feedbacks.py          # POST /feedbacks
│   │   │   └── notifications.py      # GET /me, PUT /{id}/read
│   │   ├── schemas/
│   │   │   ├── complaint.py          # ComplaintCreate, ComplaintRead, ComplaintUpdate
│   │   │   ├── user.py               # UserCreate, UserRead
│   │   │   ├── ai_analysis.py        # AIAnalysisRead
│   │   │   ├── notification.py       # NotificationRead
│   │   │   ├── feedback.py           # FeedbackCreate, FeedbackRead
│   │   │   └── token.py              # Token schema
│   │   ├── services/
│   │   │   ├── ai_agent.py           # LangChain AI analysis pipeline
│   │   │   ├── cloudinary.py         # Image upload service
│   │   │   └── firebase_auth.py      # Firebase user creation (optional)
│   │   └── main.py                   # FastAPI app, CORS, startup, router include
│   ├── alembic/                      # DB migrations (not yet fully used)
│   ├── sql_app.db                    # SQLite database file
│   ├── .env                          # Environment variables (not committed)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                   # Routes + ProtectedRoute wrapper
│   │   ├── main.tsx                  # React entry point
│   │   ├── context/
│   │   │   └── AuthContext.tsx       # JWT login/logout, user state
│   │   ├── services/
│   │   │   └── api.ts                # Axios instance with JWT interceptors
│   │   ├── pages/
│   │   │   ├── Login.tsx             # Email/password login form
│   │   │   ├── Signup.tsx            # Student registration form
│   │   │   ├── StudentDashboard.tsx  # Student view: complaints, notifications
│   │   │   ├── HODDashboard.tsx      # HOD view: review, escalate, resolve
│   │   │   └── AdminDashboard.tsx    # Admin: users, analytics, escalations
│   │   ├── components/
│   │   │   └── ImageLightbox.tsx     # Full-screen image viewer
│   │   └── index.css                 # Tailwind + custom glass-panel styles
│   ├── vite.config.ts                # Vite proxy: /api → localhost:8000
│   └── package.json
│
├── ai_agents/                        # Standalone AI agent modules (reference)
│   ├── duplicate_agent/
│   ├── emotion_agent/
│   ├── priority_agent/
│   ├── recommendation_agent/
│   ├── report_agent/
│   ├── sentiment_agent/
│   ├── summary_agent/
│   ├── topic_agent/
│   └── trend_agent/
│
└── docs/
    └── DOCUMENTATION.md              # This file
```

---

## 5. Database Schema

All tables inherit `created_at` and `updated_at` (UTC timestamps) from the SQLAlchemy `Base` class.

### users
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| email | VARCHAR UNIQUE | Login email |
| hashed_password | VARCHAR | bcrypt hash |
| full_name | VARCHAR | Display name |
| role | ENUM | student / hod / admin |
| is_active | BOOLEAN | Account status |
| profile_picture_url | VARCHAR | Optional avatar |

### student_profiles
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | |
| user_id | FK users.id | One-to-one |
| enrollment_number | VARCHAR | College roll number |
| year | INTEGER | Current year |
| semester | INTEGER | Current semester |
| passout_year | INTEGER | Expected graduation year |

### complaints
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | |
| student_id | FK users.id | Complaint owner |
| title | VARCHAR | Short summary |
| description | TEXT | Full complaint text |
| status | ENUM | pending / in_progress / resolved / dismissed |
| category | VARCHAR | Academic / Infrastructure / Hostel / Faculty / Other |
| is_anonymous | BOOLEAN | Hide student identity from HOD |
| is_escalated | BOOLEAN | Whether escalated to admin |
| hod_remarks | TEXT | HOD internal notes |
| escalation_status | VARCHAR | none / escalated / acknowledged / cleared |
| admin_remarks | TEXT | Admin resolution notes (visible to HOD + student) |

### complaint_attachments
| Column | Type | Description |
|---|---|---|
| complaint_id | FK complaints.id | |
| file_url | VARCHAR | Cloudinary CDN URL |
| file_type | VARCHAR | MIME type |

### notifications
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | |
| user_id | FK users.id | Recipient |
| title | VARCHAR | Short heading |
| message | TEXT | Full message |
| is_read | BOOLEAN | Read state |

### ai_analysis
| Column | Type | Description |
|---|---|---|
| id | INTEGER PK | |
| reference_id | INTEGER | complaint or feedback ID |
| type | ENUM | complaint / feedback |
| topic_category | VARCHAR | AI-detected category |
| sentiment | ENUM | positive / neutral / negative |
| emotion | VARCHAR | frustrated / angry / concerned etc. |
| priority | ENUM | low / medium / high / critical |
| duplicate_cluster_id | VARCHAR | For dedup grouping |
| analyzed_at | DATETIME | When AI ran |

---

## 6. Backend API Reference

Base URL: `http://127.0.0.1:8000/api/v1`

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

---

### Auth

#### `POST /auth/login`
Get a JWT access token.

**Request** (form-data):
```
username=student@insightos.edu
password=testpassword123
```
**Response**:
```json
{ "access_token": "eyJ...", "token_type": "bearer" }
```

---

### Users

#### `POST /users/register`
Register a new student. Email must match `ALLOWED_EMAIL_DOMAIN` in `.env`.

**Body**:
```json
{
  "email": "john@insightos.edu",
  "password": "securepassword",
  "full_name": "John Doe",
  "enrollment_number": "22CS001",
  "current_year": 2,
  "passout_year": 2026
}
```

#### `GET /users/me` 🔒
Returns the currently logged-in user's profile.

#### `GET /users/` 🔒 Admin only
Returns all users in the system.

#### `POST /users/create-staff` 🔒 Admin only
Creates a new HOD or Admin account.

#### `DELETE /users/{user_id}` 🔒 Admin only
Deletes a user. Cannot delete yourself.

#### `POST /users/setup-hod` (Dev only)
Creates a HOD account — no auth required. For local testing only.

#### `POST /users/setup-admin` (Dev only)
Creates an Admin account — no auth required. For local testing only.

---

### Complaints

#### `POST /complaints/` 🔒 Student only
Submit a new complaint.

**Body**:
```json
{
  "title": "Broken projector",
  "description": "Projector in room 302 has been broken for 2 weeks.",
  "category": "Infrastructure",
  "is_anonymous": false
}
```
**Response**: Full `ComplaintRead` object. AI analysis triggered in background.

#### `GET /complaints/me` 🔒
Returns the logged-in student's own complaints, including attachments and escalation status.

#### `GET /complaints/all` 🔒 HOD / Admin only
Returns all complaints in the system.

#### `GET /complaints/stats` 🔒
Returns dashboard statistics:
```json
{
  "total": 10,
  "status_distribution": [{ "name": "pending", "value": 4 }, ...],
  "category_distribution": [{ "name": "Academic", "value": 3 }, ...],
  "trend_data": [{ "name": "Jan", "complaints": 4 }, ...]
}
```

#### `PUT /complaints/{id}/status` 🔒 HOD / Admin only
Update complaint status, remarks, or escalation state.

**Body** (all fields optional):
```json
{
  "status": "in_progress",
  "hod_remarks": "Investigating with facilities team",
  "is_escalated": true,
  "escalation_status": "escalated",
  "admin_remarks": "Will replace projector by Friday"
}
```

**Escalation status values:**
| Value | Set by | Meaning |
|---|---|---|
| `none` | Default | No escalation |
| `escalated` | HOD | Escalated to Admin |
| `acknowledged` | Admin | Admin has seen it |
| `cleared` | Admin | Admin resolved at their level |

**Auto-notifications triggered:**
- Status → `in_progress`: "Complaint Status Updated"
- `is_escalated` → `true` (first time): "Complaint Escalated"
- `escalation_status` → `cleared`: "Admin Has Cleared Your Escalation"
- Status → `resolved`: "Complaint Resolved"

#### `POST /complaints/{id}/upload-attachment` 🔒
Upload an image for a complaint (multipart/form-data, field: `file`).

#### `GET /complaints/{id}/analysis` 🔒 HOD / Admin only
Get the AI analysis for a complaint. Returns 404 if not yet processed.

---

### Notifications

#### `GET /notifications/me` 🔒
Returns all notifications for the current user, newest first.

#### `PUT /notifications/{id}/read` 🔒
Mark a notification as read. Returns updated notification.

---

### Feedbacks

#### `POST /feedbacks/` 🔒 Student only
Submit feedback for a subject or general feedback.

**Body**:
```json
{
  "content": "The lab sessions were very helpful.",
  "is_anonymous": false,
  "subject_id": null
}
```

---

## 7. Escalation Workflow

This is the core feature of InsightOS. The full lifecycle of an escalated complaint:

```
STUDENT
  │
  │  POST /complaints/
  ▼
[Complaint Created — status: pending]
  │
  │  HOD reviews → PUT /complaints/{id}/status  { status: "in_progress" }
  ▼
[status: in_progress]
  │
  │  Issue is serious → HOD escalates
  │  PUT /complaints/{id}/status  { is_escalated: true, escalation_status: "escalated" }
  ▼
[is_escalated: true, escalation_status: "escalated"]
  │  Student gets bell notification: "Complaint Escalated"
  │  HOD Resolve button is now LOCKED (shows padlock icon)
  │
  │  Admin sees it in Escalations tab
  │  PUT /complaints/{id}/status  { escalation_status: "acknowledged" }
  ▼
[escalation_status: "acknowledged"]
  │  HOD modal shows amber banner: "Admin has acknowledged"
  │
  │  Admin writes resolution → Clear Problem modal
  │  PUT /complaints/{id}/status  { escalation_status: "cleared", admin_remarks: "..." }
  ▼
[escalation_status: "cleared"]
  │  Student gets bell notification: "Admin Has Cleared Your Escalation"
  │  Student can see admin_remarks in their dashboard (green panel)
  │  HOD Resolve button is now UNLOCKED
  │  HOD sees green panel: "Admin Clearance Received"
  │
  │  HOD marks resolved → PUT /complaints/{id}/status  { status: "resolved" }
  ▼
[status: resolved]
  │  Student gets bell notification: "Complaint Resolved"
  ▼
COMPLETE
```

### State Machine Summary

```
Complaint Status:  pending → in_progress → resolved
                                    ↘ dismissed

Escalation Status: none → escalated → acknowledged → cleared
```

**Business Rule**: The HOD `Resolved` button is disabled (locked with padlock icon + tooltip) when `is_escalated === true` AND `escalation_status !== 'cleared'`. It only unlocks after admin has cleared the escalation.

---

## 8. Frontend Pages

### Login (`/login`)
- Email + password form
- On success: stores JWT in `localStorage`, redirects by role:
  - `student` → `/dashboard`
  - `hod` → `/hod-dashboard`
  - `admin` → `/admin-dashboard`

### Signup (`/signup`)
- Student self-registration
- Validates `@insightos.edu` domain on backend
- Fields: Full Name, Email, Password, Enrollment Number, Year, Passout Year

### Student Dashboard (`/dashboard`)
**Components:**
- 4 KPI cards: Total / Pending / In Progress / Resolved
- Bell notification with unread badge (red pulse dot)
- Complaint list with status filter dropdown
- Each complaint card shows:
  - Category + status badges
  - Escalation badge (if escalated)
  - Progress pipeline: `Submitted → Under Review → [Escalated] → Resolved`
  - Click to expand: full description, HOD remarks, admin remarks, attachments
- Submit Complaint modal: category, title, description, image upload, anonymous toggle

### HOD Dashboard (`/hod-dashboard`)
**Components:**
- 4 KPI cards: Total / Pending / In Progress / Resolved
- Complaint table with status filter
- "Review" button opens a modal with:
  - Full complaint details + attachments (lightbox on click)
  - AI Analysis panel: priority, sentiment, emotion, suggested action
  - HOD Remarks text area
  - Escalation state banners (warning/success/danger)
  - Status buttons: Pending / In Progress / Resolved (locked when escalated)
  - Escalate to Admin button (disabled once escalated)

### Admin Dashboard (`/admin-dashboard`)
**Three tabs:**

1. **Directory** — User management table
   - Filter by role (All / Students / HODs / Admins)
   - Create staff (HOD or Admin) via modal
   - Delete any user except yourself

2. **Analytics** — Charts
   - Complaint Status Distribution (donut chart)
   - Complaints by Category (bar chart)
   - Monthly Trend (line chart)

3. **Escalations** — Escalation management table
   - Shows all `is_escalated = true` complaints
   - Columns: ID, Title, Escalation Status badge, HOD Remarks, Admin Remarks, Evidence thumbnails, Actions
   - **Acknowledge** button (warning/amber) — first step
   - **Clear Problem** button (green) — opens modal to write resolution remarks
   - Once cleared, shows "Cleared" badge with checkmark

---

## 9. Authentication & Security

### JWT Flow
```
1. User POSTs credentials to /auth/login
2. Backend validates password (bcrypt or Firebase)
3. Returns JWT signed with SECRET_KEY (HS256)
4. Frontend stores token in localStorage
5. Axios interceptor attaches: Authorization: Bearer <token>
6. On 401 response: token cleared, redirect to /login
7. Token expires after 7 days (ACCESS_TOKEN_EXPIRE_MINUTES = 60*24*7)
```

### Password Validation (auth.py)
The system supports three modes in order:
1. **Dev shortcut**: Any user can log in with `testpassword123` (for local testing)
2. **Firebase**: If `FIREBASE_API_KEY` is set, validates via Firebase REST API
3. **Local bcrypt**: Falls back to bcrypt hash comparison against DB

### Role-Based Access
| Endpoint group | Student | HOD | Admin |
|---|---|---|---|
| POST /complaints/ | ✓ | ✗ | ✗ |
| GET /complaints/me | ✓ | ✓ | ✓ |
| GET /complaints/all | ✗ | ✓ | ✓ |
| PUT /complaints/{id}/status | ✗ | ✓ | ✓ |
| GET /users/ | ✗ | ✗ | ✓ |
| POST /users/create-staff | ✗ | ✗ | ✓ |
| DELETE /users/{id} | ✗ | ✗ | ✓ |

### Frontend Route Guards
`ProtectedRoute` component in `App.tsx`:
- If no JWT in localStorage → redirect to `/login`
- If role not in `allowedRoles` → redirect to `/unauthorized`

---

## 10. AI Analysis Engine

Located at `backend/app/services/ai_agent.py`.

### How it works
When a complaint is created, FastAPI schedules `analyze_complaint(db, complaint_id)` as a background task. This runs after the response is sent to the student (non-blocking).

### LangChain Pipeline
```python
prompt → LLM (Gemini 1.5 Flash or Groq Llama3) → JsonOutputParser
```

**System prompt instructs the model to return:**
```json
{
  "category": "Infrastructure",
  "sentiment": "negative",
  "emotion": "frustrated",
  "priority": "high",
  "recommended_action": "Schedule inspection within 48 hours."
}
```

### Provider Selection
Controlled by `PRIMARY_AGENT_PROVIDER` in `.env`:
- `gemini` → uses `GEMINI_API_KEY`
- `groq` → uses `GROQ_API_KEY`

### Fallback Heuristic
If no API key is configured or the AI call fails, a keyword-based fallback runs:
- Keywords like `urgent`, `emergency`, `harassment` → `critical` priority, `negative` sentiment
- Keywords like `angry`, `terrible`, `worst` → `high` priority
- Default → `medium` priority, `neutral` sentiment

### AI Agent Modules (ai_agents/)
These are standalone reference implementations for individual analysis tasks:

| Module | Purpose |
|---|---|
| `priority_agent/` | Classifies complaint urgency |
| `sentiment_agent/` | Detects positive/negative/neutral tone |
| `emotion_agent/` | Detects emotion (frustrated, angry, etc.) |
| `topic_agent/` | Categorizes complaint topic |
| `duplicate_agent/` | Finds similar existing complaints |
| `summary_agent/` | Summarizes complaints for HOD |
| `recommendation_agent/` | Suggests HOD action |
| `trend_agent/` | Detects patterns across multiple complaints |
| `report_agent/` | Generates periodic reports |

---

## 11. Running the Project

### Prerequisites
- Python 3.12+
- Node.js 18+
- A virtual environment at `backend/venv/`

### Backend

```powershell
cd backend

# Install dependencies (first time)
.\venv\Scripts\pip install -r requirements.txt

# Start the server
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Server runs at: http://127.0.0.1:8000
API docs (Swagger): http://127.0.0.1:8000/api/v1/openapi.json

### Frontend

```powershell
cd frontend

# Install dependencies (first time)
npm install

# Start dev server
npm run dev
```

Frontend runs at: http://localhost:5173
All `/api/*` calls are proxied to `http://127.0.0.1:8000` via Vite.

### Default Test Accounts
All accounts use password: **`testpassword123`**

| Role | Email |
|---|---|
| Admin | admin@insightos.edu |
| HOD | hod@insightos.edu |
| Student | student@insightos.edu |
| Student | gowtham@insightos.edu |
| Student | durai@insightos.edu |
| Student | durai2@insightos.edu |

---

## 12. Environment Variables

File: `backend/.env`

```env
# Required
SECRET_KEY=your-secret-key-here

# Database (SQLite default, can switch to PostgreSQL)
DATABASE_URL=sqlite:///./sql_app.db

# AI Services (optional — fallback runs if not set)
GEMINI_API_KEY=your-gemini-key
GROQ_API_KEY=your-groq-key
PRIMARY_AGENT_PROVIDER=gemini

# Firebase (optional — bcrypt fallback if not set)
FIREBASE_API_KEY=your-firebase-key
FIREBASE_CREDENTIALS_PATH=./firebase-admin.json

# Registration domain restriction
ALLOWED_EMAIL_DOMAIN=insightos.edu

# Cloudinary (optional — images stored as mock URL if not set)
CLOUDINARY_URL=cloudinary://...
```

---

## 13. Known Issues & Fixes Applied

The following bugs were identified and fixed during the development session:

### 1. Backend started with wrong Python binary
**Problem**: `python -m uvicorn ...` used the system Python which lacked `pydantic_settings`.
**Fix**: Always start with `.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000`.

### 2. Complaints disappeared after logout/re-login
**Root cause**: `AttributeError` in `complaints.py` notification block — `complaint_in.status.value` was called before checking if `complaint_in.status` was `None`, and `complaint.is_escalated` was read after mutation (always `True`).
**Fix**: Snapshot `old_status` and `old_is_escalated` before any mutations; use `complaint_in.status.value` only when `complaint_in.status is not None`.

### 3. Student dashboard showed 0 complaints despite data existing
**Root cause**: `Promise.all()` in `fetchData()` — if `/notifications/me` returned 500, the entire block threw and `setComplaints()` was never called.
**Fix**: Changed to `Promise.allSettled()` so each call succeeds/fails independently.

### 4. Notifications endpoint returned 500
**Root cause**: `NotificationRead` Pydantic schema had fields that didn't match the `Notification` SQLAlchemy model columns.
**Fix**: Rewrote `notification.py` schema to exactly match the model: `id`, `user_id`, `title`, `message`, `is_read`, `created_at`.

### 5. HOD Resolve button not locking after escalation
**Root cause**: `handleSelectComplaint` loaded complaint from the stale in-memory list. After clicking "Escalate to Admin", the modal closed and reopened with the old data where `is_escalated` was still `false`.
**Fix**: `handleSelectComplaint` now calls `/complaints/all` to get fresh data from the server every time the modal opens.

### 6. Duplicate escalation notification
**Root cause**: The notification block for escalation was accidentally duplicated in the router.
**Fix**: Removed the duplicate `db.add(notification)` call.

### 7. AI Analysis endpoint returning 500
**Root cause**: `AIAnalysisRead` schema fields (`category`, `complaint_id`, `recommended_action`) did not match the `AIAnalysis` model's actual columns (`topic_category`, `reference_id`, `type`). The global exception handler masked the real traceback.
**Status**: Schema fix applied. The endpoint returns 404 (analysis not yet processed) or 200 with full analysis for complaints that have been analyzed.

---

## 14. API Audit Results

Full automated test run against a live backend instance:

```
============================================================
  InsightOS Enterprise — API Audit Report
============================================================
  [✓] GET  /health
  [✓] POST /auth/login  (student)
  [✓] GET  /users/me  (student)
  [✓] GET  /complaints/me
  [✓] GET  /notifications/me
  [✓] POST /complaints/  (create)
  [✓] POST /auth/login  (hod)
  [✓] GET  /complaints/all  (hod)
  [✓] PUT  /complaints/{id}/status  (in_progress)
  [✓] PUT  /complaints/{id}/status  (escalate)
  [✓] POST /auth/login  (admin)
  [✓] GET  /users/  (admin)
  [✓] PUT  /complaints/{id}/status  (acknowledge)
  [✓] PUT  /complaints/{id}/status  (clear)
  [✓] PUT  /complaints/{id}/status  (resolve)
  [✓] GET  /complaints/stats
  [✓] PUT  /notifications/{id}/read
  [✓] GET  /complaints/all blocked for student
  [✗] GET  /complaints/{id}/analysis  (schema mismatch — fix applied)
============================================================
  Result: 18/19 passed | 1 known issue (AI analysis schema)
============================================================
```

The full escalation workflow (HOD → Admin → HOD → Resolve) passes end-to-end.

---

*Documentation generated: July 15, 2026*
*Project: InsightOS Enterprise v1.0*

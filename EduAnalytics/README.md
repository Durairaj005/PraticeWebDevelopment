SCREENSHOT OF ADMIN PORTAL 
<img width="1891" height="916" alt="Screenshot 2025-12-20 014012" src="https://github.com/user-attachments/assets/854387ad-640b-46e1-9722-45d74a388315" />
![WhatsApp Image 2025-12-20 at 1 41 44 AM](https://github.com/user-attachments/assets/698a6f31-0306-4233-8e6e-53891e52643a)
![WhatsApp Image 2025-12-20 at 1 41 44 AM](https://github.com/user-attachments/assets/79be0d33-9945-4fd1-b8e9-3f59b7570980)
![WhatsApp Image 2025-12-20 at 1 42 43 AM](https://github.com/user-attachments/assets/1b7bbbca-adbc-4087-be8d-1c7d08ab7058)

SCREENSHOT OF STUDENT PORTAL
![WhatsApp Image 2025-12-20 at 1 42 43 AM](https://github.com/user-attachments/assets/bebc5e89-d098-4af3-bde0-8ea669775706)
![WhatsApp Image 2025-12-20 at 1 52 19 AM](https://github.com/user-attachments/assets/32527e4c-d8c2-4589-b2c9-3474ed2201c8)
![WhatsApp Image 2025-12-20 at 1 54 29 AM](https://github.com/user-attachments/assets/b03ef9d5-b2cc-4ea8-a9b9-4b6c59ca083e)
![WhatsApp Image 2025-12-20 at 1 55 32 AM](https://github.com/user-attachments/assets/be7808f4-3cc4-4a6e-a6a3-426c1ca81b7a)

# EduAnalytics - Educational Analytics System

A full-stack web application for managing student academic performance with multi-batch support, real-time analytics, and comprehensive dashboard visualizations.

---

## 📂 Project Structure

### Root Directory
```
FINAL PROJECT/
├── README.md                          # This file - Project overview & quick start
├── QUICK_START_GUIDE.md              # Step-by-step guide to run the application
├── VISUAL_ARCHITECTURE.md            # System architecture diagrams
├── EduAnalytics/                     # Main project folder
│   ├── backend/                      # FastAPI backend server
│   ├── frontend/                     # React frontend application
│   ├── Current_Batch_2025_No_SemMarks.csv    # Sample data: 2025 batch (5 students, 25 marks)
│   ├── Past_Batch_2023_With_SemMarks.csv     # Sample data: 2023 batch (5 students, 25 marks)
│   └── README.md                     # EduAnalytics specific documentation
```

---

## 🏗️ Technology Stack

- **Backend:** FastAPI (Python) with SQLAlchemy ORM, SQLite database
- **Frontend:** React 18 with Vite, Tailwind CSS, Framer Motion
- **Authentication:** JWT tokens with DOB-based student login
- **Charts:** Chart.js for analytics visualizations
- **Database:** SQLite for data persistence

---

## 📋 Key Features

### 1. Multi-Batch Management
- Upload multiple student batches (2025, 2023, etc.)
- Explicit batch selection (no defaults)
- Batch-wise filtering and comparison
- Each batch can have its own semester schedule

### 2. Student Authentication
- **Login Method:** Register No + Date of Birth (DD-MM-YYYY format)
- JWT token-based session management
- Secure API endpoints with authorization

### 3. Mark Management
- **CA Marks:** CA1, CA2, CA3 (each 0-50 range)
- **Semester Marks:** Semester examination (0-100 range)
- CSV upload for bulk data import
- Individual mark editing via admin dashboard
- Automatic pass/fail calculation (Pass ≥ 40)

### 4. Dashboard Analytics
- **Class Statistics:** Average, Highest/Lowest scores, Pass rate, Distinction rate
- **Student Performance:** Individual CA progress, semester results
- **Visualizations:**
  - CA Progress Trend (Line chart)
  - Performance by Subject (Bar chart)
  - Skills Assessment (Radar chart)
  - Class Mark Distribution (Bar chart)
- **Split Visualizations:** Separate CA and Semester sections

### 5. Admin Features
- Marks Edit Dashboard (edit marks without re-upload)
- Student Comparison (compare 2 students in same batch)
- Batch Comparison (compare 2 different batches)
- CSV upload for bulk data management

### 6. Star Achievement System
- **CA Achievements (Yellow Stars):** Awarded when CA average > 50 (display: X/Y stars)
- **Semester Excellence (Blue Stars):** Awarded when semester marks > 80 (display: X/Y stars or "-")

### 7. Dual Leaderboard System
- **CA Leaderboard:** Always visible, ranked by CA average, Top 10 per batch
- **Semester Leaderboard:** Appears when semester results published
- **Real-time Updates:** Refreshes automatically on data changes

### 8. 7-Point Grade System
- **O (91-100):** Outstanding - Green | **A+ (81-90):** Excellent - Emerald
- **A (71-80):** Very Good - Teal | **B+ (61-70):** Good - Blue
- **B (51-60):** Average - Purple | **C (41-50):** Satisfactory - Orange
- **RA (0-40):** Reassessment - Red

### 9. Real-time Statistics Dashboard
- Class analytics (average, pass rate, distinction rate, grade distribution)
- Subject-wise performance metrics
- Batch comparisons and trends

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+ with pip and venv
- Node.js 16+ with npm
- SQLite (included with Python)

### Backend Setup
```bash
cd EduAnalytics/backend

# Create and activate virtual environment
python -m venv venv
source venv/Scripts/activate  # On Windows
source venv/bin/activate      # On Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Initialize fresh database
python init_fresh_db.py

# Start backend server (runs on localhost:8000)
python -m uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd EduAnalytics/frontend

# Install dependencies
npm install

# Start development server (runs on localhost:5174)
npm run dev
```

### Access the Application
- **Frontend:** http://localhost:5174
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 📊 Database Schema

### Tables
1. **Batches** - Batch years (2025, 2023, etc.)
2. **Students** - Student information (register_no, name, DOB, batch)
3. **Subjects** - Subject list (Mathematics, Physics, Chemistry, English, Biology)
4. **Marks** - Student marks per subject (CA1, CA2, CA3, semester_marks)
5. **Semesters** - Semester information per batch
6. **Admins** - Admin credentials for system management

### Sample Data
- **Batch 2025:** 5 students with CA marks (>30 each)
- **Batch 2023:** 5 students with CA marks + Semester results

---

## 🔐 Authentication

### Student Login
```
Register No: CS2025001
Date of Birth: 12-01-2006 (DD-MM-YYYY format)
```

### Admin Dashboard
```
Sign in using your Google account
(OAuth 2.0 Authentication)
```

---

## 📁 Folder Descriptions

### `/backend`
- **`app/main.py`** - FastAPI application entry point
- **`app/db/models.py`** - SQLAlchemy database models
- **`app/routes/`** - API endpoints (admin.py, student.py, auth.py)
- **`app/services/`** - Business logic (auth_service.py, upload_service.py)
- **`app/schemas/`** - Pydantic data validation models
- **`requirements.txt`** - Python dependencies
- **`init_fresh_db.py`** - Database initialization script

### `/frontend`
- **`src/pages/`** - React page components
  - `admin/` - Admin dashboards
  - `student/` - Student dashboard
  - `auth/` - Login pages
- **`src/components/`** - Reusable React components
  - `charts/` - Chart components (BarChart, LineChart, etc.)
  - `cards/` - Dashboard cards
  - `common/` - Navbar, Sidebar, etc.
- **`src/utils/`** - Utility functions
  - `markDistribution.js` - Class statistics calculation
  - `passFailUtils.js` - Pass/fail logic
  - `formatMarks.js` - Mark formatting
- **`vite.config.js`** - Vite build configuration
- **`tailwind.config.js`** - Tailwind CSS configuration

---

## 🧩 Component Documentation (13 Total Components)

### Frontend Components

#### Page Components
- **`StudentDashboard.jsx`** (743 lines)
  - Purpose: Main student analytics page
  - Features: Charts, statistics, achievements display
  
- **`AdminDashboard.jsx`**
  - Purpose: Admin control center
  - Features: CSV upload, batch management, student list

- **`DatabaseManagement.jsx`** (743 lines)
  - Purpose: CSV upload and data management
  - Features: Upload interface, delete button, success messages
  - Status: ✅ Delete button fix applied

- **`StudentComparison.jsx`**
  - Purpose: Compare students or vs class
  - Features: Side-by-side comparison, radar charts

- **`BatchComparison.jsx`**
  - Purpose: Compare multiple batches
  - Features: Year-over-year analytics, trend charts

- **`AdminLogin.jsx`**
  - Purpose: Admin authentication
  - Features: Email/password login, token management

- **`StudentLogin.jsx`**
  - Purpose: Student authentication
  - Features: Register No + DOB login form

#### Chart Components
- **`LineChart.jsx`** - Display CA progress trend (Chart.js)
- **`BarChart.jsx`** - Subject performance display (Chart.js)
- **`RadarChart.jsx`** - Skills/competency assessment (Chart.js)

#### Card Components
- **`StatCard.jsx`** - Display key metrics with animated counters
- **`AchievementCard.jsx`** - Display star achievements with animations
- **`LeaderboardCard.jsx`** - Display top 10 rankings with badges

#### Common Components
- **`Navbar.jsx`** - Top navigation bar with logo and logout
- **`Sidebar.jsx`** - Side navigation (admin/student views)

---

## 🔄 Data Flow

### CSV Upload Flow
1. Admin uploads CSV file via admin dashboard
2. Backend validates and processes CSV
3. Data inserted into database
4. Students automatically created if new
5. Marks linked to correct batch and semester

### Student Dashboard Flow
1. Student logs in with Register No + DOB
2. Backend generates JWT token
3. Student data fetched with authentication
4. Marks retrieved and calculations performed
5. Charts rendered with real data
6. Class statistics calculated from batch data

---

## 🔄 Detailed Workflows (7 Workflows)

### Workflow 1: Student Login & Dashboard Access
1. Student navigates to http://localhost:5174
2. Enters Register No and DOB (DD-MM-YYYY format)
3. System calls POST /api/v1/auth/login
4. Backend validates credentials
5. JWT token generated and returned
6. Student redirected to /student/dashboard
7. Dashboard fetches data with Authorization header
8. Marks, achievements, leaderboard loaded
9. Charts and statistics rendered

### Workflow 2: CSV Upload (Data Import)
1. Admin navigates to Admin Dashboard → Batch Management
2. Selects batch year (2025 or 2023)
3. Clicks "Upload CSV" and selects file
4. Frontend previews first 5 records
5. Clicks "Confirm Upload"
6. Backend validates: columns, formats, marks ranges, duplicates
7. If validation passes: creates students, inserts marks, timestamps records
8. Returns success count
9. Dashboard refreshes automatically
10. Leaderboard recalculated

### Workflow 3: Delete Last Upload (Data Cleanup)
1. Admin clicks "Delete Last Upload" button
2. System shows confirmation dialog with details
3. Admin confirms action
4. Backend identifies last upload by batch year and timestamp
5. Begins database transaction (all-or-nothing safety)
6. Deletes mark records from that upload
7. Deletes student records (only if no other marks)
8. Commits transaction
9. Returns success message
10. Leaderboard and statistics recalculated

### Workflow 4: Mark Editing (Individual Update)
1. Admin navigates to Admin Dashboard → Edit Marks
2. Selects batch and semester
3. System displays student table with marks
4. Admin clicks edit icon and modifies mark value
5. Clicks "Save"
6. Backend updates database and triggers recalculation
7. Stars recalculated (if CA average crosses threshold)
8. Leaderboard re-ranked
9. Table refreshes with updated values

### Workflow 5: Achievement Calculation (Stars)
Trigger: After any mark is uploaded or modified
1. System retrieves student's CA marks (CA1, CA2, CA3)
2. Calculates CA average: (CA1 + CA2 + CA3) / 3
3. Checks achievement threshold: if CA average > 50, award CA stars
4. Checks semester threshold: if semester marks > 80, award semester stars
5. Updates student record with star counts
6. Reflects immediately in student dashboard

### Workflow 6: Leaderboard Generation & Ranking
Trigger: After each data change
1. Retrieve all students in batch
2. Calculate CA average for each student
3. Sort by average (descending)
4. Assign ranks (1, 2, 3...)
5. Top 10 sent to frontend for display
6. Semester leaderboard generated separately (when published)

### Workflow 7: Student Comparison
1. Student navigates to "Compare" section
2. Selects comparison type ("Me vs Class" or "Me vs Another Student")
3. System calculates comparison metrics
4. Charts display side-by-side comparison
5. Statistics show percentile rank and performance

---

## 📈 Calculation Methods

### Pass/Fail Determination
- Minimum aggregate (CA1 + CA2 + CA3)/3 ≥ 40 for pass
- Each individual assessment must meet minimum

### Class Statistics
- **Average:** Mean of all marks in batch
- **Highest:** Maximum mark in batch
- **Lowest:** Minimum mark in batch
- **Pass Rate:** (Passed students / Total students) × 100
- **Distinction Rate:** (Students scoring ≥90 / Total students) × 100

### Mark Display
- **CA Averages:** (CA1 + CA2 + CA3) / 3
- **Combined Average:** (CA Average + Semester) / 2 (when semester exists)

---

## 🛠️ API Endpoints (20+ Complete Reference)

### Authentication Endpoints
- **`POST /api/v1/auth/login`** - Student login with register_no and DOB
  - Request: `{"register_no": "CS2025001", "dob": "12-01-2006"}`
  - Response: `{"token": "jwt_token", "student_id": 1}`

- **`POST /api/v1/auth/admin-login`** - Admin login with email and password

### Student Endpoints (5 endpoints)
- **`GET /api/v1/student/dashboard`** - Get complete dashboard data with marks, achievements, leaderboard
- **`GET /api/v1/student/marks`** - Get student marks with details (Query: `?batch_year=2025`)
- **`GET /api/v1/student/achievements`** - Get star achievements
- **`GET /api/v1/student/leaderboard`** - Get leaderboard rankings (Query: `?type=ca|semester`)
- **`GET /api/v1/student/comparison`** - Compare self with class statistics

### Admin Endpoints - Marks (6 endpoints)
- **`GET /api/v1/admin/all-students`** - Get students in batch (Query: `?batch_year=2025`)
- **`GET /api/v1/admin/students/{student_id}/marks`** - Get student marks only
- **`PUT /api/v1/admin/marks/{mark_id}`** - Update individual mark (Request: `{"value": 45}`)
- **`DELETE /api/v1/admin/marks/{mark_id}`** - Delete specific mark record
- **`POST /api/v1/admin/marks/recalculate`** - Recalculate all statistics
- **`GET /api/v1/admin/marks/history`** - Get mark edit history with timestamps

### Admin Endpoints - Data Upload (3 endpoints)
- **`POST /api/v1/admin/upload`** - Upload CSV file (multipart/form-data, max 10MB)
- **`DELETE /api/v1/admin/delete-last-upload`** - Delete last upload (Query: `?batch_year=2025`)
- **`GET /api/v1/admin/upload-history`** - Get upload history with record counts

### Batch Management (3 endpoints)
- **`GET /api/v1/batches`** - Get all batches
- **`POST /api/v1/batches`** - Create new batch
- **`GET /api/v1/batches/{batch_id}/statistics`** - Get batch statistics

### Analytics Endpoints (4 endpoints)
- **`GET /api/v1/analytics/class-performance`** - Class-wise performance
- **`GET /api/v1/analytics/student-vs-class`** - Student vs class comparison
- **`GET /api/v1/analytics/subject-performance`** - Subject-wise statistics
- **`GET /api/v1/analytics/grade-distribution`** - Grade distribution counts

### System Endpoints (2 endpoints)
- **`GET /api/v1/health`** - System health check
- **`GET /api/v1/info`** - System information

### Authentication
All admin endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

**Total: 23 API Endpoints** documented above (compared to 7 previously)

---

## ⚙️ Configuration

### Database
- **File:** `eduanalytics.db` (SQLite)
- **Location:** `backend/` folder
- **Auto-created:** On first run via `init_fresh_db.py`

### Ports
- **Backend:** `8000` (configured in uvicorn)
- **Frontend:** `5174` (configured in Vite)
- **Database:** SQLite file-based (no additional port)

---

## 🔧 Environment Configuration

### Environment Variables (.env)

Create `.env` file in `backend/` directory:

```bash
# Database Configuration
DATABASE_URL=sqlite:///./eduanalytics.db
DATABASE_ECHO=false

# Server Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=true

# Authentication
JWT_SECRET_KEY=your-secret-key-here-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# CORS Configuration
CORS_ORIGINS=["http://localhost:5174"]
CORS_CREDENTIALS=true

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_EXTENSIONS=["csv"]

# Firebase/Google OAuth Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
```

### Development vs Production

| Setting | Development | Production |
|---------|-------------|-----------|
| API_RELOAD | true | false |
| CORS_ORIGINS | localhost | domain.com |
| JWT_EXPIRATION | 24 hours | 8 hours |
| DATABASE_ECHO | true | false |
| LOG_LEVEL | DEBUG | WARNING |

### Frontend Configuration (vite.config.js)

```javascript
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000';
```

---

## � Deployment Guide (Production Setup)

### Step 1: Server Requirements
- **OS:** Linux (Ubuntu 20.04+) or Windows Server
- **Python:** 3.8+ | **Node.js:** 16+ | **RAM:** 2GB minimum | **Storage:** 50GB

### Step 2: Setup Backend
```bash
cd EduAnalytics/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python init_fresh_db.py
```

### Step 3: Setup Frontend
```bash
cd EduAnalytics/frontend
npm install
npm run build  # Creates optimized production build
```

### Step 4: Configure Environment
Create `.env` file in backend/ with production values:
- Change JWT_SECRET_KEY to strong random value
- Set CORS_ORIGINS to your domain
- Set LOG_LEVEL to WARNING

### Step 5: Start Services (Gunicorn)
```bash
pip install gunicorn
gunicorn app.main:app --workers 4 --bind 0.0.0.0:8000
```

### Step 6: Configure Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /path/to/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
}
```

### Step 7: Setup SSL Certificates (Let's Encrypt)
```bash
sudo certbot certonly --nginx -d yourdomain.com
sudo certbot renew --dry-run
```

### Step 8: Database Backups
Create `/opt/eduanalytics/backup.sh` and add to crontab:
```bash
0 2 * * * /opt/eduanalytics/backup.sh
```

### Step 9: Security Checklist
- [ ] Change admin password from default
- [ ] Set JWT_SECRET_KEY to strong value
- [ ] Enable HTTPS with SSL
- [ ] Configure CORS for your domain
- [ ] Disable debug mode
- [ ] Setup backups
- [ ] Configure firewall rules
- [ ] Regular package updates

### Production Performance Tips
- Use gunicorn with 4+ workers
- Enable gzip compression in Nginx
- Use CDN for static files
- Monitor disk space for logs/backups
- Keep Python packages updated

---

## 🔒 Security Documentation

### Authentication & Authorization

#### JWT Token Security
- **Generation:** HS256 algorithm
- **Secret Key:** 32+ characters, stored in .env
- **Expiration:** 24 hours (adjustable)
- **Storage:** localStorage on frontend
- **Transmission:** Authorization header only

#### Role-Based Access Control
- **Student Role:** View own marks, leaderboard, achievements
- **Admin Role:** Upload data, edit marks, delete uploads, manage system

### Data Protection

#### Input Validation
- CSV format validation
- Content validation (required columns, data types)
- Range validation (marks 0-50 for CA, 0-100 for semester)
- All inputs sanitized before database insertion

#### Database Security
- Uses SQLAlchemy ORM (prevents SQL injection)
- Transaction-based delete (atomic operations)
- Foreign key constraints (data integrity)
- Automated backups with rotation

#### CORS Configuration
- Only approved domains allowed
- Credentials restricted to same origin
- Preflight requests validated

### Password Security
- Admin passwords hashed with bcrypt
- Student login uses Register No + DOB
- DOB transmitted only over HTTPS
- Default credentials must be changed on production

### API Security
- Rate limiting recommended on login endpoint
- HTTPS required for all connections
- Security headers configured (X-Content-Type-Options, X-Frame-Options, etc.)
- Audit logging for critical operations

### Audit Logging Best Practices
Log these events:
- Login attempts (success/failure)
- CSV uploads (file, records, timestamp)
- Data deletions (what, when, by whom)
- Mark edits (old/new values, timestamp)
- All admin actions

---

## 🧪 Testing Guide

### Manual Test Cases

#### Test 1: Student Login
```
Register No: CS2025001 | DOB: 12-01-2006
Expected: Successful login, redirect to dashboard
```

#### Test 2: CSV Upload
```
Upload: Current_Batch_2025_No_SemMarks.csv
Expected: "Uploaded 5 records successfully"
Verify: Data appears in dashboard
```

#### Test 3: Delete Last Upload
```
Action: Click "Delete Last Upload"
Expected: Confirmation dialog, deletion confirmed
Verify: Student list empty, statistics cleared
```

#### Test 4: Mark Editing
```
Old Value: CA1 = 45 | New Value: CA1 = 48
Expected: Mark updated, recalculation triggered
Verify: Leaderboard rank changed, grade updated
```

#### Test 5: Star Achievement
```
Scenario: CA average crosses 50 threshold
Expected: Yellow CA stars appear (X/6 stars)
Verify: Real-time update on dashboard
```

#### Test 6: Leaderboard Ranking
```
Setup: 5 students with different CA averages
Expected: Correct ranking order (highest first)
Verify: After edit, rank position changes correctly
```

#### Test 7: Student Comparison
```
Type: "Me vs Class" comparison
Expected: Student marks vs class average charts
Verify: Percentile rank calculated correctly
```

#### Test 8: Dashboard Statistics
```
Verify: Average, Pass Rate, Distinction Rate calculations
Expected: Statistics match manual calculations
Verify: Updates automatically after data change
```

### Performance Tests
- Large upload: 1000+ records in CSV
- Dashboard load time: < 2 seconds
- API response time: < 500ms
- Leaderboard calculation: < 1 second

### Expected Behaviors
✅ **Should Work:**
- Login with correct credentials
- CSV upload and preview
- Mark editing and instant recalculation
- Star achievement awards
- Leaderboard ranking updates
- Dashboard charts refresh
- Student comparisons

❌ **Should Fail Gracefully:**
- Invalid credentials
- Wrong file format
- Out-of-range marks
- Missing CSV columns
- Unauthorized admin access

---



### Backend Issues
1. **Port already in use:** Kill process or use `--port` flag
2. **Database errors:** Delete `eduanalytics.db` and run `init_fresh_db.py`
3. **Import errors:** Ensure `requirements.txt` packages installed

### Frontend Issues
1. **Port 5173 in use:** Try next available port (5174, 5175, etc.)
2. **API connection errors:** Verify backend is running on :8000
3. **Build errors:** Run `npm install` to update dependencies

---

## 📚 Sample Commands

```bash
# Reset database to fresh state
python backend/init_fresh_db.py

# Upload CSV data
curl -X POST http://localhost:8000/api/v1/admin/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@Current_Batch_2025_No_SemMarks.csv"

# Check database content
sqlite3 backend/eduanalytics.db ".tables"
sqlite3 backend/eduanalytics.db "SELECT * FROM students LIMIT 5;"
```

---

## 📝 Notes

- **Date Format:** All DOB should be in DD-MM-YYYY format
- **CSV Format:** Must include Register_No, Student_Name, Email, Batch_Year, Semester, Subject_Name, CA1, CA2, CA3, Date_of_Birth
- **Marks Range:** CA1-CA3: 0-50, Semester: 0-100
- **Pass Criteria:** Minimum 40 marks (aggregate of CA components or semester)

---

## 🎯 Next Steps

1. ✅ Run backend server
2. ✅ Run frontend server
3. ✅ Access http://localhost:5174
4. ✅ Login with student credentials
5. ✅ View analytics and dashboards

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review API documentation: http://localhost:8000/docs
3. Check browser console for frontend errors
4. Check terminal output for backend logs

---

**Version:** 1.0 | **Last Updated:** December 2025

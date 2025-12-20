/**
 * EduAnalytics PostgreSQL Schema
 * Auto-generated from SQLAlchemy models
 * This shows the exact table structure
 */

-- ============================================
-- BATCHES TABLE (Years like 2024, 2023)
-- ============================================
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    batch_year VARCHAR(4) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_batch_year ON batches(batch_year);

-- ============================================
-- SEMESTERS TABLE (Sem 1, Sem 2, etc.)
-- ============================================
CREATE TABLE semesters (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL,  -- 1, 2, 3, 4
    academic_year VARCHAR(9) NOT NULL,  -- "2024-2025"
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(batch_id, semester_number)
);
CREATE INDEX idx_semester_batch ON semesters(batch_id);

-- ============================================
-- STUDENTS TABLE
-- ============================================
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    register_no VARCHAR(20) UNIQUE NOT NULL,  -- "CS2024001"
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- bcrypt hashed
    batch_id INTEGER NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_student_register_no ON students(register_no);
CREATE INDEX idx_student_email ON students(email);
CREATE INDEX idx_student_batch ON students(batch_id);

-- ============================================
-- SUBJECTS TABLE
-- ============================================
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,  -- "Mathematics", "Physics", etc.
    code VARCHAR(20) UNIQUE NOT NULL,   -- "MATH101", "PHY101", etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_subject_name ON subjects(name);
CREATE INDEX idx_subject_code ON subjects(code);

-- ============================================
-- MARKS TABLE (CA1, CA2, CA3, Semester)
-- ============================================
-- This is the core table linking:
-- Student -> Subject -> Semester (CA1, CA2, CA3, Semester marks)
CREATE TABLE marks (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    ca1 FLOAT,                -- CA1 marks (0-100)
    ca2 FLOAT,                -- CA2 marks (0-100)
    ca3 FLOAT,                -- CA3 marks (0-100)
    semester FLOAT,           -- Semester exam marks (0-100)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id, semester_id)  -- One entry per student per subject per semester
);
CREATE INDEX idx_mark_student ON marks(student_id);
CREATE INDEX idx_mark_subject ON marks(subject_id);
CREATE INDEX idx_mark_semester ON marks(semester_id);

-- ============================================
-- ADMINS/TEACHERS TABLE
-- ============================================
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'teacher' NOT NULL,  -- "admin" or "teacher"
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,    -- Google OAuth UID
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_admin_email ON admins(email);
CREATE INDEX idx_admin_firebase_uid ON admins(firebase_uid);

-- ============================================
-- CSV UPLOAD LOG TABLE
-- ============================================
CREATE TABLE csv_upload_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    uploaded_records INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_csv_admin ON csv_upload_logs(admin_id);
CREATE INDEX idx_csv_created ON csv_upload_logs(created_at);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_marks_student_semester ON marks(student_id, semester_id);
CREATE INDEX idx_marks_subject_semester ON marks(subject_id, semester_id);
CREATE INDEX idx_student_batch_active ON students(batch_id, is_active);

-- ============================================
-- RELATIONSHIPS SUMMARY
-- ============================================
/*
Batch (1) ──→ (Many) Semesters
Batch (1) ──→ (Many) Students

Semester (1) ──→ (Many) Marks
Student (1) ──→ (Many) Marks
Subject (1) ──→ (Many) Marks

Mark is the junction table:
Mark = (Student, Subject, Semester) with (CA1, CA2, CA3, Semester marks)
*/

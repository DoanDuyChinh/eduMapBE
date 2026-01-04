-- EduMap Database Schema DDL
-- Generated for Visual Paradigm Import
-- System: Generic SQL (Compatible with MySQL/PostgreSQL/Visual Paradigm)
-- NOTE: JSON types converted to TEXT for import compatibility

CREATE TABLE organizations (
    _id VARCHAR(24) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    plan VARCHAR(50) DEFAULT 'free',
    settings TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE users (
    _id VARCHAR(24) PRIMARY KEY,
    org_id VARCHAR(24) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    profile TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(_id)
);

CREATE TABLE reset_tokens (
    _id VARCHAR(24) PRIMARY KEY,
    user_id VARCHAR(24) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(_id)
);

CREATE TABLE grades (
    _id VARCHAR(24) PRIMARY KEY,
    org_id VARCHAR(24) NOT NULL,
    name VARCHAR(50) NOT NULL,
    level INT NOT NULL,
    FOREIGN KEY (org_id) REFERENCES organizations(_id)
);

CREATE TABLE subjects (
    _id VARCHAR(24) PRIMARY KEY,
    org_id VARCHAR(24) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(_id)
);

CREATE TABLE classes (
    _id VARCHAR(24) PRIMARY KEY,
    org_id VARCHAR(24) NOT NULL,
    teacher_id VARCHAR(24) NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    settings TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(_id),
    FOREIGN KEY (teacher_id) REFERENCES users(_id)
);

CREATE TABLE class_enrollments (
    _id VARCHAR(24) PRIMARY KEY,
    class_id VARCHAR(24) NOT NULL,
    student_id VARCHAR(24) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(_id),
    FOREIGN KEY (student_id) REFERENCES users(_id)
);

CREATE TABLE questions (
    _id VARCHAR(24) PRIMARY KEY,
    org_id VARCHAR(24) NOT NULL,
    owner_id VARCHAR(24) NOT NULL,
    subject_id VARCHAR(24) NOT NULL,
    type VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    choices TEXT,
    answer TEXT,
    level INT,
    tags TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(_id),
    FOREIGN KEY (owner_id) REFERENCES users(_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(_id)
);

CREATE TABLE exams (
    _id VARCHAR(24) PRIMARY KEY,
    org_id VARCHAR(24) NOT NULL,
    owner_id VARCHAR(24) NOT NULL,
    subject_id VARCHAR(24),
    grade_id VARCHAR(24),
    name VARCHAR(255) NOT NULL,
    duration INT NOT NULL,
    questions TEXT,
    settings TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(_id),
    FOREIGN KEY (owner_id) REFERENCES users(_id),
    FOREIGN KEY (subject_id) REFERENCES subjects(_id),
    FOREIGN KEY (grade_id) REFERENCES grades(_id)
);

CREATE TABLE assignments (
    _id VARCHAR(24) PRIMARY KEY,
    org_id VARCHAR(24) NOT NULL,
    class_id VARCHAR(24) NOT NULL,
    exam_id VARCHAR(24) NOT NULL,
    open_at TIMESTAMP,
    close_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'scheduled',
    settings TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(_id),
    FOREIGN KEY (class_id) REFERENCES classes(_id),
    FOREIGN KEY (exam_id) REFERENCES exams(_id)
);

CREATE TABLE submissions (
    _id VARCHAR(24) PRIMARY KEY,
    org_id VARCHAR(24) NOT NULL,
    assignment_id VARCHAR(24),
    exam_id VARCHAR(24) NOT NULL,
    user_id VARCHAR(24) NOT NULL,
    answers TEXT,
    score DECIMAL(5, 2),
    status VARCHAR(50) DEFAULT 'in_progress',
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    proctoring_data TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (org_id) REFERENCES organizations(_id),
    FOREIGN KEY (assignment_id) REFERENCES assignments(_id),
    FOREIGN KEY (exam_id) REFERENCES exams(_id),
    FOREIGN KEY (user_id) REFERENCES users(_id)
);

CREATE TABLE proctor_logs (
    _id VARCHAR(24) PRIMARY KEY,
    submission_id VARCHAR(24) NOT NULL,
    user_id VARCHAR(24) NOT NULL,
    event VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'low',
    meta TEXT,
    created_at TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(_id),
    FOREIGN KEY (user_id) REFERENCES users(_id)
);

CREATE TABLE activity_logs (
    _id VARCHAR(24) PRIMARY KEY,
    submission_id VARCHAR(24) NOT NULL,
    exam_id VARCHAR(24),
    user_id VARCHAR(24) NOT NULL,
    type VARCHAR(50) NOT NULL,
    action VARCHAR(255),
    details TEXT,
    is_suspicious BOOLEAN,
    created_at TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(_id),
    FOREIGN KEY (exam_id) REFERENCES exams(_id),
    FOREIGN KEY (user_id) REFERENCES users(_id)
);

CREATE TABLE feed_posts (
    _id VARCHAR(24) PRIMARY KEY,
    class_id VARCHAR(24) NOT NULL,
    author_id VARCHAR(24) NOT NULL,
    content TEXT NOT NULL,
    images TEXT,
    comments TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(_id),
    FOREIGN KEY (author_id) REFERENCES users(_id)
);

CREATE TABLE notifications (
    _id VARCHAR(24) PRIMARY KEY,
    recipient_id VARCHAR(24) NOT NULL,
    sender_id VARCHAR(24),
    type VARCHAR(50) NOT NULL,
    content TEXT,
    related_id VARCHAR(24),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES users(_id),
    FOREIGN KEY (sender_id) REFERENCES users(_id)
);

CREATE TABLE mindmaps (
    _id VARCHAR(24) PRIMARY KEY,
    user_id VARCHAR(24) NOT NULL,
    title VARCHAR(255),
    data TEXT,
    shared_with TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(_id)
);

CREATE TABLE ai_chat_sessions (
    _id VARCHAR(24) PRIMARY KEY,
    user_id VARCHAR(24) NOT NULL,
    title VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(_id)
);

CREATE TABLE ai_chat_messages (
    _id VARCHAR(24) PRIMARY KEY,
    session_id VARCHAR(24) NOT NULL,
    sender VARCHAR(20) NOT NULL,
    message TEXT,
    attachments TEXT,
    created_at TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(_id)
);

CREATE TABLE audit_logs (
    _id VARCHAR(24) PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    collection_name VARCHAR(100) NOT NULL,
    document_id VARCHAR(24),
    performed_by TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

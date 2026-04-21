-- ============================================================================
-- EXPENSE TRACKER DATABASE SETUP
-- Create users table to match User.java entity
-- ============================================================================

-- Ensure we're using the correct database
USE finance_db;

-- Drop existing table (CAUTION: This will delete all user data)
-- DROP TABLE IF EXISTS `users`;

-- Create users table with all constraints matching User.java entity
CREATE TABLE IF NOT EXISTS `users` (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(255) NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NULL,
    full_name VARCHAR(255) NULL,
    profile_picture_url VARCHAR(512) NULL,
    total_income DOUBLE DEFAULT 0.0,
    last_login_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username),
    UNIQUE KEY uk_email (email),
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check table structure
DESC `users`;

-- List all tables in database
SHOW TABLES;

-- View table creation statement
SHOW CREATE TABLE `users`;

-- ============================================================================
-- OPTIONAL: Insert default admin user for testing
-- Password: admin123 (BCrypt hashed)
-- Uncomment the line below to insert admin user
-- ============================================================================
-- INSERT INTO `users` (username, email, password, created_at) 
-- VALUES ('admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoXuA8Jj3SVQfnkQPyqjVBIE2xP2hd6cKbqW', NOW());

-- ============================================================================
-- HOW TO USE THIS FILE IN VS CODE:
-- ============================================================================
-- 1. Install MySQL extension: cweijan.vscode-mysql-client2
-- 2. Click MySQL icon in sidebar, connect to your database
-- 3. Right-click finance_db → New Query
-- 4. Copy-paste this entire file into the query editor
-- 5. Select all (Ctrl+A) and execute (Ctrl+Enter)
-- 6. Check the output tab for success messages
-- ============================================================================

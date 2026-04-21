-- Create finance_db if it doesn't exist
CREATE DATABASE IF NOT EXISTS finance_db;
USE finance_db;

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
    id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_username (username),
    UNIQUE KEY unique_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify the table was created
SHOW TABLES;
DESCRIBE `users`;

-- Insert default admin user for testing (optional)
-- Password: admin123 (hashed with BCrypt)
-- INSERT INTO `users` (username, email, password, created_at) 
-- VALUES ('admin', 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoXuA8Jj3SVQfnkQPyqjVBIE2xP2hd6cKbqW', NOW());

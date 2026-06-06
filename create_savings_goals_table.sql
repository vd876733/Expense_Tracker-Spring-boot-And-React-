-- Create finance_db if it doesn't exist
CREATE DATABASE IF NOT EXISTS finance_db;
USE finance_db;

-- Create savings_goals table
CREATE TABLE IF NOT EXISTS `savings_goals` (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_email VARCHAR(255) NOT NULL,
    goal_name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    current_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    target_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_savings_goals_user_email_target_date (user_email, target_date),
    KEY idx_savings_goals_target_date (target_date),
    CONSTRAINT fk_savings_goals_user_email
        FOREIGN KEY (user_email)
        REFERENCES `users` (`email`)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify the table was created
SHOW TABLES;
DESCRIBE `savings_goals`;
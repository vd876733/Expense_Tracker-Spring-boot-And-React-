-- Envers audit tables for MySQL
-- Based on entity: com.financetracker.entity.Transaction
-- Run this in the finance_db schema in MySQL Workbench.

USE finance_db;

-- 1) Revision metadata table used by Envers
CREATE TABLE IF NOT EXISTS revinfo (
    rev INT NOT NULL AUTO_INCREMENT,
    revtstmp BIGINT,
    PRIMARY KEY (rev)
) ENGINE=InnoDB;

-- 2) Audit table for transactions (suffix configured as _aud)
CREATE TABLE IF NOT EXISTS transactions_aud (
    id BIGINT NOT NULL,
    rev INT NOT NULL,
    revtype TINYINT,
    description VARCHAR(255) NOT NULL,
    amount DOUBLE NOT NULL,
    date DATE NOT NULL,
    category VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (id, rev),
    CONSTRAINT fk_transactions_aud_revinfo
        FOREIGN KEY (rev)
        REFERENCES revinfo (rev)
) ENGINE=InnoDB;

-- Helpful index for faster history lookups by revision
CREATE INDEX idx_transactions_aud_rev ON transactions_aud (rev);

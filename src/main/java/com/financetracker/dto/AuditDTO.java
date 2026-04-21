package com.financetracker.dto;

import com.financetracker.entity.Transaction;

import java.time.Instant;

/**
 * DTO representing a single audited revision of a transaction.
 */
public class AuditDTO {
    private Instant timestamp;
    private String revisionType;
    private Transaction transaction;

    public AuditDTO(Instant timestamp, String revisionType, Transaction transaction) {
        this.timestamp = timestamp;
        this.revisionType = revisionType;
        this.transaction = transaction;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public String getRevisionType() {
        return revisionType;
    }

    public Transaction getTransaction() {
        return transaction;
    }
}
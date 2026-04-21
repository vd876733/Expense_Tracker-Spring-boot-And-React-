package com.financetracker.dto;

import com.financetracker.entity.Transaction;

import java.time.Instant;

/**
 * Audit log DTO for transaction revision history.
 */
public class AuditLogDTO {
    private Integer revisionNumber;
    private Instant changeDateTime;
    private String changeType;
    private Transaction transactionState;

    public AuditLogDTO() {
    }

    public AuditLogDTO(Integer revisionNumber, Instant changeDateTime, String changeType, Transaction transactionState) {
        this.revisionNumber = revisionNumber;
        this.changeDateTime = changeDateTime;
        this.changeType = changeType;
        this.transactionState = transactionState;
    }

    public Integer getRevisionNumber() {
        return revisionNumber;
    }

    public void setRevisionNumber(Integer revisionNumber) {
        this.revisionNumber = revisionNumber;
    }

    public Instant getChangeDateTime() {
        return changeDateTime;
    }

    public void setChangeDateTime(Instant changeDateTime) {
        this.changeDateTime = changeDateTime;
    }

    public String getChangeType() {
        return changeType;
    }

    public void setChangeType(String changeType) {
        this.changeType = changeType;
    }

    public Transaction getTransactionState() {
        return transactionState;
    }

    public void setTransactionState(Transaction transactionState) {
        this.transactionState = transactionState;
    }
}
package com.financetracker.dto;

import java.util.List;

/**
 * CSV Import Result DTO
 * Contains the result of a CSV import operation
 */
public class CsvImportResultDTO {
    private Integer totalRecords;
    private Integer successfulRecords;
    private Integer failedRecords;
    private List<String> errors;
    private List<Long> importedTransactionIds;

    public CsvImportResultDTO() {
    }

    public CsvImportResultDTO(Integer totalRecords, Integer successfulRecords, 
                             Integer failedRecords, List<String> errors, 
                             List<Long> importedTransactionIds) {
        this.totalRecords = totalRecords;
        this.successfulRecords = successfulRecords;
        this.failedRecords = failedRecords;
        this.errors = errors;
        this.importedTransactionIds = importedTransactionIds;
    }

    public Integer getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(Integer totalRecords) {
        this.totalRecords = totalRecords;
    }

    public Integer getSuccessfulRecords() {
        return successfulRecords;
    }

    public void setSuccessfulRecords(Integer successfulRecords) {
        this.successfulRecords = successfulRecords;
    }

    public Integer getFailedRecords() {
        return failedRecords;
    }

    public void setFailedRecords(Integer failedRecords) {
        this.failedRecords = failedRecords;
    }

    public List<String> getErrors() {
        return errors;
    }

    public void setErrors(List<String> errors) {
        this.errors = errors;
    }

    public List<Long> getImportedTransactionIds() {
        return importedTransactionIds;
    }

    public void setImportedTransactionIds(List<Long> importedTransactionIds) {
        this.importedTransactionIds = importedTransactionIds;
    }
}

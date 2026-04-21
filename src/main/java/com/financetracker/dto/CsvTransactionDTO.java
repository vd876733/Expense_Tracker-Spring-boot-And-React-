package com.financetracker.dto;

import com.opencsv.bean.CsvBindByPosition;

import java.time.LocalDate;

/**
 * CSV Import Record DTO
 * Maps CSV columns to Transaction fields
 */
public class CsvTransactionDTO {
    
    @CsvBindByPosition(position = 0)
    private String date;
    
    @CsvBindByPosition(position = 1)
    private String description;
    
    @CsvBindByPosition(position = 2)
    private String category;
    
    @CsvBindByPosition(position = 3)
    private String amount;

    public CsvTransactionDTO() {
    }

    public CsvTransactionDTO(String date, String description, String category, String amount) {
        this.date = date;
        this.description = description;
        this.category = category;
        this.amount = amount;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }
}

package com.financetracker.dto;

/**
 * Budget Request DTO
 * Used for creating and updating budgets
 */
public class BudgetDTO {
    private Long id;
    private String category;
    private Double amount;
    private Double limitAmount;
    private Double monthlyLimit;
    private Long userId;

    public BudgetDTO() {
    }

    public BudgetDTO(Long id, String category, Double limitAmount, Long userId) {
        this.id = id;
        this.category = category;
        this.limitAmount = limitAmount;
        this.monthlyLimit = limitAmount;
        this.userId = userId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getMonthlyLimit() {
        if (monthlyLimit != null) {
            return monthlyLimit;
        }
        if (limitAmount != null) {
            return limitAmount;
        }
        return amount;
    }

    public void setMonthlyLimit(Double monthlyLimit) {
        this.monthlyLimit = monthlyLimit;
        this.limitAmount = monthlyLimit;
    }

    public Double getLimitAmount() {
        if (limitAmount != null) {
            return limitAmount;
        }
        if (monthlyLimit != null) {
            return monthlyLimit;
        }
        return amount;
    }

    public void setLimitAmount(Double limitAmount) {
        this.limitAmount = limitAmount;
        this.monthlyLimit = limitAmount;
    }

    public Double getAmount() {
        return amount != null ? amount : getLimitAmount();
    }

    public void setAmount(Double amount) {
        this.amount = amount;
        if (this.limitAmount == null) {
            this.limitAmount = amount;
        }
        if (this.monthlyLimit == null) {
            this.monthlyLimit = amount;
        }
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}

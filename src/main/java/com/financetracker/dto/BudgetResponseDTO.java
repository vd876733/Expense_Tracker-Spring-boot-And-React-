package com.financetracker.dto;

/**
 * Budget Response DTO
 * Contains budget information with spending analysis
 */
public class BudgetResponseDTO {
    private Long id;
    private String category;
    private Double monthlyLimit;
    private Double amountSpent;
    private Double remainingBudget;
    private Double percentageSpent;
    private Boolean isOverBudget;
    private String status; // "UNDER_BUDGET", "WARNING", "OVER_BUDGET"

    public BudgetResponseDTO() {
    }

    public BudgetResponseDTO(Long id, String category, Double monthlyLimit, 
                            Double amountSpent, Double remainingBudget, 
                            Double percentageSpent, Boolean isOverBudget, String status) {
        this.id = id;
        this.category = category;
        this.monthlyLimit = monthlyLimit;
        this.amountSpent = amountSpent;
        this.remainingBudget = remainingBudget;
        this.percentageSpent = percentageSpent;
        this.isOverBudget = isOverBudget;
        this.status = status;
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
        return monthlyLimit;
    }

    public void setMonthlyLimit(Double monthlyLimit) {
        this.monthlyLimit = monthlyLimit;
    }

    public Double getAmountSpent() {
        return amountSpent;
    }

    public void setAmountSpent(Double amountSpent) {
        this.amountSpent = amountSpent;
    }

    public Double getRemainingBudget() {
        return remainingBudget;
    }

    public void setRemainingBudget(Double remainingBudget) {
        this.remainingBudget = remainingBudget;
    }

    public Double getPercentageSpent() {
        return percentageSpent;
    }

    public void setPercentageSpent(Double percentageSpent) {
        this.percentageSpent = percentageSpent;
    }

    public Boolean getIsOverBudget() {
        return isOverBudget;
    }

    public void setIsOverBudget(Boolean isOverBudget) {
        this.isOverBudget = isOverBudget;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

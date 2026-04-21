package com.financetracker.dto;

public interface CategorySpendingComparisonDTO {

    String getCategoryName();

    Double getCurrentMonthTotal();

    Double getPreviousMonthTotal();
}

package com.financetracker.dto;

public class MonthlyIncomeExpenseDTO {
    private int year;
    private int month;
    private Double income;
    private Double expenses;

    public MonthlyIncomeExpenseDTO() {
    }

    public MonthlyIncomeExpenseDTO(int year, int month, Double income, Double expenses) {
        this.year = year;
        this.month = month;
        this.income = income;
        this.expenses = expenses;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public int getMonth() {
        return month;
    }

    public void setMonth(int month) {
        this.month = month;
    }

    public Double getIncome() {
        return income;
    }

    public void setIncome(Double income) {
        this.income = income;
    }

    public Double getExpenses() {
        return expenses;
    }

    public void setExpenses(Double expenses) {
        this.expenses = expenses;
    }
}
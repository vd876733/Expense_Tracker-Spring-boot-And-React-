package com.financetracker.service;

import com.financetracker.dto.BudgetResponseDTO;
import com.financetracker.entity.Budget;
import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import com.financetracker.repository.BudgetRepository;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Budget Service
 * Handles budget calculations and budget vs. actual analysis
 */
@Service
public class BudgetService {

    @Autowired
    private BudgetRepository budgetRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get budget analysis for a specific category in the current month
     * @param category the category name
     * @param userId the user ID
     * @return BudgetResponseDTO with spending analysis
     */
    public BudgetResponseDTO getBudgetAnalysis(String category, String userId) {
        User user = resolveUser(userId);
        Optional<Budget> budget = budgetRepository.findByCategoryAndUser_Id(category, user.getId());
        
        if (!budget.isPresent()) {
            throw new IllegalArgumentException("Budget not found for category: " + category);
        }

        Budget budgetEntity = budget.get();
        double amountSpent = calculateCurrentMonthSpending(category, user.getEmail());
        return createBudgetResponse(budgetEntity, amountSpent);
    }

    public BudgetResponseDTO getBudgetAnalysis(String category, Long userId) {
        User user = resolveUser(userId);
        Optional<Budget> budget = budgetRepository.findByCategoryAndUser_Id(category, user.getId());

        if (!budget.isPresent()) {
            throw new IllegalArgumentException("Budget not found for category: " + category);
        }

        Budget budgetEntity = budget.get();
        double amountSpent = calculateCurrentMonthSpending(category, user.getEmail());
        return createBudgetResponse(budgetEntity, amountSpent);
    }

    /**
     * Get budget analysis for all budgets of a user in the current month
     * @param userId the user ID
     * @return List of BudgetResponseDTO for all user budgets
     */
    public List<BudgetResponseDTO> getAllBudgetAnalyses(String userId) {
        User user = resolveUser(userId);
        List<Budget> budgets = budgetRepository.findByUser_Id(user.getId());
        
        return budgets.stream()
                .map(budget -> {
                    double amountSpent = calculateCurrentMonthSpending(budget.getCategory(), user.getEmail());
                    return createBudgetResponse(budget, amountSpent);
                })
                .collect(Collectors.toList());
    }

    public List<BudgetResponseDTO> getAllBudgetAnalyses(Long userId) {
        User user = resolveUser(userId);
        List<Budget> budgets = budgetRepository.findByUser_Id(user.getId());

        if (budgets.isEmpty()) {
            return List.of();
        }

        return budgets.stream()
                .map(budget -> {
                    double amountSpent = calculateCurrentMonthSpending(budget.getCategory(), user.getEmail());
                    return createBudgetResponse(budget, amountSpent);
                })
                .collect(Collectors.toList());
    }

    /**
     * Create a new budget
     * @param category the category name
     * @param monthlyLimit the monthly spending limit
     * @param userId the user ID
     * @return Created Budget entity
     */
    public Budget createBudget(String category, Double monthlyLimit, String userId) {
        if (category == null || category.isBlank()) {
            throw new IllegalArgumentException("Category is required");
        }
        if (monthlyLimit == null || monthlyLimit <= 0) {
            throw new IllegalArgumentException("limitAmount must be greater than 0");
        }

        User user = resolveUser(userId);

        Budget budget = budgetRepository.findByCategoryAndUser_Id(category, user.getId())
                .orElseGet(Budget::new);

        budget.setCategory(category);
        budget.setMonthlyLimit(monthlyLimit);
        budget.setUser(user);
        
        return budgetRepository.save(budget);
    }

    public Budget createBudget(String category, Double monthlyLimit, Long userId) {
        if (category == null || category.isBlank()) {
            throw new IllegalArgumentException("Category is required");
        }
        if (monthlyLimit == null || monthlyLimit <= 0) {
            throw new IllegalArgumentException("limitAmount must be greater than 0");
        }

        User user = resolveUser(userId);

        Budget budget = budgetRepository.findByCategoryAndUser_Id(category, user.getId())
                .orElseGet(Budget::new);

        budget.setCategory(category);
        budget.setMonthlyLimit(monthlyLimit);
        budget.setUser(user);

        return budgetRepository.save(budget);
    }

    /**
     * Update an existing budget
     * @param id the budget ID
     * @param monthlyLimit the new monthly limit
     * @return Updated Budget entity
     */
    public Budget updateBudget(Long id, Double monthlyLimit) {
        Optional<Budget> budget = budgetRepository.findById(id);
        
        if (!budget.isPresent()) {
            throw new IllegalArgumentException("Budget not found with ID: " + id);
        }

        Budget budgetEntity = budget.get();
        budgetEntity.setMonthlyLimit(monthlyLimit);
        
        return budgetRepository.save(budgetEntity);
    }

    /**
     * Delete a budget
     * @param id the budget ID
     */
    public void deleteBudget(Long id) {
        if (!budgetRepository.existsById(id)) {
            throw new IllegalArgumentException("Budget not found with ID: " + id);
        }
        budgetRepository.deleteById(id);
    }

    /**
     * Delete all budget goals for a user
     * @param userId the user ID
     */
    public void resetBudgetsForUser(String userId) {
        User user = resolveUser(userId);
        budgetRepository.deleteByUser_Id(user.getId());
    }

    public void resetBudgetsForUser(Long userId) {
        User user = resolveUser(userId);
        budgetRepository.deleteByUser_Id(user.getId());
    }

    /**
     * Calculate spending for the current month for a specific category
     * @param category the category name
     * @return Total amount spent in current month
     */
    private double calculateCurrentMonthSpending(String category, String userEmail) {
        LocalDate now = LocalDate.now();
        LocalDate monthStart = now.withDayOfMonth(1);
        LocalDate monthEnd = now.withDayOfMonth(now.getMonth().length(now.isLeapYear()));

        List<Transaction> transactions = transactionRepository.findByDateRangeAndUser_Email(
                monthStart,
                monthEnd,
                userEmail
        );
        
        return transactions.stream()
                .filter(t -> t.getCategory().equalsIgnoreCase(category))
                .mapToDouble(Transaction::getAmount)
                .sum();
    }

    /**
     * Calculate remaining budget for a category
     * @param monthlyLimit the monthly budget limit
     * @param amountSpent the amount spent so far
     * @return Remaining budget
     */
    private double calculateRemainingBudget(double monthlyLimit, double amountSpent) {
        return monthlyLimit - amountSpent;
    }

    /**
     * Calculate percentage of budget spent
     * @param monthlyLimit the monthly budget limit
     * @param amountSpent the amount spent so far
     * @return Percentage spent (0-100)
     */
    private double calculatePercentageSpent(double monthlyLimit, double amountSpent) {
        if (monthlyLimit == 0) {
            return 0;
        }
        return (amountSpent / monthlyLimit) * 100;
    }

    /**
     * Determine budget status
     * @param percentageSpent the percentage of budget spent
     * @param isOverBudget whether spending exceeds the limit
     * @return Status string: "UNDER_BUDGET", "WARNING", or "OVER_BUDGET"
     */
    private String determineBudgetStatus(double percentageSpent, boolean isOverBudget) {
        if (isOverBudget) {
            return "OVER_BUDGET";
        } else if (percentageSpent >= 80) {
            return "WARNING";
        } else {
            return "UNDER_BUDGET";
        }
    }

    /**
     * Create a BudgetResponseDTO from a Budget entity and spending amount
     * @param budget the Budget entity
     * @param amountSpent the amount spent in current month
     * @return BudgetResponseDTO with calculated values
     */
    private BudgetResponseDTO createBudgetResponse(Budget budget, double amountSpent) {
        double monthlyLimit = budget.getMonthlyLimit();
        double remainingBudget = calculateRemainingBudget(monthlyLimit, amountSpent);
        double percentageSpent = calculatePercentageSpent(monthlyLimit, amountSpent);
        boolean isOverBudget = amountSpent > monthlyLimit;
        String status = determineBudgetStatus(percentageSpent, isOverBudget);

        return new BudgetResponseDTO(
                budget.getId(),
                budget.getCategory(),
                monthlyLimit,
                Math.round(amountSpent * 100.0) / 100.0,
                Math.round(remainingBudget * 100.0) / 100.0,
                Math.round(percentageSpent * 100.0) / 100.0,
                isOverBudget,
                status
        );
    }

    /**
     * Check if a category has exceeded its budget
     * @param category the category name
     * @param userId the user ID
     * @return true if category has exceeded budget, false otherwise
     */
    public boolean isOverBudget(String category, String userId) {
        User user = resolveUser(userId);
        Optional<Budget> budget = budgetRepository.findByCategoryAndUser_Id(category, user.getId());
        
        if (!budget.isPresent()) {
            return false;
        }

        double amountSpent = calculateCurrentMonthSpending(category, user.getEmail());
        return amountSpent > budget.get().getMonthlyLimit();
    }

    public boolean isOverBudget(String category, Long userId) {
        User user = resolveUser(userId);
        Optional<Budget> budget = budgetRepository.findByCategoryAndUser_Id(category, user.getId());

        if (!budget.isPresent()) {
            return false;
        }

        double amountSpent = calculateCurrentMonthSpending(category, user.getEmail());
        return amountSpent > budget.get().getMonthlyLimit();
    }

    /**
     * Get all categories that have exceeded their budgets
     * @param userId the user ID
     * @return List of BudgetResponseDTO for over-budget categories
     */
    public List<BudgetResponseDTO> getOverBudgetCategories(String userId) {
        return getAllBudgetAnalyses(userId).stream()
                .filter(BudgetResponseDTO::getIsOverBudget)
                .collect(Collectors.toList());
    }

    public List<BudgetResponseDTO> getOverBudgetCategories(Long userId) {
        return getAllBudgetAnalyses(userId).stream()
                .filter(BudgetResponseDTO::getIsOverBudget)
                .collect(Collectors.toList());
    }

    private User resolveUser(String userId) {
        try {
            Long numericId = Long.parseLong(userId);
            return userRepository.findById(numericId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));
        } catch (NumberFormatException ex) {
            return userRepository.findByUsername(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + userId));
        }
    }

    private User resolveUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));
    }
}

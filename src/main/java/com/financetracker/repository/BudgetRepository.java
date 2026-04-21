package com.financetracker.repository;

import com.financetracker.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    /**
     * Find budget by category and user ID
     * @param category the category name
     * @param userId the user ID
     * @return Optional containing the budget if found
     */
    Optional<Budget> findByCategoryAndUser_Id(String category, Long userId);

    /**
     * Find budget by category and username
     * @param category the category name
     * @param username the username
     * @return Optional containing the budget if found
     */
    Optional<Budget> findByCategoryAndUser_Username(String category, String username);

    /**
     * Find all budgets for a user
     * @param userId the user ID
     * @return List of budgets for the user
     */
    List<Budget> findByUser_Id(Long userId);

    /**
     * Find all budgets for a username
     * @param username the username
     * @return List of budgets for the user
     */
    List<Budget> findByUser_Username(String username);

    /**
     * Find all budgets by category
     * @param category the category name
     * @return List of budgets for the category
     */
    List<Budget> findByCategory(String category);

    /**
     * Check if a budget exists for a category and user
     * @param category the category name
     * @param userId the user ID
     * @return true if budget exists, false otherwise
     */
    boolean existsByCategoryAndUser_Id(String category, Long userId);

    /**
     * Check if a budget exists for a category and username
     * @param category the category name
     * @param username the username
     * @return true if budget exists, false otherwise
     */
    boolean existsByCategoryAndUser_Username(String category, String username);

    /**
     * Delete all budgets for a specific user
     * @param userId the user ID
     */
    void deleteByUser_Id(Long userId);

    /**
     * Delete all budgets for a specific username
     * @param username the username
     */
    void deleteByUser_Username(String username);
}

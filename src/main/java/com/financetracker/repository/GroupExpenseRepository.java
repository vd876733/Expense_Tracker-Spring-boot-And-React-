package com.financetracker.repository;

import com.financetracker.entity.GroupExpense;
import com.financetracker.entity.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository for GroupExpense entity
 * Provides database operations for group expenses
 */
@Repository
public interface GroupExpenseRepository extends JpaRepository<GroupExpense, Long> {

    /**
     * Find all expenses in a specific group
     * @param groupId the group's ID
     * @return List of expenses in the group
     */
    @Query("SELECT ge FROM GroupExpense ge WHERE ge.expenseGroup.id = :groupId ORDER BY ge.date DESC")
    List<GroupExpense> findByGroupId(@Param("groupId") Long groupId);

    /**
     * Find all expenses paid by a specific user
     * @param userId the user's ID
     * @return List of expenses paid by the user
     */
    @Query("SELECT ge FROM GroupExpense ge WHERE ge.payer.id = :userId ORDER BY ge.date DESC")
    List<GroupExpense> findByPayerId(@Param("userId") Long userId);

    /**
     * Find all expenses in a group paid by a specific user
     * @param groupId the group's ID
     * @param userId the user's ID
     * @return List of expenses paid by the user in the group
     */
    @Query("SELECT ge FROM GroupExpense ge WHERE ge.expenseGroup.id = :groupId AND ge.payer.id = :userId ORDER BY ge.date DESC")
    List<GroupExpense> findByGroupIdAndPayerId(@Param("groupId") Long groupId, @Param("userId") Long userId);

    /**
     * Find all expenses for a user in groups they belong to
     * @param userId the user's ID
     * @return List of all group expenses for the user's groups
     */
    @Query("SELECT ge FROM GroupExpense ge WHERE ge.expenseGroup.id IN " +
           "(SELECT eg.id FROM ExpenseGroup eg JOIN eg.memberships gm WHERE gm.user.id = :userId AND gm.status = :status) " +
           "ORDER BY ge.date DESC")
    List<GroupExpense> findAllExpensesForUserGroups(@Param("userId") Long userId, @Param("status") MembershipStatus status);

    /**
     * Find expenses in a group within a date range
     * @param groupId the group's ID
     * @param startDate the start date
     * @param endDate the end date
     * @return List of expenses within the date range
     */
    @Query("SELECT ge FROM GroupExpense ge WHERE ge.expenseGroup.id = :groupId " +
           "AND ge.date >= :startDate AND ge.date <= :endDate ORDER BY ge.date DESC")
    List<GroupExpense> findByGroupIdAndDateRange(@Param("groupId") Long groupId,
                                                  @Param("startDate") LocalDate startDate,
                                                  @Param("endDate") LocalDate endDate);

    /**
     * Find expenses in a specific category within a group
     * @param groupId the group's ID
     * @param category the category name
     * @return List of expenses in the category
     */
    @Query("SELECT ge FROM GroupExpense ge WHERE ge.expenseGroup.id = :groupId AND ge.category = :category ORDER BY ge.date DESC")
    List<GroupExpense> findByGroupIdAndCategory(@Param("groupId") Long groupId, @Param("category") String category);

    /**
     * Calculate total amount paid by a user in a specific group
     * @param groupId the group's ID
     * @param userId the user's ID
     * @return Total amount paid by the user in the group
     */
    @Query("SELECT COALESCE(SUM(ge.totalAmount), 0.0) FROM GroupExpense ge " +
           "WHERE ge.expenseGroup.id = :groupId AND ge.payer.id = :userId")
    Double getTotalPaidByUserInGroup(@Param("groupId") Long groupId, @Param("userId") Long userId);

    /**
     * Calculate total amount for all expenses in a group
     * @param groupId the group's ID
     * @return Total amount for all expenses in the group
     */
    @Query("SELECT COALESCE(SUM(ge.totalAmount), 0.0) FROM GroupExpense ge WHERE ge.expenseGroup.id = :groupId")
    Double getTotalExpensesInGroup(@Param("groupId") Long groupId);

    /**
     * Find all expenses in a group for a specific user (either as payer or member)
     * @param groupId the group's ID
     * @param userId the user's ID
     * @return List of all relevant expenses
     */
    @Query("SELECT ge FROM GroupExpense ge WHERE ge.expenseGroup.id = :groupId " +
           "AND (ge.payer.id = :userId OR ge.expenseGroup.id IN " +
           "(SELECT eg.id FROM ExpenseGroup eg JOIN eg.memberships gm WHERE gm.user.id = :userId AND gm.status = :status)) " +
           "ORDER BY ge.date DESC")
    List<GroupExpense> findRelevantExpensesForUser(@Param("groupId") Long groupId, @Param("userId") Long userId, @Param("status") MembershipStatus status);
}

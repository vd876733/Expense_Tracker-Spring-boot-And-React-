package com.financetracker.repository;

import com.financetracker.dto.CategorySpendingComparisonDTO;
import com.financetracker.dto.CategoryTotalDTO;
import com.financetracker.dto.DailySpendingDTO;
import com.financetracker.dto.MonthlyIncomeExpenseDTO;
import com.financetracker.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.history.RevisionRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, RevisionRepository<Transaction, Long, Integer> {

        @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.email = :email")
        Double getTotalSumByUserEmail(@Param("email") String email);

        @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.email = :email AND t.category = :category")
        Double getTotalSumByCategoryAndUserEmail(@Param("email") String email, @Param("category") String category);

    /**
     * Find transactions by month and year
     * @param year the year
     * @param month the month (1-12)
     * @return List of transactions in the specified month/year
     */
    @Query("SELECT t FROM Transaction t WHERE " +
            "YEAR(t.date) = :year AND MONTH(t.date) = :month " +
            "ORDER BY t.date DESC")
    List<Transaction> findByMonthAndYear(@Param("month") int month, @Param("year") int year);

    @Query("SELECT t FROM Transaction t WHERE " +
            "t.user.email = :email AND YEAR(t.date) = :year AND MONTH(t.date) = :month " +
            "ORDER BY t.date DESC")
        List<Transaction> findByMonthAndYearAndUser_Email(
            @Param("month") int month,
            @Param("year") int year,
            @Param("email") String email);

    /**
     * Find transactions by category
     * @param category the category name
     * @return List of transactions in the specified category
     */
    List<Transaction> findByCategory(String category);

        List<Transaction> findByCategoryAndUser_Email(String category, String userEmail);

    /**
     * Find transactions within a date range
     * @param startDate the start date (inclusive)
     * @param endDate the end date (inclusive)
     * @return List of transactions within the date range
     */
    @Query("SELECT t FROM Transaction t WHERE t.date >= :startDate AND t.date <= :endDate " +
            "ORDER BY t.date DESC")
    List<Transaction> findByDateRange(@Param("startDate") LocalDate startDate, 
                                      @Param("endDate") LocalDate endDate);

    @Query("SELECT t FROM Transaction t WHERE t.user.email = :email AND t.date >= :startDate AND t.date <= :endDate " +
            "ORDER BY t.date DESC")
        List<Transaction> findByDateRangeAndUser_Email(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("email") String email);

    /**
     * Find transactions by category and month/year
     * @param category the category name
     * @param year the year
     * @param month the month (1-12)
     * @return List of transactions matching both filters
     */
    @Query("SELECT t FROM Transaction t WHERE " +
            "t.category = :category AND " +
            "YEAR(t.date) = :year AND MONTH(t.date) = :month " +
            "ORDER BY t.date DESC")
    List<Transaction> findByCategoryAndMonthAndYear(@Param("category") String category, 
                                                     @Param("month") int month, 
                                                     @Param("year") int year);

    @Query("SELECT t FROM Transaction t WHERE " +
            "t.user.email = :email AND t.category = :category AND " +
            "YEAR(t.date) = :year AND MONTH(t.date) = :month " +
            "ORDER BY t.date DESC")
        List<Transaction> findByCategoryAndMonthAndYearAndUser_Email(
            @Param("category") String category,
            @Param("month") int month,
            @Param("year") int year,
            @Param("email") String email);

        List<Transaction> findAllByUser_Email(String userEmail);

        List<Transaction> findByUser_Email(String userEmail);

        @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.email = :email AND t.amount > 0")
        Double sumIncomeByUserEmail(@Param("email") String email);

        @Query("SELECT COALESCE(SUM(ABS(t.amount)), 0) FROM Transaction t WHERE t.user.email = :email AND t.amount < 0")
        Double sumExpensesByUserEmail(@Param("email") String email);

    boolean existsByDescriptionAndCategoryAndAmountAndDate(String description, String category, Double amount, java.time.LocalDate date);

    @Query(value = "SELECT t.category AS category_name, " +
            "SUM(CASE WHEN YEAR(t.date) = :currentYear AND MONTH(t.date) = :currentMonth THEN t.amount ELSE 0 END) AS current_month_total, " +
            "SUM(CASE WHEN YEAR(t.date) = :previousYear AND MONTH(t.date) = :previousMonth THEN t.amount ELSE 0 END) AS previous_month_total " +
            "FROM transactions t " +
            "WHERE (YEAR(t.date) = :currentYear AND MONTH(t.date) = :currentMonth) " +
            "OR (YEAR(t.date) = :previousYear AND MONTH(t.date) = :previousMonth) " +
            "GROUP BY t.category",
            nativeQuery = true)
    List<CategorySpendingComparisonDTO> findCategorySpendingComparison(
            @Param("currentMonth") int currentMonth,
            @Param("currentYear") int currentYear,
            @Param("previousMonth") int previousMonth,
            @Param("previousYear") int previousYear
    );

    @Query("SELECT new com.financetracker.dto.CategoryTotalDTO(t.category, COALESCE(SUM(t.amount), 0)) " +
            "FROM Transaction t " +
            "WHERE t.user.email = :email AND YEAR(t.date) = :year AND MONTH(t.date) = :month " +
            "GROUP BY t.category")
    List<CategoryTotalDTO> findCategoryTotalsByMonthAndYearAndUserEmail(
            @Param("month") int month,
            @Param("year") int year,
            @Param("email") String email);

    @Query("SELECT new com.financetracker.dto.MonthlyIncomeExpenseDTO(" +
            "YEAR(t.date), MONTH(t.date), " +
            "COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0)) " +
            "FROM Transaction t " +
            "WHERE t.user.email = :email AND t.date >= :startDate " +
            "GROUP BY YEAR(t.date), MONTH(t.date) " +
            "ORDER BY YEAR(t.date), MONTH(t.date)")
    List<MonthlyIncomeExpenseDTO> findMonthlyIncomeExpenseTotalsByUserEmail(
            @Param("startDate") LocalDate startDate,
            @Param("email") String email);

    @Query("SELECT new com.financetracker.dto.MonthlyIncomeExpenseDTO(" +
            "YEAR(t.date), MONTH(t.date), " +
            "COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0), " +
            "COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0)) " +
            "FROM Transaction t " +
            "WHERE t.user.email = :email AND t.date >= :startDate AND t.date <= :endDate " +
            "GROUP BY YEAR(t.date), MONTH(t.date) " +
            "ORDER BY YEAR(t.date), MONTH(t.date)")
    List<MonthlyIncomeExpenseDTO> findMonthlyIncomeExpenseTotalsInRangeByUserEmail(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("email") String email
    );

    @Query("SELECT new com.financetracker.dto.DailySpendingDTO(" +
            "t.date, " +
            "COALESCE(SUM(t.amount), 0)) " +
            "FROM Transaction t " +
            "WHERE t.user.email = :email AND t.date >= :startDate " +
            "GROUP BY t.date " +
            "ORDER BY t.date")
    List<DailySpendingDTO> findDailySpendingTotalsByUserEmail(
            @Param("startDate") LocalDate startDate,
            @Param("email") String email);

    @Query("SELECT new com.financetracker.dto.DailySpendingDTO(" +
            "t.date, " +
            "COALESCE(SUM(t.amount), 0)) " +
            "FROM Transaction t " +
            "WHERE t.user.email = :email AND t.date >= :startDate AND t.date <= :endDate " +
            "GROUP BY t.date " +
            "ORDER BY t.date")
    List<DailySpendingDTO> findDailySpendingTotalsInRangeByUserEmail(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("email") String email
    );
}

package com.financetracker.service;

import com.financetracker.dto.DailySpendingDTO;
import com.financetracker.dto.MonthlyIncomeExpenseDTO;
import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import com.financetracker.exception.InsufficientBalanceException;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TransactionService {

    private static final Logger logger = LoggerFactory.getLogger(TransactionService.class);

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public TransactionService(TransactionRepository transactionRepository,
                              UserRepository userRepository,
                              PasswordEncoder passwordEncoder) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Transaction addTransaction(Transaction transaction) {
        if (transaction.getUserEmail() == null || transaction.getUserEmail().isBlank()) {
            throw new IllegalArgumentException("Transaction user email is required");
        }
        if (transaction.getAmount() == null || transaction.getAmount() < 0) {
            throw new IllegalArgumentException("Transaction amount must be non-negative");
        }

        String email = transaction.getUserEmail().trim().toLowerCase();
        User user = upsertUserByEmail(email);
        transaction.setUser(user);
        transaction.setUserEmail(user.getEmail());

        if (transaction.getUser() == null) {
            throw new IllegalStateException("Resolved user is required for transaction");
        }

        Double totalIncome = transactionRepository.sumIncomeByUserEmail(email);
        Double totalSpent = transactionRepository.sumExpensesByUserEmail(email);
        double availableBalance = (totalIncome != null ? totalIncome : 0.0) - (totalSpent != null ? totalSpent : 0.0);
        if (transaction.getAmount() > availableBalance) {
            throw new InsufficientBalanceException("Insufficient balance for this transaction");
        }
        try {
            return transactionRepository.save(transaction);
        } catch (Exception ex) {
            Throwable rootCause = ex.getCause();
            logger.error("Failed to save transaction for userEmail={} amount={} category={} date={}",
                    transaction.getUserEmail(),
                    transaction.getAmount(),
                    transaction.getCategory(),
                    transaction.getDate(),
                    ex);
            if (rootCause != null) {
                logger.error("Transaction save root cause: {}", rootCause.getMessage(), rootCause);
            }
            System.out.println("Transaction save SQL error: " + (rootCause != null ? rootCause.getMessage() : ex.getMessage()));
            ex.printStackTrace();
            throw ex;
        }
    }

    public List<Transaction> getTransactionsByEmail(String email) {
        if (email == null || email.isBlank()) {
            return List.of();
        }
        List<Transaction> transactions = transactionRepository.findAllByUser_Email(email);
        return transactions != null ? transactions : List.of();
    }

    public List<MonthlyIncomeExpenseDTO> getIncomeExpenseTotals(LocalDate startDate, LocalDate endDate, String email) {
        if (email == null || email.isBlank()) {
            return List.of();
        }
        LocalDate resolvedEnd = endDate != null ? endDate : LocalDate.now();
        LocalDate resolvedStart = startDate != null
                ? startDate
                : YearMonth.from(resolvedEnd).minusMonths(5).atDay(1);

        List<MonthlyIncomeExpenseDTO> totals =
            transactionRepository.findMonthlyIncomeExpenseTotalsInRangeByUserEmail(resolvedStart, resolvedEnd, email);
        return totals != null ? totals : List.of();
    }

    public List<DailySpendingDTO> getDailySpendingTotals(LocalDate startDate, LocalDate endDate, String email) {
        if (email == null || email.isBlank()) {
            return List.of();
        }
        LocalDate resolvedEnd = endDate != null ? endDate : LocalDate.now();
        LocalDate resolvedStart = startDate != null
                ? startDate
                : resolvedEnd.minusDays(29);

        List<DailySpendingDTO> rawTotals = transactionRepository.findDailySpendingTotalsInRangeByUserEmail(
                resolvedStart,
                resolvedEnd,
                email
        );
        if (rawTotals == null) {
            return List.of();
        }
        Map<LocalDate, Double> totalsByDate = new HashMap<>();
        for (DailySpendingDTO item : rawTotals) {
            totalsByDate.put(item.getDate(), item.getTotal() != null ? item.getTotal() : 0.0);
        }

        List<DailySpendingDTO> filledTotals = new ArrayList<>();
        for (LocalDate date = resolvedStart; !date.isAfter(resolvedEnd); date = date.plusDays(1)) {
            Double total = totalsByDate.getOrDefault(date, 0.0);
            filledTotals.add(new DailySpendingDTO(date, total));
        }

        return filledTotals;
    }

    private User upsertUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setUsername(generateUniqueUsername(email));
                    String rawPassword = java.util.UUID.randomUUID().toString();
                    newUser.setPassword(passwordEncoder.encode(rawPassword));
                    newUser.setTotalIncome(0.0);
                    return userRepository.save(newUser);
                });
    }

    private String generateUniqueUsername(String email) {
        String base = email.split("@")[0];
        String candidate = base;
        int suffix = 1;

        while (userRepository.existsByUsername(candidate)) {
            candidate = base + suffix;
            suffix += 1;
        }

        return candidate;
    }
}

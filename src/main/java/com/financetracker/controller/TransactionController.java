package com.financetracker.controller;

import com.financetracker.dto.AuditDTO;
import com.financetracker.dto.CategoryTotalDTO;
import com.financetracker.dto.DailySpendingDTO;
import com.financetracker.dto.MonthlyIncomeExpenseDTO;
import com.financetracker.entity.Transaction;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import com.financetracker.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.data.history.RevisionMetadata;
import org.springframework.data.history.Revisions;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "${ALLOWED_ORIGINS:http://localhost:3000,https://your-app.netlify.app}")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private UserRepository userRepository;

    /**
     * GET all transactions with optional filters
     * @param month optional month (1-12)
     * @param year optional year
     * @param category optional category name
     * @param startDate optional start date (yyyy-MM-dd format)
     * @param endDate optional end date (yyyy-MM-dd format)
     * @return List of transactions matching the filters
     */
    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            Authentication authentication) {

        String resolvedEmail = resolveEmail(authentication);
        if (resolvedEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
        }
        
        List<Transaction> transactions;

        // If date range is provided
        if (startDate != null && endDate != null) {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            
            if (category != null && !category.isEmpty()) {
                // Filter by date range and category
                List<Transaction> byRange = transactionRepository.findByDateRangeAndUser_Email(start, end, resolvedEmail);
                if (byRange == null) {
                    byRange = List.of();
                }
                transactions = byRange.stream()
                        .filter(t -> t.getCategory().equalsIgnoreCase(category))
                        .toList();
            } else {
                // Filter by date range only
                transactions = transactionRepository.findByDateRangeAndUser_Email(start, end, resolvedEmail);
                if (transactions == null) {
                    transactions = List.of();
                }
            }
        }
        // If month and year are provided
        else if (month != null && year != null) {
            if (category != null && !category.isEmpty()) {
                // Filter by category, month, and year
                transactions = transactionRepository.findByCategoryAndMonthAndYearAndUser_Email(category, month, year, resolvedEmail);
            } else {
                // Filter by month and year only
                transactions = transactionRepository.findByMonthAndYearAndUser_Email(month, year, resolvedEmail);
            }
            if (transactions == null) {
                transactions = List.of();
            }
        }
        // If only category is provided
        else if (category != null && !category.isEmpty()) {
            transactions = transactionRepository.findByCategoryAndUser_Email(category, resolvedEmail);
            if (transactions == null) {
                transactions = List.of();
            }
        }
        // No filters - return all transactions
        else {
            transactions = transactionService.getTransactionsByEmail(resolvedEmail);
        }

        return ResponseEntity.ok(transactions);
    }

    /**
     * GET a specific transaction by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Transaction> getTransactionById(@PathVariable Long id, Authentication authentication) {
        String resolvedEmail = resolveEmail(authentication);
        if (resolvedEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<Transaction> transaction = transactionRepository.findById(id);
        if (transaction.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!resolvedEmail.equalsIgnoreCase(transaction.get().getUserEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(transaction.get());
    }

    /**
     * GET transaction revision history by ID
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<List<AuditDTO>> getHistory(@PathVariable Long id, Authentication authentication) {
        String resolvedEmail = resolveEmail(authentication);
        if (resolvedEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<Transaction> transaction = transactionRepository.findById(id);
        if (transaction.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!resolvedEmail.equalsIgnoreCase(transaction.get().getUserEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Revisions<Integer, Transaction> revisions = transactionRepository.findRevisions(id);

        if (revisions.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<AuditDTO> auditLogs = revisions.getContent().stream()
                .map(revision -> {
                    Instant timestamp = revision.getMetadata().getRevisionInstant().orElse(null);
                    String revisionType = mapRevisionType(revision.getMetadata().getRevisionType());

                    return new AuditDTO(timestamp, revisionType, revision.getEntity());
                })
                .toList();

        return ResponseEntity.ok(auditLogs);
    }

    /**
     * POST a new transaction
     */
    @PostMapping
    public ResponseEntity<?> createTransaction(@RequestBody Transaction transaction,
                                               @AuthenticationPrincipal(expression = "username") String principalName,
                                               Authentication authentication) {
        String resolvedEmail = resolveEmail(authentication, principalName);
        if (resolvedEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        transaction.setUserEmail(resolvedEmail);
        try {
            Transaction savedTransaction = transactionService.addTransaction(transaction);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedTransaction);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to save transaction", "error", ex.getMessage()));
        }
    }

    /**
     * UPDATE an existing transaction
     */
    @PutMapping("/{id}")
    public ResponseEntity<Transaction> updateTransaction(@PathVariable Long id,
                                                         @RequestBody Transaction transactionDetails,
                                                         Authentication authentication) {
        String resolvedEmail = resolveEmail(authentication);
        if (resolvedEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<Transaction> existingTransaction = transactionRepository.findById(id);

        if (existingTransaction.isPresent()) {
            Transaction transaction = existingTransaction.get();
            if (!resolvedEmail.equalsIgnoreCase(transaction.getUserEmail())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            transaction.setDescription(transactionDetails.getDescription());
            transaction.setAmount(transactionDetails.getAmount());
            transaction.setDate(transactionDetails.getDate());
            transaction.setCategory(transactionDetails.getCategory());

            Transaction updatedTransaction = transactionRepository.save(transaction);
            return ResponseEntity.ok(updatedTransaction);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * DELETE a transaction
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id, Authentication authentication) {
        String resolvedEmail = resolveEmail(authentication);
        if (resolvedEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Optional<Transaction> existingTransaction = transactionRepository.findById(id);
        if (existingTransaction.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!resolvedEmail.equalsIgnoreCase(existingTransaction.get().getUserEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        transactionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET total sum of all transactions
     */
    @GetMapping("/summary/total")
    public ResponseEntity<Double> getTotalSum(@RequestParam(required = false) String email,
                                              Authentication authentication) {
        String resolvedEmail = resolveEmail(authentication);
        if (resolvedEmail == null) {
            return ResponseEntity.ok(0.0);
        }
        Double total = transactionRepository.getTotalSumByUserEmail(resolvedEmail);
        return ResponseEntity.ok(total != null ? total : 0.0);
    }

    /**
     * GET total sum by category
     */
    @GetMapping("/summary/category/{category}")
    public ResponseEntity<Double> getTotalSumByCategory(@PathVariable String category,
                                                        @RequestParam(required = false) String email,
                                                        Authentication authentication) {
        String resolvedEmail = resolveEmail(authentication);
        if (resolvedEmail == null) {
            return ResponseEntity.ok(0.0);
        }
        Double total = transactionRepository.getTotalSumByCategoryAndUserEmail(resolvedEmail, category);
        return ResponseEntity.ok(total != null ? total : 0.0);
    }

    /**
     * GET total spend by category for the current month
     */
    @GetMapping("/summary/category/current-month")
    public ResponseEntity<List<CategoryTotalDTO>> getCurrentMonthCategoryTotals(@RequestParam(required = false) String email,
                                                                                Authentication authentication) {
        String resolvedEmail = resolveEmail(authentication);
        if (resolvedEmail == null) {
            return ResponseEntity.ok(List.of());
        }
        YearMonth currentMonth = YearMonth.now();
        List<CategoryTotalDTO> totals = transactionRepository.findCategoryTotalsByMonthAndYearAndUserEmail(
                currentMonth.getMonthValue(),
                currentMonth.getYear(),
                resolvedEmail
        );
        if (totals == null) {
            totals = List.of();
        }
        return ResponseEntity.ok(totals);
    }

    /**
     * GET income vs expenses grouped by month for the last 6 months
     */
    @GetMapping("/summary/income-expense/last-6-months")
    public ResponseEntity<List<MonthlyIncomeExpenseDTO>> getIncomeExpenseLastSixMonths(@RequestParam(required = false) String email,
                                                                                       Authentication authentication) {
        String resolvedEmail = resolveEmail(authentication);
        if (resolvedEmail == null) {
            return ResponseEntity.ok(List.of());
        }
        LocalDate startDate = YearMonth.now().minusMonths(5).atDay(1);
        List<MonthlyIncomeExpenseDTO> totals = transactionRepository.findMonthlyIncomeExpenseTotalsByUserEmail(startDate, resolvedEmail);
        if (totals == null) {
            totals = List.of();
        }
        return ResponseEntity.ok(totals);
    }

    /**
     * GET income vs expenses grouped by month for a date range
     */
    @GetMapping("/charts/income-expenses")
    public ResponseEntity<List<MonthlyIncomeExpenseDTO>> getIncomeExpensesChartData(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String email,
            Authentication authentication) {
        String resolvedEmail = resolveEmail(authentication);
        if (resolvedEmail == null) {
            return ResponseEntity.ok(List.of());
        }
        LocalDate resolvedStart = startDate != null ? LocalDate.parse(startDate) : null;
        LocalDate resolvedEnd = endDate != null ? LocalDate.parse(endDate) : null;
        List<MonthlyIncomeExpenseDTO> totals = transactionService.getIncomeExpenseTotals(resolvedStart, resolvedEnd, resolvedEmail);
        return ResponseEntity.ok(totals);
    }

    /**
     * GET daily spending totals for the last 30 days
     */
    @GetMapping("/summary/spending/daily-last-30-days")
    public ResponseEntity<List<DailySpendingDTO>> getDailySpendingLastThirtyDays(@RequestParam(required = false) String email,
                                                                                 Authentication authentication) {
        String resolvedEmail = resolveEmail(authentication);
        if (resolvedEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
        }
        List<DailySpendingDTO> totals = transactionService.getDailySpendingTotals(null, null, resolvedEmail);
        return ResponseEntity.ok(totals);
    }

    /**
     * GET daily spending totals for a date range
     */
    @GetMapping("/charts/daily-spending")
    public ResponseEntity<List<DailySpendingDTO>> getDailySpendingChartData(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String email,
            Authentication authentication) {
        String resolvedEmail = resolveEmail(authentication);
        if (resolvedEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
        }
        LocalDate resolvedStart = startDate != null ? startDate : null;
        LocalDate resolvedEnd = endDate != null ? endDate : null;
        List<DailySpendingDTO> totals = transactionService.getDailySpendingTotals(resolvedStart, resolvedEnd, resolvedEmail);
        return ResponseEntity.ok(totals);
    }

    private String mapRevisionType(RevisionMetadata.RevisionType revisionType) {
        if (revisionType == null) {
            return "UNKNOWN";
        }

        return switch (revisionType) {
            case INSERT -> "INSERT";
            case UPDATE -> "UPDATE";
            case DELETE -> "DELETE";
            default -> "UNKNOWN";
        };
    }

    private String resolveEmail(Authentication authentication, String principalName) {
        String candidate = principalName;
        if (candidate == null || candidate.isBlank()) {
            candidate = authentication != null ? authentication.getName() : null;
        }
        if (candidate == null || candidate.isBlank()) {
            return null;
        }
        if (candidate.contains("@")) {
            return candidate.trim().toLowerCase();
        }
        return userRepository.findByUsername(candidate)
                .map(user -> user.getEmail())
                .orElse(null);
    }
}

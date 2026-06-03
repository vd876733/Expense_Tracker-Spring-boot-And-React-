package com.financetracker.controller;

import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import com.financetracker.service.GeminiService;
import com.financetracker.service.AiInsightsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "${ALLOWED_ORIGINS:http://localhost:3000,https://your-app.netlify.app}")
public class AIInsightsController {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;
    private final AiInsightsService aiInsightsService;

    public AIInsightsController(TransactionRepository transactionRepository,
                              UserRepository userRepository,
                              GeminiService geminiService,
                              AiInsightsService aiInsightsService) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.geminiService = geminiService;
        this.aiInsightsService = aiInsightsService;
    }

    /**
     * Get AI Coach insights based on current month spending by category
     * @param authentication the authentication object
     * @return AI-generated insights with category breakdown
     */
    @GetMapping("/insights")
    public ResponseEntity<Map<String, Object>> getAiCoachInsights(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Unauthorized"));
            }

            String email = resolveEmail(authentication);
            if (email == null || email.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User email not found"));
            }

            // Get AI insights
            String insights = aiInsightsService.getAiCoachInsights(email);

            return ResponseEntity.ok(Map.of(
                    "insights", insights,
                    "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching insights: " + e.getMessage()));
        }
    }

    /**
     * Get spending breakdown for current month (no AI processing)
     * @param authentication the authentication object
     * @return category spending breakdown
     */
    @GetMapping("/spending-breakdown")
    public ResponseEntity<Map<String, Object>> getSpendingBreakdown(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Unauthorized"));
            }

            String email = resolveEmail(authentication);
            if (email == null || email.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User email not found"));
            }

            // Get current month breakdown
            int month = java.time.LocalDate.now().getMonthValue();
            int year = java.time.LocalDate.now().getYear();
            Map<String, Double> breakdown = aiInsightsService.getMonthlyCategorySpending(email, month, year);

            return ResponseEntity.ok(Map.of(
                    "month", month,
                    "year", year,
                    "breakdown", breakdown
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching spending breakdown: " + e.getMessage()));
        }
    }

    /**
     * Legacy endpoint - Get insights from all transactions
     * @param authentication the authentication object
     * @param email the user's email
     * @return AI insights from all transactions
     */
    @GetMapping("/insights-legacy")
    public ResponseEntity<Map<String, String>> getInsights(
            Authentication authentication,
            @RequestParam String email) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("insights", "Unauthorized"));
        }

        if (email == null || email.isBlank()) {
            return ResponseEntity.ok(Map.of("insights", "No data available"));
        }

        List<Transaction> transactions = transactionRepository.findAllByUser_Email(email);
        String insights = geminiService.getFinancialInsights(transactions);
        return ResponseEntity.ok(Map.of("insights", insights));
    }

    /**
     * Helper method to resolve email from authentication
     */
    private String resolveEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return null;
        }
        return userRepository.findByUsername(authentication.getName())
                .map(User::getEmail)
                .orElse(null);
    }
}

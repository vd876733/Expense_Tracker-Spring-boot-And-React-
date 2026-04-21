package com.financetracker.controller;

import com.financetracker.entity.Transaction;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "http://localhost:3000")
public class AIInsightsController {

    private final TransactionRepository transactionRepository;
    private final GeminiService geminiService;

    public AIInsightsController(TransactionRepository transactionRepository, GeminiService geminiService) {
        this.transactionRepository = transactionRepository;
        this.geminiService = geminiService;
    }

    @GetMapping("/insights")
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
}

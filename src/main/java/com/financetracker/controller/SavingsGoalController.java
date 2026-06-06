package com.financetracker.controller;

import com.financetracker.entity.SavingsGoal;
import com.financetracker.repository.SavingsGoalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/savings")
@CrossOrigin(origins = "http://localhost:3000")
public class SavingsGoalController {

    @Autowired
    private SavingsGoalRepository savingsGoalRepository;

    @GetMapping
    public ResponseEntity<?> getSavingsGoals() {
        String email = resolveAuthenticatedEmail();
        if (email == null || "anonymousUser".equals(email)) {
            System.out.println("❌ Savings API: Request is unauthenticated or token is missing.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User session token is missing or invalid");
        }

        try {
            System.out.println("🔍 Querying database for savings goals belonging to: " + email);
            List<SavingsGoal> savingsGoals = savingsGoalRepository.findByUserEmail(email);
            return ResponseEntity.ok(savingsGoals);
        } catch (Exception ex) {
            // 🔥 This will print the EXACT database error and line number in your IntelliJ/Eclipse terminal console
            System.err.println("🔥 DATABASE CRASH OCCURRED IN GET /api/savings:");
            ex.printStackTrace();
            
            // Sends the exact message (e.g., 'Table or Column not found') back to your browser console
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Database Query Failed: " + ex.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createSavingsGoal(@RequestBody SavingsGoal savingsGoal) {
        String email = resolveAuthenticatedEmail();
        if (email == null || "anonymousUser".equals(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User session token is missing or invalid");
        }

        try {
            savingsGoal.setUserEmail(email);
            SavingsGoal savedSavingsGoal = savingsGoalRepository.save(savingsGoal);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedSavingsGoal);
        } catch (Exception ex) {
            System.err.println("🔥 DATABASE CRASH OCCURRED IN POST /api/savings:");
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Database Save Failed: " + ex.getMessage());
        }
    }

    private String resolveAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return null;
        }
        return authentication.getName();
    }
}
package com.financetracker.controller;

import com.financetracker.dto.BudgetDTO;
import com.financetracker.dto.BudgetResponseDTO;
import com.financetracker.entity.Budget;
import com.financetracker.entity.User;
import com.financetracker.repository.UserRepository;
import com.financetracker.service.BudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Collections;

/**
 * Budget Controller
 * Handles budget-related API endpoints
 */
@RestController
@RequestMapping("/api/budgets")
@CrossOrigin(origins = "${ALLOWED_ORIGINS:http://localhost:3000,https://your-app.netlify.app}")
public class BudgetController {

    @Autowired
    private BudgetService budgetService;

    @Autowired
    private UserRepository userRepository;

    /**
     * GET budget analysis for a specific category
     * @param category the category name
     * @param userId the user ID
     * @return BudgetResponseDTO with spending analysis
     */
    @GetMapping("/analysis/{category}")
    public ResponseEntity<BudgetResponseDTO> getBudgetAnalysis(
            @PathVariable String category,
            @RequestParam(required = false) String userId,
            Authentication authentication) {
        try {
            User user = resolveUser(authentication);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            BudgetResponseDTO analysis = budgetService.getBudgetAnalysis(category, user.getUsername());
            return ResponseEntity.ok(analysis);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET all budget analyses for a user
     * @param userId the user ID
     * @return List of BudgetResponseDTO for all user budgets
     */
    @GetMapping("/analysis")
    public ResponseEntity<List<BudgetResponseDTO>> getAllBudgetAnalyses(
            @RequestParam(required = false) String userId,
            Authentication authentication) {
        try {
            User user = resolveUser(authentication);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            List<BudgetResponseDTO> analyses = budgetService.getAllBudgetAnalyses(user.getUsername());
            return ResponseEntity.ok(analyses);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET all budget analyses for a user by numeric user ID
     * @param userId the numeric user ID
     * @return List of BudgetResponseDTO for all user budgets
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BudgetResponseDTO>> getAllBudgetAnalysesByUserId(
            @PathVariable Long userId,
            Authentication authentication) {
        User user = resolveUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!userId.equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<BudgetResponseDTO> analyses = budgetService.getAllBudgetAnalyses(userId);
        return ResponseEntity.ok(analyses == null ? Collections.emptyList() : analyses);
    }

    /**
     * GET all over-budget categories for a user
     * @param userId the user ID
     * @return List of over-budget BudgetResponseDTO
     */
    @GetMapping("/over-budget")
    public ResponseEntity<List<BudgetResponseDTO>> getOverBudgetCategories(
            @RequestParam(required = false) String userId,
            Authentication authentication) {
        try {
            User user = resolveUser(authentication);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            List<BudgetResponseDTO> overBudgetCategories = budgetService.getOverBudgetCategories(user.getUsername());
            return ResponseEntity.ok(overBudgetCategories);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * POST create a new budget
     * @param budgetDTO the budget data
     * @return Created Budget entity
     */
    @PostMapping
    public ResponseEntity<Budget> createBudget(@RequestBody BudgetDTO budgetDTO, Authentication authentication) {
        try {
            User user = resolveUser(authentication);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            Budget budget = budgetService.createBudget(
                    budgetDTO.getCategory(),
                    resolveLimitAmount(budgetDTO),
                    user.getUsername()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(budget);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * PUT update an existing budget
     * @param id the budget ID
     * @param budgetDTO the updated budget data
     * @return Updated Budget entity
     */
    @PutMapping("/{id}")
    public ResponseEntity<Budget> updateBudget(
            @PathVariable Long id,
            @RequestBody BudgetDTO budgetDTO) {
        try {
            Budget budget = budgetService.updateBudget(id, resolveLimitAmount(budgetDTO));
            return ResponseEntity.ok(budget);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * DELETE a budget
     * @param id the budget ID
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(@PathVariable Long id) {
        try {
            budgetService.deleteBudget(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * DELETE all budgets for a user
     * @param userId the user ID
     * @return 204 No Content
     */
    @DeleteMapping("/user/{userId}")
    public ResponseEntity<Void> resetBudgetsForUser(@PathVariable Long userId,
                                                    Authentication authentication) {
        User user = resolveUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!userId.equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        budgetService.resetBudgetsForUser(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET check if a category is over budget
     * @param category the category name
     * @param userId the user ID
     * @return true if over budget, false otherwise
     */
    @GetMapping("/check-over-budget/{category}")
    public ResponseEntity<Boolean> isOverBudget(
            @PathVariable String category,
            @RequestParam(required = false) String userId,
            Authentication authentication) {
        User user = resolveUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        boolean isOver = budgetService.isOverBudget(category, user.getUsername());
        return ResponseEntity.ok(isOver);
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return null;
        }
        return userRepository.findByUsername(authentication.getName()).orElse(null);
    }

    private Double resolveLimitAmount(BudgetDTO budgetDTO) {
        if (budgetDTO.getLimitAmount() != null) {
            return budgetDTO.getLimitAmount();
        }
        if (budgetDTO.getMonthlyLimit() != null) {
            return budgetDTO.getMonthlyLimit();
        }
        return budgetDTO.getAmount();
    }

}

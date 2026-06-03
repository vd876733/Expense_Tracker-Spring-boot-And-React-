package com.financetracker.controller;

import com.financetracker.entity.SavingsGoal;
import com.financetracker.entity.User;
import com.financetracker.repository.SavingsGoalRepository;
import com.financetracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/savings-goals")
@CrossOrigin(origins = "${ALLOWED_ORIGINS:http://localhost:3000,https://your-app.netlify.app}")
public class SavingsGoalController {

    private static final Logger log = LoggerFactory.getLogger(SavingsGoalController.class);

    @Autowired
    private SavingsGoalRepository savingsGoalRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * GET all savings goals for the logged-in user
     * @param authentication the authentication object containing user info
     * @return List of savings goals for the authenticated user
     */
    @GetMapping
    public ResponseEntity<?> getAllSavingsGoals(Authentication authentication) {
        try {
            String email = resolveEmail(authentication);
            if (email == null || email.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not authenticated"));
            }

            Optional<User> userOptional = userRepository.findByEmail(email);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "User not found"));
            }

            User user = userOptional.get();
            List<SavingsGoal> goals = savingsGoalRepository.findByUserId(user.getId());

            return ResponseEntity.ok(goals);
        } catch (Exception e) {
            log.error("Error fetching savings goals", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching savings goals"));
        }
    }

    /**
     * GET a specific savings goal by ID
     * @param id the savings goal ID
     * @param authentication the authentication object containing user info
     * @return The savings goal if it exists and belongs to the authenticated user
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getSavingsGoalById(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String email = resolveEmail(authentication);
            if (email == null || email.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not authenticated"));
            }

            Optional<SavingsGoal> goalOptional = savingsGoalRepository.findById(id);
            if (goalOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Savings goal not found"));
            }

            SavingsGoal goal = goalOptional.get();
            
            // Ensure the goal belongs to the authenticated user
            if (!goal.getUser().getEmail().equals(email)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Unauthorized access to this goal"));
            }

            return ResponseEntity.ok(goal);
        } catch (Exception e) {
            log.error("Error fetching savings goal", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error fetching savings goal"));
        }
    }

    /**
     * POST a new savings goal for the logged-in user
     * @param goalData the savings goal data (goalName, targetAmount, deadline)
     * @param authentication the authentication object containing user info
     * @return The created savings goal with HTTP 201
     */
    @PostMapping
    public ResponseEntity<?> createSavingsGoal(
            @RequestBody Map<String, Object> goalData,
            Authentication authentication) {
        try {
            String email = resolveEmail(authentication);
            if (email == null || email.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not authenticated"));
            }

            // Validate required fields
            String goalName = (String) goalData.get("goalName");
            Object targetAmountObj = goalData.get("targetAmount");
            String deadline = (String) goalData.get("deadline");

            if (goalName == null || goalName.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Goal name is required"));
            }

            if (targetAmountObj == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Target amount is required"));
            }

            if (deadline == null || deadline.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Deadline is required"));
            }

            Double targetAmount = null;
            if (targetAmountObj instanceof Number numberValue) {
                targetAmount = numberValue.doubleValue();
            }

            if (targetAmount == null || targetAmount <= 0) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Target amount must be greater than 0"));
            }

            Optional<User> userOptional = userRepository.findByEmail(email);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "User not found"));
            }

            SavingsGoal goal = new SavingsGoal();
            goal.setGoalName(goalName);
            goal.setTargetAmount(targetAmount);
            goal.setCurrentAmount(0.0);
            goal.setDeadline(java.time.LocalDate.parse(deadline));
            goal.setUser(userOptional.get());

            SavingsGoal savedGoal = savingsGoalRepository.save(goal);

            log.info("Savings goal created successfully for user: {}", email);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedGoal);
        } catch (Exception e) {
            log.error("Error creating savings goal", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error creating savings goal: " + e.getMessage()));
        }
    }

    /**
     * PUT update an existing savings goal
     * @param id the savings goal ID
     * @param goalData the updated savings goal data
     * @param authentication the authentication object containing user info
     * @return The updated savings goal
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSavingsGoal(
            @PathVariable Long id,
            @RequestBody Map<String, Object> goalData,
            Authentication authentication) {
        try {
            String email = resolveEmail(authentication);
            if (email == null || email.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not authenticated"));
            }

            Optional<SavingsGoal> goalOptional = savingsGoalRepository.findById(id);
            if (goalOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Savings goal not found"));
            }

            SavingsGoal goal = goalOptional.get();
            
            // Ensure the goal belongs to the authenticated user
            if (!goal.getUser().getEmail().equals(email)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Unauthorized access to this goal"));
            }

            // Update fields if provided
            if (goalData.containsKey("goalName") && goalData.get("goalName") != null) {
                goal.setGoalName((String) goalData.get("goalName"));
            }

            if (goalData.containsKey("targetAmount") && goalData.get("targetAmount") != null) {
                Object targetAmountObj = goalData.get("targetAmount");
                if (targetAmountObj instanceof Number numberValue) {
                    Double targetAmount = numberValue.doubleValue();
                    if (targetAmount > 0) {
                        goal.setTargetAmount(targetAmount);
                    }
                }
            }

            if (goalData.containsKey("currentAmount") && goalData.get("currentAmount") != null) {
                Object currentAmountObj = goalData.get("currentAmount");
                if (currentAmountObj instanceof Number numberValue) {
                    Double currentAmount = numberValue.doubleValue();
                    if (currentAmount >= 0) {
                        goal.setCurrentAmount(currentAmount);
                    }
                }
            }

            if (goalData.containsKey("deadline") && goalData.get("deadline") != null) {
                goal.setDeadline(java.time.LocalDate.parse((String) goalData.get("deadline")));
            }

            SavingsGoal updatedGoal = savingsGoalRepository.save(goal);

            log.info("Savings goal updated successfully for user: {}", email);
            return ResponseEntity.ok(updatedGoal);
        } catch (Exception e) {
            log.error("Error updating savings goal", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error updating savings goal: " + e.getMessage()));
        }
    }

    /**
     * DELETE a savings goal
     * @param id the savings goal ID
     * @param authentication the authentication object containing user info
     * @return HTTP 204 No Content on success
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSavingsGoal(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String email = resolveEmail(authentication);
            if (email == null || email.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User not authenticated"));
            }

            Optional<SavingsGoal> goalOptional = savingsGoalRepository.findById(id);
            if (goalOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Savings goal not found"));
            }

            SavingsGoal goal = goalOptional.get();
            
            // Ensure the goal belongs to the authenticated user
            if (!goal.getUser().getEmail().equals(email)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "Unauthorized access to this goal"));
            }

            savingsGoalRepository.deleteById(id);

            log.info("Savings goal deleted successfully for user: {}", email);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting savings goal", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error deleting savings goal"));
        }
    }

    /**
     * Helper method to resolve the email from the Authentication object
     * @param authentication the authentication object
     * @return the user's email or null if not found
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

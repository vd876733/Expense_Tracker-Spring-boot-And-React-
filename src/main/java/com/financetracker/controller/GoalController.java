package com.financetracker.controller;

import com.financetracker.entity.Goal;
import com.financetracker.entity.User;
import com.financetracker.repository.GoalRepository;
import com.financetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/goals")
@CrossOrigin(origins = "${ALLOWED_ORIGINS:http://localhost:3000}")
public class GoalController {

    @Autowired
    private GoalRepository goalRepository;

    @Autowired
    private UserRepository userRepository;

    private String resolveEmail(Authentication authentication) {
        if (authentication == null) return null;
        String name = authentication.getName();
        if (name != null && name.contains("@")) return name.trim().toLowerCase();
        return userRepository.findByUsername(name).map(User::getEmail).orElse(null);
    }

    @GetMapping
    public ResponseEntity<List<Goal>> getGoals(Authentication authentication) {
        String email = resolveEmail(authentication);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(goalRepository.findByUser_EmailOrderByPriorityRankAsc(email));
    }

    @PostMapping
    public ResponseEntity<Goal> createGoal(@RequestBody Goal goal, Authentication authentication) {
        String email = resolveEmail(authentication);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        
        goal.setUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(goalRepository.save(goal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Goal> updateGoal(@PathVariable Long id, @RequestBody Goal goalDetails, Authentication authentication) {
        String email = resolveEmail(authentication);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        
        Optional<Goal> existingOpt = goalRepository.findByIdAndUser_Email(id, email);
        if (existingOpt.isEmpty()) return ResponseEntity.notFound().build();
        
        Goal existing = existingOpt.get();
        existing.setName(goalDetails.getName());
        existing.setTargetAmount(goalDetails.getTargetAmount());
        existing.setCurrentAmount(goalDetails.getCurrentAmount());
        existing.setCategoryIcon(goalDetails.getCategoryIcon());
        existing.setPriorityRank(goalDetails.getPriorityRank());
        
        return ResponseEntity.ok(goalRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(@PathVariable Long id, Authentication authentication) {
        String email = resolveEmail(authentication);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        
        Optional<Goal> existingOpt = goalRepository.findByIdAndUser_Email(id, email);
        if (existingOpt.isEmpty()) return ResponseEntity.notFound().build();
        
        goalRepository.delete(existingOpt.get());
        
        // Re-index remaining goals
        List<Goal> remaining = goalRepository.findByUser_EmailOrderByPriorityRankAsc(email);
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setPriorityRank(i + 1);
        }
        goalRepository.saveAll(remaining);
        
        return ResponseEntity.noContent().build();
    }
}

package com.financetracker.controller;

import com.financetracker.entity.User;
import com.financetracker.entity.UserCategory;
import com.financetracker.repository.UserCategoryRepository;
import com.financetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "${ALLOWED_ORIGINS:http://localhost:3000}")
public class CategoryController {

    @Autowired
    private UserCategoryRepository userCategoryRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<UserCategory>> getUserCategories(Authentication authentication) {
        String email = resolveEmail(authentication, null);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<UserCategory> categories = userCategoryRepository.findByUserId(userOpt.get().getId());
        return ResponseEntity.ok(categories);
    }

    @PostMapping
    public ResponseEntity<UserCategory> createCategory(@RequestBody Map<String, String> payload, Authentication authentication) {
        String email = resolveEmail(authentication, null);
        if (email == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String name = payload.get("name");
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = userOpt.get();

        // Check if category already exists
        Optional<UserCategory> existing = userCategoryRepository.findByUserIdAndNameIgnoreCase(user.getId(), name.trim());
        if (existing.isPresent()) {
            return ResponseEntity.ok(existing.get()); // already exists
        }

        UserCategory newCategory = new UserCategory(name.trim(), user);
        userCategoryRepository.save(newCategory);

        return ResponseEntity.status(HttpStatus.CREATED).body(newCategory);
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

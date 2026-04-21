package com.financetracker.controller;

import com.financetracker.entity.User;
import com.financetracker.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "${ALLOWED_ORIGINS:http://localhost:3000,https://your-app.netlify.app}")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PutMapping("/income")
    public ResponseEntity<?> updateIncome(@RequestBody Map<String, Object> payload,
                                          Authentication authentication) {
        String email = resolveEmail(authentication);
        Double totalIncome = null;
        if (payload.get("totalIncome") instanceof Number numberValue) {
            totalIncome = numberValue.doubleValue();
        }

        if (email == null || email.isBlank() || totalIncome == null || totalIncome < 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Email and non-negative totalIncome are required"));
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found"));
        }

        User user = userOptional.get();
        user.setTotalIncome(totalIncome);
        User saved = userRepository.save(user);
        return ResponseEntity.ok(Map.of(
            "id", saved.getId(),
            "username", saved.getUsername(),
            "email", saved.getEmail(),
            "fullName", saved.getFullName(),
            "profilePictureUrl", saved.getProfilePictureUrl(),
            "totalIncome", saved.getTotalIncome()
        ));
    }

    private String resolveEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return null;
        }
        return userRepository.findByUsername(authentication.getName())
                .map(User::getEmail)
                .orElse(null);
    }
}

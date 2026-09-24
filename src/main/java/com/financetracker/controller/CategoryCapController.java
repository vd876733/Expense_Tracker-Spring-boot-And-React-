package com.financetracker.controller;

import com.financetracker.entity.CategoryCap;
import com.financetracker.entity.User;
import com.financetracker.repository.CategoryCapRepository;
import com.financetracker.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/category-caps")
@CrossOrigin(origins = "${ALLOWED_ORIGINS:http://localhost:3000}")
public class CategoryCapController {

    @Autowired
    private CategoryCapRepository categoryCapRepository;

    @Autowired
    private UserRepository userRepository;

    private String resolveEmail(Authentication authentication) {
        if (authentication == null) return null;
        String name = authentication.getName();
        if (name != null && name.contains("@")) return name.trim().toLowerCase();
        return userRepository.findByUsername(name).map(User::getEmail).orElse(null);
    }

    @GetMapping
    public ResponseEntity<List<CategoryCap>> getCaps(Authentication authentication) {
        String email = resolveEmail(authentication);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(categoryCapRepository.findByUser_Email(email));
    }

    @PostMapping
    public ResponseEntity<CategoryCap> createOrUpdateCap(@RequestBody CategoryCap cap, Authentication authentication) {
        String email = resolveEmail(authentication);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        
        Optional<CategoryCap> existingOpt = categoryCapRepository.findByCategoryNameAndUser_Email(cap.getCategoryName(), email);
        
        if (existingOpt.isPresent()) {
            CategoryCap existing = existingOpt.get();
            existing.setDailyCap(cap.getDailyCap());
            existing.setIcon(cap.getIcon());
            return ResponseEntity.ok(categoryCapRepository.save(existing));
        } else {
            cap.setUser(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(categoryCapRepository.save(cap));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCap(@PathVariable Long id, Authentication authentication) {
        String email = resolveEmail(authentication);
        if (email == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        
        Optional<CategoryCap> existing = categoryCapRepository.findById(id);
        if (existing.isEmpty() || !existing.get().getUser().getEmail().equalsIgnoreCase(email)) {
             return ResponseEntity.notFound().build();
        }
        
        categoryCapRepository.delete(existing.get());
        return ResponseEntity.noContent().build();
    }
}

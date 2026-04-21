package com.financetracker.controller;

import com.financetracker.dto.GoogleAuthResponse;
import com.financetracker.service.GoogleAuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.security.GeneralSecurityException;
import java.util.HashMap;
import java.util.Map;

/**
 * Google Authentication Controller
 * Handles Google Sign-In token exchange.
 */
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "${ALLOWED_ORIGINS:http://localhost:3000,https://your-app.netlify.app}")
public class GoogleAuthController {

    private static final Logger logger = LoggerFactory.getLogger(GoogleAuthController.class);

    private final GoogleAuthService googleAuthService;

    public GoogleAuthController(GoogleAuthService googleAuthService) {
        this.googleAuthService = googleAuthService;
    }

    @PostMapping("/google")
    public ResponseEntity<?> authenticateWithGoogle(@RequestBody Map<String, String> requestBody) {
        String token = requestBody.get("idToken");
        if (token == null || token.isBlank()) {
            token = requestBody.get("credential");
        }
        if (token == null || token.isBlank()) {
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("status", "error");
            errorBody.put("message", "Missing Google ID token");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(errorBody);
        }

        try {
            GoogleAuthResponse response = googleAuthService.authenticateWithGoogle(token);
            return ResponseEntity.ok(response);
        } catch (GeneralSecurityException ex) {
            logger.error("Google authentication failed: token verification error", ex);
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("status", "error");
            errorBody.put("message", ex.getMessage() != null ? ex.getMessage() : "Google ID token verification failed");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(errorBody);
        } catch (Exception ex) {
            logger.error("Google authentication failed: unexpected error", ex);
            Map<String, Object> errorBody = new HashMap<>();
            errorBody.put("status", "error");
            errorBody.put("message", "Authentication failed");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(errorBody);
        }
    }
}

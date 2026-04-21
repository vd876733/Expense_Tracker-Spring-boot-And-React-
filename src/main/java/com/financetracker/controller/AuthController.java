package com.financetracker.controller;

import com.financetracker.dto.JwtAuthenticationResponse;
import com.financetracker.dto.LoginRequest;
import com.financetracker.entity.User;
import com.financetracker.repository.UserRepository;
import com.financetracker.security.TokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Authentication Controller
 * Handles user authentication and token generation.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private TokenProvider tokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    /**
     * Authenticate user and return JWT token
     *
     * @param loginRequest contains username and password
     * @return JWT token
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            String token = tokenProvider.generateToken(authentication);
                Long userId = userRepository.findByUsername(loginRequest.getUsername())
                    .map(User::getId)
                    .orElse(null);
                return ResponseEntity.ok(new JwtAuthenticationResponse(token, userId));
        } catch (Exception e) {
            logger.error("Login failed for username: {}", loginRequest != null ? loginRequest.getUsername() : null, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage());
        }
    }

    /**
     * Register a new user
     *
     * @param signupRequest contains username, email, and password
     * @return JWT token for the newly registered user
     */
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        try {
            System.out.println("/api/auth/signup request received for username: " + signupRequest.getUsername());

            // Check if username already exists
            if (userRepository.existsByUsername(signupRequest.getUsername())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Username is already taken!");
            }

            // Check if email already exists
            if (userRepository.existsByEmail(signupRequest.getEmail())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Email is already in use!");
            }

            // Create new user
            User newUser = new User();
            newUser.setUsername(signupRequest.getUsername());
            newUser.setEmail(signupRequest.getEmail());
                        newUser.setTotalIncome(10000.0);
            if (passwordEncoder != null) {
                newUser.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
            } else {
                newUser.setPassword(signupRequest.getPassword());
            }

            try {
                userRepository.save(newUser);
            } catch (Exception saveException) {
                logger.error("Failed to save new user during signup: {}", signupRequest.getUsername(), saveException);
                return ResponseEntity.status(500)
                        .body("Database Error: " + saveException.getMessage());
            }

            // Generate JWT token for the new user
            String token = tokenProvider.generateTokenFromUsername(newUser.getUsername());

            return ResponseEntity.ok(new JwtAuthenticationResponse(token, newUser.getId()));

        } catch (Exception e) {
            logger.error("Signup failed for username: {}", signupRequest != null ? signupRequest.getUsername() : null, e);
            return ResponseEntity.status(500)
                    .body("Backend Error: " + e.getMessage());
        }
    }

    public static class SignupRequest {
        @NotBlank
        private String username;

        @NotBlank
        @Email
        private String email;

        @NotBlank
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}
